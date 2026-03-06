/**
 * Конфигурация полей школы — Единый источник истины (SSOT).
 * Позволяет добавлять/удалять поля в одном месте.
 */

// lib/schema-config.ts
export const SCHOOL_SCHEMA = {

  // --- СИСТЕМНЫЕ ПОЛЯ ---
    nazwa: {
        label: "nazwa.label",
        type: "string",
        filterType: "text",
        source: "rspo",
    },
    numer_rspo: {
        label: "numer_rspo.label",
        type: "number",
        filterType: null,
        source: "rspo",
    },
    updated_at: {
        label: "updated_at.label",
        type: "string",
        filterType: null,
        source: "additional_data",
        nullable: true,
    },
    website: {
        label: "website.label",
        type: "string",
        filterType: null,
        source: "additional_data",
        nullable: true,
    },

  // --- ГЕОГРАФИЯ (Данные из rspo) ---
  // geoLevel определяет порядок каскада: при смене уровня N сбрасываются уровни > N
  wojewodztwo: {
    label: "wojewodztwo.label",
    type: "string",
    filterType: "select",
    source: "rspo",
    nullable: true,
    geoLevel: 1,
  },
  powiat: {
    label: "powiat.label",
    type: "string",
    filterType: "select",
    source: "rspo",
    nullable: true,
    geoLevel: 2,
  },
  gmina: {
    label: "gmina.label",
    type: "string",
    filterType: "select",
    source: "rspo",
    nullable: true,
    geoLevel: 3,
  },
  miejscowosc: {
    label: "miejscowosc.label",
    type: "string",
    filterType: "select",
    source: "rspo",
    nullable: true,
    geoLevel: 4,
  },
  adres: {
    label: "adres.label",
    type: "string",
    filterType: null,
    source: "rspo",
    nullable: true,
  },

  // --- КАТЕГОРИИ И ОСОБЕННОСТИ (Данные из additional_data) ---
  school_category: {
    label: "school_category.label",
    type: "array",
    filterType: "multiselect",
    source: "additional_data",
    nullable: true,
    ui: { position: "badge", color: "blue" }
  },
  instruction_languages: {
    label: "instruction_languages.label",
    type: "array",
    filterType: "multiselect",
    source: "additional_data",
    nullable: true,
    ui: { position: "feature", icon: "Languages" }
  },
  curriculum: {
    label: "curriculum.label",
    type: "array",
    filterType: "multiselect",
    source: "additional_data",
    nullable: true,
    ui: { position: "feature", icon: "BookOpen" }
  },
  methodology: {
    label: "methodology.label",
    type: "array",
    filterType: "multiselect",
    source: "additional_data",
    nullable: true,
    ui: { position: "feature", icon: "Brain" }
  },
  specialization: {
    label: "specialization.label",
    type: "array",
    filterType: "multiselect",
    source: "additional_data",
    nullable: true,
    ui: { position: "highlight", icon: "Star" }
  },

  // --- ЭТАПЫ ОБУЧЕНИЯ (Boolean флаги из rspo) ---
  wychowanie_przedszkolne: {
    label: "wychowanie_przedszkolne.label",
    type: "boolean",
    filterType: "checkbox",
    source: "rspo",
    nullable: true,
    ui: { position: "stage" }
  },
  i_etap_edukacyjny: {
    label: "i_etap_edukacyjny.label",
    type: "boolean",
    filterType: "checkbox",
    source: "rspo",
    nullable: true,
    ui: { position: "stage" }
  },
  ii_etap_edukacyjny: {
    label: "ii_etap_edukacyjny.label",
    type: "boolean",
    filterType: "checkbox",
    source: "rspo",
    nullable: true,
    ui: { position: "stage" }
  },

  // --- ФИНАНСЫ ---
  // rangeParams: имена URL-параметров, через которые передаётся диапазон (не совпадают с именем поля)
  total_annual_cost: {
    label: "total_annual_cost.label",
    type: "number",
    filterType: "range",
    source: "additional_data",
    nullable: true,
    rangeParams: { min: "min_fee", max: "max_fee" },
    ui: { suffix: "PLN", position: "financial" }
  },

  // --- CКОРИНГ И ДРУГОЕ (не для фильтров) ---
    pricing_score: {
        label: "pricing_score.label",
        type: "number",
        filterType: null,
        source: "additional_data",
        nullable: true,
    },
    info_score: {
        label: "info_score.label",
        type: "number",
        filterType: null,
        source: "additional_data",
        nullable: true,
    }

  } as const;

// Маппинг строковых типов схемы в реальные TypeScript-типы
export type SchemaTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  array: string[];
};


// --- ТИПЫ ДЛЯ TYPESCRIPT ---

// Ключи всех полей
export type SchoolFieldKey = keyof typeof SCHOOL_SCHEMA;

// Ключи полей, которые участвуют в фильтрации (filterType !== null)
export type FilterableFieldKey = {
  [K in SchoolFieldKey]: (typeof SCHOOL_SCHEMA)[K]['filterType'] extends null ? never : K
}[SchoolFieldKey];

