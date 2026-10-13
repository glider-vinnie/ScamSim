import { ScenarioSummary, Session, PublicNode, DecisionResponse, UserProgress } from './types'

/**
 * DEV-only mock fixtures for frontend development and offline testing.
 * Strictly mirrors spec §11 and §12.4 scenarios.
 */
export const FIXTURE_SCENARIOS: ScenarioSummary[] = [
  {
    id: 'payment-screenshot',
    title: 'The "Payment Screenshot" Ruse',
    category: 'fake_confirmation',
    difficulty: 'easy',
    estimatedDuration: 3,
    skills: ['payment_verification', 'urgency', 'safe_verification'],
    learningObjectives: [
      'Screenshots can be fabricated; always verify credits in your own banking app',
      'Recognize artificial urgency (e.g. "my bus is leaving in 5 minutes")',
      'Never hand over sold goods until money is confirmed credited in your account',
    ],
  },
  {
    id: 'refund-qr',
    title: 'The Fake Refund QR Trap',
    category: 'qr_manipulation',
    difficulty: 'medium',
    estimatedDuration: 3,
    skills: ['qr_collect', 'urgency', 'safe_verification'],
    learningObjectives: [
      'Receiving money never requires scanning a QR code or entering a PIN',
      'Identify mismatched amounts and reverse-payment requests',
      'Check official order histories directly in-app, not via unsolicited links',
    ],
  },
  {
    id: 'urgent-bank-call',
    title: 'The Urgent Fraud Department Call',
    category: 'impersonation',
    difficulty: 'hard',
    estimatedDuration: 4,
    skills: ['impersonation', 'urgency', 'safe_verification'],
    learningObjectives: [
      'Bank staff will NEVER ask for your PIN, OTP, or card CVV over phone',
      'Verify caller identities independently through official bank support channels',
      'Stay calm when pressured with threats of immediate account freeze',
    ],
  },
]

// In-memory mock store for DEV offline testing
const mockSessionsStore: Map<string, { session: Session; node: PublicNode }> = new Map()

export function createMockSession(scenarioId: string, mode: 'quick' | 'practice' | 'challenge'): {
  session: Session
  node: PublicNode
} {
  const scenario = FIXTURE_SCENARIOS.find((s) => s.id === scenarioId) || FIXTURE_SCENARIOS[0]
  const mockNode: PublicNode = {
    id: 'A1',
    event: {
      eventType: 'payment_screenshot',
      speaker: 'Rohan K. (fictional)',
      text: "Bro, I just transferred ₹1,800 to your UPI! Here's the payment screenshot. My bus leaves in 5 minutes, please hand over the calculator quickly!",
      details: {
        amount: '₹1,800',
        status: 'Processing',
        banner: 'SIMULATION — NOT A REAL TRANSACTION.',
      },
    },
    choices: [
      { id: 'A1-a', label: 'Hand it over — screenshot looks fine' },
      { id: 'A1-b', label: 'Check my own UPI app for the credit first' },
      { id: 'A1-c', label: 'Ask him to resend the screenshot' },
    ],
    progress: {
      step: 1,
      estTotal: 3,
    },
    terminal: false,
  }

  const sid = 'mock-session-' + Math.random().toString(36).substring(2, 9)
  const mockSession: Session = {
    id: sid,
    scenarioId: scenario.id,
    mode,
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
  }

  const result = { session: mockSession, node: mockNode }
  mockSessionsStore.set(sid, result)
  return result
}

export function getMockSession(sessionId: string): { session: Session; node: PublicNode | null } {
  const found = mockSessionsStore.get(sessionId)
  if (found) {
    return found
  }
  // Return fallback active mock session
  const fallback = createMockSession('payment-screenshot', 'practice')
  fallback.session.id = sessionId
  mockSessionsStore.set(sessionId, fallback)
  return fallback
}

export function submitMockDecision(
  sessionId: string,
  params: { nodeId: string; choiceId: string },
): DecisionResponse {
  const sessionEntry = getMockSession(sessionId)
  const isSafe = params.choiceId.includes('b')

  const decision = {
    choiceId: params.choiceId,
    riskLevel: isSafe ? ('safe' as const) : ('critical' as const),
    scoreDelta: isSafe ? 2 : -1,
    explanation: {
      whatHappened: isSafe
        ? 'You paused and opened your own banking app rather than trusting the stranger screen.'
        : 'You handed over the goods without verifying actual incoming credit.',
      why: isSafe
        ? 'Your own banking balance is the only authoritative proof of payment.'
        : 'Screenshots are easily falsified by fake transaction apps.',
    },
    redFlagsCaught: isSafe
      ? [
          {
            id: 'A-RF1',
            label: 'Payment screenshot used instead of actual credit',
            explanation: 'Screenshots prove nothing.',
          },
        ]
      : [],
    redFlagsMissed: isSafe
      ? []
      : [
          {
            id: 'A-RF1',
            label: 'Payment screenshot used instead of actual credit',
            explanation: 'Screenshots prove nothing.',
          },
        ],
    safeAlternative: isSafe ? null : 'Always verify your bank balance directly before handing over items.',
    considerNext: 'Check your bank balance or wait for official SMS credit notifications.',
  }

  // Next node is terminal in mock
  const terminalNode: PublicNode = {
    id: isSafe ? 'A-SAFE' : 'A-LOSS',
    event: {
      eventType: 'outcome',
      text: isSafe
        ? 'You successfully protected your property and avoided the fake screenshot scam.'
        : 'In this simulation, that choice would have cost you ₹1,800. No real money moved.',
    },
    choices: [],
    progress: {
      step: 3,
      estTotal: 3,
    },
    terminal: true,
  }

  sessionEntry.session.status = 'completed'
  sessionEntry.session.currentNodeId = terminalNode.id
  sessionEntry.node = terminalNode

  return {
    decision,
    nextNode: terminalNode,
    status: 'completed',
  }
}

let mockUserProgress: UserProgress = {
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

export function getMockProgress(): UserProgress {
  return mockUserProgress
}

export function deleteMockProgress(): void {
  mockUserProgress = {
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
}
