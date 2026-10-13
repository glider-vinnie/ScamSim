/**
 * Single source of truth for all ScamSim UI microcopy.
 * Spec §9 compliance.
 */
export const COPY = {
  appName: 'ScamSim',
  tagline: 'Learn to spot the scam before it costs you.',
  explainer:
    'Practise making real-time decisions in realistic, fictional scam scenarios. Spot the red flags before it costs you real money.',
  simulationBanner: 'SIMULATION — fictional scenario. No real payments.',
  disclaimer:
    'SIMULATION ONLY — Fictional scenarios for educational practice. Never enter your PIN or transfer money to unverified parties. No real funds, credentials, or personal information are ever requested.',
  paymentMockBanner: 'SIMULATION — NOT A REAL TRANSACTION.',

  landing: {
    heroTitle: 'Learn to spot the scam before it costs you.',
    heroSubtitle:
      'Reading warning lists is not enough. ScamSim lets you experience pressured scenarios, make decisions, and train your instincts safely.',
    primaryCta: 'Start a simulation',
    secondaryCta: 'How it works',
    nameInputLabel: 'Display Name (optional)',
    nameInputPlaceholder: 'e.g. Priyanshu (stored locally on your device only)',
    previewSpeaker: 'Rohan K. (fictional buyer)',
    previewMessage:
      'Bro I transferred ₹1,800! See attached screenshot. Bus leaving in 5 mins hurry!',
    previewFlag: 'Urgency Pressure & Unverified Screenshot',

    stepsHeading: 'How ScamSim Works',
    stepsSubheading: 'Three simple steps to building fraud defense reflexes.',
    step1Title: '1. Face the Scenario',
    step1Desc:
      'Encounter authentic, fictional interactions involving UPI requests, fake confirmation slips, and QR manipulation.',
    step2Title: '2. Decide Under Pressure',
    step2Desc:
      'Choose your response. Every path branches into realistic simulated outcomes with zero real-world risk.',
    step3Title: '3. Learn the Red Flags',
    step3Desc:
      'Discover which flags you caught, which ones slipped by, and receive adaptive follow-ups tailored to your weak points.',

    categoriesHeading: 'Scam Categories Covered',
    modesHeading: 'Choose Your Practice Mode',
    modeQuickPlayTitle: 'Quick Play',
    modeQuickPlayDesc: 'Jump straight into our core scenario with a single click.',
    modePracticeTitle: 'Scenario Library',
    modePracticeDesc: 'Browse and filter scenarios by attack category and difficulty.',
    modeChallengeTitle: 'Challenge Mode',
    modeChallengeDesc: 'Timed, escalating multi-round gauntlet.',
    modeChallengeBadge: 'Coming Soon',
  },

  library: {
    heading: 'Scenario Library',
    subheading: 'Choose a scenario to practise detecting fraud patterns at your own pace.',
    emptyCategory: 'No scenarios in this category yet.',
    emptyLibrary: 'No scenarios available at this time.',
    retryButton: 'Try loading again',
    filterLabel: 'Filter by category:',
  },

  play: {
    stepLabel: (step: number, total: number) => `Step ${step} of ~${total}`,
    restartPrompt: 'Are you sure you want to restart this simulation? Current progress will be reset.',
    restartConfirm: 'Restart Scenario',
    restartCancel: 'Keep Playing',
    simulatedLossNotice: (amount: string) =>
      `In this simulation, that choice would have cost you ${amount}. No real money moved.`,
  },

  results: {
    heading: 'Simulation Results',
    scoreHeading: 'Your Eye for Scams',
    scoringFormulaTitle: 'How scoring works',
    scoringFormulaBody:
      'Your score blends 70% decision safety (safe choices earn full points, critical choices deduct) and 30% red-flag identification (proportion of subtle fraud flags correctly caught).',
    scoreDisclaimer:
      'This score reflects how you did in this simulation. It does not guarantee how you would handle a real scam.',
    skillsTested: 'Skills Demonstrated',
    areasToImprove: 'Areas to Practice',
    recommendedNextTitle: 'Recommended Next Practice',
    replayButton: 'Replay This Scenario',
    libraryButton: 'Browse Library',
    progressButton: 'View Progress Dashboard',
  },

  rulesOfThumb: [
    'Pause. Verify. Then decide.',
    'Receiving money on UPI NEVER requires scanning a QR code or entering your UPI PIN.',
    'A screenshot is not proof of payment. Check your own bank account balance.',
    'Real bank officials will never demand OTPs or urge panic transactions to prevent account lockouts.',
  ],
} as const
