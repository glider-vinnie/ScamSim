import React from 'react'
import { ShieldCheck, CircleAlert, TriangleAlert, OctagonAlert } from 'lucide-react'
import { RiskLevel } from '../../lib/types'

export interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel
  showText?: boolean
  size?: 'sm' | 'md'
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showText = true,
  size = 'md',
  className = '',
  ...props
}) => {
  const iconSize = size === 'sm' ? 14 : 16
  const textClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1 font-semibold'

  switch (level) {
    case 'safe':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-badge bg-teal/15 text-navy border border-teal/40 ${textClass} ${className}`}
          aria-label="Risk level: Safe"
          {...props}
        >
          <ShieldCheck size={iconSize} className="text-teal flex-shrink-0" aria-hidden="true" />
          {showText && <span>Safe</span>}
        </span>
      )
    case 'cautious':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-badge bg-sand text-navy font-semibold ${textClass} ${className}`}
          aria-label="Risk level: Cautious"
          {...props}
        >
          <CircleAlert size={iconSize} className="text-navy flex-shrink-0" aria-hidden="true" />
          {showText && <span>Cautious</span>}
        </span>
      )
    case 'risky':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-badge bg-surface text-ink border-2 border-coral ${textClass} ${className}`}
          aria-label="Risk level: Risky"
          {...props}
        >
          <TriangleAlert size={iconSize} className="text-coral flex-shrink-0" aria-hidden="true" />
          {showText && <span>Risky</span>}
        </span>
      )
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-badge bg-berry text-surface font-semibold ${textClass} ${className}`}
          aria-label="Risk level: Critical"
          {...props}
        >
          <OctagonAlert size={iconSize} className="text-surface flex-shrink-0" aria-hidden="true" />
          {showText && <span>Critical</span>}
        </span>
      )
  }
}
