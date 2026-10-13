import React, { useState } from 'react'
import {
  Button,
  Card,
  Badge,
  RiskBadge,
  Dialog,
  Alert,
  ProgressBar,
  SkillBar,
  ScoreRing,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui'
import {
  SimulationBanner,
  ScenarioCard,
  CategoryFilter,
  MessageBubble,
  PaymentScreenshotMock,
  QrPlaceholder,
  CallCard,
  PayScreenMock,
  AppViewMock,
  ChoiceButton,
  FeedbackPanel,
} from '../components'
import { ScenarioSummary, DecisionResult } from '../lib/types'

export const KitPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [choiceSelected, setChoiceSelected] = useState<string | null>('opt-1')

  const sampleScenario: ScenarioSummary = {
    id: 'payment-screenshot',
    title: 'The "Payment Screenshot" Ruse',
    category: 'fake_confirmation',
    difficulty: 'easy',
    estimatedDuration: 3,
    skills: ['payment_verification', 'urgency', 'safe_verification'],
    learningObjectives: ['Verify credits in your own bank app', 'Resist rush pressure'],
  }

  const sampleDecision: DecisionResult = {
    choiceId: 'A1-b',
    riskLevel: 'safe',
    scoreDelta: 2,
    explanation: {
      whatHappened: 'You opened your own banking app to verify that funds actually credited.',
      why: 'A screenshot can be easily doctored or forged. Your own account balance is the only authoritative proof.',
    },
    redFlagsCaught: [
      { id: 'A-RF1', label: 'Payment screenshot used instead of actual credit', explanation: 'Screenshots prove nothing.' },
      { id: 'A-RF3', label: 'Processing status shown on receipt', explanation: 'Money has not transferred yet.' },
    ],
    redFlagsMissed: [
      { id: 'A-RF2', label: 'Pressure to act fast before bus leaves', explanation: 'Urgency rush tactic.' },
    ],
    safeAlternative: null,
    considerNext: 'Always verify bank SMS or app push notifications directly.',
  }

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto px-4" data-testid="kit-page">
      <div>
        <h1 className="text-3xl font-extrabold text-navy">ScamSim UI Component Kit</h1>
        <p className="text-muted text-sm mt-1">
          Dev-only catalog displaying design system tokens and component states.
        </p>
      </div>

      <SimulationBanner />

      {/* Buttons */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* Badges & Risk Badges */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Badges & Risk Badges</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="default">Default Badge</Badge>
          <Badge variant="highlight">Highlight</Badge>
          <Badge variant="interactive">Interactive</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
        <div className="flex flex-wrap gap-4 items-center pt-2">
          <RiskBadge level="safe" />
          <RiskBadge level="cautious" />
          <RiskBadge level="risky" />
          <RiskBadge level="critical" />
        </div>
      </section>

      {/* Cards & Dialog */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Cards & Dialog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-bold text-navy mb-1">Standard Card</h3>
            <p className="text-sm text-muted">Surface card with standard shadow and border.</p>
          </Card>
          <Card subtle>
            <h3 className="font-bold text-navy mb-1">Subtle Card</h3>
            <p className="text-sm text-muted">Subtle tinted background card.</p>
          </Card>
        </div>
        <div>
          <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
            Open Test Dialog
          </Button>
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Test Focus-Trapped Dialog"
          >
            <div className="space-y-4">
              <p className="text-sm text-ink">
                This dialog traps keyboard focus and closes cleanly when pressing Escape or clicking outside.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
                  Confirm
                </Button>
              </div>
            </div>
          </Dialog>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Alerts</h2>
        <div className="space-y-3">
          <Alert variant="info" title="Informational">This is an informational notice regarding simulations.</Alert>
          <Alert variant="warn" title="Warning">Warning: High pressure tactics detected.</Alert>
          <Alert variant="error" title="Critical Action">Simulated payment compromised your security.</Alert>
          <Alert variant="success" title="Safe Choice">You correctly identified the impersonation attempt.</Alert>
        </div>
      </section>

      {/* Progress & Skills */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Progress & Skill Bars</h2>
        <ProgressBar value={60} label="Simulation Journey" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <SkillBar skill="payment_verification" value={80} delta={10} />
          <SkillBar skill="urgency" value={55} delta={-4} />
          <SkillBar skill="impersonation" value={40} />
          <SkillBar skill="qr_collect" value={65} delta={5} />
          <SkillBar skill="safe_verification" value={90} delta={10} />
        </div>
      </section>

      {/* Score Rings */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Score Rings</h2>
        <div className="flex flex-wrap gap-8 justify-around p-4 bg-surface rounded-card border border-mist">
          <ScoreRing score={92} />
          <ScoreRing score={68} />
          <ScoreRing score={35} />
        </div>
      </section>

      {/* Domain Mocks */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Domain Event Mocks</h2>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <MessageBubble
            speaker="Rohan K."
            text="Bro I sent ₹1,800! See attached screenshot. My bus leaves in 5 mins hurry!"
            redFlagTag="Urgency Pressure"
            time="10:14 AM"
          />
          <MessageBubble
            speaker="You"
            text="Let me check my banking app first to confirm the credit."
            isSender
            time="10:15 AM"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <PaymentScreenshotMock />
          <QrPlaceholder />
          <CallCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <PayScreenMock />
          <AppViewMock />
        </div>
      </section>

      {/* Choice Buttons & Feedback Panel */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Decisions & Feedback</h2>
        <div className="space-y-2">
          <ChoiceButton
            id="opt-1"
            label="Check my own UPI app for the credit first"
            selected={choiceSelected === 'opt-1'}
            onSelect={() => setChoiceSelected('opt-1')}
          />
          <ChoiceButton
            id="opt-2"
            label="Hand it over — screenshot looks fine"
            selected={choiceSelected === 'opt-2'}
            onSelect={() => setChoiceSelected('opt-2')}
          />
          <ChoiceButton
            id="opt-3"
            label="Disabled choice option"
            disabled
            onSelect={() => {}}
          />
        </div>
        <FeedbackPanel decision={sampleDecision} onContinue={() => alert('Continue clicked')} />
      </section>

      {/* States */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Feedback & Empty States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No Scenarios Yet"
            description="There are currently no active scenarios in this category."
          />
          <ErrorState
            title="Failed to Load"
            message="Could not connect to the simulation engine."
            onRetry={() => {}}
          />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="rect" />
        </div>
      </section>

      {/* Scenario Card */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy border-b border-mist/40 pb-2">Scenario Card</h2>
        <div className="max-w-md">
          <ScenarioCard scenario={sampleScenario} onStart={() => alert('Starting scenario')} />
        </div>
      </section>
    </div>
  )
}

export default KitPage
