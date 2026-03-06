import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, useRouter, usePathname, redirect, getPathname } = createNavigation(routing)

/**
 * Вычисляет путь к разделу /schools с учётом локали.
 * Используется там, где нельзя применить JSX-компонент Link
 * (например, HTML-строки для MapLibre popup).
 */
export function getSchoolsPath(locale: string): string {
  return getPathname({ href: '/schools', locale })
}
