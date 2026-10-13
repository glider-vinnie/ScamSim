import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  BookOpen,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { completeSession, getResults, startSession, ApiError } from '../lib/api'
import { Results, Skill } from '../lib/types'
import { SKILL_LABELS } from '../lib/constants'
import {
  Button,
  Card,
  Badge,
  RiskBadge,
  ScoreRing,
  Skeleton,
  ErrorState,
} from '../components/ui'
import { SimulationBanner } from '../components'

export const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [results, setResults] = useState<Results | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isStartingNext, setIsStartingNext] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let isMounted = true
    setIsLoading(true)
    setError(null)

    const fetchResults = async () => {
      try {
        let data: Results
        try {
          data = await completeSession(sessionId)
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            navigate(`/play/${sessionId}`)
            return
          }
          data = await getResults(sessionId)
        }
        if (isMounted) {
          setResults(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to retrieve simulation results.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchResults()

    return () => {
      isMounted = false
    }
  }, [sessionId, navigate])

  const handleReplay = async () => {
    if (!results) return
    setIsStartingNext(true)
    try {
      const res = await startSession({
        scenarioId: results.scenarioId,
        mode: 'practice',
      })
      navigate(`/play/${res.session.id}`)
    } catch {
      setIsStartingNext(false)
    }
  }

  const handleStartRecommended = async (scenarioId: string) => {
    setIsStartingNext(true)
    try {
      const res = await startSession({
        scenarioId,
        mode: 'practice',
      })
      navigate(`/play/${res.session.id}`)
    } catch {
      setIsStartingNext(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <SimulationBanner />
        <Skeleton className="h-48 w-full rounded-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <ErrorState
          title="Results Unavailable"
          message={error || 'Simulation results could not be located.'}
          action={
            <Button variant="primary" onClick={() => navigate('/library')}>
              Go to Library
            </Button>
          }
        />
      </div>
    )
  }

  const isSafe = results.outcomeType === 'safe'

  return (
    <div className="min-w-[320px] max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Simulation Header */}
      <SimulationBanner />

      {/* Main Results Header Card */}
      <Card className="p-6 sm:p-8 text-center space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Scenario Complete
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">Simulation Results</h1>
          <div className="flex items-center justify-center gap-2 pt-1">
            {isSafe ? (
              <Badge variant="interactive" className="gap-1.5 text-xs py-1 px-3">
                <ShieldCheck size={14} className="text-teal" />
                <span>Safe Handler — Threat Prevented</span>
              </Badge>
            ) : (
              <Badge variant="danger" className="gap-1.5 text-xs py-1 px-3">
                <AlertTriangle size={14} />
                <span>Critical Risk — Simulated Financial Loss</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Score Ring */}
        <div className="py-2">
          <ScoreRing score={results.score} label={results.scoreLabel} />
        </div>

        {/* Decision vs Flag Score Sub-metrics */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2 border-t border-mist/30">
          <div className="p-3 bg-surface-subtle rounded-lg border border-mist/40">
            <span className="text-xs font-bold text-muted block">Decision Quality</span>
            <span className="text-xl font-extrabold text-navy">{results.decisionScore}%</span>
          </div>
          <div className="p-3 bg-surface-subtle rounded-lg border border-mist/40">
            <span className="text-xs font-bold text-muted block">Deception Spotted</span>
            <span className="text-xl font-extrabold text-navy">{results.flagScore}%</span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleReplay}
            isLoading={isStartingNext}
            className="gap-2"
          >
            <RotateCcw size={16} />
            <span>Replay Scenario</span>
          </Button>

          <Button variant="secondary" onClick={() => navigate('/progress')} className="gap-2">
            <BarChart2 size={16} />
            <span>View Progress</span>
          </Button>

          <Button variant="ghost" onClick={() => navigate('/library')} className="gap-2">
            <BookOpen size={16} />
            <span>Scenario Library</span>
          </Button>
        </div>
      </Card>

      {/* Recommended Next Follow-up Card */}
      {results.recommendedNext ? (
        <Card className="p-6 bg-sand/15 border-2 border-sand/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-navy uppercase tracking-wider block">
                Recommended Next Challenge
              </span>
              <h3 className="text-lg font-bold text-navy">{results.recommendedNext.title}</h3>
              <p className="text-sm text-ink">{results.recommendedNext.reason}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => handleStartRecommended(results.recommendedNext!.scenarioId)}
              isLoading={isStartingNext}
              className="gap-2 shrink-0"
            >
              <span>Start Challenge</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy">Continue Learning</h3>
            <p className="text-xs text-muted">
              Explore more scenarios across payment frauds and impersonation tricks.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/library')}>
            Explore Library
          </Button>
        </Card>
      )}

      {/* Learning Summary & Recommended Safe Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Info size={18} className="text-teal" />
            <span>Key Takeaways</span>
          </h3>
          <p className="text-sm text-ink leading-relaxed">{results.learningSummary}</p>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal" />
            <span>Recommended Safe Actions</span>
          </h3>
          <ul className="space-y-2">
            {results.recommendedSafeActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 size={16} className="text-teal shrink-0 mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Decisions Timeline */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-navy">Decision Timeline</h3>
        <div className="space-y-3">
          {results.decisions.map((dec, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 p-3 bg-surface-subtle border border-mist/30 rounded-lg text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted text-xs">Step {idx + 1}</span>
                <span className="font-medium text-ink">Decision at {dec.nodeId}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    dec.scoreDelta > 0
                      ? 'text-navy'
                      : dec.scoreDelta < 0
                        ? 'text-berry'
                        : 'text-muted'
                  }`}
                >
                  {dec.scoreDelta > 0 ? `+${dec.scoreDelta}` : dec.scoreDelta} pts
                </span>
                <RiskBadge level={dec.riskLevel} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Red Flags Caught & Missed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal" />
            <span>Red Flags Spotted ({results.identifiedRedFlags.length})</span>
          </h3>
          {results.identifiedRedFlags.length > 0 ? (
            <ul className="space-y-2">
              {results.identifiedRedFlags.map((flagId) => (
                <li
                  key={flagId}
                  className="text-xs text-ink font-medium bg-teal/10 border border-teal/20 p-2.5 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle2 size={14} className="text-teal shrink-0" />
                  <span>{flagId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No deceptive indicators were spotted in this run.</p>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-berry" />
            <span>Red Flags Missed ({results.missedRedFlags.length})</span>
          </h3>
          {results.missedRedFlags.length > 0 ? (
            <ul className="space-y-2">
              {results.missedRedFlags.map((flagId) => (
                <li
                  key={flagId}
                  className="text-xs text-ink font-medium bg-berry/10 border border-berry/20 p-2.5 rounded-lg flex items-center gap-2"
                >
                  <AlertTriangle size={14} className="text-berry shrink-0" />
                  <span>{flagId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-navy font-semibold">Excellent! Zero red flags missed.</p>
          )}
        </Card>
      </div>

      {/* Skills Assessment */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-navy">Skills Demonstrated</h3>
        {results.skillsDemonstrated.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {results.skillsDemonstrated.map((sk) => (
              <Badge key={sk} variant="interactive" className="text-xs">
                {SKILL_LABELS[sk as Skill] || sk}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Keep practicing to build your defensive reflex against financial social engineering.
          </p>
        )}
      </Card>

      {/* How Scoring Works Disclosure */}
      <Card className="p-6 bg-surface-subtle border border-mist/40 space-y-3">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
          How Scoring Works
        </h3>
        <p className="text-xs text-ink leading-relaxed font-mono">
          Overall Score = round(0.7 × DecisionScore + 0.3 × FlagScore)
        </p>
        <p className="text-xs text-muted leading-relaxed">
          Safe choices provide +2, cautious choices +1, risky decisions 0, and critical errors -1.
          Flag score reflects the percentage of deceptive techniques identified during your path.
        </p>
        <p className="text-[11px] text-muted italic border-t border-mist/30 pt-2">
          DISCLAIMER: ScamSim is an educational simulation. All names, numbers, institutions, and
          interactions are completely simulated. Scoring 100 in ScamSim does not guarantee
          immunity from real-world scams.
        </p>
      </Card>
    </div>
  )
}
