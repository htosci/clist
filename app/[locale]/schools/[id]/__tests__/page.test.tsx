import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockSchoolDetail, mockSchoolDetailMinimal } from '@/lib/__tests__/fixtures/schoolDetail.fixture'
import { mockUseTranslations } from '@/lib/__tests__/mocks/next-intl.mock'

// --- Моки ---

vi.mock('@/lib/supabase', () => ({
  getSchoolDetailAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
  getLocale: async () => 'pl',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Мокаем дочерние async Server Components, чтобы render() не получал висящие Promise
vi.mock('@/components/schools/school-detail-header', () => ({
  SchoolDetailHeader: ({ school }: { school: { nazwa: string } }) => <div data-testid="header">{school.nazwa}</div>,
}))
vi.mock('@/components/schools/school-detail-program', () => ({
  SchoolDetailProgram: () => <div data-testid="program" />,
}))
vi.mock('@/components/schools/school-detail-pricing', () => ({
  SchoolDetailPricing: ({ school }: { school: { total_annual_cost: number | null } }) => (
    <div data-testid="pricing">{school.total_annual_cost}</div>
  ),
}))
vi.mock('@/components/schools/school-detail-contacts', () => ({
  SchoolDetailContacts: () => <div data-testid="contacts" />,
}))
vi.mock('@/components/schools/school-detail-address', () => ({
  SchoolDetailAddress: () => <div data-testid="address" />,
}))
vi.mock('@/components/schools/school-card', () => ({
  formatUpdatedAt: () => '21 фев',
}))

// --- Тесты ---

import SchoolDetailPage, { generateMetadata } from '@/app/[locale]/schools/[id]/page'
import { getSchoolDetailAction } from '@/lib/supabase'

const mockGetSchoolDetail = vi.mocked(getSchoolDetailAction)

describe('generateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('возвращает {} для невалидного id ("abc") — не вызывает getSchoolDetailAction', async () => {
    const result = await generateMetadata({ params: Promise.resolve({ id: 'abc' }) })
    expect(result).toEqual({})
    expect(mockGetSchoolDetail).not.toHaveBeenCalled()
  })

  it('возвращает {} если школа не найдена', async () => {
    mockGetSchoolDetail.mockResolvedValue(null)
    const result = await generateMetadata({ params: Promise.resolve({ id: '12345' }) })
    expect(result).toEqual({})
  })

  it('формирует title с именем школы и городом', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetail)
    const result = await generateMetadata({ params: Promise.resolve({ id: '12345' }) })
    expect(result.title).toBe(`${mockSchoolDetail.nazwa} — ${mockSchoolDetail.miejscowosc} | Clist`)
  })

  it('включает openGraph с title', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetail)
    const result = await generateMetadata({ params: Promise.resolve({ id: '12345' }) })
    expect((result.openGraph as { title?: string })?.title).toBe(`${mockSchoolDetail.nazwa} — ${mockSchoolDetail.miejscowosc} | Clist`)
  })
})

describe('SchoolDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('вызывает notFound если школа не найдена', async () => {
    mockGetSchoolDetail.mockResolvedValue(null)
    await expect(SchoolDetailPage({ params: Promise.resolve({ id: '99999' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('вызывает getSchoolDetailAction с числовым id', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetail)
    render(await SchoolDetailPage({ params: Promise.resolve({ id: '12345' }) }))
    expect(mockGetSchoolDetail).toHaveBeenCalledWith(12345)
  })

  it('рендерит название школы через SchoolDetailHeader', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetail)
    render(await SchoolDetailPage({ params: Promise.resolve({ id: '12345' }) }))
    expect(screen.getByTestId('header')).toHaveTextContent(mockSchoolDetail.nazwa)
  })

  it('рендерит RSPO ID в футере', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetail)
    const { container } = render(await SchoolDetailPage({ params: Promise.resolve({ id: '12345' }) }))
    expect(container.textContent).toContain('12345')
  })

  it('рендерит страницу с минимальными данными без ошибок', async () => {
    mockGetSchoolDetail.mockResolvedValue(mockSchoolDetailMinimal)
    render(await SchoolDetailPage({ params: Promise.resolve({ id: '99999' }) }))
    expect(screen.getByTestId('header')).toHaveTextContent(mockSchoolDetailMinimal.nazwa)
  })
})
