import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FilterBar } from '@/components/schools/filter-bar'
import { mockFilterOptions } from '@/lib/__tests__/fixtures/filterOptions.fixture'
// Мокаем next-intl (async factory чтобы обойти ограничение hoisting)
vi.mock('next-intl', async () => {
  const { mockUseTranslations, mockUseMessages } = await import('@/lib/__tests__/mocks/next-intl.mock')
  return { useTranslations: mockUseTranslations, useMessages: mockUseMessages }
})

vi.mock('@/components/ui/value-tooltip', () => ({
  ValueTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Мокаем next/navigation
const mockPush = vi.fn()
const mockUseSearchParams = vi.fn(() => new URLSearchParams())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => '/schools',
}))

// Мокаем shadcn Select как нативный <select> для надёжного тестирования в jsdom
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: {
    value?: string
    onValueChange?: (v: string) => void
    children?: React.ReactNode
  }) => (
    <select value={value ?? ''} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children?: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

// Мокаем Checkbox как нативный input[type=checkbox]
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    id?: string
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked ?? false}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}))

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('показывает loading-заглушку когда options = null', () => {
    render(<FilterBar options={null} />)
    expect(screen.getByText(/Загрузка фильтров/)).toBeInTheDocument()
  })

  it('не рендерит select-поля когда options = null', () => {
    render(<FilterBar options={null} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('кнопка "Сбросить всё" вызывает push("/schools")', () => {
    render(<FilterBar options={mockFilterOptions} />)
    const resetBtn = screen.getByRole('button', { name: /сбросить/i })
    resetBtn.click()
    expect(mockPush).toHaveBeenCalledWith('/schools')
  })

  it('поиск с дебаунсом: после 400ms вызывает push с query=', () => {
    render(<FilterBar options={mockFilterOptions} />)
    const searchInput = screen.getByPlaceholderText('Название школы...')
    fireEvent.change(searchInput, { target: { value: 'Warsaw' } })
    expect(mockPush).not.toHaveBeenCalled()
    vi.advanceTimersByTime(400)
    expect(mockPush).toHaveBeenCalledTimes(1)
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('query=Warsaw')
  })

  it('поиск пустой строкой: query удалён из URL', () => {
    render(<FilterBar options={mockFilterOptions} />)
    const searchInput = screen.getByPlaceholderText('Название школы...')
    // Сначала вводим значение (инициирует debounce)
    fireEvent.change(searchInput, { target: { value: 'Warsaw' } })
    vi.advanceTimersByTime(200) // не даём первому debounce сработать
    // Очищаем — debounce перезапускается
    fireEvent.change(searchInput, { target: { value: '' } })
    vi.advanceTimersByTime(400)
    // Последний вызов push — с пустым query (удалённым)
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1]
    const url = lastCall?.[0] as string
    expect(url).not.toContain('query=')
  })

  it('любое изменение фильтра удаляет параметр page из URL', () => {
    render(<FilterBar options={mockFilterOptions} />)
    const searchInput = screen.getByPlaceholderText('Название школы...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    vi.advanceTimersByTime(400)
    const url = mockPush.mock.calls[0][0] as string
    expect(url).not.toContain('page=')
  })

  describe('гео-каскад', () => {
    it('смена Воеводство: сбрасывает powiat/gmina/miejscowosc, обновляет wojewodztwo', () => {
      render(<FilterBar options={mockFilterOptions} />)

      // Найти select Воеводства через его label
      const wojLabel = screen.getByText('Воеводство')
      const wojWrapper = wojLabel.closest('div')!
      const wojSelect = within(wojWrapper).getByRole('combobox')

      fireEvent.change(wojSelect, { target: { value: 'Mazowieckie' } })

      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('wojewodztwo=Mazowieckie')
      expect(url).not.toContain('powiat=')
      expect(url).not.toContain('gmina=')
      expect(url).not.toContain('miejscowosc=')
    })

    it('смена Повят: сбрасывает gmina/miejscowosc, сохраняет воеводство', () => {
      // Симулируем состояние: воеводство уже выбрано, gmina и miejscowosc тоже
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('wojewodztwo=Mazowieckie&gmina=Warszawa&miejscowosc=Warszawa')
      )
      render(<FilterBar options={mockFilterOptions} />)

      const powLabel = screen.getByText('Повят')
      const powWrapper = powLabel.closest('div')!
      const powSelect = within(powWrapper).getByRole('combobox')

      fireEvent.change(powSelect, { target: { value: 'Warszawa' } })

      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('powiat=Warszawa')
      expect(url).toContain('wojewodztwo=Mazowieckie')
      expect(url).not.toContain('gmina=')
      expect(url).not.toContain('miejscowosc=')
    })

    it('смена Гмина: сбрасывает tylko miejscowosc', () => {
      // Симулируем состояние: воеводство и повят уже выбраны
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('wojewodztwo=Mazowieckie&powiat=Warszawa&miejscowosc=Warszawa')
      )
      render(<FilterBar options={mockFilterOptions} />)

      const gminaLabel = screen.getByText('Гмина')
      const gminaWrapper = gminaLabel.closest('div')!
      const gminaSelect = within(gminaWrapper).getByRole('combobox')

      fireEvent.change(gminaSelect, { target: { value: 'Warszawa' } })

      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('gmina=Warszawa')
      expect(url).toContain('wojewodztwo=Mazowieckie')
      expect(url).toContain('powiat=Warszawa')
      expect(url).not.toContain('miejscowosc=')
    })
  })

  describe('checkbox этапов обучения', () => {
    it('отмечение checkbox: добавляет field=true в URL', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const checkbox = screen.getByLabelText('Детский сад') as HTMLInputElement
      fireEvent.click(checkbox)
      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('wychowanie_przedszkolne=true')
    })

    it('снятие checkbox: поле удалено из URL', () => {
      // Рендерим с уже отмеченным чекбоксом (симулируем состояние URL)
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('wychowanie_przedszkolne=true')
      )
      render(<FilterBar options={mockFilterOptions} />)
      const checkbox = screen.getByLabelText('Детский сад') as HTMLInputElement
      // Checkbox должен быть checked изначально
      expect(checkbox.checked).toBe(true)
      // Кликаем — снимаем отметку
      fireEvent.click(checkbox)
      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).not.toContain('wychowanie_przedszkolne=true')
    })
  })

  describe('сортировка', () => {
    it('выбор "price_asc" добавляет sort=price_asc в URL', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const sortLabel = screen.getByText('Сортировка цен')
      const sortWrapper = sortLabel.closest('div')!
      const sortSelect = within(sortWrapper).getByRole('combobox')
      fireEvent.change(sortSelect, { target: { value: 'price_asc' } })
      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('sort=price_asc')
    })

    it('выбор "price_desc" добавляет sort=price_desc в URL', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const sortLabel = screen.getByText('Сортировка цен')
      const sortWrapper = sortLabel.closest('div')!
      const sortSelect = within(sortWrapper).getByRole('combobox')
      fireEvent.change(sortSelect, { target: { value: 'price_desc' } })
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('sort=price_desc')
    })

    it('выбор "default" удаляет sort из URL', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('sort=price_asc'))
      render(<FilterBar options={mockFilterOptions} />)
      const sortLabel = screen.getByText('Сортировка цен')
      const sortWrapper = sortLabel.closest('div')!
      const sortSelect = within(sortWrapper).getByRole('combobox')
      fireEvent.change(sortSelect, { target: { value: 'default' } })
      const url = mockPush.mock.calls[0][0] as string
      expect(url).not.toContain('sort=')
    })
  })

  describe('multiselect фильтры (CheckboxGroup)', () => {
    it('отметка чекбокса добавляет значение в school_category в URL', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const privateCheckbox = screen.getByLabelText('PRIVATE') as HTMLInputElement
      fireEvent.click(privateCheckbox)
      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('school_category=private')
    })

    it('снятие отметки удаляет значение из URL', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('school_category=private'))
      render(<FilterBar options={mockFilterOptions} />)
      const privateCheckbox = screen.getByLabelText('PRIVATE') as HTMLInputElement
      expect(privateCheckbox.checked).toBe(true)
      fireEvent.click(privateCheckbox)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).not.toContain('school_category=')
    })
  })

  describe('range фильтры (цена)', () => {
    it('ввод min_fee добавляет min_fee в URL после дебаунса', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const minInput = screen.getByPlaceholderText('0')
      fireEvent.change(minInput, { target: { value: '10000' } })
      vi.advanceTimersByTime(400)
      expect(mockPush).toHaveBeenCalledTimes(1)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('min_fee=10000')
    })

    it('ввод max_fee добавляет max_fee в URL после дебаунса', () => {
      render(<FilterBar options={mockFilterOptions} />)
      const maxInput = screen.getByPlaceholderText('100 000')
      fireEvent.change(maxInput, { target: { value: '50000' } })
      vi.advanceTimersByTime(400)
      const url = mockPush.mock.calls[0][0] as string
      expect(url).toContain('max_fee=50000')
    })
  })
})
