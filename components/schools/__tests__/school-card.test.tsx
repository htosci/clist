import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SchoolCard } from '@/components/schools/school-card'
import { mockSchool, mockSchoolMinimal } from '@/lib/__tests__/fixtures/school.fixture'
import { SchoolShortCard } from '@/lib/schema-config'
vi.mock('@/i18n/navigation')

vi.mock('next-intl', async () => {
  const { mockUseTranslations, mockUseMessages } = await import('@/lib/__tests__/mocks/next-intl.mock')
  return {
    useTranslations: mockUseTranslations,
    useLocale: () => 'ru',
    useMessages: mockUseMessages,
  }
})

vi.mock('@/components/ui/value-tooltip', () => ({
  ValueTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Хелпер: рендерит карточку с переопределением полей поверх mockSchool
function renderWith(overrides: Partial<SchoolShortCard>) {
  const school: SchoolShortCard = { ...mockSchool, ...overrides }
  return render(<SchoolCard school={school} />)
}

describe('SchoolCard — базовый рендер', () => {
  it('отображает название школы', () => {
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText(mockSchool.nazwa)).toBeInTheDocument()
  })

  it('отображает город', () => {
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText(/Warszawa/)).toBeInTheDocument()
  })

  it('отображает категории как badges', () => {
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText('private')).toBeInTheDocument()
    expect(screen.getByText('bilingual')).toBeInTheDocument()
  })

  it('отображает языки обучения в верхнем регистре', () => {
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText('PL, EN')).toBeInTheDocument()
  })

  it('отображает цену', () => {
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText(/30.000 PLN|30,000 PLN/)).toBeInTheDocument()
  })
})

describe('SchoolCard — null-safety', () => {
  it('показывает "Цена по запросу" когда total_annual_cost = null', () => {
    render(<SchoolCard school={mockSchoolMinimal} />)
    expect(screen.getByText('Цена по запросу')).toBeInTheDocument()
  })

  it('показывает "PL" по умолчанию когда instruction_languages = null', () => {
    render(<SchoolCard school={mockSchoolMinimal} />)
    expect(screen.getByText('PL')).toBeInTheDocument()
  })

  it('показывает "MEN" по умолчанию когда curriculum = null', () => {
    render(<SchoolCard school={mockSchoolMinimal} />)
    expect(screen.getByText(/MEN/)).toBeInTheDocument()
  })

  it('не показывает блок специализации когда specialization = null', () => {
    render(<SchoolCard school={mockSchoolMinimal} />)
    // specialization section не рендерится при null
    expect(screen.queryByTitle(/специализ/i)).not.toBeInTheDocument()
  })
})

describe('SchoolCard — StageIcon', () => {
  it('активный этап имеет класс bg-primary', () => {
    const { container } = render(<SchoolCard school={mockSchool} />)
    // wychowanie_przedszkolne=true → активный; title берётся из i18n ('Детский сад')
    const preschool = container.querySelector('[title="Детский сад"]')
    expect(preschool?.className).toMatch(/bg-primary/)
  })

  it('неактивный этап имеет класс bg-muted', () => {
    const { container } = render(<SchoolCard school={mockSchool} />)
    // ii_etap_edukacyjny=false → неактивный; title берётся из i18n
    const stage4_8 = container.querySelector('[title="Начальная школа (4-8 классы)"]')
    expect(stage4_8?.className).toMatch(/bg-muted/)
  })
})

