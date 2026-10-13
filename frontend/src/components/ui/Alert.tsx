import React from 'react'
import { Info, TriangleAlert, CircleAlert, ShieldCheck } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warn' | 'error' | 'success'
  title?: string
  action?: React.ReactNode
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  action,
  className = '',
  ...props
}) => {
  const configs = {
    info: {
      bg: 'bg-teal/10',
      border: 'border-teal/30',
      text: 'text-navy',
      icon: <Info className="text-teal flex-shrink-0" size={18} />,
    },
    warn: {
      bg: 'bg-sand/30',
      border: 'border-sand',
      text: 'text-navy',
      icon: <CircleAlert className="text-navy flex-shrink-0" size={18} />,
    },
    error: {
      bg: 'bg-berry/10',
      border: 'border-berry/40',
      text: 'text-berry',
      icon: <TriangleAlert className="text-berry flex-shrink-0" size={18} />,
    },
    success: {
      bg: 'bg-teal/15',
      border: 'border-teal',
      text: 'text-navy',
      icon: <ShieldCheck className="text-teal flex-shrink-0" size={18} />,
    },
  }

  const config = configs[variant]

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-card border ${config.bg} ${config.border} ${config.text} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        <div className="text-sm text-ink">{children}</div>
      </div>
      {action && <div className="ml-auto pl-2">{action}</div>}
    </div>
  )
}
