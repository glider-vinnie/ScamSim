import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Trash2,
  Play,
  RotateCcw,
  Flag,
} from 'lucide-react'
import { getProgress, deleteProgress, startSession } from '../lib/api'
import { UserProgress, Skill } from '../lib/types'
import {
  Button,
  Card,
  SkillBar,
  EmptyState,
  ErrorState,
  Skeleton,
  Dialog,
} from '../components/ui'

const SKILL_KEYS: Skill[] = [
  'urgency',
  'impersonation',
  'payment_verification',
  'qr_collect',
  'safe_verification',
]

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
  const [isStartingRec, setIsStartingRec] = useState<boolean>(false)

  const fetchProgress = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProgress()
      setProgress(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [])

  const handleDeleteData = async () => {
    setIsDeleting(true)
    try {
      await deleteProgress()
      setShowDeleteDialog(false)
      await fetchProgress()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete progress data')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartQuickPlay = async () => {
    try {
      const res = await startSession({
        scenarioId: 'payment-screenshot',
        mode: 'quick',
      })
      navigate(`/play/${res.session.id}`)
    } catch {
      navigate('/library')
    }
  }

  const handleStartRecommended = async (scenarioId: string) => {
    setIsStartingRec(true)
    try {
      const res = await startSession({
        scenarioId,
        mode: 'practice',
      })
      navigate(`/play/${res.session.id}`)
    } catch {
      navigate('/library')
    } finally {
      setIsStartingRec(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <ErrorState
          title="Could not load progress"
          message={error}
          action={
            <Button variant="primary" onClick={fetchProgress}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  // Empty State: No completed simulation runs
  if (!progress || progress.sessionCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          title="No runs yet"
          description="You haven't completed any simulation scenarios yet. Start a quick play simulation to establish your fraud detection baseline."
          action={
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartQuickPlay}
              className="gap-2"
            >
              <Play size={16} />
              <span>Start Quick Play</span>
            </Button>
          }
        />
      </div>
    )
  }

  const totalCompletions = Object.values(progress.completedScenarios).reduce(
    (sum, count) => sum + count,
    0,
  )

  return (
    <div className="min-w-[320px] max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-mist/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">
            Your Scam Defense Profile
          </h1>
          <p className="text-sm text-muted mt-1">
            Track your fraud detection competencies and targeted improvement areas across simulations.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="text-xs text-coral hover:text-berry gap-1.5"
        >
          <Trash2 size={14} />
          <span>Delete my data</span>
        </Button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal/15 text-teal flex items-center justify-center font-black text-xl">
            {progress.sessionCount}
          </div>
          <div>
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
              Simulations Completed
            </h2>
            <p className="text-lg font-bold text-navy">
              {totalCompletions} scenario {totalCompletions === 1 ? 'run' : 'runs'}
            </p>
          </div>
        </Card>

        {progress.recommendedNextScenario && (
          <Card className="p-5 bg-sand/15 border-sand/40 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-navy flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={14} className="text-coral" />
                <span>Recommended Next Practice</span>
              </span>
              <h3 className="font-bold text-navy text-base">
                {progress.recommendedNextScenario.title}
              </h3>
              <p className="text-xs text-ink leading-relaxed">
                {progress.recommendedNextScenario.reason}
              </p>
            </div>
            <div className="pt-3 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleStartRecommended(progress.recommendedNextScenario!.scenarioId)
                }
                disabled={isStartingRec}
                className="text-xs gap-1.5"
              >
                <span>Start Scenario</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 5 Skill Bars */}
      <Card className="p-6 space-y-5">
        <div className="border-b border-mist/30 pb-3">
          <h2 className="text-lg font-bold text-navy">Competency Levels</h2>
          <p className="text-xs text-muted">
            Evaluated on a scale of 0 to 100 based on your identification of scam indicators.
          </p>
        </div>

        <div className="space-y-4">
          {SKILL_KEYS.map((skill) => (
            <SkillBar
              key={skill}
              skill={skill}
              value={progress.skillEstimates[skill] ?? 50}
            />
          ))}
        </div>
      </Card>

      {/* Frequently Missed Flags (Top 5) & Recent Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frequently Missed Flags */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-mist/30 pb-3">
            <Flag size={18} className="text-coral" />
            <h2 className="text-base font-bold text-navy">Frequently Missed Red Flags</h2>
          </div>

          {progress.frequentlyMissedFlags.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center italic">
              No red flags missed in recent runs! Excellent observation skills.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {progress.frequentlyMissedFlags.map((item) => (
                <li
                  key={item.redFlagId}
                  className="p-3 bg-surface-subtle border border-mist/40 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-medium text-ink leading-snug">
                    {item.label}
                  </span>
                  <span className="bg-coral/15 text-navy font-bold px-2 py-0.5 rounded-badge flex-shrink-0">
                    Missed {item.count}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Results (Max 5) */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-mist/30 pb-3">
            <RotateCcw size={18} className="text-teal" />
            <h2 className="text-base font-bold text-navy">Recent Simulation Results</h2>
          </div>

          {progress.recentResults.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center italic">
              No recent history recorded.
            </p>
          ) : (
            <ul className="space-y-2">
              {progress.recentResults.map((r) => (
                <li key={r.sessionId}>
                  <Link
                    to={`/results/${r.sessionId}`}
                    className="p-3 rounded-lg border border-mist/40 hover:border-teal/60 hover:bg-surface-subtle transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <h4 className="font-bold text-navy group-hover:text-teal transition-colors">
                        {r.title}
                      </h4>
                      <span className="text-[11px] text-muted">
                        Score: <span className="font-semibold text-ink">{r.score}/100</span>
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-muted group-hover:text-teal transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete All Progress Data?"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            This will permanently remove your stored simulation scores, competency history, and
            recommendations. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteData}
              disabled={isDeleting}
              className="bg-coral hover:bg-berry text-white"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
