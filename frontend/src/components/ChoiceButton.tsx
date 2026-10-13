import React from 'react'

export interface ChoiceButtonProps {
  id: string
  label: string
  selected?: boolean
  disabled?: boolean
  isPending?: boolean
  onSelect: () => void
  className?: string
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  id,
  label,
  selected = false,
  disabled = false,
  isPending = false,
  onSelect,
  className = '',
}) => {
  return (
    <button
      type="button"
      id={`choice-${id}`}
      disabled={disabled || isPending}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-card border-2 transition-all flex items-start gap-3.5 focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 ${
        selected
          ? 'bg-teal/10 border-teal text-navy shadow-sm'
          : 'bg-surface border-mist hover:border-teal/60 hover:bg-surface-subtle text-ink'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'border-teal bg-teal' : 'border-muted bg-surface'
        }`}
        aria-hidden="true"
      >
        {selected && <div className="w-2 h-2 rounded-full bg-surface" />}
      </div>
      <div className="flex-1">
        <span className="text-sm font-semibold leading-relaxed block">{label}</span>
      </div>
      {isPending && (
        <span className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
    </button>
  )
}
