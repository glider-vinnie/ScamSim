import React from 'react'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-surface-subtle border border-dashed border-mist rounded-card ${className}`}
    >
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <h3 className="text-base font-bold text-navy mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
