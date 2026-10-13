import { getClientId } from './clientId'
import {
  FIXTURE_SCENARIOS,
  createMockSession,
  getMockSession,
  submitMockDecision,
  getMockProgress,
  deleteMockProgress,
} from './fixtures'
import {
  ScenarioSummary,
  Session,
  PublicNode,
  DecisionResponse,
  Results,
  UserProgress,
} from './types'

export class ApiError extends Error {
  code: string
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set('X-Client-Id', getClientId())
  headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorCode = 'UNKNOWN_ERROR'
    let errorMessage = `HTTP Error ${res.status}`
    try {
      const errorJson = await res.json()
      if (errorJson?.error) {
        errorCode = errorJson.error.code || errorCode
        errorMessage = errorJson.error.message || errorMessage
      }
    } catch {
      // Body is not JSON
    }
    throw new ApiError(res.status, errorCode, errorMessage)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

/**
 * 1. Fetch available scenarios with optional category filter
 */
export async function getScenarios(category?: string): Promise<{ scenarios: ScenarioSummary[] }> {
  if (USE_MOCKS) {
    const filtered =
      category && category !== 'all'
        ? FIXTURE_SCENARIOS.filter((s) => s.category === category)
        : FIXTURE_SCENARIOS
    return { scenarios: filtered }
  }

  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
  return request<{ scenarios: ScenarioSummary[] }>(`/scenarios${query}`)
}

/**
 * 2. Start a new simulation session
 */
export async function startSession(params: {
  scenarioId: string
  mode: 'quick' | 'practice' | 'challenge'
}): Promise<{ session: Session; node: PublicNode }> {
  if (USE_MOCKS) {
    return createMockSession(params.scenarioId, params.mode)
  }

  return request<{ session: Session; node: PublicNode }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 3. Submit a choice for the current node
 */
export async function submitDecision(
  sessionId: string,
  params: { nodeId: string; choiceId: string },
): Promise<DecisionResponse> {
  if (USE_MOCKS) {
    return submitMockDecision(sessionId, params)
  }

  return request<DecisionResponse>(`/sessions/${encodeURIComponent(sessionId)}/decisions`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * 4. Get session status and current public node (resumable on refresh)
 */
export async function getSession(
  sessionId: string,
): Promise<{ session: Session; node: PublicNode | null }> {
  if (USE_MOCKS) {
    return getMockSession(sessionId)
  }

  return request<{ session: Session; node: PublicNode | null }>(
    `/sessions/${encodeURIComponent(sessionId)}`,
  )
}

/**
 * 5. Finalize session at terminal node
 */
export async function completeSession(sessionId: string): Promise<Results> {
  return request<Results>(`/sessions/${encodeURIComponent(sessionId)}/complete`, {
    method: 'POST',
  })
}

/**
 * 6. Get results for a completed session
 */
export async function getResults(sessionId: string): Promise<Results> {
  return request<Results>(`/sessions/${encodeURIComponent(sessionId)}/results`)
}

/**
 * 7. Get accumulated user progress across all sessions
 */
export async function getProgress(): Promise<UserProgress> {
  if (USE_MOCKS) {
    return getMockProgress()
  }
  return request<UserProgress>('/progress')
}

/**
 * 8. Reset and delete stored client progress
 */
export async function deleteProgress(): Promise<void> {
  if (USE_MOCKS) {
    deleteMockProgress()
    return
  }
  return request<void>('/progress', {
    method: 'DELETE',
  })
}

/**
 * 9. Get optional AI wording variation
 */
export async function getVariation(params: {
  scenarioId: string
  nodeId: string
}): Promise<{
  source: 'gemini' | 'fallback'
  messageVariant?: string
  explanationVariant?: string
}> {
  return request<{
    source: 'gemini' | 'fallback'
    messageVariant?: string
    explanationVariant?: string
  }>('/ai/variation', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}
