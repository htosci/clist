/**
 * Vitest мок для @/i18n/navigation.
 * Используется автоматически при vi.mock('@/i18n/navigation').
 * getPathname воспроизводит логику localePrefix: 'as-needed':
 * defaultLocale 'pl' — без префикса, остальные — с /${locale}.
 */
import NextLink from 'next/link'

const DEFAULT_LOCALE = 'pl'

export function getPathname({ href, locale }: { href: string; locale: string }): string {
  const path = typeof href === 'string' ? href : (href as { pathname: string }).pathname
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`
}

export function getSchoolsPath(locale: string): string {
  return getPathname({ href: '/schools', locale })
}

export const Link = NextLink
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
})
export const usePathname = () => '/'
export const redirect = () => { throw new Error('redirect called') }
