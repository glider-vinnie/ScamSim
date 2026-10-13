import React from 'react'
import { PhoneCall, ShieldAlert } from 'lucide-react'

export interface CallCardProps {
  caller?: string
  number?: string
  duration?: string
  status?: string
  className?: string
}

export const CallCard: React.FC<CallCardProps> = ({
  caller = 'Fraud Prevention Officer (fictional)',
  number = '+91 98XXX XXXXX (unverified)',
  duration = '01:42',
  status = 'Active Voice Call',
  className = '',
}) => {
  return (
    <div
      className={`max-w-sm mx-auto bg-surface border border-mist rounded-card p-5 shadow-card text-center ${className}`}
    >
      <div className="bg-sand text-navy text-[11px] font-bold py-1 px-3 rounded-badge uppercase tracking-wider mb-4 inline-flex items-center gap-1.5">
        <ShieldAlert size={14} />
        <span>SIMULATION — INCOMING CALL</span>
      </div>

      <div className="w-16 h-16 mx-auto mb-3 bg-navy text-surface rounded-full flex items-center justify-center animate-pulse">
        <PhoneCall size={28} />
      </div>

      <h3 className="text-lg font-bold text-navy mb-0.5">{caller}</h3>
      <p className="text-xs text-muted mb-2 font-mono">{number}</p>
      <div className="inline-block bg-teal/15 text-navy font-semibold text-xs px-3 py-1 rounded-badge mb-3">
        {status} • {duration}
      </div>

      <p className="text-xs text-coral font-medium border-t border-mist/40 pt-3">
        Caller insists on urgent OTP/PIN disclosure to prevent account block.
      </p>
    </div>
  )
}
