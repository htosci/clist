import { Fragment } from 'react'
import { getTranslations, getMessages } from 'next-intl/server'
import { Languages, GraduationCap, Brain, Sparkles, Users, BedDouble } from 'lucide-react'
import { SchoolDetail } from '@/lib/schema-config'
import { cn } from '@/lib/utils'
import { lookupGlossary } from '@/lib/glossary'
import { ValueTooltip } from '@/components/ui/value-tooltip'

interface Props {
  school: SchoolDetail
}

function StageChip({ active, label }: { active: boolean | null; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-muted-foreground/50 border-muted'
      )}
    >
      {label}
    </div>
  )
}

export async function SchoolDetailProgram({ school }: Props) {
  const t = await getTranslations('schoolDetail')
  const tCard = await getTranslations('card')
  const tFields = await getTranslations('fields')
  const messages = await getMessages()
  const tip = (field: string, value: string) => lookupGlossary(messages, field, value)

  const hasProgram =
    school.curriculum?.length ||
    school.instruction_languages?.length ||
    school.methodology?.length ||
    school.specialization?.length

  return (
    <div className="space-y-6">
      {/* Обзор */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          {t('overview')}
        </h2>

        <div className="flex flex-wrap gap-2">
          <StageChip active={school.wychowanie_przedszkolne} label={tCard('stagePreschool')} />
          <StageChip active={school.i_etap_edukacyjny} label={tCard('stageElementary13')} />
          <StageChip active={school.ii_etap_edukacyjny} label={tCard('stageElementary48')} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {school.liczba_uczniow !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{t('students')}:</span>
              <span className="font-semibold text-foreground">{school.liczba_uczniow}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BedDouble className="w-4 h-4" />
            <span>{t('boarding')}:</span>
            <span className="font-semibold text-foreground">
              {school.czy_posiada_internat ? t('boardingYes') : t('boardingNo')}
            </span>
          </div>
        </div>
      </section>

      {/* Программа */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          {t('program')}
        </h2>

        {!hasProgram ? (
          <p className="text-sm text-muted-foreground italic">{t('noProgram')}</p>
        ) : (
          <div className="grid gap-3 text-sm">
            {school.instruction_languages && school.instruction_languages.length > 0 && (
              <Row icon={<Languages className="w-4 h-4 text-slate-400" />} label={tFields('instruction_languages.label')}>
                {school.instruction_languages.map((l, i, arr) => (
                  <Fragment key={l}>
                    <ValueTooltip tooltip={tip('instruction_languages', l)}>{l.toUpperCase()}</ValueTooltip>
                    {i < arr.length - 1 && ', '}
                  </Fragment>
                ))}
              </Row>
            )}
            {school.curriculum && school.curriculum.length > 0 && (
              <Row icon={<GraduationCap className="w-4 h-4 text-slate-400" />} label={tFields('curriculum.label')}>
                {school.curriculum.map((c, i, arr) => (
                  <Fragment key={c}>
                    <ValueTooltip tooltip={tip('curriculum', c)}>{c}</ValueTooltip>
                    {i < arr.length - 1 && ', '}
                  </Fragment>
                ))}
              </Row>
            )}
            {school.methodology && school.methodology.length > 0 && (
              <Row icon={<Brain className="w-4 h-4 text-slate-400" />} label={tFields('methodology.label')}>
                {school.methodology.map((m, i, arr) => (
                  <Fragment key={m}>
                    <ValueTooltip tooltip={tip('methodology', m)}>{m}</ValueTooltip>
                    {i < arr.length - 1 && ', '}
                  </Fragment>
                ))}
              </Row>
            )}
            {school.specialization &&
              school.specialization.length > 0 &&
              school.specialization[0] !== 'None' && ( // AI-агент записывает "None" как sentinel-значение
                <Row icon={<Sparkles className="w-4 h-4 text-amber-400" />} label={tFields('specialization.label')}>
                  {school.specialization.map((s, i, arr) => (
                    <Fragment key={s}>
                      <ValueTooltip tooltip={tip('specialization', s)}>{s}</ValueTooltip>
                      {i < arr.length - 1 && ', '}
                    </Fragment>
                  ))}
                </Row>
              )}
          </div>
        )}
      </section>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-36 shrink-0">{label}:</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
