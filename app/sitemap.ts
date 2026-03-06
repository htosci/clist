import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://clist.pl'

  const { data } = await supabase
    .from('v_school_short_cards')
    .select('numer_rspo, updated_at')
    .limit(50000)

  const schoolUrls: MetadataRoute.Sitemap = (data ?? []).flatMap((school) => [
    {
      url: `${baseUrl}/schools/${school.numer_rspo}`,
      lastModified: school.updated_at ? new Date(school.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ru/schools/${school.numer_rspo}`,
      lastModified: school.updated_at ? new Date(school.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ])

  return [
    { url: `${baseUrl}/`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/ru/`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/schools`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/ru/schools`, changeFrequency: 'daily', priority: 0.9 },
    ...schoolUrls,
  ]
}
