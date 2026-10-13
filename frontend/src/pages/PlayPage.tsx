import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RotateCcw, BookOpen, ArrowRight, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { ApiError, getVariation } from '../lib/api'
import {
  Button,
  Card,
  Badge,
  Alert,
  ProgressBar,
  ErrorState,
  Skeleton,
  Dialog,
} from '../components/ui'
import {
  SimulationBanner,
  MessageBubble,
  PaymentScreenshotMock,
  QrPlaceholder,
  CallCard,
  PayScreenMock,
  AppViewMock,
  ChoiceButton,
  FeedbackPanel,
} from '../components'

export const PlayPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const {
    session,
    currentNode,
    decisionResult,
    pendingNextNode,
    isLoading,
    isSubmitting,
    error,
    loadSession,
    chooseOption,
    advance,
    restart,
  } = useSession(sessionId)

  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [showRestartDialog, setShowRestartDialog] = useState<boolean>(false)
  const [freshWordingEnabled, setFreshWordingEnabled] = useState<boolean>(false)
  const [variedMessage, setVariedMessage] = useState<string | null>(null)
  const [isAiVaried, setIsAiVaried] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    if (freshWordingEnabled && session?.scenarioId && currentNode?.id && !currentNode.terminal) {
      getVariation({
        scenarioId: session.scenarioId,
        nodeId: currentNode.id,
      })
        .then((res) => {
          if (!isMounted) return
          if (res.source === 'gemini' && res.messageVariant) {
            setVariedMessage(res.messageVariant)
            setIsAiVaried(true)
          } else {
            setVariedMessage(null)
            setIsAiVaried(false)
          }
        })
        .catch(() => {
          if (!isMounted) return
          setVariedMessage(null)
          setIsAiVaried(false)
        })
    } else {
      setVariedMessage(null)
      setIsAiVaried(false)
    }
    return () => {
      isMounted = false
    }
  }, [freshWordingEnabled, session?.scenarioId, currentNode?.id, currentNode?.terminal])

  const handleSelect = async (choiceId: string) => {
    if (isSubmitting || decisionResult) return
    setSelectedChoiceId(choiceId)
    await chooseOption(choiceId)
  }

  const handleAdvance = () => {
    setSelectedChoiceId(null)
    advance()
  }

  const handleConfirmRestart = async () => {
    setShowRestartDialog(false)
    await restart((newId) => {
      navigate(`/play/${newId}`)
    })
  }

  // 404 / Session not found
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <ErrorState
          title="Session Not Found"
          message="This simulation session does not exist or has expired. Please pick a scenario from the library."
          action={
            <Button variant="primary" onClick={() => navigate('/library')}>
              Go to Scenario Library
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-w-[320px] max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Simulation Header */}
      <SimulationBanner />

      {/* Top navigation & session controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-mist/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted block">
            {session?.mode ? `${session.mode} mode` : 'Simulation in progress'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-navy">
            {session?.scenarioId ? session.scenarioId.replace(/-/g, ' ').toUpperCase() : 'Scenario Simulation'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!currentNode?.terminal && (
            <Button
              variant={freshWordingEnabled ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFreshWordingEnabled(!freshWordingEnabled)}
              className={`text-xs gap-1.5 ${freshWordingEnabled ? 'border-teal text-teal font-semibold' : ''}`}
              title="Toggle AI-generated wording variations"
            >
              <Sparkles size={14} className={freshWordingEnabled ? 'text-teal' : ''} />
              <span>Fresh wording</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRestartDialog(true)}
            className="text-xs gap-1.5"
            disabled={isLoading || isSubmitting}
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            className="text-xs gap-1.5"
          >
            <BookOpen size={14} />
            <span>Library</span>
          </Button>
        </div>
      </div>

      {/* Progress & Step indicator */}
      {currentNode && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted font-medium">
            <span>
              Step {currentNode.progress.step} of ~{currentNode.progress.estTotal}
            </span>
            <span>{currentNode.terminal ? 'Final Step' : 'Decision Point'}</span>
          </div>
          <ProgressBar
            value={Math.round((currentNode.progress.step / currentNode.progress.estTotal) * 100)}
          />
        </div>
      )}

      {/* Error Banners */}
      {error && !(error instanceof ApiError && error.status === 404) && (
        <div className="animate-in fade-in">
          {error instanceof ApiError && (error.status === 409 || error.status === 422) ? (
            <Alert
              variant="error"
              title="State Conflict"
              action={
                <Button size="sm" variant="secondary" onClick={loadSession}>
                  Reload Scenario
                </Button>
              }
            >
              The simulation state was out of sync. Please reload to resume the latest step.
            </Alert>
          ) : (
            <Alert
              variant="error"
              title="Connection Issue"
              action={
                <Button size="sm" variant="secondary" onClick={loadSession}>
                  Retry
                </Button>
              }
            >
              {error.message || 'Unable to update simulation state. Please retry.'}
            </Alert>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 py-8">
          <Skeleton className="h-40 w-full rounded-card" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-card" />
            <Skeleton className="h-14 w-full rounded-card" />
            <Skeleton className="h-14 w-full rounded-card" />
          </div>
        </div>
      )}

      {/* Main Simulation View */}
      {!isLoading && currentNode && (
        <div className="space-y-6">
          {/* Simulated Event Card */}
          <Card className="p-5 sm:p-6 space-y-4">
            {/* Event Header */}
            <div className="flex items-center justify-between text-xs text-muted border-b border-mist/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider">
                  Event: {currentNode.event.eventType.replace(/_/g, ' ')}
                </span>
                {isAiVaried && (
                  <Badge variant="interactive" className="text-[10px] py-0.5 px-2">
                    <Sparkles size={10} /> AI-varied wording
                  </Badge>
                )}
              </div>
              {currentNode.event.speaker && (
                <span className="font-medium text-ink">From: {currentNode.event.speaker}</span>
              )}
            </div>

            {/* Event Content by eventType */}
            <div className="py-2 space-y-4">
              {currentNode.event.eventType === 'payment_screenshot' && (
                <div className="space-y-4">
                  <PaymentScreenshotMock
                    amount={currentNode.event.details?.amount || '₹1,800'}
                    status={currentNode.event.details?.status || 'Processing'}
                    speaker={currentNode.event.speaker}
                    details={currentNode.event.details}
                  />
                  <MessageBubble
                    text={isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                    speaker={currentNode.event.speaker}
                  />
                </div>
              )}

              {currentNode.event.eventType === 'qr_message' && (
                <div className="space-y-4">
                  <QrPlaceholder />
                  <MessageBubble
                    text={isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                    speaker={currentNode.event.speaker}
                  />
                </div>
              )}

              {currentNode.event.eventType === 'call' && (
                <div className="space-y-4">
                  <CallCard
                    caller={currentNode.event.speaker}
                    status={currentNode.event.details?.status || 'Active Voice Call'}
                  />
                  <p className="text-sm text-ink text-center max-w-lg mx-auto bg-surface-subtle p-3 rounded-lg border border-mist/40 italic">
                    "{isAiVaried && variedMessage ? variedMessage : currentNode.event.text}"
                  </p>
                </div>
              )}

              {currentNode.event.eventType === 'sms' && (
                <div className="space-y-4">
                  <div className="max-w-md mx-auto bg-navy text-surface p-4 rounded-xl shadow-card text-center space-y-1">
                    <span className="text-[11px] font-bold text-mist uppercase tracking-wider">
                      Simulated Incoming SMS
                    </span>
                    <p className="text-sm font-mono">
                      {isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                    </p>
                  </div>
                </div>
              )}

              {currentNode.event.eventType === 'pay_screen' && (
                <div className="space-y-4">
                  <PayScreenMock
                    amount={currentNode.event.details?.amount || '₹4,999'}
                    receiver={currentNode.event.details?.receiver || 'refund-desk@sim'}
                    note={isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                  />
                </div>
              )}

              {currentNode.event.eventType === 'app_view' && (
                <div className="space-y-4">
                  <AppViewMock
                    status={currentNode.event.details?.status || 'No credits found'}
                  />
                  <p className="text-sm text-ink text-center max-w-lg mx-auto font-medium">
                    {isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                  </p>
                </div>
              )}

              {(currentNode.event.eventType === 'chat' ||
                (![
                  'payment_screenshot',
                  'qr_message',
                  'call',
                  'sms',
                  'pay_screen',
                  'app_view',
                  'outcome',
                ].includes(currentNode.event.eventType) &&
                  !currentNode.terminal)) && (
                <MessageBubble
                  text={isAiVaried && variedMessage ? variedMessage : currentNode.event.text}
                  speaker={currentNode.event.speaker}
                />
              )}

              {/* Terminal Outcome Event */}
              {currentNode.terminal && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-sand/30 text-navy">
                    {currentNode.id.includes('LOSS') ? (
                      <AlertTriangle size={36} className="text-coral" />
                    ) : (
                      <ShieldCheck size={36} className="text-teal" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-navy">
                    {currentNode.id.includes('LOSS')
                      ? 'Simulated Financial Loss'
                      : 'Threat Prevented Successfully'}
                  </h3>
                  <p className="text-sm sm:text-base text-ink max-w-lg mx-auto leading-relaxed">
                    {currentNode.event.text}
                  </p>
                  <p className="text-xs text-muted uppercase tracking-wider font-semibold">
                    SIMULATION COMPLETE — NOT A REAL TRANSACTION
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Interactive Choices or Feedback */}
          {!currentNode.terminal && (
            <div className="space-y-4">
              {!decisionResult ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                    How do you respond?
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentNode.choices.map((choice) => (
                      <ChoiceButton
                        key={choice.id}
                        id={choice.id}
                        label={choice.label}
                        selected={selectedChoiceId === choice.id}
                        disabled={isSubmitting}
                        isPending={isSubmitting && selectedChoiceId === choice.id}
                        onSelect={() => handleSelect(choice.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <FeedbackPanel
                  decision={decisionResult}
                  isTerminal={Boolean(pendingNextNode?.terminal)}
                  onContinue={handleAdvance}
                />
              )}
            </div>
          )}

          {/* Terminal CTA: See Results */}
          {currentNode.terminal && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/results/${sessionId}`)}
                className="gap-2 px-8 font-bold text-base"
              >
                <span>See results</span>
                <ArrowRight size={18} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Restart Dialog */}
      <Dialog
        isOpen={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
        title="Restart Simulation?"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            Restarting will discard the current simulation run and create a fresh session for this
            scenario. Would you like to proceed?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRestartDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRestart}
            >
              Confirm Restart
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
