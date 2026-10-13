import React from 'react'

export interface QrPlaceholderProps {
  caption?: string
  size?: number
  className?: string
}

export const QrPlaceholder: React.FC<QrPlaceholderProps> = ({
  caption = 'Simulation — not scannable',
  size = 180,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 bg-surface border border-mist rounded-card shadow-card max-w-[240px] mx-auto text-center ${className}`}
      data-testid="qr-placeholder"
    >
      <div className="bg-sand/30 text-navy font-bold text-[10px] uppercase tracking-wider py-1 px-2.5 rounded-badge mb-3">
        SIMULATION
      </div>

      {/* Pure SVG decorative non-functional mock pattern, NO QR library, NO canvas, NO data URI */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="border-2 border-navy/20 p-2 bg-white rounded-lg"
        aria-hidden="true"
      >
        {/* Top-left position marker */}
        <rect x="5" y="5" width="25" height="25" rx="3" fill="#194777" />
        <rect x="10" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
        <rect x="14" y="14" width="7" height="7" fill="#194777" />

        {/* Top-right position marker */}
        <rect x="70" y="5" width="25" height="25" rx="3" fill="#194777" />
        <rect x="75" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
        <rect x="79" y="14" width="7" height="7" fill="#194777" />

        {/* Bottom-left position marker */}
        <rect x="5" y="70" width="25" height="25" rx="3" fill="#194777" />
        <rect x="10" y="75" width="15" height="15" rx="2" fill="#FFFFFF" />
        <rect x="14" y="79" width="7" height="7" fill="#194777" />

        {/* Static decorative grid blocks */}
        <rect x="35" y="8" width="6" height="6" fill="#194777" />
        <rect x="45" y="12" width="10" height="6" fill="#194777" />
        <rect x="40" y="22" width="6" height="8" fill="#194777" />
        <rect x="55" y="25" width="8" height="6" fill="#194777" />
        <rect x="12" y="38" width="6" height="8" fill="#194777" />
        <rect x="25" y="45" width="8" height="6" fill="#194777" />
        <rect x="38" y="38" width="12" height="12" rx="2" fill="#E96532" />
        <rect x="55" y="42" width="10" height="6" fill="#194777" />
        <rect x="72" y="38" width="8" height="8" fill="#194777" />
        <rect x="85" y="45" width="6" height="10" fill="#194777" />
        <rect x="36" y="60" width="14" height="6" fill="#194777" />
        <rect x="58" y="58" width="8" height="8" fill="#194777" />
        <rect x="40" y="75" width="8" height="12" fill="#194777" />
        <rect x="55" y="78" width="12" height="6" fill="#194777" />
        <rect x="75" y="75" width="14" height="14" rx="2" fill="#194777" />
      </svg>

      <span className="text-xs text-muted font-medium mt-3">{caption}</span>
    </div>
  )
}
