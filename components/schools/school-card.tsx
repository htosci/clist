"use client"

import { Fragment } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations, useLocale, useMessages } from "next-intl"
import {
  MapPin,
  GraduationCap,
  Banknote,
  Languages,
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react"
import { SchoolShortCard } from '@/lib/schema-config'
import { cn, formatUpdatedAt, getScoreClassName } from "@/lib/utils"
import { ValueTooltip } from "@/components/ui/value-tooltip"
import { lookupGlossary } from "@/lib/glossary"

export function SchoolCard({ school }: { school: SchoolShortCard }) {
  const t = useTranslations('card')
  const tf = useTranslations('fields')
  const locale = useLocale()
  const messages = useMessages()
  const tip = (field: string, value: string) => lookupGlossary(messages, field, value)
  const schoolUrl = `${locale === 'pl' ? '' : `/${locale}`}/schools/${school.numer_rspo}`

  return (
    <Link href={schoolUrl} aria-label={school.nazwa} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full border-muted/60 group">
      <CardHeader className="p-4 pb-2">
        {/* Категории + info_score + дата обновления */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {school.school_category?.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border-none select-text"
            >
              <ValueTooltip tooltip={tip('school_category', category)}>
                {category}
              </ValueTooltip>
            </Badge>
          ))}
          {school.info_score !== null && (
            <Badge
              variant="outline"
              title={t('scoreTitle')}
              className={cn(
                "text-[10px] font-semibold ml-auto border-none cursor-help",
                getScoreClassName(school.info_score)
              )}
            >
              {school.info_score}/10
            </Badge>
          )}
        </div>

        {/* Название школы */}
        <div className="min-h-[3.5rem]">
          <h3 title={school.nazwa} className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {school.nazwa}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex flex-col gap-4 flex-grow">

        {/* География и Адрес */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
          <span className="line-clamp-1">
            {[school.miejscowosc, school.adres].filter(Boolean).join(', ') || '—'}
          </span>
        </div>

        {/* Этапы обучения (Значки) */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex gap-1.5">
            <StageIcon
              active={school.wychowanie_przedszkolne}
              label="0"
              title={t('stagePreschool')}
            />
            <StageIcon
              active={school.i_etap_edukacyjny}
              label="1-3"
              title={t('stageElementary13')}
            />
            <StageIcon
              active={school.ii_etap_edukacyjny}
              label="4-8"
              title={t('stageElementary48')}
            />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
            {t('stages')}
          </span>
        </div>

        {/* Параметры (Languages, Curriculum, Methodology) */}
        <div className="grid grid-cols-1 gap-2 text-sm border-t border-dashed pt-3">
          {/* Языки */}
          <div className="flex items-center gap-2">
            <span title={tf('instruction_languages.label')} className="shrink-0 cursor-help">
              <Languages aria-hidden="true" className="w-4 h-4 text-slate-400" />
            </span>
            <span className="font-medium select-text">
              {(school.instruction_languages ?? ['pl']).map((l, i, arr) => (
                <Fragment key={l}>
                  <ValueTooltip tooltip={tip('instruction_languages', l)}>
                    {l.toUpperCase()}
                  </ValueTooltip>
                  {i < arr.length - 1 && ', '}
                </Fragment>
              ))}
            </span>
          </div>

          {/* Программа и Методика */}
          <div className="flex items-center gap-2">
            <span title={`${tf('curriculum.label')} / ${tf('methodology.label')}`} className="shrink-0 cursor-help">
              <GraduationCap aria-hidden="true" className="w-4 h-4 text-slate-400" />
            </span>
            <span className="text-muted-foreground line-clamp-1 select-text">
              {(school.curriculum ?? ['MEN']).map((c, i, arr) => (
                <Fragment key={c}>
                  <ValueTooltip tooltip={tip('curriculum', c)}>{c}</ValueTooltip>
                  {i < arr.length - 1 && ', '}
                </Fragment>
              ))}
              {school.methodology?.length ? (
                <>
                  {' • '}
                  {school.methodology.map((m, i, arr) => (
                    <Fragment key={m}>
                      <ValueTooltip tooltip={tip('methodology', m)}>{m}</ValueTooltip>
                      {i < arr.length - 1 && ', '}
                    </Fragment>
                  ))}
                </>
              ) : null}
            </span>
          </div>

          {/* Специализация (если есть) */}
          {school.specialization && school.specialization.length > 0 && (
            <div className="flex items-center gap-2">
              <span title={tf('specialization.label')} className="shrink-0 cursor-help">
                <Sparkles aria-hidden="true" className="w-4 h-4 text-amber-400" />
              </span>
              <span className="text-muted-foreground italic line-clamp-1 select-text">
                {school.specialization.map((s, i, arr) => (
                  <Fragment key={s}>
                    <ValueTooltip tooltip={tip('specialization', s)}>{s}</ValueTooltip>
                    {i < arr.length - 1 && ', '}
                  </Fragment>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Цена и Футер */}
        <div className="mt-auto pt-3 flex justify-between items-center border-t border-muted">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold text-base text-primary">
              <span title={tf('total_annual_cost.label')} className="cursor-help shrink-0">
                <Banknote aria-hidden="true" className="w-4 h-4" />
              </span>
              {school.total_annual_cost
                ? `${school.total_annual_cost.toLocaleString()} ${t('currency')}`
                : t('priceOnRequest')}
            </div>
            {school.total_annual_cost && (
              <span className="text-[10px] text-muted-foreground ml-5">{t('perYear')}</span>
            )}
          </div>

          {/* Индикатор надежности данных по цене */}
          <div className="flex items-center gap-2">
            {school.pricing_score !== null && school.pricing_score >= 8 && (
               <div title={t('dataVerified')} className="text-green-600">
                 <CheckCircle2 className="w-5 h-5" />
               </div>
            )}
            {school.pricing_score !== null && school.pricing_score < 5 && school.total_annual_cost && (
              <Badge variant="outline" className="text-[9px] bg-yellow-50 text-yellow-700 border-yellow-200">
                {t('approximate')}
              </Badge>
            )}
          </div>
        </div>

        {/* Дата обновления */}
        {school.updated_at && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock aria-hidden="true" className="w-3 h-3" />
            <span>{t('updatedAt')} {formatUpdatedAt(school.updated_at, locale)}</span>
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  )
}

/**
 * Вспомогательный компонент для значков этапов
 */
function StageIcon({ active, label, title }: { active: boolean | null, label: string, title: string }) {
  return (
    <div
      title={title}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/30 text-muted-foreground/40 border-muted"
      )}
    >
      {label}
    </div>
  )
}
