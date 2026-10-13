import React from 'react'
import { ShieldCheck, Clock } from 'lucide-react'

export interface AppViewMockProps {
  title?: string
  status?: string
  recentActivity?: Array<{ title: string; amount: string; date: string; credit?: boolean }>
  className?: string
}

export const AppViewMock: React.FC<AppViewMockProps> = ({
  title = 'Your Official Banking App',
  status = 'No pending credits found',
  recentActivity = [
    { title: 'Campus Cafeteria', amount: '₹120', date: 'Yesterday', credit: false },
    { title: 'Bookstore Store', amount: '₹450', date: '3 days ago', credit: false },
  ],
  className = '',
}) => {
  return (
    <div
      className={`max-w-sm mx-auto bg-surface border border-mist rounded-card p-5 shadow-card ${className}`}
    >
      <div className="bg-sand text-navy text-[11px] font-bold text-center py-1 px-3 rounded-badge uppercase tracking-wider mb-4">
        SIMULATION — INDEPENDENT APP VIEW
      </div>

      <div className="flex items-center justify-between pb-3 border-b border-mist/40 mb-3">
        <h4 className="font-bold text-sm text-navy">{title}</h4>
        <div className="flex items-center gap-1 text-[11px] text-teal font-semibold">
          <ShieldCheck size={14} />
          <span>Verified Safe</span>
        </div>
      </div>

      <div className="bg-surface-subtle p-3 rounded-lg border border-mist/30 text-center mb-4">
        <span className="text-xs text-muted block mb-1">Live Account Status</span>
        <span className="text-sm font-bold text-coral flex items-center justify-center gap-1.5">
          <Clock size={16} />
          {status}
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted block">Recent Transactions</span>
        {recentActivity.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs p-2 bg-surface rounded border border-mist/30"
          >
            <div>
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-[10px] text-muted">{item.date}</p>
            </div>
            <span
              className={`font-mono font-semibold ${
                item.credit ? 'text-teal' : 'text-ink'
              }`}
            >
              {item.credit ? `+${item.amount}` : `-${item.amount}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
