from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Skill = Literal[
    "urgency",
    "impersonation",
    "payment_verification",
    "qr_collect",
    "safe_verification",
]

RiskLevel = Literal["safe", "cautious", "risky", "critical"]

ScenarioCategory = Literal[
    "upi_request",
    "fake_confirmation",
    "qr_manipulation",
    "impersonation",
    "fake_offer",
    "account_verification",
]


class BaseForbid(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RedFlag(BaseForbid):
    id: str
    label: str
    explanation: str


class ChoiceExplanation(BaseForbid):
    whatHappened: str
    why: str


class Choice(BaseForbid):
    id: str
    label: str
    riskLevel: RiskLevel
    scoreDelta: int
    skillUpdates: dict[Skill, int]
    nextNodeId: str
    catches: list[str] = Field(default_factory=list)
    explanation: ChoiceExplanation


class MessageOrEvent(BaseForbid):
    eventType: str
    speaker: str | None = None
    text: str
    details: dict[str, str] = Field(default_factory=dict)


class NodeFeedback(BaseForbid):
    safeAlternative: str | None = None
    considerNext: str | None = None


class Outcome(BaseForbid):
    type: Literal["loss", "safe"]
    title: str
    text: str


class DecisionNode(BaseForbid):
    id: str
    terminal: bool
    messageOrEvent: MessageOrEvent
    relevantSkills: list[Skill] = Field(default_factory=list)
    redFlagsPresent: list[str] = Field(default_factory=list)
    feedback: NodeFeedback | None = None
    choices: list[Choice] = Field(default_factory=list)
    outcome: Outcome | None = None


class Scenario(BaseForbid):
    id: str
    title: str
    category: ScenarioCategory
    difficulty: Literal["easy", "medium", "hard"]
    estimatedDuration: int
    learningObjectives: list[str]
    startingContext: str
    skills: list[Skill]
    redFlags: list[RedFlag]
    startNodeId: str
    decisionNodes: list[DecisionNode]
    recommendedSafeActions: list[str]
    learningSummary: str


# --- Session and Engine models ---


class DecisionRecord(BaseForbid):
    nodeId: str
    choiceId: str
    riskLevel: RiskLevel
    scoreDelta: int
    at: str


class Session(BaseForbid):
    id: str
    scenarioId: str
    mode: Literal["quick", "practice", "challenge"]
    status: Literal["in_progress", "completed"]
    startTime: str
    completionTime: str | None = None
    currentNodeId: str | None = None
    decisions: list[DecisionRecord] = Field(default_factory=list)
    score: int | None = None
    identifiedRedFlags: list[str] = Field(default_factory=list)
    missedRedFlags: list[str] = Field(default_factory=list)
    skillUpdates: dict[Skill, int] = Field(default_factory=dict)


class PublicNodeChoice(BaseForbid):
    id: str
    label: str


class PublicNodeProgress(BaseForbid):
    step: int
    estTotal: int


class PublicNodeEvent(BaseForbid):
    eventType: str
    speaker: str | None = None
    text: str
    details: dict[str, str] = Field(default_factory=dict)


class PublicNode(BaseForbid):
    id: str
    event: PublicNodeEvent
    choices: list[PublicNodeChoice]
    progress: PublicNodeProgress
    terminal: bool


class DecisionResult(BaseForbid):
    choiceId: str
    riskLevel: RiskLevel
    scoreDelta: int
    explanation: ChoiceExplanation
    redFlagsCaught: list[RedFlag]
    redFlagsMissed: list[RedFlag]
    safeAlternative: str | None = None
    considerNext: str


class RecommendedNext(BaseForbid):
    scenarioId: str
    title: str
    reason: str


class AreaToImprove(BaseForbid):
    skill: Skill
    missedFlags: list[str] = Field(default_factory=list)


class Results(BaseForbid):
    sessionId: str
    scenarioId: str
    outcomeType: Literal["loss", "safe"]
    score: int
    scoreLabel: str
    decisionScore: int
    flagScore: int
    decisions: list[DecisionRecord]
    identifiedRedFlags: list[str]
    missedRedFlags: list[str]
    skillUpdates: dict[Skill, int]
    skillsDemonstrated: list[Skill]
    areasToImprove: list[AreaToImprove]
    learningSummary: str
    recommendedSafeActions: list[str]
    recommendedNext: RecommendedNext | None = None


class RecentResult(BaseForbid):
    sessionId: str
    scenarioId: str
    title: str
    score: int
    completedAt: str


class MissedFlagCount(BaseForbid):
    redFlagId: str
    label: str
    count: int


class UserProgress(BaseForbid):
    sessionCount: int
    completedScenarios: dict[str, int]
    skillEstimates: dict[Skill, int]
    recommendedNextScenario: RecommendedNext | None = None
    recentResults: list[RecentResult] = Field(default_factory=list)
    frequentlyMissedFlags: list[MissedFlagCount] = Field(default_factory=list)
