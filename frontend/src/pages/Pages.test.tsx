import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from './LandingPage'
import { LibraryPage } from './LibraryPage'
import { ApiError } from '../lib/api'
import * as api from '../lib/api'
import { FIXTURE_SCENARIOS } from '../lib/fixtures'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LandingPage & LibraryPage Tests (PROMPT 03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('ApiError correctly parses status, code, and message', () => {
    const error = new ApiError(404, 'SCENARIO_NOT_FOUND', 'Scenario could not be located.')
    expect(error.status).toBe(404)
    expect(error.code).toBe('SCENARIO_NOT_FOUND')
    expect(error.message).toBe('Scenario could not be located.')
    expect(error.name).toBe('ApiError')
  })

  describe('LandingPage', () => {
    it('CTA click calls startSession and navigates to /play/:id', async () => {
      vi.spyOn(api, 'startSession').mockResolvedValueOnce({
        session: {
          id: 'test-session-123',
          scenarioId: 'payment-screenshot',
          mode: 'quick',
          status: 'in_progress',
          startTime: new Date().toISOString(),
          completionTime: null,
          currentNodeId: 'A1',
          decisions: [],
          score: null,
          identifiedRedFlags: [],
          missedRedFlags: [],
          skillUpdates: {
            urgency: 0,
            impersonation: 0,
            payment_verification: 0,
            qr_collect: 0,
            safe_verification: 0,
          },
        },
        node: {
          id: 'A1',
          event: { eventType: 'chat', text: 'Hello' },
          choices: [{ id: 'c1', label: 'Choice 1' }],
          progress: { step: 1, estTotal: 3 },
          terminal: false,
        },
      })

      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
      )

      const startButton = screen.getByRole('button', { name: /Start a simulation/i })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(api.startSession).toHaveBeenCalledWith({
          scenarioId: 'payment-screenshot',
          mode: 'quick',
        })
        expect(mockNavigate).toHaveBeenCalledWith('/play/test-session-123')
      })
    })

    it('Challenge mode card is aria-disabled and not focusable-actionable', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
      )

      const challengeButtons = screen.getAllByText('Coming Soon')
      const disabledButton = challengeButtons.find((el) => el.tagName === 'BUTTON')
      expect(disabledButton).toBeDefined()
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true')
      expect(disabledButton).toBeDisabled()
      expect(disabledButton).toHaveAttribute('tabIndex', '-1')
    })

    it('persists display name in localStorage without sending to server', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>,
      )

      const input = screen.getByLabelText(/Display Name/i)
      fireEvent.change(input, { target: { value: 'Aarav' } })
      expect(localStorage.getItem('scamsim_display_name')).toBe('Aarav')
    })
  })

  describe('LibraryPage', () => {
    it('renders scenarios from API and filter hides/shows cards', async () => {
      vi.spyOn(api, 'getScenarios').mockResolvedValueOnce({
        scenarios: FIXTURE_SCENARIOS,
      })

      render(
        <MemoryRouter>
          <LibraryPage />
        </MemoryRouter>,
      )

      // Wait for scenarios to load
      await waitFor(() => {
        expect(screen.getByText('The "Payment Screenshot" Ruse')).toBeInTheDocument()
        expect(screen.getByText('The Fake Refund QR Trap')).toBeInTheDocument()
      })

      // Click QR Manipulation tab
      const qrTab = screen.getByRole('tab', { name: /QR Manipulation/i })
      fireEvent.click(qrTab)

      // Payment Screenshot should now be hidden
      expect(screen.queryByText('The "Payment Screenshot" Ruse')).toBeNull()
      expect(screen.getByText('The Fake Refund QR Trap')).toBeInTheDocument()
    })

    it('shows empty category state when category with no scenarios is chosen', async () => {
      vi.spyOn(api, 'getScenarios').mockResolvedValueOnce({
        scenarios: FIXTURE_SCENARIOS,
      })

      render(
        <MemoryRouter>
          <LibraryPage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('The "Payment Screenshot" Ruse')).toBeInTheDocument()
      })

      // Click UPI Request Scam (no authored scenarios in MVP)
      const upiTab = screen.getByRole('tab', { name: /UPI Request Scam/i })
      fireEvent.click(upiTab)

      expect(screen.getByText(/No scenarios in this category yet/i)).toBeInTheDocument()
    })

    it('shows error state with retry button when API fails', async () => {
      vi.spyOn(api, 'getScenarios').mockRejectedValueOnce(new Error('Network failure'))

      render(
        <MemoryRouter>
          <LibraryPage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText(/Could not load scenarios/i)).toBeInTheDocument()
        expect(screen.getByText(/Network failure/i)).toBeInTheDocument()
      })

      // Mock successful response on retry
      vi.spyOn(api, 'getScenarios').mockResolvedValueOnce({
        scenarios: FIXTURE_SCENARIOS,
      })

      const retryBtn = screen.getByRole('button', { name: /Try again/i })
      fireEvent.click(retryBtn)

      await waitFor(() => {
        expect(screen.getByText('The "Payment Screenshot" Ruse')).toBeInTheDocument()
      })
    })
  })
})
