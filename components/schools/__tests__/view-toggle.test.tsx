import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()
const mockSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/schools',
  useSearchParams: () => mockSearchParams(),
}))

vi.mock('next-intl', async (importOriginal) => {
  const { mockUseTranslations } = await import('@/lib/__tests__/mocks/next-intl.mock')
  const original = await importOriginal<typeof import('next-intl')>()
  return { ...original, useTranslations: mockUseTranslations }
})

import { ViewToggle } from '@/components/schools/view-toggle'

describe('ViewToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Пустые searchParams по умолчанию
    mockSearchParams.mockReturnValue(new URLSearchParams())
  })

  it('рендерит кнопки Сетка и Карта', () => {
    render(<ViewToggle currentView="grid" />)
    // useTranslations('schools') + 'viewToggle.grid' → 'Сетка'
    expect(screen.getByTitle('Сетка')).toBeInTheDocument()
    expect(screen.getByTitle('Карта')).toBeInTheDocument()
  })

  it('нажатие на кнопку Карта вызывает push с ?view=map', async () => {
    const user = userEvent.setup()
    render(<ViewToggle currentView="grid" />)
    await user.click(screen.getByTitle('Карта'))
    expect(mockPush).toHaveBeenCalledWith('/schools?view=map')
  })

  it('нажатие на кнопку Сетка убирает параметр view', async () => {
    const user = userEvent.setup()
    mockSearchParams.mockReturnValue(new URLSearchParams('view=map'))
    render(<ViewToggle currentView="map" />)
    await user.click(screen.getByTitle('Сетка'))
    expect(mockPush).toHaveBeenCalledWith('/schools')
  })

  it('при переключении на карту сохраняет другие фильтры', async () => {
    const user = userEvent.setup()
    mockSearchParams.mockReturnValue(new URLSearchParams('miejscowosc=Warszawa'))
    render(<ViewToggle currentView="grid" />)
    await user.click(screen.getByTitle('Карта'))
    expect(mockPush).toHaveBeenCalledWith('/schools?miejscowosc=Warszawa&view=map')
  })

  // При переключении вида пагинация теряет смысл: страница 3 вида сетки
  // не соответствует странице 3 на карте (карта показывает всё сразу).
  // Поэтому switchTo() всегда удаляет параметр page.
  it('при переключении на карту удаляет параметр page', async () => {
    const user = userEvent.setup()
    mockSearchParams.mockReturnValue(new URLSearchParams('page=3&miejscowosc=Warszawa'))
    render(<ViewToggle currentView="grid" />)
    await user.click(screen.getByTitle('Карта'))
    const calledUrl = mockPush.mock.calls[0][0] as string
    expect(calledUrl).not.toContain('page=')
    expect(calledUrl).toContain('view=map')
  })

  it('при переключении на сетку удаляет параметр page', async () => {
    const user = userEvent.setup()
    mockSearchParams.mockReturnValue(new URLSearchParams('view=map&page=2'))
    render(<ViewToggle currentView="map" />)
    await user.click(screen.getByTitle('Сетка'))
    const calledUrl = mockPush.mock.calls[0][0] as string
    expect(calledUrl).not.toContain('page=')
    expect(calledUrl).not.toContain('view=')
  })

  // currentView управляет стилем активной кнопки.
  // Проверяем что активная кнопка имеет класс выделения —
  // это предотвращает случайное удаление условного класса при рефакторинге стилей.
  it('кнопка текущего вида имеет класс активного состояния', () => {
    render(<ViewToggle currentView="map" />)
    const mapBtn = screen.getByTitle('Карта')
    const gridBtn = screen.getByTitle('Сетка')
    expect(mapBtn.className).toContain('bg-background')
    expect(gridBtn.className).not.toContain('bg-background')
  })
})
