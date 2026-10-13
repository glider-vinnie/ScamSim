import React from 'react'
import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react'

export interface PaymentScreenshotMockProps {
  amount?: string
  status?: string
  speaker?: string
  txnId?: string
  details?: Record<string, string>
  className?: string
}

export const PaymentScreenshotMock: React.FC<PaymentScreenshotMockProps> = ({
  amount = '₹1,800',
  status = 'Processing',
  speaker = 'Rohan K. (fictional)',
  txnId = 'SIM-TXN-984210',
  details,
  className = '',
}) => {
  const isProcessing = status.toLowerCase().includes('process')

  return (
    <div
      className={`max-w-sm mx-auto bg-surface border-2 border-dashed border-mist rounded-card p-5 shadow-card ${className}`}
      data-testid="payment-screenshot-mock"
    >
      {/* Required simulation watermark */}
      <div className="bg-sand text-navy text-xs font-bold text-center py-1.5 px-3 rounded-button uppercase tracking-wider mb-4 flex items-center justify-center gap-1.5">
        <ShieldAlert size={14} />
        <span>SIMULATION — NOT A REAL TRANSACTION.</span>
      </div>

      <div className="border border-mist/60 rounded-xl p-4 bg-surface-subtle/50 text-center space-y-3">
        <div className="flex justify-center">
          {isProcessing ? (
            <div className="p-3 bg-sand/30 rounded-full text-navy">
              <Clock size={32} />
            </div>
          ) : (
            <div className="p-3 bg-teal/20 rounded-full text-teal">
              <CheckCircle2 size={32} />
            </div>
          )}
        </div>

        <div>
          <div className="text-2xl font-black text-navy">{amount}</div>
          <div
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-badge mt-1 ${
              isProcessing ? 'bg-sand text-navy' : 'bg-teal/20 text-navy'
            }`}
          >
            {status}
          </div>
        </div>

        <div className="border-t border-mist/40 pt-3 text-xs space-y-1 text-left text-muted">
          <div className="flex justify-between">
            <span>To:</span>
            <span className="font-semibold text-ink">You (Seller)</span>
          </div>
          <div className="flex justify-between">
            <span>From:</span>
            <span className="font-semibold text-ink">{speaker}</span>
          </div>
          <div className="flex justify-between">
            <span>Reference:</span>
            <span className="font-mono text-[11px] text-ink">{txnId}</span>
          </div>
          {details &&
            Object.entries(details)
              .filter(([k]) => k !== 'banner' && k !== 'amount' && k !== 'status')
              .map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}:</span>
                  <span className="font-semibold text-ink">{v}</span>
                </div>
              ))}
        </div>
      </div>
      <p className="text-[11px] text-center text-muted mt-3 italic">
        Screenshot shared by buyer via chat
      </p>
    </div>
  )
}
