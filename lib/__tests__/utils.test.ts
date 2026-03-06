import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

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
