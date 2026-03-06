import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockUseTranslations } from '@/lib/__tests__/mocks/next-intl.mock'
import { mockSchoolDetail, mockSchoolDetailMinimal } from '@/lib/__tests__/fixtures/schoolDetail.fixture'

vi.mock('next-intl/server', async () => ({
  getTranslations: async (ns: string) => mockUseTranslations(ns),
}))

import { SchoolDetailPricing } from '@/components/schools/school-detail-pricing'

describe('SchoolDetailPricing', () => {
  it('показывает сообщение когда нет данных о стоимости', async () => {
    render(await SchoolDetailPricing({ school: mockSchoolDetailMinimal }))
    expect(screen.getByText(/Данные о стоимости не собраны/i)).toBeInTheDocument()
  })

  it('показывает total_annual_cost если нет детальных pricing данных', async () => {
    const school = { ...mockSchoolDetailMinimal, total_annual_cost: 18000 }
    const { container } = render(await SchoolDetailPricing({ school }))
    expect(container.textContent).toContain('18')
    expect(container.textContent).toContain('PLN')
  })

  it('рендерит таблицу цен при наличии pricing', async () => {
    render(await SchoolDetailPricing({ school: mockSchoolDetail }))
    // Категория из fee_structure
    expect(screen.getByText('basic')).toBeInTheDocument()
    // Вступительный взнос
    expect(screen.getByText(/1\s*000/)).toBeInTheDocument()
  })

  it('показывает учебный год', async () => {
    const { container } = render(await SchoolDetailPricing({ school: mockSchoolDetail }))
    expect(container.textContent).toContain('2025-2026')
  })

  it('показывает бейдж "ориентировочно" когда is_approximate_total = true', async () => {
    // Строка 26: бейдж отображается только когда pricing.is_approximate_total = true
    // t('pricingApprox') = 'ориентировочно' (ru.json)
    const school = {
      ...mockSchoolDetail,
      pricing: { ...mockSchoolDetail.pricing!, is_approximate_total: true },
    }
    render(await SchoolDetailPricing({ school }))
    expect(screen.getByText('ориентировочно')).toBeInTheDocument()
  })

  it('не показывает бейдж "ориентировочно" когда is_approximate_total = false', async () => {
    // mockSchoolDetail.pricing.is_approximate_total = false
    render(await SchoolDetailPricing({ school: mockSchoolDetail }))
    expect(screen.queryByText('ориентировочно')).not.toBeInTheDocument()
  })

  it('показывает прочерк "—" в колонке взноса когда entry_fee = null', async () => {
    // Строки 113-114: t('notProvided') = '—' (ru.json) — отображается в обоих полях
    const school = {
      ...mockSchoolDetail,
      pricing: {
        ...mockSchoolDetail.pricing!,
        fee_structure: [
          { ...mockSchoolDetail.pricing!.fee_structure[0], entry_fee: null, monthly_fee: null },
        ],
      },
    }
    const { container } = render(await SchoolDetailPricing({ school }))
    // Два прочерка: для entry_fee и для monthly_fee
    expect(container.textContent?.match(/—/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('показывает "~" когда monthly_fee.is_approximate = true', async () => {
    // Строки 122-124: значок приблизительности в ячейке ежемесячного платежа
    const school = {
      ...mockSchoolDetail,
      pricing: {
        ...mockSchoolDetail.pricing!,
        fee_structure: [
          {
            ...mockSchoolDetail.pricing!.fee_structure[0],
            monthly_fee: {
              ...mockSchoolDetail.pricing!.fee_structure[0].monthly_fee!,
              is_approximate: true,
            },
          },
        ],
      },
    }
    const { container } = render(await SchoolDetailPricing({ school }))
    expect(container.textContent).toContain('~')
  })
})
