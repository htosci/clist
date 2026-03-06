/**
 * Мок useTranslations для тестов.
 * Использует реальные переводы из messages/ru.json, чтобы тесты
 * по-прежнему работали с конкретными текстовыми строками.
 */
import ruMessages from '../../../messages/ru.json'

type MessagesObj = Record<string, unknown>

function getNestedValue(obj: MessagesObj, key: string): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return key
    current = (current as MessagesObj)[part]
  }
  return typeof current === 'string' ? current : key
}

function interpolate(value: string, params?: Record<string, unknown>): string {
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

/**
 * Всегда возвращает сообщения локали 'ru' — независимо от контекста теста.
 * Для тестов, проверяющих польские переводы, при необходимости мокируй useMessages отдельно.
 */
export function mockUseMessages() {
  return ruMessages as unknown as Record<string, unknown>
}

export function mockUseTranslations(namespace: string) {
  const nsObj = namespace
    ? (ruMessages as MessagesObj)[namespace] as MessagesObj | undefined
    : ruMessages as unknown as MessagesObj

  return (key: string, params?: Record<string, unknown>) => {
    if (!nsObj) return key
    const value = getNestedValue(nsObj, key)
    return interpolate(value, params)
  }
}
