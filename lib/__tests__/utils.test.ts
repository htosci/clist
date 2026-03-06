import { describe, it, expect } from 'vitest'
import { cn, isSafeUrl, formatUpdatedAt, getScoreClassName } from '@/lib/utils'

describe('cn', () => {
  it('объединяет имена классов', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('отфильтровывает ложные значения', () => {
    expect(cn('a', false && 'b')).toBe('a')
  })

  it('разрешает конфликты tailwind (последнее побеждает)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('возвращает пустую строку без аргументов', () => {
    expect(cn()).toBe('')
  })

  it('обрабатывает undefined', () => {
    expect(cn(undefined)).toBe('')
  })

  it('поддерживает объектную нотацию', () => {
    expect(cn({ 'font-bold': true, 'text-red-500': false })).toBe('font-bold')
  })

  it('поддерживает массивную нотацию', () => {
    expect(cn(['a', 'b'])).toBe('a b')
  })

  it('применяет tailwind-merge для margin-конфликтов', () => {
    expect(cn('mx-2', 'mx-4')).toBe('mx-4')
  })
})

describe('isSafeUrl', () => {
  it('принимает https', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
  })

  it('принимает http', () => {
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('отклоняет javascript:', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('отклоняет data:', () => {
    expect(isSafeUrl('data:text/html,<h1>xss</h1>')).toBe(false)
  })

  it('отклоняет невалидный URL', () => {
    expect(isSafeUrl('not a url')).toBe(false)
  })
})

describe('formatUpdatedAt', () => {
  it('форматирует ISO-дату', () => {
    const result = formatUpdatedAt('2026-02-21T00:00:00.000Z', 'ru')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Проверяем что это не оригинальная строка (т.е. форматирование произошло)
    expect(result).not.toBe('2026-02-21T00:00:00.000Z')
  })

  it('возвращает строку при невалидной дате (catch-ветвь)', () => {
    // Невалидная строка — Date будет NaN
    const result = formatUpdatedAt('not-a-date', 'ru')
    expect(typeof result).toBe('string')
    expect(result).toBe('not-a-date')
  })
})

describe('getScoreClassName', () => {
  it('возвращает зелёный для score >= 7', () => {
    expect(getScoreClassName(7)).toBe('bg-green-50 text-green-700')
    expect(getScoreClassName(10)).toBe('bg-green-50 text-green-700')
  })

  it('возвращает жёлтый для score от 4 до 6', () => {
    expect(getScoreClassName(4)).toBe('bg-yellow-50 text-yellow-700')
    expect(getScoreClassName(6)).toBe('bg-yellow-50 text-yellow-700')
  })

  it('возвращает красный для score < 4', () => {
    expect(getScoreClassName(3)).toBe('bg-red-50 text-red-700')
    expect(getScoreClassName(0)).toBe('bg-red-50 text-red-700')
  })
})