describe('SchoolCard — pricing badge', () => {
  it('pricing_score >= 8: показывает CheckCircle2 (Данные проверены)', () => {
    const school: SchoolShortCard = { ...mockSchool, pricing_score: 8 }
    render(<SchoolCard school={school} />)
    expect(screen.getByTitle('Данные проверены')).toBeInTheDocument()
  })

  it('pricing_score < 5 + есть цена: показывает badge "ориентир"', () => {
    const school: SchoolShortCard = { ...mockSchool, pricing_score: 4, total_annual_cost: 20000 }
    render(<SchoolCard school={school} />)
    expect(screen.getByText('ориентир')).toBeInTheDocument()
  })

  it('pricing_score < 5 + нет цены: не показывает badge', () => {
    const school: SchoolShortCard = { ...mockSchool, pricing_score: 4, total_annual_cost: null }
    render(<SchoolCard school={school} />)
    expect(screen.queryByText('ориентир')).not.toBeInTheDocument()
  })

  it('pricing_score = null: не показывает ни badge, ни CheckCircle2', () => {
    const school: SchoolShortCard = { ...mockSchool, pricing_score: null }
    render(<SchoolCard school={school} />)
    expect(screen.queryByText('ориентир')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Данные проверены')).not.toBeInTheDocument()
  })

  it('pricing_score = 5..7 (средний): не показывает ни badge, ни CheckCircle2', () => {
    const school: SchoolShortCard = { ...mockSchool, pricing_score: 6 }
    render(<SchoolCard school={school} />)
    expect(screen.queryByText('ориентир')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Данные проверены')).not.toBeInTheDocument()
  })
})

describe('SchoolCard — info_score badge', () => {
  // info_score влияет только на CSS-класс (цвет badge), текст всегда "X/10".
  // Проверяем что badge рендерится и содержит правильное значение.
  // Цвет проверяем через className: jsdom не вычисляет стили, но Tailwind-классы
  // присутствуют в атрибуте class — этого достаточно для проверки логики ветвления.

  it('info_score = 8 (>= 7): badge зелёный (bg-green-50)', () => {
    renderWith({ info_score: 8 })
    const badge = screen.getByText('8/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-green-50/)
  })

  it('info_score = 7 (граница >= 7): badge зелёный (bg-green-50)', () => {
    renderWith({ info_score: 7 })
    const badge = screen.getByText('7/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-green-50/)
  })

  it('info_score = 5 (>= 4, < 7): badge жёлтый (bg-yellow-50)', () => {
    renderWith({ info_score: 5 })
    const badge = screen.getByText('5/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-yellow-50/)
  })

  it('info_score = 4 (граница >= 4): badge жёлтый (bg-yellow-50)', () => {
    renderWith({ info_score: 4 })
    const badge = screen.getByText('4/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-yellow-50/)
  })

  it('info_score = 3 (< 4): badge красный (bg-red-50)', () => {
    renderWith({ info_score: 3 })
    const badge = screen.getByText('3/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-red-50/)
  })

  it('info_score = 0 (минимум): badge красный (bg-red-50)', () => {
    renderWith({ info_score: 0 })
    const badge = screen.getByText('0/10')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/bg-red-50/)
  })

  it('info_score = null: badge не рендерится', () => {
    renderWith({ info_score: null })
    // null проверяется условием в JSX: {school.info_score !== null && ...}
    expect(screen.queryByTitle('Полнота данных о школе')).not.toBeInTheDocument()
  })
})

describe('SchoolCard — updated_at', () => {
  // Блок с датой обновления рендерится только когда updated_at не null.
  // formatUpdatedAt — приватный хелпер, тестируем косвенно через рендер.

  it('updated_at присутствует: показывает строку "обновлено ..."', () => {
    // mockSchool.updated_at = '2024-01-01' — валидная ISO-дата
    render(<SchoolCard school={mockSchool} />)
    expect(screen.getByText(/обновлено/)).toBeInTheDocument()
  })

  it('updated_at = null: блок с датой не рендерится', () => {
    // mockSchoolMinimal.updated_at = null
    render(<SchoolCard school={mockSchoolMinimal} />)
    expect(screen.queryByText(/обновлено/)).not.toBeInTheDocument()
  })

  it('updated_at невалидная строка: показывает исходную строку как есть', () => {
    // При невалидной дате formatUpdatedAt возвращает dateStr без изменений
    renderWith({ updated_at: 'not-a-date' })
    expect(screen.getByText(/обновлено not-a-date/)).toBeInTheDocument()
  })

  it('updated_at валидная дата: форматирует в виде "день мес"', () => {
    // '2024-02-12' → "12 фев." (toLocaleDateString с 'ru-RU')
    renderWith({ updated_at: '2024-02-12' })
    const el = screen.getByText(/обновлено/)
    // Проверяем что результат содержит число 12 и месяц на русском
    expect(el.textContent).toMatch(/12/)
    expect(el.textContent).toMatch(/фев/)
  })
})
