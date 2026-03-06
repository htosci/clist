"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ValueTooltip } from "@/components/ui/value-tooltip"

interface CheckboxGroupProps {
  label: string
  options: string[]
  values: string[]
  onChange: (values: string[]) => void
  formatOption?: (opt: string) => string
  collapseThreshold?: number
  getTooltip?: (value: string) => string | undefined
}

const toSafeId = (label: string, opt: string) =>
  `cbg-${label}-${opt}`.replace(/\s+/g, '-').toLowerCase()

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  formatOption = (opt) => opt.toUpperCase(),
  collapseThreshold = 5,
  getTooltip,
}: CheckboxGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const t = useTranslations('ui')

  const showAll = options.length <= collapseThreshold || expanded
  const visibleOptions = showAll ? options : options.slice(0, collapseThreshold)
  const hiddenCount = options.length - collapseThreshold

  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt))
    } else {
      onChange([...values, opt])
    }
  }

  return (
    <div role="group" aria-label={label} className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        {visibleOptions.map((opt) => {
          const id = toSafeId(label, opt)
          return (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={values.includes(opt)}
                onCheckedChange={() => toggle(opt)}
              />
              <Label
                htmlFor={id}
                className="cursor-pointer text-sm font-normal select-text"
              >
                <ValueTooltip tooltip={getTooltip?.(opt)}>
                  {formatOption(opt)}
                </ValueTooltip>
              </Label>
            </div>
          )
        })}
      </div>
      {options.length > collapseThreshold && (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('showLess') : t('showMore', { count: hiddenCount })}
        </Button>
      )}
    </div>
  )
}
