import React from 'react'
import { getScoreLabel } from '../../lib/constants'

export interface ScoreRingProps {
  score: number // 0-100
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference
  const scoreInfo = getScoreLabel(clamped)
  const displayLabel = label || scoreInfo.label

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#B2C8CA"
            strokeWidth={strokeWidth}
            strokeOpacity="0.4"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#19869B"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-navy">{clamped}</span>
          <span className="text-xs text-muted font-medium">/ 100</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 font-bold text-base text-navy">
        {scoreInfo.icon}
        <span>{displayLabel}</span>
      </div>
    </div>
  )
}
