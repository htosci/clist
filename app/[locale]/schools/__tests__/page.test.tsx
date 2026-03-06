import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockUseTranslations } from '@/lib/__tests__/mocks/next-intl.mock'
import { mockSchool } from '@/lib/__tests__/fixtures/school.fixture'
import { mockFilterOptions } from '@/lib/__tests__/fixtures/filterOptions.fixture'
import { PaginationButton } from '@/app/[locale]/schools/page'

// --- Моки для SchoolsPage ---

// getTranslations и getLocale — серверные утилиты next-intl
vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
  getLocale: async () => 'pl',
}))

// Дочерние компоненты мокируем целиком: их поведение тестируется отдельно.
// Здесь важно убедиться что страница рендерит нужный компонент в нужной ветке.
vi.mock('@/components/schools/filter-bar', () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}))
vi.mock('@/components/schools/school-grid', () => ({
  SchoolGrid: ({ schools }: { schools: unknown[] }) => (
    <div data-testid="school-grid" data-count={schools.length} />
  ),
}))
vi.mock('@/components/schools/view-toggle', () => ({
  ViewToggle: ({ currentView }: { currentView: string }) => (
    <div data-testid="view-toggle" data-view={currentView} />
  ),
}))
// SchoolMapWrapper исключён из coverage (WebGL), поэтому мокируем без реализации
vi.mock('@/components/schools/school-map-wrapper', () => ({
  SchoolMapWrapper: ({ schools }: { schools: unknown[] }) => (
    <div data-testid="school-map-wrapper" data-count={schools.length} />
  ),
}))
vi.mock('@/app/[locale]/schools/loading', () => ({
  default: () => <div data-testid="loading-skeleton" />,
}))

// Серверные экшены мокируем, чтобы не делать запросов к Supabase
const mockGetSchoolsAction = vi.fn()
const mockGetFilterOptions = vi.fn()
const mockGetSchoolsForMapAction = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getSchoolsAction: (...args: unknown[]) => mockGetSchoolsAction(...args),
  getFilterOptions: (...args: unknown[]) => mockGetFilterOptions(...args),
  getSchoolsForMapAction: (...args: unknown[]) => mockGetSchoolsForMapAction(...args),
}))

// Тестируем PaginationButton как отдельный чистый компонент

describe('PaginationButton', () => {
  it('активная кнопка: рендерит <a> с корректным href', () => {
    render(
      <PaginationButton params={{ sort: 'price_asc' }} targetPage={3} disabled={false}>
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link', { name: 'Вперед' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/schools?sort=price_asc&page=3')
  })

  it('disabled кнопка: рендерит <button disabled>', () => {
    render(
      <PaginationButton params={{}} targetPage={0} disabled={true}>
        Назад
      </PaginationButton>
    )
    const btn = screen.getByRole('button', { name: 'Назад' })
    expect(btn).toBeDisabled()
    expect(btn.tagName).toBe('BUTTON')
  })

  it('href сохраняет все существующие фильтры', () => {
    render(
      <PaginationButton
        params={{ query: 'Warsaw', wojewodztwo: 'Mazowieckie', sort: 'price_asc' }}
        targetPage={2}
        disabled={false}
      >
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain('query=Warsaw')
    expect(href).toContain('wojewodztwo=Mazowieckie')
    expect(href).toContain('sort=price_asc')
    expect(href).toContain('page=2')
  })

  it('активная кнопка: НЕ имеет атрибут disabled', () => {
    render(
      <PaginationButton params={{}} targetPage={1} disabled={false}>
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('disabled')
  })

  it('href для page=1 содержит page=1', () => {
    render(
      <PaginationButton params={{}} targetPage={1} disabled={false}>
        Назад
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/schools?page=1')
  })

  // basePath нужен для русской локали: /ru/schools вместо /schools
  it('использует basePath для формирования href', () => {
    render(
      <PaginationButton params={{}} targetPage={2} disabled={false} basePath="/ru/schools">
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/ru/schools?page=2')
  })
})

// --- SchoolsPage (async Server Component) ---
// Вызываем как функцию: await SchoolsPage(...), как это принято в проекте.

describe('SchoolsPage — режим сетки (по умолчанию)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSchoolsAction.mockResolvedValue({
      data: [mockSchool],
      count: 1,
      page: 1,
      totalPages: 1,
    })
    mockGetFilterOptions.mockResolvedValue(mockFilterOptions)
    // В режиме сетки getSchoolsForMapAction не должна вызываться —
    // страница подставляет Promise.resolve([]) напрямую
    mockGetSchoolsForMapAction.mockResolvedValue([])
  })

  it('рендерит заголовок страницы', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({}) }))
    expect(
      screen.getByRole('heading', { level: 1, name: /Частные школы Польши/i })
    ).toBeInTheDocument()
  })

  it('показывает количество найденных школ из schools.count', async () => {
    mockGetSchoolsAction.mockResolvedValueOnce({
      data: [mockSchool],
      count: 42,
      page: 1,
      totalPages: 4,
    })
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({}) }))
    // "Найдено школ: {count}" → "Найдено школ: 42"
    expect(screen.getByText(/Найдено школ: 42/)).toBeInTheDocument()
  })

  it('рендерит SchoolGrid, не рендерит SchoolMapWrapper', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByTestId('school-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('school-map-wrapper')).not.toBeInTheDocument()
  })

  it('передаёт ViewToggle текущий вид "grid"', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByTestId('view-toggle')).toHaveAttribute('data-view', 'grid')
  })

  it('не вызывает getSchoolsForMapAction в режиме сетки', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    await SchoolsPage({ searchParams: Promise.resolve({}) })
    // В коде страницы: isMapView ? getSchoolsForMapAction(filters) : Promise.resolve([])
    // Поэтому мок не должен быть вызван
    expect(mockGetSchoolsForMapAction).not.toHaveBeenCalled()
  })
})

