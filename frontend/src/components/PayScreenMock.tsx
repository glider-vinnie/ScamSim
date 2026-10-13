import React from 'react'
import { ShieldAlert, ArrowUpRight } from 'lucide-react'

export interface PayScreenMockProps {
  amount?: string
  receiver?: string
  note?: string
  className?: string
}

export const PayScreenMock: React.FC<PayScreenMockProps> = ({
  amount = '₹4,999',
  receiver = 'refund-desk@sim',
  note = 'Order Cancel Refund',
  className = '',
}) => {
  return (
    <div
      className={`max-w-sm mx-auto bg-surface border-2 border-coral rounded-card p-5 shadow-card ${className}`}
    >
      <div className="bg-sand text-navy text-xs font-bold text-center py-1.5 px-3 rounded-button uppercase tracking-wider mb-4 flex items-center justify-center gap-1.5">
        <ShieldAlert size={14} />
        <span>SIMULATED UPI PAYMENT REQUEST</span>
      </div>

      <div className="bg-coral/10 border border-coral/30 rounded-xl p-4 text-center mb-4">
        <div className="inline-flex items-center gap-1 text-xs font-bold text-coral uppercase tracking-wide mb-1">
          <ArrowUpRight size={14} />
          <span>PAY REQUEST (DEBIT)</span>
        </div>
        <div className="text-3xl font-extrabold text-navy my-1">{amount}</div>
        <p className="text-xs text-muted">
          Paying to: <span className="font-semibold text-ink">{receiver}</span>
        </p>
        {note && <p className="text-xs text-muted mt-1 italic">Note: "{note}"</p>}
      </div>

      <div className="p-3 bg-surface-subtle border border-mist/40 rounded-lg text-xs text-center text-muted">
        Notice: In real UPI apps, receiving a refund never prompts a PAY button or requests your PIN.
      </div>
    </div>
  )
}
