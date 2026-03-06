import { getTranslations } from 'next-intl/server'
import { Phone, Mail, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolDetail } from '@/lib/schema-config'
import { isSafeUrl } from '@/lib/utils'

interface Props {
  school: SchoolDetail
}

export async function SchoolDetailContacts({ school }: Props) {
  const t = await getTranslations('schoolDetail')

  const phone = school.contact?.phone || school.rspo_telefon
  const email = school.contact?.email || school.rspo_email
  const website = school.website && isSafeUrl(school.website) ? school.website : null

  if (!phone && !email && !website) return null

  const phoneHrefValue = phone ? phoneHref(phone) : null

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        {t('contacts')}
      </h2>

      <div className="flex flex-col gap-2 text-sm">
        {phone && (
          phoneHrefValue ? (
            <a
              href={phoneHrefValue}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
              {formatPhone(phone)}
            </a>
          ) : (
            <span className="flex items-center gap-2 text-foreground">
              <Phone aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
              {formatPhone(phone)}
            </span>
          )
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors break-all"
          >
            <Mail aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
            {email}
          </a>
        )}

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Globe aria-hidden="true" className="w-4 h-4 text-slate-400 shrink-0" />
            {website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {website && (
        <Button asChild variant="outline" size="sm" className="mt-2">
          <a href={website} target="_blank" rel="noopener noreferrer">
            {t('website')} ↗
          </a>
        </Button>
      )}
    </section>
  )
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Уже с кодом страны: 48 + 9 цифр
  if (digits.startsWith('48') && digits.length === 11) {
    return `+48 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  // Только польский номер без кода
  if (digits.length === 9) {
    return `+48 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

function phoneHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('48') && digits.length === 11) return `tel:+${digits}`
  if (digits.length === 9) return `tel:+48${digits}`
  if (digits.length >= 5) return `tel:${digits}`  // safe: только цифры
  return null  // нераспознанный формат
}
