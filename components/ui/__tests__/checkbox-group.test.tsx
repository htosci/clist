import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckboxGroup } from '@/components/ui/checkbox-group'
vi.mock('next-intl', async () => {
  const { mockUseTranslations } = await import('@/lib/__tests__/mocks/next-intl.mock')
  return { useTranslations: mockUseTranslations }
})

// Мокаем shadcn Checkbox как нативный input[type=checkbox].
// Оригинальный компонент принимает onCheckedChange (не onChange),
// поэтому пробрасываем именно его через onChange нативного элемента.
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
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

// Мокаем shadcn Label как нативный label.
// htmlFor нужен для связки label с checkbox через id.
vi.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
    className,
  }: {
    children?: React.ReactNode
    htmlFor?: string
    className?: string
  }) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

// Мокаем shadcn Button как нативную button.
// aria-expanded нужен для теста состояния раскрытия.
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    'aria-expanded': ariaExpanded,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    'aria-expanded'?: boolean
  }) => (
    <button onClick={onClick} aria-expanded={ariaExpanded}>
      {children}
    </button>
  ),
}))

// --- Фикстуры ---

const OPTIONS_FEW = ['alpha', 'beta', 'gamma'] // 3 опции < threshold по умолчанию (5)
const OPTIONS_MANY = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta'] // 7 опций > 5

