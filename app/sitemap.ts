import type { MetadataRoute } from 'next'
import { getSchoolsForSitemap } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clist.pl'

  const data = await getSchoolsForSitemap()

  const schoolUrls: MetadataRoute.Sitemap = data.flatMap((school) => [
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
