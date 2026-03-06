import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockUseTranslations } from '@/lib/__tests__/mocks/next-intl.mock'
import { mockSchoolDetail, mockSchoolDetailMinimal } from '@/lib/__tests__/fixtures/schoolDetail.fixture'

vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
}))

import { SchoolDetailContacts } from '@/components/schools/school-detail-contacts'

describe('SchoolDetailContacts', () => {
  // --- Случай пустых данных (важнейший: компонент возвращает null) ---

  it('возвращает null и ничего не рендерит когда нет контактов', async () => {
    // mockSchoolDetailMinimal: contact=null, rspo_telefon=null, rspo_email=null, website=null
    const { container } = render(await SchoolDetailContacts({ school: mockSchoolDetailMinimal }) ?? <></>)
    // Если компонент вернул null — контейнер div будет пустым
    expect(container.firstChild).toBeNull()
  })

  it('не показывает секцию "Контакты" когда нет данных', async () => {
    render(await SchoolDetailContacts({ school: mockSchoolDetailMinimal }) ?? <></>)
    expect(screen.queryByText(/Контакты/i)).not.toBeInTheDocument()
  })

  // --- Приоритет: contact.phone над rspo_telefon ---

  it('показывает телефон из contact.phone (приоритет над rspo_telefon)', async () => {
    // mockSchoolDetail: contact.phone = '987654321', rspo_telefon = '123456789'
    // Ожидаем что отображается contact.phone, а не rspo_telefon
    render(await SchoolDetailContacts({ school: mockSchoolDetail }))
    // '987654321' → '+48 987 654 321' (9 цифр → форматирование)
    expect(screen.getByText('+48 987 654 321')).toBeInTheDocument()
  })

  it('показывает rspo_telefon как fallback когда contact.phone отсутствует', async () => {
    const school = { ...mockSchoolDetail, contact: null }
    // rspo_telefon = '123456789' → '+48 123 456 789'
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('+48 123 456 789')).toBeInTheDocument()
  })

  // --- Форматирование номера телефона ---

  it('форматирует 9-значный номер как +48 XXX XXX XXX', async () => {
    const school = { ...mockSchoolDetailMinimal, rspo_telefon: '600123456' }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('+48 600 123 456')).toBeInTheDocument()
  })

  it('форматирует 11-значный номер с кодом страны 48 как +48 XXX XXX XXX', async () => {
    // Строка 75 в formatPhone: номер начинается с '48' и содержит 11 цифр
    // 48600123456 → '+48 600 123 456'
    const school = { ...mockSchoolDetailMinimal, rspo_telefon: '48600123456' }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('+48 600 123 456')).toBeInTheDocument()
  })

  it('оставляет нестандартный номер без изменений', async () => {
    // Номер не из 9 цифр — возвращается как есть
    const school = { ...mockSchoolDetailMinimal, rspo_telefon: '12-3456' }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('12-3456')).toBeInTheDocument()
  })

  it('ссылка tel: содержит только цифры номера', async () => {
    const school = { ...mockSchoolDetailMinimal, rspo_telefon: '600123456' }
    render(await SchoolDetailContacts({ school }))
    const phoneLink = screen.getByRole('link', { name: /600 123 456/ })
    // href формируется через .replace(/\D/g, '') → +48600123456
    expect(phoneLink).toHaveAttribute('href', 'tel:+48600123456')
  })

  // --- Email: приоритет contact.email над rspo_email ---

  it('показывает email из contact.email (приоритет над rspo_email)', async () => {
    // mockSchoolDetail: contact.email = 'contact@example.pl', rspo_email = 'school@example.pl'
    render(await SchoolDetailContacts({ school: mockSchoolDetail }))
    expect(screen.getByText('contact@example.pl')).toBeInTheDocument()
  })

  it('показывает rspo_email как fallback когда contact.email отсутствует', async () => {
    const school = { ...mockSchoolDetail, contact: null }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('school@example.pl')).toBeInTheDocument()
  })

  it('ссылка mailto: содержит корректный email', async () => {
    const school = { ...mockSchoolDetailMinimal, rspo_email: 'test@school.pl' }
    render(await SchoolDetailContacts({ school }))
    const emailLink = screen.getByRole('link', { name: 'test@school.pl' })
    expect(emailLink).toHaveAttribute('href', 'mailto:test@school.pl')
  })

  // --- Website ---

  it('отображает ссылку на сайт без протокола (https:// убирается)', async () => {
    // mockSchoolDetail.website = 'https://example.com' → отображается 'example.com'
    render(await SchoolDetailContacts({ school: mockSchoolDetail }))
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('отображает кнопку "Перейти на сайт" когда есть website', async () => {
    render(await SchoolDetailContacts({ school: mockSchoolDetail }))
    // Кнопка — это <a> внутри Button asChild
    const buttons = screen.getAllByText(/Перейти на сайт/)
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('не показывает кнопку сайта когда website = null', async () => {
    const school = { ...mockSchoolDetail, website: null }
    render(await SchoolDetailContacts({ school }))
    expect(screen.queryByText(/Перейти на сайт/)).not.toBeInTheDocument()
  })

  // --- Секция отображается с заголовком ---

  it('показывает заголовок "Контакты" когда есть хотя бы один контакт', async () => {
    render(await SchoolDetailContacts({ school: mockSchoolDetail }))
    expect(screen.getByText(/Контакты/i)).toBeInTheDocument()
  })

  it('рендерит секцию только с телефоном без ошибок', async () => {
    const school = { ...mockSchoolDetailMinimal, rspo_telefon: '500100200' }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('+48 500 100 200')).toBeInTheDocument()
    // email и website не отображаются
    expect(screen.queryByRole('link', { name: /mailto:/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Перейти на сайт/)).not.toBeInTheDocument()
  })

  it('рендерит секцию только с email без ошибок', async () => {
    const school = { ...mockSchoolDetailMinimal, rspo_email: 'only@email.pl' }
    render(await SchoolDetailContacts({ school }))
    expect(screen.getByText('only@email.pl')).toBeInTheDocument()
  })
})
