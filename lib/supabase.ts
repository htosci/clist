// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  SchoolShortCard,
  SchoolDetail,
  SchoolMapMarker,
  FilterOptions,
  FilterableFieldKey,
  getFieldsByFilterType,
  getGeoFields,
} from '@/lib/schema-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Все фильтруемые поля приходят как строки из URL.
// Range-поля (total_annual_cost) передаются через rangeParams (min_fee/max_fee), не напрямую.
export type SchoolsParams = {
  [K in FilterableFieldKey]?: string;
} & {
  min_fee?: string;
  max_fee?: string;
  query?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, params: Omit<SchoolsParams, 'page' | 'limit' | 'sort'>): any {
  // 1. Поиск по названию
  if (params.query) {
    query = query.ilike('nazwa', `%${params.query}%`);
  }

  // 2. Географический каскад (порядок определяется geoLevel в схеме)
  for (const [key] of getGeoFields()) {
    const value = (params as Record<string, string | undefined>)[key];
    if (value && value !== 'all') {
      query = query.eq(key, value);
    }
  }

  // 3. Этапы обучения (checkbox → boolean в БД)
  for (const [key] of getFieldsByFilterType('checkbox')) {
    const value = (params as Record<string, string | undefined>)[key];
    if (value === 'true') {
      query = query.eq(key, true);
    }
  }

  // 4. Массивы (multiselect → contains: школа должна иметь ВСЕ выбранные значения)
  for (const [key] of getFieldsByFilterType('multiselect')) {
    const value = (params as Record<string, string | undefined>)[key];
    if (value && value !== 'all') {
      query = query.contains(key, value.split(','));
    }
  }

  // 5. Диапазон (range → rangeParams из схемы)
  for (const [key, config] of getFieldsByFilterType('range')) {
    const rangeConfig = (config as { rangeParams?: { min: string; max: string } }).rangeParams;
    if (rangeConfig) {
      const minValue = (params as Record<string, string | undefined>)[rangeConfig.min];
      const maxValue = (params as Record<string, string | undefined>)[rangeConfig.max];
      const minParsed = parseInt(minValue ?? ''); if (Number.isFinite(minParsed)) query = query.gte(key, minParsed);
      const maxParsed = parseInt(maxValue ?? ''); if (Number.isFinite(maxParsed)) query = query.lte(key, maxParsed);
    }
  }

  return query;
}

export async function getSchoolsAction(params: SchoolsParams) {
  const page = Math.max(1, parseInt(params.page || '1') || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit || '12') || 12));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Инициализируем запрос к View
  let query = supabase
    .from('v_school_short_cards')
    .select('*', { count: 'exact' });

  query = applyFilters(query, params);

  // 6. Сортировка
  if (params.sort === 'price_asc') {
    query = query.order('total_annual_cost', { ascending: true, nullsFirst: false });
  } else if (params.sort === 'price_desc') {
    query = query.order('total_annual_cost', { ascending: false, nullsFirst: false });
  } else {
    // По умолчанию: сначала те, где больше данных (info_score), затем по названию
    query = query
      .order('info_score', { ascending: false })
      .order('nazwa', { ascending: true });
  }

  // 7. Пагинация
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }

  return {
    data: data as SchoolShortCard[],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

export async function getSchoolsForMapAction(params: Omit<SchoolsParams, 'page' | 'limit' | 'sort'>): Promise<SchoolMapMarker[]> {
  let query = supabase.from('v_school_map').select('*');

  query = applyFilters(query, params);

  const { data, error } = await query;

  if (error) {
    console.error('Supabase map error:', error);
    return [];
  }

  return (data ?? []) as SchoolMapMarker[];
}

export const getSchoolDetailAction = cache(async function getSchoolDetailAction(id: number): Promise<SchoolDetail | null> {
  const { data, error } = await supabase
    .from('v_school_detail')
    .select('*')
    .eq('numer_rspo', id)
    .single();

  if (error || !data) return null;
  if (data.specialization) {
    data.specialization = data.specialization.filter((s: string) => s !== 'None');
  }
  return data as SchoolDetail;
});

export async function getSchoolsForSitemap() {
  const { data } = await supabase
    .from('v_school_short_cards')
    .select('numer_rspo, updated_at')
    .limit(50000);
  return data ?? [];
}

export const getFilterOptions = unstable_cache(
  async () => {
    const { data, error } = await supabase.rpc('get_unique_filter_values');

    if (error || !data) {
      console.error('Error fetching filters:', error);
      return null;
    }

    const completeOptions: FilterOptions = {
      geo_hierarchy: data.geo_hierarchy || {},
      school_category: data.school_category || [],
      instruction_languages: data.instruction_languages || [],
      curriculum: data.curriculum || [],
      methodology: data.methodology || [],
      specialization: data.specialization || [],
    };

    return completeOptions;
  },
  ['filter-options-key'],
  { revalidate: 3600, tags: ['filters'] }
);
