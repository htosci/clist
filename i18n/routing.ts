import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['pl', 'ru'],
  defaultLocale: 'pl',
  localePrefix: 'as-needed',
})
