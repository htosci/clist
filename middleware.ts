import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Перехватываем все пути кроме Next.js internals и статики
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
