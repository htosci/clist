"use client"

// components/schools/school-grid.tsx
import { useTranslations } from "next-intl"
import { SchoolCard } from "./school-card"
import { SchoolShortCard } from "@/lib/schema-config"

export function SchoolGrid({ schools }: { schools: SchoolShortCard[] }) {
  const t = useTranslations('grid')

  if (schools.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{t('empty')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {schools.map((school) => (
        <SchoolCard key={school.numer_rspo} school={school} />
      ))}
    </div>
  )
}
