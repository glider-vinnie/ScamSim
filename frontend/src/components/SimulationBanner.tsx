import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { COPY } from '../lib/copy'

export const SimulationBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-sand/30 border border-sand text-navy px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 tracking-wide uppercase rounded-button ${className}`}
      role="status"
    >
      <AlertTriangle size={15} className="text-navy flex-shrink-0" aria-hidden="true" />
      <span>{COPY.simulationBanner}</span>
    </div>
  )
}
