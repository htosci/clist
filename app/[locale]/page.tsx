import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, getLocale } from "next-intl/server"
import { Search, MapPin, BookOpen, BadgeCheck } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.home')
  return {
    title: t('title'),
    description: t('description'),
  }
}

const CITIES = [
  { key: "warszawa" as const, slug: "Warszawa" },
  { key: "krakow" as const, slug: "Kraków" },
  { key: "wroclaw" as const, slug: "Wrocław" },
  { key: "gdansk" as const, slug: "Gdańsk" },
  { key: "poznan" as const, slug: "Poznań" },
  { key: "katowice" as const, slug: "Katowice" },
]

export default async function Home() {
  const t = await getTranslations('home')
  const locale = await getLocale()

  const schoolsPath = locale === 'pl' ? '/schools' : `/${locale}/schools`

  const uspItems = [
    { icon: Search, titleKey: "usp.search.title", textKey: "usp.search.text" },
    { icon: MapPin, titleKey: "usp.location.title", textKey: "usp.location.text" },
    { icon: BookOpen, titleKey: "usp.data.title", textKey: "usp.data.text" },
    { icon: BadgeCheck, titleKey: "usp.score.title", textKey: "usp.score.text" },
  ] as const

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center space-y-8">
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('hero.subtitle')}
          </p>
        </div>

        <Link
          href={schoolsPath}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Search className="w-4 h-4" />
          {t('hero.cta')}
        </Link>

        {/* Быстрые фильтры по городам */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            {t('cities.heading')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`${schoolsPath}?miejscowosc=${encodeURIComponent(city.slug)}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:border-primary/20"
              >
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {t(`cities.${city.key}`)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* УТП */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10 tracking-tight">
            {t('usp.heading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {uspItems.map(({ icon: Icon, titleKey, textKey }) => (
              <div
                key={titleKey}
                className="flex flex-col items-start gap-3 rounded-xl border bg-background p-5 shadow-sm"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
