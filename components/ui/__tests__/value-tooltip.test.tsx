import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValueTooltip } from '@/components/ui/value-tooltip'

describe('ValueTooltip', () => {
  describe('без пропа tooltip', () => {
    it('рендерит children', () => {
      render(<ValueTooltip>Текст метки</ValueTooltip>)
      expect(screen.getByText('Текст метки')).toBeInTheDocument()
    })

    it('не создаёт дополнительный span', () => {
      const { container } = render(<ValueTooltip>Текст метки</ValueTooltip>)
      expect(container.querySelectorAll('span')).toHaveLength(0)
    })

    it('корректно рендерит когда tooltip = undefined', () => {
      render(<ValueTooltip tooltip={undefined}>Метка</ValueTooltip>)
      expect(screen.getByText('Метка')).toBeInTheDocument()
    })

    it('корректно рендерит когда tooltip = пустая строка (falsy)', () => {
      const { container } = render(<ValueTooltip tooltip="">Метка</ValueTooltip>)
      expect(screen.getByText('Метка')).toBeInTheDocument()
      expect(container.querySelectorAll('span')).toHaveLength(0)
    })
  })

  describe('с пропом tooltip', () => {
    it('оборачивает children в span с атрибутом title', () => {
      render(<ValueTooltip tooltip="Английский">EN</ValueTooltip>)
      const span = screen.getByText('EN').closest('span')
      expect(span).not.toBeNull()
      expect(span).toHaveAttribute('title', 'Английский')
    })

    it('span имеет класс cursor-help — пользователь видит курсор-подсказку', () => {
      render(<ValueTooltip tooltip="Английский">EN</ValueTooltip>)
      const span = screen.getByText('EN').closest('span')
      expect(span).toHaveClass('cursor-help')
    })

    it('рендерит children внутри span', () => {
      render(<ValueTooltip tooltip="Описание">Текст метки</ValueTooltip>)
      expect(screen.getByText('Текст метки')).toBeInTheDocument()
    })

    it('title содержит переданный текст подсказки', () => {
      render(<ValueTooltip tooltip="Польская программа MEN">MEN</ValueTooltip>)
      const span = screen.getByText('MEN')
      expect(span).toHaveAttribute('title', 'Польская программа MEN')
    })
  })
})
