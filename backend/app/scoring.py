from app.models import (
    AreaToImprove,
    Results,
    Scenario,
    Session,
    Skill,
)

ALL_SKILLS: list[Skill] = [
    "urgency",
    "impersonation",
    "payment_verification",
    "qr_collect",
    "safe_verification",
]


def get_score_label(score: int) -> str:
    if score >= 80:
        return "Sharp eye"
    if score >= 50:
        return "Getting there"
    return "Needs practice"


def compute_results(session: Session, scenario: Scenario) -> Results:
    nodes_by_id = {n.id: n for n in scenario.decisionNodes}
    rf_by_id = {rf.id: rf for rf in scenario.redFlags}

    n_decisions = len(session.decisions)
    if n_decisions == 0:
        decision_score = 0
    else:
        raw_sum = sum(d.scoreDelta for d in session.decisions)
        decision_score = round(100 * max(0, raw_sum) / (2 * n_decisions))

    # Visited non-terminal nodes
    present_flag_ids: set[str] = set()
    caught_flag_ids: set[str] = set()

    # Track choices made for skill updates and flag catching
    skill_sums: dict[Skill, int] = {s: 0 for s in ALL_SKILLS}

    for decision in session.decisions:
        node = nodes_by_id.get(decision.nodeId)
        if node and not node.terminal:
            present_flag_ids.update(node.redFlagsPresent)
            # Find the chosen choice
            chosen_choice = next((c for c in node.choices if c.id == decision.choiceId), None)
            if chosen_choice:
                # Add choice catches
                caught_flag_ids.update(chosen_choice.catches)
                for sk, delta in chosen_choice.skillUpdates.items():
                    skill_sums[sk] = skill_sums.get(sk, 0) + delta

    # Only count flags that were actually present in visited nodes
    effective_caught = caught_flag_ids & present_flag_ids
    missed_flag_ids = present_flag_ids - effective_caught

    if len(present_flag_ids) == 0:
        flag_score = 100
    else:
        flag_score = round(100 * len(effective_caught) / len(present_flag_ids))

    final_score = round(0.7 * decision_score + 0.3 * flag_score)
    score_label = get_score_label(final_score)

    # Determine outcomeType from terminal node
    terminal_node = nodes_by_id.get(session.currentNodeId or "")
    if terminal_node and terminal_node.terminal and terminal_node.outcome:
        outcome_type = terminal_node.outcome.type
    else:
        outcome_type = "safe" if final_score >= 50 else "loss"

    # Skills demonstrated (Δ > 0)
    skills_demonstrated = [s for s in ALL_SKILLS if skill_sums.get(s, 0) > 0]

    # Areas to improve (Δ <= 0)
    areas_to_improve: list[AreaToImprove] = []
    for s in ALL_SKILLS:
        if skill_sums.get(s, 0) <= 0:
            # Collect labels of missed flags relevant to nodes testing this skill
            relevant_missed: list[str] = []
            for decision in session.decisions:
                node = nodes_by_id.get(decision.nodeId)
                if node and s in node.relevantSkills:
                    for missed_id in node.redFlagsPresent:
                        if missed_id in missed_flag_ids:
                            rf_obj = rf_by_id.get(missed_id)
                            label = rf_obj.label if rf_obj else missed_id
                            if label not in relevant_missed:
                                relevant_missed.append(label)

            # If no node-specific missed flag found, include general missed flags
            if not relevant_missed:
                for missed_id in missed_flag_ids:
                    rf_obj = rf_by_id.get(missed_id)
                    label = rf_obj.label if rf_obj else missed_id
                    if label not in relevant_missed:
                        relevant_missed.append(label)

            areas_to_improve.append(AreaToImprove(skill=s, missedFlags=relevant_missed))

    return Results(
        sessionId=session.id,
        scenarioId=scenario.id,
        outcomeType=outcome_type,
        score=final_score,
        scoreLabel=score_label,
        decisionScore=decision_score,
        flagScore=flag_score,
        decisions=session.decisions,
        identifiedRedFlags=sorted(effective_caught),
        missedRedFlags=sorted(missed_flag_ids),
        skillUpdates=skill_sums,
        skillsDemonstrated=skills_demonstrated,
        areasToImprove=areas_to_improve,
        learningSummary=scenario.learningSummary,
        recommendedSafeActions=scenario.recommendedSafeActions,
        recommendedNext=None,
    )
