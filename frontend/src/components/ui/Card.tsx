import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  subtle?: boolean
}

export const Card: React.FC<CardProps> = ({ children, subtle = false, className = '', ...props }) => {
  return (
    <div
      className={`rounded-card border border-mist shadow-card p-6 ${
        subtle ? 'bg-surface-subtle' : 'bg-surface'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
