import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'highlight' | 'danger' | 'interactive'
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', ...props }) => {
  const variantStyles = {
    default: 'bg-mist/30 text-ink border border-mist',
    highlight: 'bg-sand text-navy font-semibold',
    danger: 'bg-berry text-surface font-semibold',
    interactive: 'bg-teal/15 text-navy border border-teal/40 font-semibold',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-xs leading-none uppercase tracking-wider ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
