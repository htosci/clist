"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { useTranslations, useMessages } from "next-intl"
import { lookupGlossary } from "@/lib/glossary"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { X } from "lucide-react"
import { FilterOptions, getGeoFields, getFieldsByFilterType } from '@/lib/schema-config'
import { CheckboxGroup } from "@/components/ui/checkbox-group"

// Вычисляем один раз на уровне модуля — не пересчитывается при каждом рендере
const geoFields = getGeoFields()
const checkboxFields = getFieldsByFilterType('checkbox')
const multiselectFields = getFieldsByFilterType('multiselect')
const rangeFields = getFieldsByFilterType('range')

export function FilterBar({ options }: { options: FilterOptions | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('filters')
  const tf = useTranslations('fields')
  const messages = useMessages()

  const selectedWoj = searchParams.get('wojewodztwo')
  const selectedPow = searchParams.get('powiat')
  const selectedGm = searchParams.get('gmina')

  const getGeoOptions = (key: string): string[] => {
    if (!options) return []
    const h = options.geo_hierarchy
    switch (key) {
      case 'wojewodztwo': return Object.keys(h).sort()
      case 'powiat': return selectedWoj ? Object.keys(h[selectedWoj] ?? {}).sort() : []
      case 'gmina': return selectedWoj && selectedPow ? Object.keys((h[selectedWoj] ?? {})[selectedPow] ?? {}).sort() : []
      case 'miejscowosc': return selectedWoj && selectedPow && selectedGm
        ? [...((h[selectedWoj] ?? {})[selectedPow]?.[selectedGm] ?? [])].sort()
        : []
      default: return []
    }
  }

  const updateFilters = (updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleDebouncedUpdate = useDebouncedCallback((key: string, value: string) => {
    updateFilters({ [key]: value })
  }, 400)

  const handleReset = () => router.push(pathname)

  if (!options) return <div className="p-4 animate-pulse bg-muted/20 rounded-xl">{t('loading')}</div>

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-card shadow-sm select-text [&_label]:!select-text">
      {/* 1. Поиск и сортировка */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="search">{t('search.label')}</Label>
          <Input
            id="search"
            placeholder={t('search.placeholder')}
            defaultValue={searchParams.get('query') || ""}
            onChange={(e) => handleDebouncedUpdate('query', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="sort-select">{t('sort.label')}</Label>
          <Select
            value={searchParams.get('sort') || "default"}
            onValueChange={(v) => updateFilters({ sort: v === 'default' ? null : v })}
          >
            <SelectTrigger id="sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('sort.default')}</SelectItem>
              <SelectItem value="price_asc">{t('sort.asc')}</SelectItem>
              <SelectItem value="price_desc">{t('sort.desc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} className="w-full">
            <X aria-hidden="true" className="w-4 h-4 mr-2" /> {t('reset')}
          </Button>
        </div>
      </div>

      {/* 2. География — каскад из schema (geoLevel определяет что сбрасывать) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {geoFields.map(([key, config]) => {
          const currentLevel = (config as { geoLevel: number }).geoLevel
          const geoOptions = getGeoOptions(key)
          return (
            <div key={key}>
              <Label>{tf(config.label as Parameters<typeof tf>[0])}</Label>
              <Select
                disabled={currentLevel > 1 && geoOptions.length === 0}
                value={searchParams.get(key) || "all"}
                onValueChange={(v) => {
                  // Сброс всех гео-полей с geoLevel строго выше текущего
                  const resetFields = geoFields
                    .filter(([, c]) => (c as { geoLevel: number }).geoLevel > currentLevel)
                    .reduce<Record<string, null>>((acc, [k]) => ({ ...acc, [k]: null }), {})
                  updateFilters({ ...resetFields, [key]: v === 'all' ? null : v })
                }}
              >
                <SelectTrigger><SelectValue placeholder={t('any')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('any')}</SelectItem>
                  {geoOptions.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>

      {/* 3. Этапы обучения — из schema (filterType: 'checkbox') */}
      <div className="flex flex-wrap gap-6 py-2 border-y border-border/50">
        {checkboxFields.map(([key, config]) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={searchParams.get(key) === 'true'}
              onCheckedChange={(checked) => updateFilters({ [key]: checked ? 'true' : null })}
            />
            <Label htmlFor={key} className="cursor-pointer">
              {tf(config.label as Parameters<typeof tf>[0])}
            </Label>
          </div>
        ))}
      </div>

      {/* 4. Параметры + цена — из schema (filterType: 'multiselect' и 'range') */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {multiselectFields.map(([key, config]) => {
          const selected = searchParams.get(key)?.split(',').filter(Boolean) ?? []
          const fieldOptions: string[] = (options[key as keyof FilterOptions] as string[]) ?? []
          return (
            <CheckboxGroup
              key={key}
              label={tf(config.label as Parameters<typeof tf>[0])}
              options={fieldOptions}
              values={selected}
              onChange={(vals) => updateFilters({ [key]: vals.join(',') || null })}
              getTooltip={(value) => lookupGlossary(messages, key, value)}
            />
          )
        })}

        {rangeFields.map(([key, config]) => {
          const { min, max } = (config as { rangeParams: { min: string; max: string } }).rangeParams
          const suffix = (config as { ui?: { suffix?: string } }).ui?.suffix ?? ''
          return (
            <div key={key} className="md:col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <Label title={tf('total_annual_cost.label')} className="cursor-help">{t('price.from', { suffix })}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  defaultValue={searchParams.get(min) || ""}
                  onChange={(e) => handleDebouncedUpdate(min, e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label title={tf('total_annual_cost.label')} className="cursor-help">{t('price.to')}</Label>
                <Input
                  type="number"
                  placeholder="100 000"
                  defaultValue={searchParams.get(max) || ""}
                  onChange={(e) => handleDebouncedUpdate(max, e.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
