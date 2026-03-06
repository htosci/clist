import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockUseTranslations, mockUseMessages } from '@/lib/__tests__/mocks/next-intl.mock'
import { mockSchoolDetail, mockSchoolDetailMinimal } from '@/lib/__tests__/fixtures/schoolDetail.fixture'

// SchoolDetailHeader — async Server Component, поэтому мокаем next-intl/server
// и вызываем компонент как обычную async-функцию: await SchoolDetailHeader(props)
vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
  getMessages: async () => mockUseMessages(),
}))

// next/link мокируем как обычный <a>, чтобы можно было проверить href
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { SchoolDetailHeader } from '@/components/schools/school-detail-header'

describe('SchoolDetailHeader', () => {
  // --- Базовые сценарии ---

  it('отображает название школы', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Prywatna Szkoła Testowa')
  })

  it('рендерит ссылку "назад" с корректным href', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools?city=Warszawa' }))
    const backLink = screen.getByText(/Вернуться к каталогу/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/schools?city=Warszawa')
  })

  it('отображает категории школы как бейджи', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    // mockSchoolDetail имеет school_category: ['private', 'bilingual']
    expect(screen.getByText('private')).toBeInTheDocument()
    expect(screen.getByText('bilingual')).toBeInTheDocument()
  })

  it('отображает подзаголовок с типом и городом через разделитель', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    // typ = 'Szkoła podstawowa', miejscowosc = 'Warszawa' → 'Szkoła podstawowa · Warszawa'
    expect(screen.getByText('Szkoła podstawowa · Warszawa')).toBeInTheDocument()
  })

  it('отображает ссылку на сайт школы', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    const websiteLink = screen.getByText(/Перейти на сайт/)
    expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://example.com')
  })

  // --- info_score: три цвета ---

  it('info_score >= 7 получает зелёный цвет', async () => {
    // mockSchoolDetail.info_score = 8
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    const badge = screen.getByText('8/10')
    expect(badge).toHaveClass('text-green-700')
  })

  it('info_score от 4 до 6 получает жёлтый цвет', async () => {
    const school = { ...mockSchoolDetail, info_score: 5 }
    render(await SchoolDetailHeader({ school, backHref: '/schools' }))
    const badge = screen.getByText('5/10')
    expect(badge).toHaveClass('text-yellow-700')
  })

  it('info_score < 4 получает красный цвет', async () => {
    const school = { ...mockSchoolDetail, info_score: 2 }
    render(await SchoolDetailHeader({ school, backHref: '/schools' }))
    const badge = screen.getByText('2/10')
    expect(badge).toHaveClass('text-red-700')
  })

  it('не отображает бейдж info_score когда значение null', async () => {
    // mockSchoolDetailMinimal.info_score = null
    render(await SchoolDetailHeader({ school: mockSchoolDetailMinimal, backHref: '/schools' }))
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument()
  })

  // --- Баннер о закрытии ---

  it('показывает баннер "школа закрыта" когда closed = true', async () => {
    const school = { ...mockSchoolDetail, closed: true }
    render(await SchoolDetailHeader({ school, backHref: '/schools' }))
    expect(screen.getByText(/Школа закрыта/i)).toBeInTheDocument()
  })

  it('не показывает баннер закрытия когда closed = false', async () => {
    // mockSchoolDetail.closed = false
    render(await SchoolDetailHeader({ school: mockSchoolDetail, backHref: '/schools' }))
    expect(screen.queryByText(/Школа закрыта/i)).not.toBeInTheDocument()
  })

  it('не показывает баннер закрытия когда closed = null', async () => {
    // mockSchoolDetailMinimal.closed = null
    render(await SchoolDetailHeader({ school: mockSchoolDetailMinimal, backHref: '/schools' }))
    expect(screen.queryByText(/Школа закрыта/i)).not.toBeInTheDocument()
  })

  // --- Граничные случаи: nullable-поля ---

  it('не отображает ссылку на сайт когда website = null', async () => {
    render(await SchoolDetailHeader({ school: mockSchoolDetailMinimal, backHref: '/schools' }))
    expect(screen.queryByText(/Перейти на сайт/)).not.toBeInTheDocument()
  })

  it('не отображает категории когда school_category = null', async () => {
    // mockSchoolDetailMinimal.school_category = null — секция бейджей пустая
    render(await SchoolDetailHeader({ school: mockSchoolDetailMinimal, backHref: '/schools' }))
    expect(screen.queryByText('private')).not.toBeInTheDocument()
  })

  it('рендерит минимальные данные без ошибок', async () => {
    // Проверяем что компонент не падает когда большинство полей null
    render(await SchoolDetailHeader({ school: mockSchoolDetailMinimal, backHref: '/schools' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Минимальная школа')
  })

  it('подзаголовок содержит только typ когда miejscowosc = null', async () => {
    const school = { ...mockSchoolDetailMinimal, typ: 'Szkoła podstawowa' }
    render(await SchoolDetailHeader({ school, backHref: '/schools' }))
    // filter(Boolean) убирает null, join добавляет разделитель только если оба поля есть
    expect(screen.getByText('Szkoła podstawowa')).toBeInTheDocument()
  })
})
