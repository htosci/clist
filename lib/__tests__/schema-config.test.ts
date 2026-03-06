import { describe, it, expect } from 'vitest'
import {
  getFieldsByFilterType,
  getGeoFields,
  getFilterKeys,
  getFieldsByPosition,
} from '@/lib/schema-config'

describe('getFieldsByFilterType', () => {
  it('возвращает 4 select-поля (гео)', () => {
    const fields = getFieldsByFilterType('select')
    expect(fields).toHaveLength(4)
  })

  it('возвращает 3 checkbox-поля (этапы обучения)', () => {
    const fields = getFieldsByFilterType('checkbox')
    expect(fields).toHaveLength(3)
  })

  it('возвращает 5 multiselect-полей', () => {
    const fields = getFieldsByFilterType('multiselect')
    expect(fields).toHaveLength(5)
    const keys = fields.map(([key]) => key)
    expect(keys).toContain('school_category')
    expect(keys).toContain('instruction_languages')
    expect(keys).toContain('curriculum')
    expect(keys).toContain('methodology')
    expect(keys).toContain('specialization')
  })

  it('возвращает 1 range-поле (total_annual_cost)', () => {
    const fields = getFieldsByFilterType('range')
    expect(fields).toHaveLength(1)
    expect(fields[0][0]).toBe('total_annual_cost')
  })

  it('возвращает 1 text-поле (nazwa)', () => {
    const fields = getFieldsByFilterType('text')
    expect(fields).toHaveLength(1)
    expect(fields[0][0]).toBe('nazwa')
  })
})

describe('getGeoFields', () => {
  it('возвращает ровно 4 гео-поля', () => {
    const fields = getGeoFields()
    expect(fields).toHaveLength(4)
  })

  it('поля отсортированы по geoLevel по возрастанию (1→4)', () => {
    const fields = getGeoFields()
    const levels = fields.map(([, config]) => (config as { geoLevel: number }).geoLevel)
    expect(levels).toEqual([1, 2, 3, 4])
  })

  it('порядок полей: wojewodztwo, powiat, gmina, miejscowosc', () => {
    const fields = getGeoFields()
    expect(fields.map(([key]) => key)).toEqual([
      'wojewodztwo',
      'powiat',
      'gmina',
      'miejscowosc',
    ])
  })

  it('все поля имеют filterType: select', () => {
    const fields = getGeoFields()
    fields.forEach(([, config]) => {
      expect(config.filterType).toBe('select')
    })
  })
})

describe('getFilterKeys', () => {
  it('возвращает только строки', () => {
    const keys = getFilterKeys('select')
    expect(keys.every((k) => typeof k === 'string')).toBe(true)
  })

  it('возвращает правильные ключи для checkbox', () => {
    const keys = getFilterKeys('checkbox')
    expect(keys).toContain('wychowanie_przedszkolne')
    expect(keys).toContain('i_etap_edukacyjny')
    expect(keys).toContain('ii_etap_edukacyjny')
    expect(keys).toHaveLength(3)
  })

  it('возвращает правильные ключи для select', () => {
    const keys = getFilterKeys('select')
    expect(keys).toContain('wojewodztwo')
    expect(keys).toContain('powiat')
    expect(keys).toContain('gmina')
    expect(keys).toContain('miejscowosc')
  })
})

describe('getFieldsByPosition', () => {
  it('badge-позиция: содержит school_category', () => {
    const fields = getFieldsByPosition('badge')
    expect(fields.map(([key]) => key)).toContain('school_category')
  })

  it('stage-позиция: 3 поля этапов обучения', () => {
    const fields = getFieldsByPosition('stage')
    const keys = fields.map(([key]) => key)
    expect(keys).toContain('wychowanie_przedszkolne')
    expect(keys).toContain('i_etap_edukacyjny')
    expect(keys).toContain('ii_etap_edukacyjny')
    expect(fields).toHaveLength(3)
  })

  it('financial-позиция: содержит total_annual_cost', () => {
    const fields = getFieldsByPosition('financial')
    expect(fields.map(([key]) => key)).toContain('total_annual_cost')
  })

  it('feature-позиция: содержит languages, curriculum, methodology', () => {
    const fields = getFieldsByPosition('feature')
    const keys = fields.map(([key]) => key)
    expect(keys).toContain('instruction_languages')
    expect(keys).toContain('curriculum')
    expect(keys).toContain('methodology')
  })

  it('highlight-позиция: содержит specialization', () => {
    const fields = getFieldsByPosition('highlight')
    expect(fields.map(([key]) => key)).toContain('specialization')
  })
})
