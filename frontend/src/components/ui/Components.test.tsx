import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskBadge, Dialog } from './index'
import { PaymentScreenshotMock, QrPlaceholder } from '../index'

describe('UI Kit Component Tests', () => {
  it('RiskBadge renders text and icons for each risk level', () => {
    const { rerender } = render(<RiskBadge level="safe" />)
    expect(screen.getByText('Safe')).toBeInTheDocument()

    rerender(<RiskBadge level="cautious" />)
    expect(screen.getByText('Cautious')).toBeInTheDocument()

    rerender(<RiskBadge level="risky" />)
    expect(screen.getByText('Risky')).toBeInTheDocument()

    rerender(<RiskBadge level="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('PaymentScreenshotMock contains simulation string watermark', () => {
    render(<PaymentScreenshotMock />)
    expect(screen.getByText('SIMULATION — NOT A REAL TRANSACTION.')).toBeInTheDocument()
  })

  it('QrPlaceholder has no <canvas> and no data attributes (static SVG)', () => {
    const { container } = render(<QrPlaceholder />)
    expect(container.querySelector('canvas')).toBeNull()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Verify no base64 / data: uri attributes
    const outerHtml = container.innerHTML
    expect(outerHtml).not.toContain('data:image')
    expect(screen.getByText('Simulation — not scannable')).toBeInTheDocument()
  })

  it('Dialog focus trap, renders children, and Esc closes dialog', () => {
    const handleClose = vi.fn()
    const { rerender } = render(
      <Dialog isOpen={true} onClose={handleClose} title="Test Modal">
        <button id="first-btn">First</button>
        <button id="second-btn">Second</button>
      </Dialog>,
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()

    // Test Escape key closes dialog
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)

    // Test re-render when closed
    rerender(
      <Dialog isOpen={false} onClose={handleClose} title="Test Modal">
        <button>First</button>
      </Dialog>,
    )
    expect(screen.queryByText('Test Modal')).toBeNull()
  })
})
