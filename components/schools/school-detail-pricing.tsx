import { getTranslations } from 'next-intl/server'
import { Banknote, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SchoolDetail, PricingFeeItem } from '@/lib/schema-config'

interface Props {
  school: SchoolDetail
}

export async function SchoolDetailPricing({ school }: Props) {
  const t = await getTranslations('schoolDetail')

  const { pricing, total_annual_cost, pricing_score } = school

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          {t('pricing')}
        </h2>
        {pricing_score !== null && pricing_score >= 8 && (
          <span title={t('dataVerified')}>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </span>
        )}
        {pricing && pricing.is_approximate_total && (
          <Badge variant="outline" className="text-[9px] bg-yellow-50 text-yellow-700 border-yellow-200">
            {t('pricingApprox')}
          </Badge>
        )}
      </div>

      {pricing ? (
        <PricingTable pricing={pricing} t={t} />
      ) : total_annual_cost ? (
        <SimplePricing cost={total_annual_cost} t={t} />
      ) : (
        <p className="text-sm text-muted-foreground italic">{t('noPricing')}</p>
      )}
    </section>
  )
}

function SimplePricing({
  cost,
  t,
}: {
  cost: number
  t: Awaited<ReturnType<typeof getTranslations<'schoolDetail'>>>
}) {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <Banknote className="w-5 h-5" />
      {cost.toLocaleString()} PLN
      <span className="text-sm font-normal text-muted-foreground">{t('perYear')}</span>
    </div>
  )
}

function PricingTable({
  pricing,
  t,
}: {
  pricing: NonNullable<SchoolDetail['pricing']>
  t: Awaited<ReturnType<typeof getTranslations<'schoolDetail'>>>
}) {
  return (
    <div className="space-y-2">
      {pricing.academic_year && (
        <p className="text-xs text-muted-foreground">
          {t('academicYear')}: <span className="font-medium text-foreground">{pricing.academic_year}</span>
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('program')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('entryFee')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('monthlyFee')}</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">
                {t('inclusions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pricing.fee_structure.map((item, i) => (
              <PricingRow key={i} item={item} t={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PricingRow({
  item,
  t,
}: {
  item: PricingFeeItem
  t: Awaited<ReturnType<typeof getTranslations<'schoolDetail'>>>
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <td className="px-3 py-2.5 font-semibold uppercase text-xs tracking-wide">{item.category}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {item.entry_fee ? (
          <span>
            {item.entry_fee.amount.toLocaleString()} PLN
            <span className="text-xs text-muted-foreground ml-1">({t('oneTime')})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t('notProvided')}</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">
        {item.monthly_fee ? (
          <span>
            {item.monthly_fee.amount.toLocaleString()} PLN
            <span className="text-xs text-muted-foreground ml-1">/{t('perMonth')}</span>
            {item.monthly_fee.is_approximate && (
              <span className="text-xs text-yellow-600 ml-1">~</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('notProvided')}</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
        <div className="space-y-0.5">
          {item.inclusions?.map((inc, j) => (
            <div key={j} className="text-xs">{inc}</div>
          ))}
          {item.discounts && (
            <div className="text-xs text-green-700 mt-1">
              {t('discounts')}: {item.discounts}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
