import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { getSchoolDetailAction } from '@/lib/supabase'
import { SchoolDetailHeader } from '@/components/schools/school-detail-header'
import { SchoolDetailProgram } from '@/components/schools/school-detail-program'
import { SchoolDetailPricing } from '@/components/schools/school-detail-pricing'
import { SchoolDetailContacts } from '@/components/schools/school-detail-contacts'
import { SchoolDetailAddress } from '@/components/schools/school-detail-address'
import { Clock } from 'lucide-react'
import { formatUpdatedAt } from '@/lib/utils'

interface Params {
  id: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params
  if (isNaN(Number(id))) return {}

  const school = await getSchoolDetailAction(Number(id))
  if (!school) return {}

  const t = await getTranslations('schoolDetail')
  const title = `${school.nazwa} — ${school.miejscowosc ?? ''} | Clist`
  const description = [
    school.typ,
    school.miejscowosc,
    school.curriculum?.join(', '),
    school.total_annual_cost ? `${school.total_annual_cost.toLocaleString()} ${t('currency')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function SchoolDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  if (isNaN(Number(id))) notFound()

  const [school, locale] = await Promise.all([
    getSchoolDetailAction(Number(id)),
    getLocale(),
  ])

  if (!school) notFound()

  const t = await getTranslations('schoolDetail')
  const schoolsPath = getPathname({ href: '/schools', locale })

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="space-y-8">
        <SchoolDetailHeader school={school} backHref={schoolsPath} />

        <div className="grid gap-8 md:grid-cols-2">
          <SchoolDetailProgram school={school} />
          <SchoolDetailContacts school={school} />
        </div>

        <SchoolDetailPricing school={school} />

        <SchoolDetailAddress school={school} />

        {/* Футер карточки */}
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 border-t pt-4">
          {school.updated_at && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {t('updatedAt')} {formatUpdatedAt(school.updated_at, locale)}
              </span>
            </div>
          )}
          <span>
            {t('rspoId')}: #{school.numer_rspo}
          </span>
        </div>
      </div>
    </div>
  )
}
