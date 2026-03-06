import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PaginationButton from '@/components/schools/pagination-button'

describe('PaginationButton', () => {
  it('рендерит disabled кнопку когда disabled=true', () => {
    render(
      <PaginationButton params={{}} targetPage={0} disabled={true}>
        Назад
      </PaginationButton>
    )
    const btn = screen.getByRole('button', { name: 'Назад' })
    expect(btn).toBeDisabled()
  })

  it('рендерит ссылку когда disabled=false', () => {
    render(
      <PaginationButton params={{}} targetPage={2} disabled={false}>
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link', { name: 'Вперед' })
    expect(link).toBeInTheDocument()
  })

  it('href содержит корректный параметр page', () => {
    render(
      <PaginationButton params={{ query: 'test' }} targetPage={3} disabled={false}>
        Вперед
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', expect.stringContaining('page=3'))
  })

  it('href содержит basePath по умолчанию /schools', () => {
    render(
      <PaginationButton params={{}} targetPage={2} disabled={false}>
        Далее
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toMatch(/^\/schools\?/)
  })

  it('href использует переданный basePath', () => {
    render(
      <PaginationButton params={{}} targetPage={2} disabled={false} basePath="/ru/schools">
        Далее
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toMatch(/^\/ru\/schools\?/)
  })

  it('сохраняет существующие params в href', () => {
    render(
      <PaginationButton params={{ query: 'warszawa', sort: 'price_asc' }} targetPage={2} disabled={false}>
        Далее
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain('query=warszawa')
    expect(href).toContain('sort=price_asc')
  })

  it('не включает undefined-параметры в href', () => {
    render(
      <PaginationButton params={{ query: undefined, sort: 'price_asc' }} targetPage={2} disabled={false}>
        Далее
      </PaginationButton>
    )
    const link = screen.getByRole('link')
    const href = link.getAttribute('href') ?? ''
    expect(href).not.toContain('query=')
    expect(href).toContain('sort=price_asc')
  })
})
