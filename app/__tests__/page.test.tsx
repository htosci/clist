import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/[locale]/page'
import { mockUseTranslations } from '@/lib/__tests__/mocks/next-intl.mock'

vi.mock('@/i18n/navigation')

// Мокаем next-intl/server: getTranslations → реальные переводы ru.json, getLocale → 'pl'
vi.mock('next-intl/server', async () => {
  const { mockUseTranslations } = await import('@/lib/__tests__/mocks/next-intl.mock')
  return {
    getTranslations: async (namespace: string) => mockUseTranslations(namespace),
    getLocale: async () => 'pl',
  }
})

// app/[locale]/page.tsx — async Server Component.
// Тестируем вызывая как функцию: await Home() → JSX
describe('Home — Hero-секция', () => {
  it('показывает главный заголовок', async () => {
    render(await Home())
    expect(
      screen.getByRole('heading', { level: 1, name: /Найдите частную школу в Польше/i })
    ).toBeInTheDocument()
  })

  it('показывает подзаголовок с описанием', async () => {
    render(await Home())
    expect(screen.getByText(/Сравнивайте более 1/)).toBeInTheDocument()
  })

  it('кнопка CTA ведёт на /schools', async () => {
    render(await Home())
    const link = screen.getByRole('link', { name: /Смотреть все школы/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/schools')
  })
})

describe('Home — блок популярных городов', () => {
  const cities = [
    { name: 'Варшава',  slug: 'Warszawa' },
    { name: 'Краков',   slug: 'Krak%C3%B3w' },
    { name: 'Вроцлав',  slug: 'Wroc%C5%82aw' },
    { name: 'Гданьск',  slug: 'Gda%C5%84sk' },
    { name: 'Познань',  slug: 'Pozna%C5%84' },
    { name: 'Катовице', slug: 'Katowice' },
  ]

  it('показывает метку "Популярные города"', async () => {
    render(await Home())
    expect(screen.getByText(/Популярные города/i)).toBeInTheDocument()
  })

  cities.forEach(({ name, slug }) => {
    it(`кнопка города "${name}" ведёт на /schools?miejscowosc=${slug}`, async () => {
      render(await Home())
      const link = screen.getByRole('link', { name: new RegExp(name, 'i') })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute(
        'href',
        `/schools?miejscowosc=${slug}`
      )
    })
  })
})

describe('Home — секция УТП "Почему Clist?"', () => {
  it('показывает заголовок секции', async () => {
    render(await Home())
    expect(
      screen.getByRole('heading', { level: 2, name: /Почему Clist/i })
    ).toBeInTheDocument()
  })

  it('показывает все четыре карточки УТП', async () => {
    render(await Home())
    expect(screen.getByText('Умный поиск')).toBeInTheDocument()
    expect(screen.getByText('Любой город Польши')).toBeInTheDocument()
    expect(screen.getByText('Актуальные данные')).toBeInTheDocument()
    expect(screen.getByText('Оценка полноты')).toBeInTheDocument()
  })

  it('каждая карточка содержит описательный текст', async () => {
    render(await Home())
    expect(screen.getByText(/Фильтрация по 10\+ параметрам/)).toBeInTheDocument()
    expect(screen.getByText(/охватывает школы по всей стране/)).toBeInTheDocument()
    expect(screen.getByText(/собирается автоматически/)).toBeInTheDocument()
    expect(screen.getByText(/индикатор надёжности/)).toBeInTheDocument()
  })
})
