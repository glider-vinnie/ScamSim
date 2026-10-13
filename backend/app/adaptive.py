from datetime import UTC, datetime

from app.models import (
    MissedFlagCount,
    RecentResult,
    RecommendedNext,
    Results,
    Scenario,
    Skill,
    UserProgress,
)
from app.scoring import ALL_SKILLS

SKILL_ORDER: list[Skill] = [
    "urgency",
    "impersonation",
    "payment_verification",
    "qr_collect",
    "safe_verification",
]

SKILL_LABELS: dict[Skill, str] = {
    "urgency": "Urgency detection",
    "impersonation": "Impersonation detection",
    "payment_verification": "Payment verification",
    "qr_collect": "QR code verification",
    "safe_verification": "Safe verification",
}


def initial_progress() -> UserProgress:
    """Creates default user progress for a brand new user."""
    return UserProgress(
        sessionCount=0,
        completedScenarios={},
        skillEstimates={s: 50 for s in ALL_SKILLS},
        recommendedNextScenario=RecommendedNext(
            scenarioId="payment-screenshot",
            title="The \"Payment Screenshot\" Ruse",
            reason="Recommended starting scenario to test your scam detection fundamentals.",
        ),
        recentResults=[],
        frequentlyMissedFlags=[],
    )


def scenario_weights(scenario: Scenario) -> dict[Skill, float]:
    """
    Computes scenario skill weights w(s) per spec §13:
    Mean over its non-terminal nodes of:
    1 if s is node primary, 0.5 if secondary, else 0.
    """
    non_terminals = [n for n in scenario.decisionNodes if not n.terminal]
    if not non_terminals:
        return {s: 0.0 for s in ALL_SKILLS}

    totals: dict[Skill, float] = {s: 0.0 for s in ALL_SKILLS}

    for node in non_terminals:
        if node.relevantSkills:
            primary = node.relevantSkills[0]
            secondaries = node.relevantSkills[1:]
            totals[primary] += 1.0
            for sec in secondaries:
                totals[sec] += 0.5

    n_nodes = len(non_terminals)
    return {s: totals[s] / n_nodes for s in ALL_SKILLS}


def recommend(
    progress: UserProgress,
    scenarios: list[Scenario],
    last_scenario_id: str | None = None,
    last_score: int | None = None,
) -> RecommendedNext | None:
    """
    Computes scenario recommendation per spec §13:
    1. weakest = lowest estimate; ties -> fixed order urgency, impersonation, payment_verification, qr_collect, safe_verification.
    2. Candidates = all scenarios ordered by w(weakest) desc, ties -> fewest completions -> id.
    3. Exclude the just-completed scenario if its score >= 70 (variety); otherwise it stays eligible (targeted replay).
    4. First remaining candidate with w > 0 wins; reason string = "You're weakest at {skill label}; this one trains it."
    5. New user -> recommend payment-screenshot.
    """
    if progress.sessionCount == 0 or not scenarios:
        default_sc = next((s for s in scenarios if s.id == "payment-screenshot"), scenarios[0] if scenarios else None)
        if not default_sc:
            return None
        return RecommendedNext(
            scenarioId=default_sc.id,
            title=default_sc.title,
            reason="Recommended starting scenario to test your scam detection fundamentals.",
        )

    # 1. Find weakest skill (break ties by SKILL_ORDER)
    sorted_skills = sorted(
        ALL_SKILLS,
        key=lambda s: (progress.skillEstimates.get(s, 50), SKILL_ORDER.index(s)),
    )
    weakest_skill = sorted_skills[0]

    # Precompute weights for all scenarios
    sc_weights = {s.id: scenario_weights(s).get(weakest_skill, 0.0) for s in scenarios}

    # 2. Candidate ordering: w(weakest) desc, fewest completions asc, id asc
    sorted_candidates = sorted(
        scenarios,
        key=lambda s: (
            -sc_weights[s.id],
            progress.completedScenarios.get(s.id, 0),
            s.id,
        ),
    )

    # 3. Exclude just-completed scenario if score >= 70
    eligible_candidates: list[Scenario] = []
    for sc in sorted_candidates:
        if last_scenario_id and sc.id == last_scenario_id and last_score is not None and last_score >= 70:
            continue
        eligible_candidates.append(sc)

    # 4. First remaining candidate with w > 0 wins
    for sc in eligible_candidates:
        if sc_weights[sc.id] > 0:
            return RecommendedNext(
                scenarioId=sc.id,
                title=sc.title,
                reason=f"You're weakest at {SKILL_LABELS.get(weakest_skill, weakest_skill)}; this one trains it.",
            )

    # Fallback to first eligible or first scenario
    fallback = eligible_candidates[0] if eligible_candidates else scenarios[0]
    return RecommendedNext(
        scenarioId=fallback.id,
        title=fallback.title,
        reason=f"Recommended practice for {fallback.title}.",
    )


