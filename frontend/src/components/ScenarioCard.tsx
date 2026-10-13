import React from 'react'
import { Clock, BarChart } from 'lucide-react'
import { ScenarioSummary } from '../lib/types'
import { Card, Button, Badge } from './ui'
import { CATEGORY_LABELS, SKILL_LABELS } from '../lib/constants'

export interface ScenarioCardProps {
  scenario: ScenarioSummary
  onStart: (scenarioId: string) => void
  isLoading?: boolean
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onStart,
  isLoading = false,
}) => {
  const difficultyColors = {
    easy: 'text-navy border-teal/40 bg-teal/15 font-bold',
    medium: 'text-navy border-sand bg-sand/30 font-bold',
    hard: 'text-berry border-berry/40 bg-berry/15 font-bold',
  }

  return (
    <Card className="flex flex-col justify-between hover:border-teal/50 transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-badge bg-sand/20 text-navy border border-sand/40">
            SIMULATION
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-badge border uppercase tracking-wide ${
              difficultyColors[scenario.difficulty]
            }`}
          >
            {scenario.difficulty}
          </span>
        </div>

        <h3 className="text-lg font-bold text-navy mb-1 leading-snug">{scenario.title}</h3>
        <p className="text-xs font-semibold text-muted mb-3">
          {CATEGORY_LABELS[scenario.category] || scenario.category}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted mb-4">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>~{scenario.estimatedDuration} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart size={14} />
            <span>{scenario.skills.length} skills tested</span>
          </div>
        </div>

        {scenario.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {scenario.skills.map((skill) => (
              <Badge key={skill} variant="default" className="text-[11px] font-medium lowercase">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="primary"
        className="w-full mt-2"
        isLoading={isLoading}
        onClick={() => onStart(scenario.id)}
      >
        Start Simulation
      </Button>
    </Card>
  )
}
