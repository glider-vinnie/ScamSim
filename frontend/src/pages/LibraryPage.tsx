import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { COPY } from '../lib/copy'
import { getScenarios, startSession } from '../lib/api'
import { ScenarioSummary } from '../lib/types'
import { Skeleton, ErrorState, EmptyState } from '../components/ui'
import { SimulationBanner, CategoryFilter, ScenarioCard } from '../components'

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadScenarios = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getScenarios()
      setScenarios(res.scenarios || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retrieve scenarios from the simulation engine.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScenarios()
  }, [])

  const handleStartScenario = async (scenarioId: string) => {
    setStartingId(scenarioId)
    try {
      const res = await startSession({
        scenarioId,
        mode: 'practice',
      })
      navigate(`/play/${res.session.id}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not launch simulation session. Please retry.',
      )
      setStartingId(null)
    }
  }

  // Filter scenarios locally or via query
  const filteredScenarios =
    selectedCategory === 'all'
      ? scenarios
      : scenarios.filter((s) => s.category === selectedCategory)

  return (
    <div className="space-y-8 py-2">
      <SimulationBanner />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-navy tracking-tight">
          {COPY.library.heading}
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl">
          {COPY.library.subheading}
        </p>
      </div>

      {/* Category filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 4 Reachable States */}
      {/* 1. Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="library-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-surface border border-mist rounded-card space-y-4">
              <div className="flex justify-between">
                <Skeleton className="w-20 h-5" />
                <Skeleton className="w-14 h-5" />
              </div>
              <Skeleton className="w-3/4 h-6" />
              <Skeleton className="w-1/2 h-4" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
              <Skeleton className="w-full h-10 mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* 2. Error State with Retry */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load scenarios"
          message={error}
          onRetry={loadScenarios}
        />
      )}

      {/* 3. Empty Library State */}
      {!isLoading && !error && scenarios.length === 0 && (
        <EmptyState
          icon={<BookOpen size={40} />}
          title={COPY.library.emptyLibrary}
          description="The simulation catalog is currently empty. Please check backend connection."
        />
      )}

      {/* 4. Empty Category State */}
      {!isLoading && !error && scenarios.length > 0 && filteredScenarios.length === 0 && (
        <EmptyState
          icon={<BookOpen size={40} />}
          title={COPY.library.emptyCategory}
          description={`No scenarios have been authored for "${selectedCategory}" yet. Try selecting another category.`}
        />
      )}

      {/* Populated Grid */}
      {!isLoading && !error && filteredScenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="scenario-grid">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isLoading={startingId === scenario.id}
              onStart={handleStartScenario}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryPage
