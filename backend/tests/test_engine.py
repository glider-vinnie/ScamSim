import pytest

from app.engine import (
    apply_decision,
    public_node,
    start_session,
)
from app.errors import (
    ChoiceInvalidError,
    InvalidTransitionError,
    SessionCompletedError,
)
from app.scenarios_loader import load_all
from app.scoring import compute_results


@pytest.fixture(scope="module")
def scenarios():
    return load_all()


def test_public_node_no_leakage(scenarios):
    sc_a = scenarios["payment-screenshot"]
    p_node = public_node(sc_a, "A1", step=1)

    assert p_node.id == "A1"
    assert len(p_node.choices) == 3
    assert not p_node.terminal

    # PublicNode has only 'id' and 'label' on choices (no riskLevel, scoreDelta, catches, skillUpdates)
    for ch in p_node.choices:
        assert hasattr(ch, "id")
        assert hasattr(ch, "label")
        assert not hasattr(ch, "riskLevel")
        assert not hasattr(ch, "scoreDelta")
        assert not hasattr(ch, "catches")
        assert not hasattr(ch, "skillUpdates")

    p_dict = p_node.model_dump()
    for ch_dict in p_dict["choices"]:
        assert "riskLevel" not in ch_dict
        assert "scoreDelta" not in ch_dict
        assert "catches" not in ch_dict
        assert "skillUpdates" not in ch_dict


# --- Test Best & Worst Paths for All 3 Scenarios ---