describe('SchoolsPage — режим карты (view=map)', () => {
  const mapMarkers = [
    { numer_rspo: 1, nazwa: 'Школа 1', lat: 52.0, lng: 21.0 },
    { numer_rspo: 2, nazwa: 'Школа 2', lat: 50.0, lng: 19.0 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSchoolsAction.mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      totalPages: 0,
    })
    mockGetFilterOptions.mockResolvedValue(mockFilterOptions)
    mockGetSchoolsForMapAction.mockResolvedValue(mapMarkers)
  })

  it('рендерит SchoolMapWrapper, не рендерит SchoolGrid', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({ view: 'map' }) }))
    expect(screen.getByTestId('school-map-wrapper')).toBeInTheDocument()
    expect(screen.queryByTestId('school-grid')).not.toBeInTheDocument()
  })

  it('показывает количество маркеров из mapMarkers.length, не из schools.count', async () => {
    // Это ключевое поведение: в режиме карты счётчик берётся из mapMarkers,
    // а не из schools.count (который мог бы быть устаревшим или отличаться)
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({ view: 'map' }) }))
    expect(screen.getByText(/Найдено школ: 2/)).toBeInTheDocument()
  })

  it('передаёт ViewToggle текущий вид "map"', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({ view: 'map' }) }))
    expect(screen.getByTestId('view-toggle')).toHaveAttribute('data-view', 'map')
  })

  it('вызывает getSchoolsForMapAction с теми же фильтрами что переданы в searchParams', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    await SchoolsPage({
      searchParams: Promise.resolve({ view: 'map', miejscowosc: 'Warszawa' }),
    })
    expect(mockGetSchoolsForMapAction).toHaveBeenCalledWith(
      expect.objectContaining({ miejscowosc: 'Warszawa' })
    )
  })

  it('передаёт маркеры в SchoolMapWrapper', async () => {
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({ view: 'map' }) }))
    const wrapper = screen.getByTestId('school-map-wrapper')
    // Проверяем что маркеры дошли до компонента карты
    expect(wrapper).toHaveAttribute('data-count', String(mapMarkers.length))
  })

  it('не рендерит пагинацию в режиме карты', async () => {
    mockGetSchoolsAction.mockResolvedValueOnce({
      data: [],
      count: 100,
      page: 1,
      totalPages: 9, // много страниц — в режиме сетки пагинация была бы видна
    })
    const { default: SchoolsPage } = await import('@/app/[locale]/schools/page')
    render(await SchoolsPage({ searchParams: Promise.resolve({ view: 'map' }) }))
    expect(screen.queryByText(/Назад/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Вперед/)).not.toBeInTheDocument()
  })
})
