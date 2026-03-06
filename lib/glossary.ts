/**
 * Утилиты для поиска подсказок (тултипов) по значениям полей.
 * Тексты хранятся в messages/{locale}.json в namespace 'glossary'.
 */

/** Маппинг ключа поля схемы → под-неймспейс в glossary */
export const FIELD_GLOSSARY_NS: Record<string, string> = {
  instruction_languages: 'languages',
  methodology: 'methodology',
  curriculum: 'curriculum',
  school_category: 'school_category',
  specialization: 'specialization',
}

/** Нормализует значение в ключ i18n: "Reggio Emilia" → "reggio_emilia", "Języki" → "jezyki" */
export function toGlossaryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // убираем диакритику после NFD-декомпозиции
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Ищет тултип для значения поля в объекте сообщений.
 * Возвращает строку или undefined (нет записи → тултип не показывается).
 */
export function lookupGlossary(
  messages: unknown,
  fieldKey: string,
  value: string
): string | undefined {
  const ns = FIELD_GLOSSARY_NS[fieldKey]
  if (!ns) return undefined
  // Используем Record<string, string | undefined> чтобы корректно типизировать
  // отсутствующий ключ — index signature возвращает undefined для несуществующих ключей
  const section = (messages as Record<string, Record<string, Record<string, string | undefined>>>)
    ?.glossary?.[ns]
  if (!section) return undefined
  return section[toGlossaryKey(value)]
}
