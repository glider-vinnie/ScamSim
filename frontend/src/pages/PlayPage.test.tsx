import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PlayPage } from './PlayPage'
import * as api from '../lib/api'
import { PublicNode, Session, DecisionResponse } from '../lib/types'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    getSession: vi.fn(),
    submitDecision: vi.fn(),
    startSession: vi.fn(),
    getVariation: vi.fn(),
  }
})

describe('PlayPage Interactive Journey Tests (PROMPT 06)', () => {
  const mockSession: Session = {
    id: 'test-session-123',
    scenarioId: 'payment-screenshot',
    mode: 'practice',
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
  }

  const mockScreenshotNode: PublicNode = {
    id: 'A1',
    event: {
      eventType: 'payment_screenshot',
      speaker: 'Rohan K. (fictional)',
      text: 'Bhai, I just sent ₹1,800! Bus leaves in 5 minutes.',
      details: {
        amount: '₹1,800',
        status: 'Processing',
        banner: 'SIMULATION — NOT A REAL TRANSACTION.',
      },
    },
    choices: [
      { id: 'A1-a', label: 'Hand it over — looks fine' },
      { id: 'A1-b', label: 'Check my own UPI app for credit' },
    ],
    progress: { step: 1, estTotal: 3 },
    terminal: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPlayPage(sessionId = 'test-session-123') {
    return render(
      <MemoryRouter initialEntries={[`/play/${sessionId}`]}>
        <Routes>
          <Route path="/play/:sessionId" element={<PlayPage />} />
          <Route path="/results/:sessionId" element={<div>Results Page Mock</div>} />
          <Route path="/library" element={<div>Library Page Mock</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('resumes session and renders payment_screenshot eventType', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    renderPlayPage()

    expect(await screen.findByTestId('payment-screenshot-mock')).toBeInTheDocument()
    expect(screen.getByText('SIMULATION — NOT A REAL TRANSACTION.')).toBeInTheDocument()
    expect(screen.getByText(/Bhai, I just sent ₹1,800!/i)).toBeInTheDocument()
    expect(screen.getByText(/Hand it over — looks fine/i)).toBeInTheDocument()
    expect(screen.getByText(/Check my own UPI app for credit/i)).toBeInTheDocument()
  })

  it('renders different eventTypes (qr_message, call, pay_screen, app_view)', async () => {
    const testCases: Array<{ eventType: string; expectedText: string; details?: Record<string, string> }> = [
      {
        eventType: 'qr_message',
        expectedText: 'Scan to claim ₹499 refund',
      },
      {
        eventType: 'call',
        expectedText: 'Officer Mehta calling regarding urgent debit',
        details: { status: 'Active Voice Call' },
      },
      {
        eventType: 'pay_screen',
        expectedText: 'Collect request for ₹4,999',
        details: { amount: '₹4,999', receiver: 'refund-desk@sim' },
      },
      {
        eventType: 'app_view',
        expectedText: 'No pending credits in account balance',
        details: { status: 'Zero credits found' },
      },
    ]

    for (const tc of testCases) {
      vi.mocked(api.getSession).mockResolvedValueOnce({
        session: mockSession,
        node: {
          id: 'TEST_NODE',
          event: {
            eventType: tc.eventType,
            speaker: 'Test Speaker',
            text: tc.expectedText,
            details: tc.details || {},
          },
          choices: [{ id: 'opt-1', label: 'Option 1' }],
          progress: { step: 1, estTotal: 2 },
          terminal: false,
        },
      })

      const { unmount } = renderPlayPage()
      expect(await screen.findByText(new RegExp(tc.expectedText, 'i'))).toBeInTheDocument()
      unmount()
    }
  })

  it('completes decision flow: choice select -> FeedbackPanel with aria-live -> advance', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    const decisionResponse: DecisionResponse = {
      decision: {
        choiceId: 'A1-b',
        riskLevel: 'safe',
        scoreDelta: 2,
        explanation: {
          whatHappened: 'You checked your own account first.',
          why: 'Personal bank statements are authoritative.',
        },
        redFlagsCaught: [
          {
            id: 'A-RF1',
            label: 'Screenshot used as proof',
            explanation: 'Screenshots can be faked.',
          },
        ],
        redFlagsMissed: [],
        safeAlternative: null,
        considerNext: 'Wait for incoming SMS or push alert.',
      },
      nextNode: {
        id: 'A3',
        event: {
          eventType: 'chat',
          speaker: 'Rohan K. (fictional)',
          text: 'Did the money come?',
          details: {},
        },
        choices: [{ id: 'A3-a', label: 'Not yet' }],
        progress: { step: 2, estTotal: 3 },
        terminal: false,
      },
      status: 'in_progress',
    }

    vi.mocked(api.submitDecision).mockResolvedValueOnce(decisionResponse)

    renderPlayPage()

    const choiceBtn = await screen.findByText(/Check my own UPI app for credit/i)
    fireEvent.click(choiceBtn)

    // FeedbackPanel displays outcome and aria-live polite region
    expect(await screen.findByText(/Decision Outcome/i)).toBeInTheDocument()
    expect(screen.getByText(/You checked your own account first/i)).toBeInTheDocument()
    expect(screen.getByText(/Personal bank statements are authoritative/i)).toBeInTheDocument()
    expect(screen.getByText(/Screenshot used as proof/i)).toBeInTheDocument()

    const politeRegion = document.querySelector('[aria-live="polite"]')
    expect(politeRegion).toBeInTheDocument()

    // Advance to next node
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn)

    expect(await screen.findByText(/Did the money come\?/i)).toBeInTheDocument()
  })

  it('guards against double-click sending multiple requests', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    // Return a delayed promise
    let resolveSubmit: (val: DecisionResponse) => void = () => {}
    const slowPromise = new Promise<DecisionResponse>((res) => {
      resolveSubmit = res
    })
    vi.mocked(api.submitDecision).mockReturnValueOnce(slowPromise)

    renderPlayPage()

    const choiceBtn = await screen.findByText(/Check my own UPI app for credit/i)
    fireEvent.click(choiceBtn)
    fireEvent.click(choiceBtn)
    fireEvent.click(choiceBtn)

    expect(api.submitDecision).toHaveBeenCalledTimes(1)

    // Clean up promise
    resolveSubmit({
      decision: {
        choiceId: 'A1-b',
        riskLevel: 'safe',
        scoreDelta: 2,
        explanation: { whatHappened: 'Good', why: 'Safe' },
        redFlagsCaught: [],
        redFlagsMissed: [],
        safeAlternative: null,
        considerNext: 'Done',
      },
      nextNode: null,
      status: 'completed',
    })

    await waitFor(() => {
      expect(screen.getByText(/Decision Outcome/i)).toBeInTheDocument()
    })
  })

  it('handles 409 conflict error by showing Reload Scenario alert', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    const conflictErr = new api.ApiError(409, 'INVALID_TRANSITION', 'State Conflict')
    vi.mocked(api.submitDecision).mockRejectedValueOnce(conflictErr)

    renderPlayPage()

    const choiceBtn = await screen.findByText(/Check my own UPI app for credit/i)
    fireEvent.click(choiceBtn)

    expect(await screen.findByText(/State Conflict/i)).toBeInTheDocument()
    const reloadBtn = screen.getByRole('button', { name: /reload scenario/i })
    expect(reloadBtn).toBeInTheDocument()

    // Clicking reload re-calls getSession
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })
    fireEvent.click(reloadBtn)
    await waitFor(() => {
      expect(api.getSession).toHaveBeenCalledTimes(2)
    })
  })

  it('renders terminal outcome node and navigates via See Results CTA', async () => {
    const terminalNode: PublicNode = {
      id: 'A-SAFE',
      event: {
        eventType: 'outcome',
        text: 'You safely retained your calculator until funds were confirmed.',
        details: {},
      },
      choices: [],
      progress: { step: 3, estTotal: 3 },
      terminal: true,
    }

    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: { ...mockSession, status: 'completed' },
      node: terminalNode,
    })

    renderPlayPage()

    expect(await screen.findByText(/Threat Prevented Successfully/i)).toBeInTheDocument()
    expect(screen.getByText(/You safely retained your calculator/i)).toBeInTheDocument()

    const resultsBtn = screen.getByRole('button', { name: /see results/i })
    fireEvent.click(resultsBtn)

    expect(await screen.findByText(/Results Page Mock/i)).toBeInTheDocument()
  })

  it('opens restart dialog and restarts session on confirm', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    vi.mocked(api.startSession).mockResolvedValueOnce({
      session: { ...mockSession, id: 'new-session-777' },
      node: mockScreenshotNode,
    })

    renderPlayPage()

    const restartBtn = await screen.findByRole('button', { name: /restart/i })
    fireEvent.click(restartBtn)

    expect(screen.getByText(/Restart Simulation\?/i)).toBeInTheDocument()
    const confirmBtn = screen.getByRole('button', { name: /confirm restart/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(api.startSession).toHaveBeenCalledWith({
        scenarioId: 'payment-screenshot',
        mode: 'practice',
      })
    })
  })

  it('verifies safety rule: no credential inputs (PIN/OTP/password)', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    const { container } = renderPlayPage()
    await screen.findByText(/Bhai, I just sent ₹1,800!/i)

    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBe(0)
  })

  it('handles optional fresh wording toggle with AI-varied wording tag', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    vi.mocked(api.getVariation).mockResolvedValueOnce({
      source: 'gemini',
      messageVariant: 'Hey buddy, money transferred! Rush hurry departure soon.',
    })

    renderPlayPage()

    await screen.findByText(/Bhai, I just sent ₹1,800!/i)

    const freshBtn = screen.getByRole('button', { name: /fresh wording/i })
    fireEvent.click(freshBtn)

    await waitFor(() => {
      expect(api.getVariation).toHaveBeenCalledWith({
        scenarioId: 'payment-screenshot',
        nodeId: 'A1',
      })
    })

    expect(await screen.findByText(/AI-varied wording/i)).toBeInTheDocument()
    expect(
      screen.getByText('Hey buddy, money transferred! Rush hurry departure soon.'),
    ).toBeInTheDocument()
  })

  it('keeps original text when variation endpoint returns fallback', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce({
      session: mockSession,
      node: mockScreenshotNode,
    })

    vi.mocked(api.getVariation).mockResolvedValueOnce({
      source: 'fallback',
    })

    renderPlayPage()

    await screen.findByText(/Bhai, I just sent ₹1,800!/i)

    const freshBtn = screen.getByRole('button', { name: /fresh wording/i })
    fireEvent.click(freshBtn)

    await waitFor(() => {
      expect(api.getVariation).toHaveBeenCalled()
    })

    expect(screen.queryByText(/AI-varied wording/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Bhai, I just sent ₹1,800!/i)).toBeInTheDocument()
  })
})