def test_scenario_a_best_path(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # A1-b -> safe, catches RF1, RF3
    session, res1 = apply_decision(session, sc_a, "A1", "A1-b")
    assert session.status == "in_progress"
    assert session.currentNodeId == "A3"
    assert res1.riskLevel == "safe"

    # A3-b -> safe, catches RF2, RF4 -> reaches terminal A-SAFE
    session, _res2 = apply_decision(session, sc_a, "A3", "A3-b")
    assert session.status == "completed"
    assert session.currentNodeId == "A-SAFE"
    assert session.score == 100

    results = compute_results(session, sc_a)
    assert results.decisionScore == 100
    assert results.flagScore == 100
    assert results.score == 100
    assert results.scoreLabel == "Sharp eye"
    assert results.outcomeType == "safe"


def test_scenario_a_worst_path(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # A1-a -> critical, catches none -> terminal A-LOSS
    session, _res1 = apply_decision(session, sc_a, "A1", "A1-a")
    assert session.status == "completed"
    assert session.currentNodeId == "A-LOSS"
    assert session.score == 0

    results = compute_results(session, sc_a)
    assert results.decisionScore == 0
    assert results.flagScore == 0
    assert results.score == 0
    assert results.scoreLabel == "Needs practice"
    assert results.outcomeType == "loss"


def test_scenario_a_mixed_path_hand_computed(scenarios):
    """
    Mixed path hand-computed expectation from spec:
    A1-c -> A2-b -> A3-b:
      choices: A1-c (risky: 0), A2-b (cautious: 1), A3-b (safe: 2)
      sum = 0 + 1 + 2 = 3, n = 3 -> decisionScore = round(100 * 3 / 6) = 50
      present: A1 [RF1, RF2, RF3], A2 [RF1, RF2, RF4], A3 [RF2, RF4] -> union = {RF1, RF2, RF3, RF4} (4 flags)
      catches: A1-c [], A2-b [RF4], A3-b [RF2, RF4] -> union = {RF2, RF4} (2 flags)
      flagScore = round(100 * 2 / 4) = 50
      score = round(0.7 * 50 + 0.3 * 50) = 50
    """
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # A1-c
    session, _ = apply_decision(session, sc_a, "A1", "A1-c")
    assert session.currentNodeId == "A2"

    # A2-b
    session, _ = apply_decision(session, sc_a, "A2", "A2-b")
    assert session.currentNodeId == "A3"

    # A3-b
    session, _ = apply_decision(session, sc_a, "A3", "A3-b")
    assert session.status == "completed"

    results = compute_results(session, sc_a)
    assert results.decisionScore == 50
    assert results.flagScore == 50
    assert results.score == 50
    assert session.score == 50
    assert results.scoreLabel == "Getting there"
    assert results.outcomeType == "safe"
    assert set(results.identifiedRedFlags) == {"A-RF2", "A-RF4"}
    assert set(results.missedRedFlags) == {"A-RF1", "A-RF3"}


def test_scenario_b_best_and_worst_path(scenarios):
    sc_b = scenarios["refund-qr"]

    # Best path: B1-c -> B4-a -> B-SAFE
    session_best = start_session(sc_b, "client-test", "practice")
    session_best, _ = apply_decision(session_best, sc_b, "B1", "B1-c")
    session_best, _ = apply_decision(session_best, sc_b, "B4", "B4-a")
    assert session_best.status == "completed"
    assert session_best.score == 100

    # Worst path: B1-a -> B2-a -> B-LOSS
    session_worst = start_session(sc_b, "client-test", "practice")
    session_worst, _ = apply_decision(session_worst, sc_b, "B1", "B1-a")
    session_worst, _ = apply_decision(session_worst, sc_b, "B2", "B2-a")
    assert session_worst.status == "completed"
    assert session_worst.score == 0


def test_scenario_c_best_and_worst_path(scenarios):
    sc_c = scenarios["urgent-bank-call"]

    # Best path: C1-b -> C3-a -> C-REPORTED
    session_best = start_session(sc_c, "client-test", "practice")
    session_best, _ = apply_decision(session_best, sc_c, "C1", "C1-b")
    session_best, _ = apply_decision(session_best, sc_c, "C3", "C3-a")
    assert session_best.status == "completed"
    assert session_best.score == 100

    # Worst path: C1-a -> C2-a -> C-LOSS
    session_worst = start_session(sc_c, "client-test", "practice")
    session_worst, _ = apply_decision(session_worst, sc_c, "C1", "C1-a")
    session_worst, _ = apply_decision(session_worst, sc_c, "C2", "C2-a")
    assert session_worst.status == "completed"
    assert session_worst.score == 0


# --- Engine Invariant & Error Handling Tests ---


def test_invalid_node_transition(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # Current node is A1, attempting decision for A3
    with pytest.raises(InvalidTransitionError, match="does not match session currentNodeId"):
        apply_decision(session, sc_a, "A3", "A3-b")


def test_invalid_choice_for_node(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # Choice 'B1-a' belongs to Scenario B, not node A1
    with pytest.raises(ChoiceInvalidError, match="does not belong to node"):
        apply_decision(session, sc_a, "A1", "B1-a")


def test_idempotent_duplicate_submission(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    session_advanced, res1 = apply_decision(session, sc_a, "A1", "A1-b")

    # Resubmit identical (A1, A1-b)
    session_again, res2 = apply_decision(session_advanced, sc_a, "A1", "A1-b")

    # Returns identical result without mutating decisions list
    assert res1.choiceId == res2.choiceId
    assert res1.riskLevel == res2.riskLevel
    assert len(session_again.decisions) == 1
    assert session_again.currentNodeId == session_advanced.currentNodeId


def test_different_choice_conflict(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    session_advanced, _ = apply_decision(session, sc_a, "A1", "A1-b")

    # Submitting a different choice for already answered A1 raises InvalidTransitionError
    with pytest.raises(InvalidTransitionError, match="already answered with choice"):
        apply_decision(session_advanced, sc_a, "A1", "A1-a")


def test_replay_after_complete_error(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # Advance to completion
    session_completed, _ = apply_decision(session, sc_a, "A1", "A1-a")
    assert session_completed.status == "completed"

    # Attempting to make another move on completed session
    with pytest.raises(SessionCompletedError, match="already completed"):
        apply_decision(session_completed, sc_a, "A1-a", "some-choice")


def test_every_choice_reaches_terminal_in_all_scenarios(scenarios):
    """
    Exhaustively traverses all possible paths in each scenario
    to confirm every single branch ends in a terminal node.
    """
    def traverse(curr_session, sc, nodes_map):
        curr_node = nodes_map[curr_session.currentNodeId]
        if curr_node.terminal:
            assert curr_session.status == "completed"
            assert curr_session.score is not None
            return

        for ch in curr_node.choices:
            next_session, _ = apply_decision(
                curr_session, sc, curr_node.id, ch.id
            )
            traverse(next_session, sc, nodes_map)

    for scenario in scenarios.values():
        nodes_by_id = {n.id: n for n in scenario.decisionNodes}
        init_session = start_session(scenario, "test-client", "practice")
        traverse(init_session, scenario, nodes_by_id)


def test_skill_sums_and_updates_exactness(scenarios):
    sc_a = scenarios["payment-screenshot"]
    session = start_session(sc_a, "client-test", "practice")

    # A1-b safe (+10 pv, +5 urgency, +5 safe_ver)
    session, _ = apply_decision(session, sc_a, "A1", "A1-b")
    assert session.skillUpdates["payment_verification"] == 10
    assert session.skillUpdates["urgency"] == 5
    assert session.skillUpdates["safe_verification"] == 5

    # A3-c safe (+10 pv, +5 urgency, +5 safe_ver)
    session, _ = apply_decision(session, sc_a, "A3", "A3-c")
    assert session.skillUpdates["payment_verification"] == 20
    assert session.skillUpdates["urgency"] == 10
    assert session.skillUpdates["safe_verification"] == 10