// Тип для фильтров
export type SchoolFilters = {
  [K in FilterableFieldKey]?: string;
} & {
  min_fee?: string;
  max_fee?: string;
  query?: string;
};

// --- ХЕЛПЕРЫ ---

type FilterTypeName = 'text' | 'select' | 'multiselect' | 'checkbox' | 'range';

/** Все поля с заданным filterType */
export const getFieldsByFilterType = (filterType: FilterTypeName) => {
  return Object.entries(SCHOOL_SCHEMA).filter(
    ([, config]) => config.filterType === filterType
  );
};

/** Гео-поля, отсортированные по geoLevel (для каскада и итерации в Supabase) */
export const getGeoFields = () => {
  return Object.entries(SCHOOL_SCHEMA)
    .filter(([, config]) => 'geoLevel' in config)
    .sort((a, b) =>
      (a[1] as { geoLevel: number }).geoLevel - (b[1] as { geoLevel: number }).geoLevel
    );
};

/** Ключи полей с заданным filterType */
export const getFilterKeys = (filterType: FilterTypeName): string[] => {
  return getFieldsByFilterType(filterType).map(([key]) => key);
};

/** Хелпер для получения полей по позиции в UI (для карточки) */
export const getFieldsByPosition = (position: "badge" | "feature" | "financial" | "highlight" | "stage") => {
  return Object.entries(SCHOOL_SCHEMA).filter(
    ([, config]) => (config as { ui?: { position?: string } }).ui?.position === position
  );
};

// --- ПРОИЗВОДНЫЕ ТИПЫ ---

// Ключи полей с filterType 'multiselect' — дают плоские массивы вариантов
type MultiselectFieldKey = {
  [K in SchoolFieldKey]: (typeof SCHOOL_SCHEMA)[K]['filterType'] extends 'multiselect' ? K : never
}[SchoolFieldKey];

/** Иерархия гео-фильтров: воеводство → повет → гмина → [населённые пункты] */
export type GeoHierarchy = {
  [woj: string]: { [pow: string]: { [gm: string]: string[] } }
};

/** Варианты для dropdown-фильтров: иерархия для гео + плоские массивы для multiselect */
export type FilterOptions = {
  [K in MultiselectFieldKey]: string[];
} & {
  geo_hierarchy: GeoHierarchy;
};

/** Карточка школы — все поля с учётом nullable */
export type SchoolShortCard = {
  [K in keyof typeof SCHOOL_SCHEMA]: (typeof SCHOOL_SCHEMA)[K] extends { nullable: true }
    ? SchemaTypeMap[(typeof SCHOOL_SCHEMA)[K]['type']] | null
    : SchemaTypeMap[(typeof SCHOOL_SCHEMA)[K]['type']];
};

// --- ТИПЫ ДЕТАЛЬНОЙ СТРАНИЦЫ ---

export type PricingFeeItem = {
  category: string;
  entry_fee: { type: string; amount: number } | null;
  monthly_fee: {
    amount: number;
    months_per_year: number;
    range: [number, number] | null;
    is_approximate: boolean;
  } | null;
  annual_fee: number | null;
  materials_fee: number | null;
  inclusions: string[];
  discounts: string | null;
};

export type PricingData = {
  academic_year: string;
  currency: string;
  is_approximate_total: boolean;
  fee_structure: PricingFeeItem[];
};

export type SchoolMapMarker = {
  numer_rspo: number;
  nazwa: string;
  lat: number;
  lng: number;
  // geo (для фильтрации)
  wojewodztwo: string | null;
  powiat: string | null;
  gmina: string | null;
  miejscowosc: string | null;
  // финансы и массивы
  total_annual_cost: number | null;
  instruction_languages: string[] | null;
  school_category: string[] | null;
  curriculum: string[] | null;
  methodology: string[] | null;
  specialization: string[] | null;
  // этапы
  wychowanie_przedszkolne: boolean | null;
  i_etap_edukacyjny: boolean | null;
  ii_etap_edukacyjny: boolean | null;
};

export type SchoolDetail = {
  numer_rspo: number;
  nazwa: string;
  closed: boolean | null;
  typ: string | null;
  wychowanie_przedszkolne: boolean | null;
  i_etap_edukacyjny: boolean | null;
  ii_etap_edukacyjny: boolean | null;
  czy_posiada_internat: boolean | null;
  liczba_uczniow: number | null;
  wojewodztwo: string | null;
  powiat: string | null;
  miejscowosc: string | null;
  adres: string | null;
  kod_pocztowy: string | null;
  geolokalizacja: { latitude: number; longitude: number } | null;
  rspo_telefon: string | null;
  rspo_email: string | null;
  school_category: string[] | null;
  instruction_languages: string[] | null;
  curriculum: string[] | null;
  methodology: string[] | null;
  specialization: string[] | null;
  contact: { phone: string | null; email: string | null } | null;
  website: string | null;
  pricing: PricingData | null;
  total_annual_cost: number | null;
  pricing_score: number | null;
  info_score: number | null;
  updated_at: string | null;
};
