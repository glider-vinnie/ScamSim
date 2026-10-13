import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Zap, BookOpen, Trophy, UserCheck } from 'lucide-react'
import { COPY } from '../lib/copy'
import { startSession } from '../lib/api'
import { Button, Card, Alert } from '../components/ui'
import {
  SimulationBanner,
  MessageBubble,
  PaymentScreenshotMock,
} from '../components'
import { CATEGORY_LABELS } from '../lib/constants'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scamsim_display_name')
      if (saved) setDisplayName(saved)
    } catch {
      // LocalStorage access restricted
    }
  }, [])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDisplayName(val)
    try {
      localStorage.setItem('scamsim_display_name', val)
    } catch {
      // LocalStorage access restricted
    }
  }

  const handleStartQuickPlay = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await startSession({
        scenarioId: 'payment-screenshot',
        mode: 'quick',
      })
      navigate(`/play/${res.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the simulation engine.')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  const categories = [
    'fake_confirmation',
    'qr_manipulation',
    'impersonation',
    'upi_request',
    'fake_offer',
    'account_verification',
  ]

  return (
    <div className="space-y-16 py-4">
      <SimulationBanner />

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-teal/15 text-navy font-semibold text-xs border border-teal/30">
            <Shield size={14} className="text-teal" />
            <span>Interactive Financial Scam Simulator</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-[1.15]">
            {COPY.landing.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed">
            {COPY.landing.heroSubtitle}
          </p>

          {/* Optional display name input */}
          <div className="max-w-md">
            <label
              htmlFor="display-name"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
            >
              {COPY.landing.nameInputLabel}
            </label>
            <div className="relative">
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={handleNameChange}
                placeholder={COPY.landing.nameInputPlaceholder}
                className="w-full px-3.5 py-2.5 bg-surface border border-mist rounded-button text-sm text-ink placeholder:text-muted/60 focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2"
              />
              {displayName && (
                <UserCheck
                  size={16}
                  className="absolute right-3 top-3 text-teal"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          {error && (
            <Alert
              variant="error"
              title="Simulation Startup Failed"
              action={
                <Button variant="secondary" size="sm" onClick={handleStartQuickPlay}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onClick={handleStartQuickPlay}
              className="gap-2 shadow-md"
            >
              <span>{COPY.landing.primaryCta}</span>
              <ArrowRight size={18} />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={scrollToHowItWorks}
            >
              {COPY.landing.secondaryCta}
            </Button>
          </div>
        </div>

        {/* Hero Visual: Static mock preview using real components */}
        <div className="lg:col-span-5 space-y-4 bg-surface-subtle border border-mist/80 p-5 rounded-card shadow-card">
          <div className="flex items-center justify-between pb-2 border-b border-mist/40 text-xs">
            <span className="font-bold text-navy uppercase tracking-wider">Live Simulation Preview</span>
            <span className="text-navy font-bold">Demo Snapshot</span>
          </div>

          <MessageBubble
            speaker={COPY.landing.previewSpeaker}
            text={COPY.landing.previewMessage}
            redFlagTag={COPY.landing.previewFlag}
            time="Just now"
          />

          <PaymentScreenshotMock
            amount="₹1,800"
            status="Processing"
            speaker="Rohan K. (fictional buyer)"
          />
        </div>
      </section>

      {/* 3 Steps: How It Works */}
      <section id="how-it-works" className="space-y-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
            {COPY.landing.stepsHeading}
          </h2>
          <p className="text-sm text-muted">
            {COPY.landing.stepsSubheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-navy text-surface flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-navy">{COPY.landing.step1Title}</h3>
            <p className="text-sm text-muted leading-relaxed">{COPY.landing.step1Desc}</p>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal text-surface flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-navy">{COPY.landing.step2Title}</h3>
            <p className="text-sm text-muted leading-relaxed">{COPY.landing.step2Desc}</p>
          </Card>

          <Card className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-sand text-navy flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-navy">{COPY.landing.step3Title}</h3>
            <p className="text-sm text-muted leading-relaxed">{COPY.landing.step3Desc}</p>
          </Card>
        </div>
      </section>

      {/* 6 Category Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy text-center">
          {COPY.landing.categoriesHeading}
        </h2>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-3.5 py-1.5 rounded-badge bg-surface text-ink border border-mist/80 text-xs font-semibold shadow-xs"
            >
              {CATEGORY_LABELS[cat] || cat}
            </span>
          ))}
        </div>
      </section>

      {/* Mode Picker */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-navy text-center">
          {COPY.landing.modesHeading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Play */}
          <Card className="flex flex-col justify-between border-teal/40">
            <div className="space-y-2">
              <div className="p-2.5 bg-teal/15 text-navy rounded-button inline-block">
                <Zap size={22} className="text-teal" />
              </div>
              <h3 className="text-lg font-bold text-navy">{COPY.landing.modeQuickPlayTitle}</h3>
              <p className="text-sm text-muted">{COPY.landing.modeQuickPlayDesc}</p>
            </div>
            <Button
              variant="primary"
              className="w-full mt-6"
              isLoading={isLoading}
              onClick={handleStartQuickPlay}
            >
              Start Quick Play
            </Button>
          </Card>

          {/* Practice Mode */}
          <Card className="flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-2.5 bg-navy/10 text-navy rounded-button inline-block">
                <BookOpen size={22} className="text-navy" />
              </div>
              <h3 className="text-lg font-bold text-navy">{COPY.landing.modePracticeTitle}</h3>
              <p className="text-sm text-muted">{COPY.landing.modePracticeDesc}</p>
            </div>
            <Button
              variant="secondary"
              className="w-full mt-6"
              onClick={() => navigate('/library')}
            >
              Browse Scenarios
            </Button>
          </Card>

          {/* Challenge Mode (Coming Soon) */}
          <Card className="flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-sand/30 text-navy rounded-button inline-block">
                  <Trophy size={22} className="text-navy" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-badge bg-sand text-navy">
                  {COPY.landing.modeChallengeBadge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-navy">{COPY.landing.modeChallengeTitle}</h3>
              <p className="text-sm text-ink">{COPY.landing.modeChallengeDesc}</p>
            </div>
            <button
              type="button"
              aria-disabled="true"
              tabIndex={-1}
              disabled
              className="w-full mt-6 py-2 px-4 rounded-button text-sm font-semibold bg-mist/30 text-muted cursor-not-allowed border border-mist/40"
            >
              {COPY.landing.modeChallengeBadge}
            </button>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
