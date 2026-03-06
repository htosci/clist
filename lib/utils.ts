import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Форматирует ISO-дату в "12 фев" / "5 mar" согласно локали */
export function formatUpdatedAt(dateStr: string, locale: string = 'ru'): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  try {
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

/** Проверяет, что URL имеет безопасный протокол (http/https). Защита от javascript: URI. */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/** Возвращает Tailwind-классы для бейджа info_score */
export function getScoreClassName(score: number): string {
  if (score >= 7) return 'bg-green-50 text-green-700'
  if (score >= 4) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-700'
}
