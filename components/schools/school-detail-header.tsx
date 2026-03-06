import { getTranslations, getMessages } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { SchoolDetail } from '@/lib/schema-config'
import { cn, isSafeUrl, getScoreClassName } from '@/lib/utils'
import { lookupGlossary } from '@/lib/glossary'

interface Props {
  school: SchoolDetail
  backHref: string
}

export async function SchoolDetailHeader({ school, backHref }: Props) {
  const t = await getTranslations('schoolDetail')
  const tCard = await getTranslations('card')
  const messages = await getMessages()
  const tip = (field: string, value: string) => lookupGlossary(messages, field, value)

  return (
    <div className="space-y-3">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('back')}
      </Link>

      {school.closed && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {t('closed')}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {school.school_category?.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                title={tip('school_category', cat)}
                className="text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 border-none cursor-help"
              >
                {cat}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{school.nazwa}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {[school.typ, school.miejscowosc].filter(Boolean).join(' · ')}
          </p>
        </div>

        {school.info_score !== null && (
          <Badge
            variant="outline"
            title={tCard('scoreTitle')}
            className={cn(
              'text-sm font-semibold border-none shrink-0 cursor-help',
              getScoreClassName(school.info_score)
            )}
          >
            {school.info_score}/10
          </Badge>
        )}
      </div>

      {school.website && isSafeUrl(school.website) && (
        <a
          href={school.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <LinkIcon aria-hidden="true" className="w-3.5 h-3.5" />
          {t('website')}
        </a>
      )}
    </div>
  )
}
