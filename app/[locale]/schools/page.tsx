// app/[locale]/schools/page.tsx
import type { Metadata } from "next"
import { Suspense } from "react"
import { getTranslations, getLocale } from "next-intl/server"
import { getPathname } from "@/i18n/navigation"
import { getSchoolsAction, getFilterOptions, getSchoolsForMapAction } from "@/lib/supabase"
import type { SchoolsParams } from "@/lib/supabase"
import { SchoolGrid } from "@/components/schools/school-grid"
import { FilterBar } from "@/components/schools/filter-bar"
import { ViewToggle } from "@/components/schools/view-toggle"
import { SchoolMapWrapper } from "@/components/schools/school-map-wrapper"
import PaginationButton from "@/components/schools/pagination-button"
import Loading from "./loading"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.schools')
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: "website",
    },
  }
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<SchoolsParams & { view?: string }>;
}) {
  const filters = await searchParams
  const isMapView = filters.view === 'map'

  const [t, locale] = await Promise.all([
    getTranslations('schools'),
    getLocale(),
  ])

  const schoolsPath = getPathname({ href: '/schools', locale })

  const [schools, filterOptions, mapMarkers] = await Promise.all([
    isMapView ? Promise.resolve(null) : getSchoolsAction(filters),
    getFilterOptions(),
    isMapView ? getSchoolsForMapAction(filters) : Promise.resolve([]),
  ])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('found', { count: isMapView ? mapMarkers.length : (schools?.count ?? 0) })}
          </p>
        </div>
        <ViewToggle currentView={isMapView ? 'map' : 'grid'} />
      </div>

      <FilterBar options={filterOptions} filterError={filterOptions === null} />

      {isMapView ? (
        <SchoolMapWrapper schools={mapMarkers} />
      ) : (
        <Suspense key={JSON.stringify(filters)} fallback={<Loading />}>
          <div className="space-y-10">
            <SchoolGrid schools={schools?.data ?? []} />

            {(schools?.totalPages ?? 0) > 1 && (
              <div className="flex flex-col items-center justify-center gap-4 border-t pt-8">
                <div className="flex items-center gap-2">
                  <PaginationButton
                    params={filters}
                    targetPage={(schools?.page ?? 1) - 1}
                    disabled={(schools?.page ?? 1) <= 1}
                    basePath={schoolsPath}
                  >
                    {t('pagination.prev')}
                  </PaginationButton>

                  <div className="text-sm font-medium">
                    {t('pagination.page', { current: schools?.page ?? 1, total: schools?.totalPages ?? 1 })}
                  </div>

                  <PaginationButton
                    params={filters}
                    targetPage={(schools?.page ?? 1) + 1}
                    disabled={(schools?.page ?? 1) >= (schools?.totalPages ?? 1)}
                    basePath={schoolsPath}
                  >
                    {t('pagination.next')}
                  </PaginationButton>
                </div>
              </div>
            )}
          </div>
        </Suspense>
      )}
    </div>
  )
}
