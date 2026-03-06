import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockUseTranslations, mockUseMessages } from '@/lib/__tests__/mocks/next-intl.mock'
import { mockSchoolDetail, mockSchoolDetailMinimal } from '@/lib/__tests__/fixtures/schoolDetail.fixture'

vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
  getMessages: async () => mockUseMessages(),
}))

import { SchoolDetailProgram } from '@/components/schools/school-detail-program'

describe('SchoolDetailProgram', () => {
  it('рендерит языки обучения из данных школы', async () => {
    const { container } = render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.instruction_languages = ['pl', 'en']
    expect(container.textContent).toContain('PL')
    expect(container.textContent).toContain('EN')
  })

  it('рендерит программу обучения', async () => {
    const { container } = render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.curriculum = ['IB', 'MEN']
    expect(container.textContent).toContain('IB')
    expect(container.textContent).toContain('MEN')
  })

  it('рендерит методику обучения', async () => {
    const { container } = render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.methodology = ['Classic']
    expect(container.textContent).toContain('Classic')
  })

  it('рендерит специализацию', async () => {
    const { container } = render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.specialization = ['Math']
    expect(container.textContent).toContain('Math')
  })

  it('показывает сообщение noProgram при отсутствии данных программы', async () => {
    render(await SchoolDetailProgram({ school: mockSchoolDetailMinimal }))
    expect(screen.getByText(/Данные о программе не собраны/i)).toBeInTheDocument()
  })

  it('не показывает строку специализации при пустом массиве (после фильтрации sentinel)', async () => {
    const school = { ...mockSchoolDetail, specialization: [] }
    const { container } = render(await SchoolDetailProgram({ school }))
    // Специализации нет — строка не рендерится
    expect(container.textContent).not.toContain('Math')
  })

  it('не показывает специализацию когда она null', async () => {
    const school = { ...mockSchoolDetail, specialization: null }
    render(await SchoolDetailProgram({ school }))
    // Секция программы есть (curriculum, languages), но строка специализации отсутствует
    expect(screen.queryByText('Специализация')).not.toBeInTheDocument()
  })

  it('показывает количество учеников', async () => {
    const { container } = render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.liczba_uczniow = 200
    expect(container.textContent).toContain('200')
  })

  it('показывает статус интерната', async () => {
    render(await SchoolDetailProgram({ school: mockSchoolDetail }))
    // mockSchoolDetail.czy_posiada_internat = false → t('boardingNo') = 'Нет'
    expect(screen.getByText('Нет')).toBeInTheDocument()
  })

  it('рендерит минимальные данные без ошибок', async () => {
    // mockSchoolDetailMinimal: все программные поля null
    render(await SchoolDetailProgram({ school: mockSchoolDetailMinimal }))
    expect(screen.getByText(/Данные о программе не собраны/i)).toBeInTheDocument()
  })
})
