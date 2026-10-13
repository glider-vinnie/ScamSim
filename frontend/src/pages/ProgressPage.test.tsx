import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProgressPage } from './ProgressPage'
import * as api from '../lib/api'
import { UserProgress } from '../lib/types'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    getProgress: vi.fn(),
    deleteProgress: vi.fn(),
    startSession: vi.fn(),
  }
})

describe('ProgressPage Component Tests (PROMPT 08)', () => {
  const mockEmptyProgress: UserProgress = {
    sessionCount: 0,
    completedScenarios: {},
    skillEstimates: {
      urgency: 50,
      impersonation: 50,
      payment_verification: 50,
      qr_collect: 50,
      safe_verification: 50,
    },
    recommendedNextScenario: {
      scenarioId: 'payment-screenshot',
      title: 'The "Payment Screenshot" Ruse',
      reason: 'Recommended starting scenario to test your scam detection fundamentals.',
    },
    recentResults: [],
    frequentlyMissedFlags: [],
  }

  const mockPopulatedProgress: UserProgress = {
    sessionCount: 3,
    completedScenarios: {
      'payment-screenshot': 2,
      'urgent-bank-call': 1,
    },
    skillEstimates: {
      urgency: 65,
      impersonation: 45,
      payment_verification: 75,
      qr_collect: 50,
      safe_verification: 70,
    },
    recommendedNextScenario: {
      scenarioId: 'urgent-bank-call',
      title: 'The Urgent Fraud Department Call',
      reason: "You're weakest at Impersonation detection; this one trains it.",
    },
    recentResults: [
      {
        sessionId: 'sess-1',
        scenarioId: 'urgent-bank-call',
        title: 'The Urgent Fraud Department Call',
        score: 60,
        completedAt: '2026-10-13T01:00:00Z',
      },
      {
        sessionId: 'sess-2',
        scenarioId: 'payment-screenshot',
        title: 'The "Payment Screenshot" Ruse',
        score: 100,
        completedAt: '2026-10-13T00:30:00Z',
      },
    ],
    frequentlyMissedFlags: [
      {
        redFlagId: 'C-RF3',
        label: 'Caller requesting OTP or PIN',
        count: 2,
      },
      {
        redFlagId: 'A-RF1',
        label: 'Payment screenshot used instead of bank credit',
        count: 1,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderProgressPage() {
    return render(
      <MemoryRouter initialEntries={['/progress']}>
        <Routes>
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/play/:sessionId" element={<div>Play Screen Mock</div>} />
          <Route path="/results/:sessionId" element={<div>Results Screen Mock</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders empty state for new user with sessionCount 0', async () => {
    vi.mocked(api.getProgress).mockResolvedValueOnce(mockEmptyProgress)

    renderProgressPage()

    expect(await screen.findByText(/No runs yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start quick play/i })).toBeInTheDocument()
  })

  it('clicking start quick play in empty state starts session and navigates', async () => {
    vi.mocked(api.getProgress).mockResolvedValueOnce(mockEmptyProgress)
    vi.mocked(api.startSession).mockResolvedValueOnce({
      session: {
        id: 'new-quick-play-session',
        scenarioId: 'payment-screenshot',
        mode: 'quick',
        status: 'in_progress',
        startTime: '2026-10-13T00:00:00Z',
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
        event: { eventType: 'chat', text: 'Hi', details: {} },
        choices: [],
        progress: { step: 1, estTotal: 3 },
        terminal: false,
      },
    })

    renderProgressPage()

    const startBtn = await screen.findByRole('button', { name: /start quick play/i })
    fireEvent.click(startBtn)

    expect(await screen.findByText(/Play Screen Mock/i)).toBeInTheDocument()
    expect(api.startSession).toHaveBeenCalledWith({
      scenarioId: 'payment-screenshot',
      mode: 'quick',
    })
  })

  it('renders populated state with 5 skill bars, stats, recommended next, and missed flags', async () => {
    vi.mocked(api.getProgress).mockResolvedValueOnce(mockPopulatedProgress)

    renderProgressPage()

    // Title and stats
    expect(await screen.findByText(/Your Scam Defense Profile/i)).toBeInTheDocument()
    expect(screen.getByText(/3 scenario runs/i)).toBeInTheDocument()

    // 5 Skill bars
    expect(screen.getByText(/Spotting Urgency & Pressure/i)).toBeInTheDocument()
    expect(screen.getByText('65/100')).toBeInTheDocument()
    expect(screen.getByText(/Detecting Impersonation/i)).toBeInTheDocument()
    expect(screen.getByText('45/100')).toBeInTheDocument()
    expect(screen.getByText(/Payment Verification/i)).toBeInTheDocument()
    expect(screen.getByText('75/100')).toBeInTheDocument()
    expect(screen.getByText(/QR & Collect Requests/i)).toBeInTheDocument()
    expect(screen.getByText('50/100')).toBeInTheDocument()
    expect(screen.getByText(/Independent Safe Verification/i)).toBeInTheDocument()
    expect(screen.getByText('70/100')).toBeInTheDocument()

    // Recommended Next
    expect(screen.getByText(/Recommended Next Practice/i)).toBeInTheDocument()
    expect(screen.getByText(/You're weakest at Impersonation detection; this one trains it./i)).toBeInTheDocument()

    // Frequently Missed Flags
    expect(screen.getByText(/Caller requesting OTP or PIN/i)).toBeInTheDocument()
    expect(screen.getByText(/Missed 2×/i)).toBeInTheDocument()

    // Recent results link
    expect(screen.getAllByText(/The Urgent Fraud Department Call/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Score:/i).length).toBe(2)
  })

  it('executes delete my data flow with confirmation dialog', async () => {
    vi.mocked(api.getProgress).mockResolvedValueOnce(mockPopulatedProgress)
    vi.mocked(api.deleteProgress).mockResolvedValueOnce()

    renderProgressPage()

    const deleteBtn = await screen.findByRole('button', { name: /delete my data/i })
    fireEvent.click(deleteBtn)

    // Dialog opens
    expect(screen.getByText(/Delete All Progress Data\?/i)).toBeInTheDocument()

    // On delete confirm, calls deleteProgress and refetches
    vi.mocked(api.getProgress).mockResolvedValueOnce(mockEmptyProgress)
    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(api.deleteProgress).toHaveBeenCalledTimes(1)
      expect(api.getProgress).toHaveBeenCalledTimes(2)
    })

    // Shows empty state after deletion
    expect(await screen.findByText(/No runs yet/i)).toBeInTheDocument()
  })
})
