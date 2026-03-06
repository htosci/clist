import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SchoolGrid } from '@/components/schools/school-grid'
import { mockSchool } from '@/lib/__tests__/fixtures/school.fixture'
import { SchoolShortCard } from '@/lib/schema-config'
vi.mock('next-intl', async () => {
  const { mockUseTranslations } = await import('@/lib/__tests__/mocks/next-intl.mock')
  return { useTranslations: mockUseTranslations }
})

vi.mock('@/components/schools/school-card', () => ({
  SchoolCard: ({ school }: { school: SchoolShortCard }) => (
    <div data-testid="school-card">{school.nazwa}</div>
  ),
}))

describe('SchoolGrid', () => {
  it('показывает сообщение "Школы не найдены" при пустом массиве', () => {
    render(<SchoolGrid schools={[]} />)
    expect(screen.getByText('Школы не найдены')).toBeInTheDocument()
  })

  it('рендерит одну карточку для одной школы', () => {
    render(<SchoolGrid schools={[mockSchool]} />)
    const cards = screen.getAllByTestId('school-card')
    expect(cards).toHaveLength(1)
  })

  it('рендерит N карточек для N школ', () => {
    const school2 = { ...mockSchool, numer_rspo: 99998, nazwa: 'Вторая школа' }
    const school3 = { ...mockSchool, numer_rspo: 99997, nazwa: 'Третья школа' }
    render(<SchoolGrid schools={[mockSchool, school2, school3]} />)
    expect(screen.getAllByTestId('school-card')).toHaveLength(3)
  })

  it('передаёт правильное название в карточку', () => {
    render(<SchoolGrid schools={[mockSchool]} />)
    expect(screen.getByText(mockSchool.nazwa)).toBeInTheDocument()
  })

  it('не показывает сообщение "не найдены" когда есть школы', () => {
    render(<SchoolGrid schools={[mockSchool]} />)
    expect(screen.queryByText('Школы не найдены')).not.toBeInTheDocument()
  })
})
