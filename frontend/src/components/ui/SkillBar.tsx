import React from 'react'
import { Skill } from '../../lib/types'
import { SKILL_LABELS } from '../../lib/constants'

export interface SkillBarProps {
  skill: Skill
  value: number // 0 - 100
  delta?: number
  className?: string
}

export const SkillBar: React.FC<SkillBarProps> = ({ skill, value, delta, className = '' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)))
  const label = SKILL_LABELS[skill] || skill

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-navy">{label}</span>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && (
            <span
              className={`text-xs font-bold ${
                delta > 0 ? 'text-teal' : delta < 0 ? 'text-berry' : 'text-muted'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className="font-mono text-xs text-muted">{percentage}/100</span>
        </div>
      </div>
      <div
        className="w-full h-3 bg-mist/30 rounded-full overflow-hidden p-0.5 border border-mist/40"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full bg-teal transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
