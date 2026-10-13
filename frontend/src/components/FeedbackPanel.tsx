import React, { useEffect, useRef } from 'react'
import { Check, AlertCircle, ArrowRight } from 'lucide-react'
import { DecisionResult } from '../lib/types'
import { RiskBadge, Button } from './ui'

export interface FeedbackPanelProps {
  decision: DecisionResult
  onContinue: () => void
  isTerminal?: boolean
  className?: string
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  decision,
  onContinue,
  isTerminal = false,
  className = '',
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [decision])

  return (
    <div
      className={`bg-surface border-2 border-mist rounded-card p-5 sm:p-6 shadow-card space-y-5 animate-in fade-in duration-200 ${className}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-mist/40">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-navy focus:outline-none"
        >
          Decision Outcome
        </h3>
        <RiskBadge level={decision.riskLevel} />
      </div>

      {/* What happened */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">What happened</h4>
        <p className="text-sm text-ink leading-relaxed font-medium">
          {decision.explanation.whatHappened}
        </p>
      </div>

      {/* Why */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Why it matters</h4>
        <p className="text-sm text-ink leading-relaxed">
          {decision.explanation.why}
        </p>
      </div>

      {/* Red flags caught vs missed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {decision.redFlagsCaught.length > 0 && (
          <div className="bg-teal/10 border border-teal/30 rounded-lg p-3">
            <h5 className="text-xs font-bold text-teal flex items-center gap-1.5 mb-2">
              <Check size={14} />
              <span>Red Flags Caught ({decision.redFlagsCaught.length})</span>
            </h5>
            <ul className="text-xs space-y-1.5 text-navy">
              {decision.redFlagsCaught.map((rf) => (
                <li key={rf.id} className="leading-snug">
                  • <span className="font-semibold">{rf.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {decision.redFlagsMissed.length > 0 && (
          <div className="bg-coral/10 border border-coral/30 rounded-lg p-3">
            <h5 className="text-xs font-bold text-coral flex items-center gap-1.5 mb-2">
              <AlertCircle size={14} />
              <span>Red Flags Overlooked ({decision.redFlagsMissed.length})</span>
            </h5>
            <ul className="text-xs space-y-1.5 text-ink">
              {decision.redFlagsMissed.map((rf) => (
                <li key={rf.id} className="leading-snug">
                  • <span className="font-semibold">{rf.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Safer alternative if provided */}
      {decision.safeAlternative && (
        <div className="bg-sand/20 border border-sand/40 rounded-lg p-3">
          <h5 className="text-xs font-bold text-navy mb-1">Safer Alternative</h5>
          <p className="text-xs text-ink leading-relaxed">{decision.safeAlternative}</p>
        </div>
      )}

      {/* Consider next */}
      {decision.considerNext && (
        <p className="text-xs text-muted italic">
          Tip: {decision.considerNext}
        </p>
      )}

      {/* Action CTA */}
      <div className="pt-2 flex justify-end">
        <Button variant="primary" onClick={onContinue} className="gap-2">
          <span>{isTerminal ? 'See Final Results' : 'Continue'}</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
