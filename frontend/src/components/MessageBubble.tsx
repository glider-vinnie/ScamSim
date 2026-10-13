import React from 'react'

export interface MessageBubbleProps {
  speaker?: string
  text: string
  isSender?: boolean
  redFlagTag?: string
  time?: string
  className?: string
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  speaker,
  text,
  isSender = false,
  redFlagTag,
  time,
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} ${className}`}>
      {speaker && <span className="text-xs font-semibold text-muted mb-1 px-1">{speaker}</span>}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm relative ${
          isSender
            ? 'bg-navy text-surface rounded-br-none shadow-sm'
            : 'bg-surface border border-mist text-ink rounded-bl-none shadow-card'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-mist/20 text-[11px] opacity-80">
          {redFlagTag && (
            <span className="font-bold text-surface bg-berry px-1.5 py-0.5 rounded text-[10px]">
              Flag: {redFlagTag}
            </span>
          )}
          {time && <span className="ml-auto">{time}</span>}
        </div>
      </div>
    </div>
  )
}