def apply_session(
    progress: UserProgress,
    results: Results,
    scenario: Scenario,
    all_scenarios: list[Scenario] | None = None,
    now: str | None = None,
) -> UserProgress:
    """
    Applies a completed session's results to user progress.
    Idempotent: if results.sessionId is already recorded in recentResults, returns unchanged.
    """
    # Idempotency check
    if any(r.sessionId == results.sessionId for r in progress.recentResults):
        return progress

    timestamp = now or datetime.now(UTC).isoformat()

    # Deep copy to maintain pure function contract
    new_progress = progress.model_copy(deep=True)

    # 1. Update sessionCount
    new_progress.sessionCount += 1

    # 2. Update completedScenarios
    new_progress.completedScenarios[scenario.id] = (
        new_progress.completedScenarios.get(scenario.id, 0) + 1
    )

    # 3. Update skillEstimates (clamp 0..100)
    for skill in ALL_SKILLS:
        current_val = new_progress.skillEstimates.get(skill, 50)
        delta = results.skillUpdates.get(skill, 0)
        new_val = max(0, min(100, current_val + delta))
        new_progress.skillEstimates[skill] = new_val

    # 4. Update recentResults (cap at 5 most recent)
    new_entry = RecentResult(
        sessionId=results.sessionId,
        scenarioId=scenario.id,
        title=scenario.title,
        score=results.score,
        completedAt=timestamp,
    )
    new_progress.recentResults = [new_entry] + new_progress.recentResults[:4]

    # 5. Update frequentlyMissedFlags (aggregate counts, top 5)
    flag_counts: dict[str, int] = {
        item.redFlagId: item.count for item in new_progress.frequentlyMissedFlags
    }
    rf_by_id = {rf.id: rf.label for rf in scenario.redFlags}

    for missed_id in results.missedRedFlags:
        flag_counts[missed_id] = flag_counts.get(missed_id, 0) + 1

    # Rebuild MissedFlagCount objects
    # Note: Preserve existing labels if known
    existing_labels = {
        item.redFlagId: item.label for item in new_progress.frequentlyMissedFlags
    }
    new_flag_counts: list[MissedFlagCount] = []
    for rf_id, count in flag_counts.items():
        label = rf_by_id.get(rf_id) or existing_labels.get(rf_id) or rf_id
        new_flag_counts.append(MissedFlagCount(redFlagId=rf_id, label=label, count=count))

    # Sort by count desc, then redFlagId asc, limit to 5
    new_flag_counts.sort(key=lambda x: (-x.count, x.redFlagId))
    new_progress.frequentlyMissedFlags = new_flag_counts[:5]

    # 6. Recompute recommendation
    candidate_scenarios = all_scenarios or [scenario]
    new_progress.recommendedNextScenario = recommend(
        new_progress,
        candidate_scenarios,
        last_scenario_id=scenario.id,
        last_score=results.score,
    )

    return new_progress
