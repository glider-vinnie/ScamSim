import { useState, useEffect, useCallback, useRef } from 'react'
import { getSession, submitDecision, startSession, ApiError } from './api'
import { Session, PublicNode, DecisionResult } from './types'

export interface UseSessionReturn {
  session: Session | null
  currentNode: PublicNode | null
  decisionResult: DecisionResult | null
  pendingNextNode: PublicNode | null
  isLoading: boolean
  isSubmitting: boolean
  error: ApiError | Error | null
  isTerminal: boolean
  loadSession: () => Promise<void>
  chooseOption: (choiceId: string) => Promise<void>
  advance: () => void
  restart: (onSuccess: (newSessionId: string) => void) => Promise<void>
}

export function useSession(sessionId: string | undefined): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [currentNode, setCurrentNode] = useState<PublicNode | null>(null)
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null)
  const [pendingNextNode, setPendingNextNode] = useState<PublicNode | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<ApiError | Error | null>(null)

  // Guard against simultaneous double clicks
  const submittingRef = useRef<boolean>(false)

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setError(new Error('No session ID provided'))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getSession(sessionId)
      setSession(data.session)
      setCurrentNode(data.node)
      setDecisionResult(null)
      setPendingNextNode(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const chooseOption = useCallback(
    async (choiceId: string) => {
      if (!sessionId || !currentNode || submittingRef.current || decisionResult) {
        return
      }

      submittingRef.current = true
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await submitDecision(sessionId, {
          nodeId: currentNode.id,
          choiceId,
        })
        setDecisionResult(response.decision)
        setPendingNextNode(response.nextNode)
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        submittingRef.current = false
        setIsSubmitting(false)
      }
    },
    [sessionId, currentNode, decisionResult],
  )

  const advance = useCallback(() => {
    if (pendingNextNode) {
      setCurrentNode(pendingNextNode)
      setPendingNextNode(null)
      setDecisionResult(null)
    }
  }, [pendingNextNode])

  const restart = useCallback(
    async (onSuccess: (newSessionId: string) => void) => {
      if (!session) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await startSession({
          scenarioId: session.scenarioId,
          mode: session.mode,
        })
        onSuccess(res.session.id)
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    },
    [session],
  )

  const isTerminal = Boolean(currentNode?.terminal || session?.status === 'completed')

  return {
    session,
    currentNode,
    decisionResult,
    pendingNextNode,
    isLoading,
    isSubmitting,
    error,
    isTerminal,
    loadSession,
    chooseOption,
    advance,
    restart,
  }
}
