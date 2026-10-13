export type Skill =
  | "urgency"
  | "impersonation"
  | "payment_verification"
  | "qr_collect"
  | "safe_verification";

export type RiskLevel = "safe" | "cautious" | "risky" | "critical";

export type ScenarioCategory =
  | "upi_request"
  | "fake_confirmation"
  | "qr_manipulation"
  | "impersonation"
  | "fake_offer"
  | "account_verification";

export interface RedFlag {
  id: string;
  label: string;
  explanation: string;
}

export interface ChoiceExplanation {
  whatHappened: string;
  why: string;
}

export interface Choice {
  id: string;
  label: string;
  riskLevel: RiskLevel;
  scoreDelta: number;
  skillUpdates: Record<Skill, number>;
  nextNodeId: string;
  catches: string[];
  explanation: ChoiceExplanation;
}

export interface MessageOrEvent {
  eventType: string;
  speaker?: string;
  text: string;
  details?: Record<string, string>;
}

export interface NodeFeedback {
  safeAlternative?: string | null;
  considerNext?: string | null;
}

export interface Outcome {
  type: "loss" | "safe";
  title: string;
  text: string;
}

export interface DecisionNode {
  id: string;
  terminal: boolean;
  messageOrEvent: MessageOrEvent;
  relevantSkills: Skill[];
  redFlagsPresent: string[];
  feedback?: NodeFeedback | null;
  choices: Choice[];
  outcome?: Outcome | null;
}

export interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: "easy" | "medium" | "hard";
  estimatedDuration: number;
  learningObjectives: string[];
  startingContext: string;
  skills: Skill[]
  redFlags: RedFlag[]
  startNodeId: string
  decisionNodes: DecisionNode[]
  recommendedSafeActions: string[]
  learningSummary: string;
}

export interface PublicNodeChoice {
  id: string;
  label: string;
}

export interface PublicNodeProgress {
  step: number;
  estTotal: number;
}

export interface PublicNodeEvent {
  eventType: string;
  speaker?: string;
  text: string;
  details?: Record<string, string>;
}

export interface PublicNode {
  id: string;
  event: PublicNodeEvent;
  choices: PublicNodeChoice[];
  progress: PublicNodeProgress;
  terminal: boolean;
}

export interface DecisionRecord {
  nodeId: string;
  choiceId: string;
  riskLevel: RiskLevel;
  scoreDelta: number;
  at: string;
}

export interface Session {
  id: string;
  scenarioId: string;
  mode: "quick" | "practice" | "challenge";
  status: "in_progress" | "completed";
  startTime: string;
  completionTime: string | null;
  currentNodeId: string | null;
  decisions: DecisionRecord[];
  score: number | null;
  identifiedRedFlags: string[];
  missedRedFlags: string[];
  skillUpdates: Record<Skill, number>;
}

export interface DecisionResult {
  choiceId: string;
  riskLevel: RiskLevel;
  scoreDelta: number;
  explanation: ChoiceExplanation;
  redFlagsCaught: RedFlag[];
  redFlagsMissed: RedFlag[];
  safeAlternative: string | null;
  considerNext: string;
}

export interface DecisionResponse {
  decision: DecisionResult;
  nextNode: PublicNode | null;
  status: "in_progress" | "completed";
  results?: Results;
}

export interface RecommendedNext {
  scenarioId: string;
  title: string;
  reason: string;
}

export interface AreaToImprove {
  skill: Skill;
  missedFlags: string[];
}

export interface Results {
  sessionId: string;
  scenarioId: string;
  outcomeType: "loss" | "safe";
  score: number;
  scoreLabel: string;
  decisionScore: number;
  flagScore: number;
  decisions: DecisionRecord[];
  identifiedRedFlags: string[];
  missedRedFlags: string[];
  skillUpdates: Record<Skill, number>;
  skillsDemonstrated: Skill[];
  areasToImprove: AreaToImprove[];
  learningSummary: string;
  recommendedSafeActions: string[];
  recommendedNext: RecommendedNext | null;
}

export interface RecentResult {
  sessionId: string;
  scenarioId: string;
  title: string;
  score: number;
  completedAt: string;
}

export interface MissedFlagCount {
  redFlagId: string;
  label: string;
  count: number;
}

export interface UserProgress {
  sessionCount: number;
  completedScenarios: Record<string, number>;
  skillEstimates: Record<Skill, number>;
  recommendedNextScenario: RecommendedNext | null;
  recentResults: RecentResult[];
  frequentlyMissedFlags: MissedFlagCount[];
}

export interface ScenarioSummary {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: "easy" | "medium" | "hard";
  estimatedDuration: number;
  skills: Skill[];
  learningObjectives: string[];
}
