import secrets
from datetime import UTC, datetime
from typing import Literal

from app.errors import (
    ChoiceInvalidError,
    InvalidTransitionError,
    SessionCompletedError,
)
from app.models import (
    DecisionRecord,
    DecisionResult,
    PublicNode,
    PublicNodeChoice,
    PublicNodeEvent,
    PublicNodeProgress,
    Scenario,
    Session,
)
from app.scoring import ALL_SKILLS, compute_results


def start_session(
    scenario: Scenario,
    client_id: str,
    mode: Literal["quick", "practice", "challenge"],
    now: str | None = None,
    session_id: str | None = None,
) -> Session:
    """Start a new deterministic simulation session."""
    created_at = now or datetime.now(UTC).isoformat()
    sid = session_id or secrets.token_urlsafe(16)

    return Session(
        id=sid,
        scenarioId=scenario.id,
        mode=mode,
        status="in_progress",
        startTime=created_at,
        completionTime=None,
        currentNodeId=scenario.startNodeId,
        decisions=[],
        score=None,
        identifiedRedFlags=[],
        missedRedFlags=[],
        skillUpdates={s: 0 for s in ALL_SKILLS},
    )


def public_node(scenario: Scenario, node_id: str, step: int = 1) -> PublicNode:
    """
    Renders public view of a node.
    NEVER leaks riskLevel, scoreDelta, catches, or internal answers.
    """
    node = next((n for n in scenario.decisionNodes if n.id == node_id), None)
    if not node:
        raise InvalidTransitionError(f"Node '{node_id}' not found in scenario '{scenario.id}'")

    return PublicNode(
        id=node.id,
        event=PublicNodeEvent(
            eventType=node.messageOrEvent.eventType,
            speaker=node.messageOrEvent.speaker,
            text=node.messageOrEvent.text,
            details=node.messageOrEvent.details,
        ),
        choices=[PublicNodeChoice(id=c.id, label=c.label) for c in node.choices],
        progress=PublicNodeProgress(
            step=step,
            estTotal=scenario.estimatedDuration,
        ),
        terminal=node.terminal,
    )


def apply_decision(
    session: Session,
    scenario: Scenario,
    node_id: str,
    choice_id: str,
    now: str | None = None,
) -> tuple[Session, DecisionResult]:
    """
    Applies a choice to the session.
    Pure and deterministic function.
    """
    timestamp = now or datetime.now(UTC).isoformat()
    nodes_by_id = {n.id: n for n in scenario.decisionNodes}
    rf_by_id = {rf.id: rf for rf in scenario.redFlags}

    # 1. Check if node was already answered
    existing_decision = next((d for d in session.decisions if d.nodeId == node_id), None)
    if existing_decision:
        if existing_decision.choiceId == choice_id:
            # Idempotent resubmit of identical (nodeId, choiceId): rebuild stored result
            node = nodes_by_id.get(node_id)
            if not node:
                raise InvalidTransitionError(f"Node '{node_id}' not found")
            choice = next((c for c in node.choices if c.id == choice_id), None)
            if not choice:
                raise ChoiceInvalidError(f"Choice '{choice_id}' not found")

            caught_rf_ids = [rf for rf in choice.catches if rf in node.redFlagsPresent]
            missed_rf_ids = [rf for rf in node.redFlagsPresent if rf not in choice.catches]
            safe_alt = (
                node.feedback.safeAlternative
                if choice.riskLevel != "safe" and node.feedback
                else None
            )
            consider_next = (
                node.feedback.considerNext if node.feedback and node.feedback.considerNext else ""
            )

            idempotent_result = DecisionResult(
                choiceId=choice.id,
                riskLevel=choice.riskLevel,
                scoreDelta=choice.scoreDelta,
                explanation=choice.explanation,
                redFlagsCaught=[rf_by_id[r] for r in caught_rf_ids if r in rf_by_id],
                redFlagsMissed=[rf_by_id[r] for r in missed_rf_ids if r in rf_by_id],
                safeAlternative=safe_alt,
                considerNext=consider_next,
            )
            return session, idempotent_result
        else:
            # Different choice for already answered node
            raise InvalidTransitionError(
                f"Node '{node_id}' was already answered with choice '{existing_decision.choiceId}'"
            )

    # 2. Check session is in progress
    if session.status == "completed":
        raise SessionCompletedError(f"Session '{session.id}' is already completed")

    # 3. Check current node matches
    if node_id != session.currentNodeId:
        raise InvalidTransitionError(
            f"Node '{node_id}' does not match session currentNodeId '{session.currentNodeId}'"
        )

    # 4. Find node and choice
    node = nodes_by_id.get(node_id)
    if not node:
        raise InvalidTransitionError(f"Node '{node_id}' not found in scenario '{scenario.id}'")

    choice = next((c for c in node.choices if c.id == choice_id), None)
    if not choice:
        raise ChoiceInvalidError(
            f"Choice '{choice_id}' does not belong to node '{node_id}'"
        )

    # 5. Compute feedback and catches/misses
    caught_rf_ids = [rf for rf in choice.catches if rf in node.redFlagsPresent]
    missed_rf_ids = [rf for rf in node.redFlagsPresent if rf not in choice.catches]

    safe_alt = (
        node.feedback.safeAlternative
        if choice.riskLevel != "safe" and node.feedback
        else None
    )
    consider_next = (
        node.feedback.considerNext if node.feedback and node.feedback.considerNext else ""
    )

    decision_result = DecisionResult(
        choiceId=choice.id,
        riskLevel=choice.riskLevel,
        scoreDelta=choice.scoreDelta,
        explanation=choice.explanation,
        redFlagsCaught=[rf_by_id[r] for r in caught_rf_ids if r in rf_by_id],
        redFlagsMissed=[rf_by_id[r] for r in missed_rf_ids if r in rf_by_id],
        safeAlternative=safe_alt,
        considerNext=consider_next,
    )

    # 6. Advance session (deep copy to preserve pure function invariants)
    new_session = session.model_copy(deep=True)
    decision_record = DecisionRecord(
        nodeId=node_id,
        choiceId=choice_id,
        riskLevel=choice.riskLevel,
        scoreDelta=choice.scoreDelta,
        at=timestamp,
    )
    new_session.decisions.append(decision_record)

    # Update session skill sums
    for sk, delta in choice.skillUpdates.items():
        new_session.skillUpdates[sk] = new_session.skillUpdates.get(sk, 0) + delta

    # Transition to next node
    next_node_id = choice.nextNodeId
    next_node = nodes_by_id.get(next_node_id)
    if not next_node:
        raise InvalidTransitionError(f"Target node '{next_node_id}' does not exist")

    new_session.currentNodeId = next_node_id

    # If next node is terminal, finalize session
    if next_node.terminal:
        new_session.status = "completed"
        new_session.completionTime = timestamp
        results = compute_results(new_session, scenario)
        new_session.score = results.score
        new_session.identifiedRedFlags = results.identifiedRedFlags
        new_session.missedRedFlags = results.missedRedFlags

    return new_session, decision_result
