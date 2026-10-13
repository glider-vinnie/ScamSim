import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  className = '',
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-card w-full h-24',
    circle: 'rounded-full w-12 h-12',
  }

  return (
    <div
      className={`animate-pulse bg-mist/40 ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}