describe('CheckboxGroup', () => {
  const noop = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // 1. Рендеринг: label группы и опции
  // -----------------------------------------------------------------------
  describe('рендеринг', () => {
    it('отображает label группы через aria-label на role="group"', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_FEW} values={[]} onChange={noop} />
      )
      // Корневой div должен иметь role="group" и aria-label с переданным label
      expect(screen.getByRole('group', { name: 'Языки' })).toBeInTheDocument()
    })

    it('отображает текстовый заголовок группы', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_FEW} values={[]} onChange={noop} />
      )
      // Label с текстом "Языки" без htmlFor — это заголовок группы
      expect(screen.getByText('Языки')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 2. options.length <= collapseThreshold: все опции видны, кнопки нет
  // -----------------------------------------------------------------------
  describe('когда опций не больше порога', () => {
    it('показывает все опции без кнопки свернуть/развернуть', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_FEW} values={[]} onChange={noop} />
      )
      // Все 3 чекбокса должны быть в DOM
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
    })

    it('не рендерит кнопку раскрытия когда опций мало', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_FEW} values={[]} onChange={noop} />
      )
      // Кнопки с текстом "ещё" или "Скрыть" не должно быть
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('показывает ровно threshold опций если options.length === threshold', () => {
      const exactOptions = ['a', 'b', 'c', 'd', 'e'] // ровно 5 = default threshold
      render(
        <CheckboxGroup label="Тест" options={exactOptions} values={[]} onChange={noop} />
      )
      expect(screen.getAllByRole('checkbox')).toHaveLength(5)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 3. options.length > collapseThreshold: показаны первые N, есть кнопка
  // -----------------------------------------------------------------------
  describe('когда опций больше порога', () => {
    it('показывает только первые collapseThreshold чекбоксов', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      // 7 опций, threshold=5 → видны 5
      expect(screen.getAllByRole('checkbox')).toHaveLength(5)
    })

    it('отображает кнопку с текстом "... ещё N" где N = кол-во скрытых', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      // 7 - 5 = 2 скрыто
      expect(screen.getByRole('button', { name: '... ещё 2' })).toBeInTheDocument()
    })

    it('кнопка имеет aria-expanded=false в свёрнутом состоянии', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      const btn = screen.getByRole('button')
      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })

    it('учитывает кастомный collapseThreshold', () => {
      render(
        <CheckboxGroup
          label="Тест"
          options={OPTIONS_MANY}
          values={[]}
          onChange={noop}
          collapseThreshold={3}
        />
      )
      // threshold=3, всего 7 → видны 3, скрыто 4
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
      expect(screen.getByRole('button', { name: '... ещё 4' })).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 4. Клик "ещё N" → показываются все опции, кнопка → "Скрыть"
  // -----------------------------------------------------------------------
  describe('раскрытие списка', () => {
    it('клик по кнопке "ещё N" показывает все опции', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      fireEvent.click(screen.getByRole('button'))
      // После раскрытия должны быть все 7 чекбоксов
      expect(screen.getAllByRole('checkbox')).toHaveLength(7)
    })

    it('после раскрытия кнопка меняет текст на "Скрыть"', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('button', { name: 'Скрыть' })).toBeInTheDocument()
    })

    it('после раскрытия кнопка имеет aria-expanded=true', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      const btn = screen.getByRole('button')
      fireEvent.click(btn)
      expect(btn).toHaveAttribute('aria-expanded', 'true')
    })
  })

  // -----------------------------------------------------------------------
  // 5. Клик "Скрыть" → снова только threshold опций
  // -----------------------------------------------------------------------
  describe('сворачивание списка', () => {
    it('клик "Скрыть" скрывает лишние опции обратно', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      const btn = screen.getByRole('button')
      // Раскрываем
      fireEvent.click(btn)
      expect(screen.getAllByRole('checkbox')).toHaveLength(7)
      // Сворачиваем
      fireEvent.click(btn)
      expect(screen.getAllByRole('checkbox')).toHaveLength(5)
    })

    it('после сворачивания кнопка снова показывает "... ещё N"', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_MANY} values={[]} onChange={noop} />
      )
      const btn = screen.getByRole('button')
      fireEvent.click(btn)
      fireEvent.click(btn)
      expect(screen.getByRole('button', { name: '... ещё 2' })).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 6. Клик незакрытого чекбокса → onChange вызван с добавленным значением
  // -----------------------------------------------------------------------
  describe('toggle чекбокса', () => {
    it('клик по незакрытому чекбоксу добавляет значение через onChange', () => {
      const handleChange = vi.fn()
      render(
        <CheckboxGroup
          label="Языки"
          options={OPTIONS_FEW}
          values={['beta']} // только beta уже выбран
          onChange={handleChange}
        />
      )
      // alpha не выбран — кликаем по его label, находим через aria (htmlFor → id)
      // id = toSafeId("Языки", "alpha") = "cbg-языки-alpha"
      const alphaCheckbox = screen.getByRole('checkbox', { name: 'ALPHA' })
      fireEvent.click(alphaCheckbox)
      // onChange должен получить массив с добавленным "alpha"
      expect(handleChange).toHaveBeenCalledWith(['beta', 'alpha'])
    })

    // -----------------------------------------------------------------------
    // 7. Клик закрытого чекбокса → onChange вызван с удалённым значением
    // -----------------------------------------------------------------------
    it('клик по уже закрытому чекбоксу удаляет значение через onChange', () => {
      const handleChange = vi.fn()
      render(
        <CheckboxGroup
          label="Языки"
          options={OPTIONS_FEW}
          values={['alpha', 'beta']} // оба выбраны
          onChange={handleChange}
        />
      )
      // beta уже выбран — снимаем отметку
      const betaCheckbox = screen.getByRole('checkbox', { name: 'BETA' })
      fireEvent.click(betaCheckbox)
      // onChange должен получить массив без "beta"
      expect(handleChange).toHaveBeenCalledWith(['alpha'])
    })
  })

  // -----------------------------------------------------------------------
  // 8. values снаружи → чекбоксы отмечены корректно
  // -----------------------------------------------------------------------
  describe('отображение выбранных значений', () => {
    it('чекбоксы из values отмечены как checked', () => {
      render(
        <CheckboxGroup
          label="Языки"
          options={OPTIONS_FEW}
          values={['alpha', 'gamma']}
          onChange={noop}
        />
      )
      const alphaCheckbox = screen.getByRole('checkbox', { name: 'ALPHA' }) as HTMLInputElement
      const betaCheckbox = screen.getByRole('checkbox', { name: 'BETA' }) as HTMLInputElement
      const gammaCheckbox = screen.getByRole('checkbox', { name: 'GAMMA' }) as HTMLInputElement

      expect(alphaCheckbox.checked).toBe(true)
      expect(betaCheckbox.checked).toBe(false)
      expect(gammaCheckbox.checked).toBe(true)
    })

    it('когда values пуст — все чекбоксы unchecked', () => {
      render(
        <CheckboxGroup label="Языки" options={OPTIONS_FEW} values={[]} onChange={noop} />
      )
      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
      checkboxes.forEach((cb) => expect(cb.checked).toBe(false))
    })
  })

  // -----------------------------------------------------------------------
  // 9. formatOption применяется к тексту метки
  // -----------------------------------------------------------------------
  describe('formatOption', () => {
    it('по умолчанию форматирует опции через toUpperCase', () => {
      render(
        <CheckboxGroup label="Языки" options={['english', 'polish']} values={[]} onChange={noop} />
      )
      // Текст меток должен быть в верхнем регистре
      expect(screen.getByText('ENGLISH')).toBeInTheDocument()
      expect(screen.getByText('POLISH')).toBeInTheDocument()
    })

    it('применяет кастомный formatOption', () => {
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
      render(
        <CheckboxGroup
          label="Языки"
          options={['english', 'polish']}
          values={[]}
          onChange={noop}
          formatOption={capitalize}
        />
      )
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Polish')).toBeInTheDocument()
      // Оригинальный текст в нижнем регистре не должен появляться как отдельный элемент
      expect(screen.queryByText('english')).not.toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // 10. Пустой options[] → не крашится
  // -----------------------------------------------------------------------
  describe('пустой список опций', () => {
    it('рендерится без ошибок при options=[]', () => {
      expect(() =>
        render(<CheckboxGroup label="Языки" options={[]} values={[]} onChange={noop} />)
      ).not.toThrow()
    })

    it('не показывает ни одного чекбокса при options=[]', () => {
      render(<CheckboxGroup label="Языки" options={[]} values={[]} onChange={noop} />)
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    })

    it('не показывает кнопку раскрытия при options=[]', () => {
      render(<CheckboxGroup label="Языки" options={[]} values={[]} onChange={noop} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
