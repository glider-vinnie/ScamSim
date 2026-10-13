import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ResultsPage } from './ResultsPage'
import * as api from '../lib/api'
import { Results } from '../lib/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ResultsPage Regression Tests (DEF-01 / DEF-02)', () => {
  const mockResults: Results = {
    sessionId: 'test-session-123',
    scenarioId: 'payment-screenshot',
    outcomeType: 'safe',
    score: 100,
    scoreLabel: 'Sharp eye',
    decisionScore: 100,
    flagScore: 100,
    decisions: [
      {
        nodeId: 'A1',
        choiceId: 'A1-b',
        riskLevel: 'safe',
        scoreDelta: 2,
        at: '2026-10-13T00:01:00Z',
      },
      {
        nodeId: 'A3',
        choiceId: 'A3-b',
        riskLevel: 'safe',
        scoreDelta: 2,
        at: '2026-10-13T00:02:00Z',
      },
    ],
    identifiedRedFlags: ['A-RF1', 'A-RF3'],
    missedRedFlags: [],
    skillUpdates: {
      urgency: 10,
      impersonation: 0,
      payment_verification: 20,
      qr_collect: 0,
      safe_verification: 10,
    },
    skillsDemonstrated: ['payment_verification', 'safe_verification'],
    areasToImprove: [],
    learningSummary: 'Always verify bank credits directly before releasing items.',
    recommendedSafeActions: [
      'Check your balance directly inside your verified banking application.',
      'Never accept sender screenshots as proof of credit.',
      'Set firm boundaries when buyers attempt to rush transactions.',
    ],
    recommendedNext: {
      scenarioId: 'urgent-bank-call',
      title: 'The "Urgent Bank Call" Spoof',
      reason: 'Lowest demonstrated skill: impersonation',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderResultsPage(sessionId = 'test-session-123') {
    return render(
      <MemoryRouter initialEntries={[`/results/${sessionId}`]}>
        <Routes>
          <Route path="/results/:sessionId" element={<ResultsPage />} />
          <Route path="/play/:sessionId" element={<div>Play Page Mock</div>} />
          <Route path="/library" element={<div>Library Page Mock</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders complete results with score, breakdown, decisions, and takeaways', async () => {
    vi.spyOn(api, 'completeSession').mockResolvedValueOnce(mockResults)

    renderResultsPage()

    expect(await screen.findByText('Simulation Results')).toBeInTheDocument()
    expect(screen.getByText('Safe Handler — Threat Prevented')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Sharp eye')).toBeInTheDocument()
    expect(screen.getByText('Always verify bank credits directly before releasing items.')).toBeInTheDocument()
    expect(screen.getByText('The "Urgent Bank Call" Spoof')).toBeInTheDocument()
  })

  it('redirects to /play/:id when session is still in progress (409 conflict)', async () => {
    vi.spyOn(api, 'completeSession').mockRejectedValueOnce(
      new api.ApiError(409, 'INVALID_TRANSITION', 'Session still in progress.'),
    )

    renderResultsPage()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/play/test-session-123')
    })
  })

  it('replay scenario starts a fresh session of the same scenario', async () => {
    vi.spyOn(api, 'completeSession').mockResolvedValueOnce(mockResults)
    vi.spyOn(api, 'startSession').mockResolvedValueOnce({
      session: {
        id: 'new-session-999',
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
      },
      node: {
        id: 'A1',
        event: { eventType: 'chat', text: 'Hi' },
        choices: [],
        progress: { step: 1, estTotal: 3 },
        terminal: false,
      },
    })

    renderResultsPage()

    const replayBtn = await screen.findByRole('button', { name: /Replay Scenario/i })
    fireEvent.click(replayBtn)

    await waitFor(() => {
      expect(api.startSession).toHaveBeenCalledWith({
        scenarioId: 'payment-screenshot',
        mode: 'practice',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/play/new-session-999')
    })
  })
})
