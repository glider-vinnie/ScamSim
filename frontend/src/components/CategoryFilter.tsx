import React from 'react'
import { CATEGORY_LABELS } from '../lib/constants'

export interface CategoryFilterProps {
  selectedCategory: string // 'all' or ScenarioCategory
  onSelectCategory: (category: string) => void
  className?: string
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Categories' },
  { id: 'fake_confirmation', label: CATEGORY_LABELS['fake_confirmation'] },
  { id: 'qr_manipulation', label: CATEGORY_LABELS['qr_manipulation'] },
  { id: 'impersonation', label: CATEGORY_LABELS['impersonation'] },
  { id: 'upi_request', label: CATEGORY_LABELS['upi_request'] },
  { id: 'fake_offer', label: CATEGORY_LABELS['fake_offer'] },
  { id: 'account_verification', label: CATEGORY_LABELS['account_verification'] },
]

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="tablist" aria-label="Scenario categories">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-badge text-xs font-semibold transition-all focus-visible:outline-3 focus-visible:outline-teal ${
              isSelected
                ? 'bg-navy text-surface shadow-sm'
                : 'bg-surface text-ink border border-mist hover:bg-surface-subtle'
            }`}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
