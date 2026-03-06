import { getTranslations } from 'next-intl/server'
import { MapPin } from 'lucide-react'
import { SchoolDetail } from '@/lib/schema-config'

interface Props {
  school: SchoolDetail
}

export async function SchoolDetailAddress({ school }: Props) {
  const t = await getTranslations('schoolDetail')
  const tFields = await getTranslations('fields')

  const { adres, kod_pocztowy, miejscowosc, powiat, wojewodztwo, geolokalizacja } = school

  const fullAddress = [adres, [kod_pocztowy, miejscowosc].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
        {t('address')}
      </h2>

      <div className="flex items-start gap-2 text-sm">
        <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          {fullAddress && <p className="font-medium">{fullAddress}</p>}
          <p className="text-muted-foreground text-xs">
            {[powiat && `${tFields('powiat.label')}: ${powiat}`, wojewodztwo && `${tFields('wojewodztwo.label')}: ${wojewodztwo}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      {/* Placeholder карты — будет заменён в Этапе 3 */}
      {geolokalizacja && (
        <div
          className="relative rounded-lg border bg-muted/20 flex items-center justify-center"
          style={{ height: 200 }}
          data-lat={geolokalizacja.latitude}
          data-lng={geolokalizacja.longitude}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            <MapPin className="w-8 h-8" />
            <span className="text-xs">
              {geolokalizacja.latitude.toFixed(4)}, {geolokalizacja.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
