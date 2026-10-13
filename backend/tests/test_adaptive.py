import pytest

from app.adaptive import (
    apply_session,
    initial_progress,
    recommend,
    scenario_weights,
)
from app.models import AreaToImprove, DecisionRecord, Results
from app.scenarios_loader import load_all


@pytest.fixture(scope="module")
def scenarios_map():
    return load_all()


@pytest.fixture(scope="module")
def all_scenarios_list(scenarios_map):
    return [
        scenarios_map["payment-screenshot"],
        scenarios_map["refund-qr"],
        scenarios_map["urgent-bank-call"],
    ]


def test_scenario_weights_from_spec(scenarios_map):
    sc_a = scenarios_map["payment-screenshot"]
    sc_b = scenarios_map["refund-qr"]
    sc_c = scenarios_map["urgent-bank-call"]

    w_a = scenario_weights(sc_a)
    w_b = scenario_weights(sc_b)
    w_c = scenario_weights(sc_c)

    # A: pv=1.0, urgency=0.5, safe_ver=0.5, imp=0.0, qr=0.0
    assert w_a["payment_verification"] == 1.0
    assert w_a["urgency"] == 0.5
    assert w_a["safe_verification"] == 0.5
    assert w_a["impersonation"] == 0.0
    assert w_a["qr_collect"] == 0.0

    # B: qr=1.0, urgency=0.5, safe_ver=0.5, pv=0.0
    assert w_b["qr_collect"] == 1.0
    assert w_b["urgency"] == 0.5
    assert w_b["payment_verification"] == 0.0

    # C: imp=1.0, urgency=0.5, safe_ver=0.5, pv=0.0
    assert w_c["impersonation"] == 1.0
    assert w_c["urgency"] == 0.5
    assert w_c["payment_verification"] == 0.0


def test_new_user_recommendation(all_scenarios_list):
    progress = initial_progress()
    assert progress.sessionCount == 0

    rec = recommend(progress, all_scenarios_list)
    assert rec is not None
    assert rec.scenarioId == "payment-screenshot"


def test_demo_case_poor_a_recommends_a(scenarios_map, all_scenarios_list):
    """
    Demo case 1: Poor run of A (score < 70, e.g. 0).
    payment_verification drops to 40 (weakest).
    Since score < 70, A is eligible for targeted replay -> recommends A.
    """
    progress = initial_progress()
    sc_a = scenarios_map["payment-screenshot"]

    poor_results = Results(
        sessionId="sess-poor-a",
        scenarioId="payment-screenshot",
        outcomeType="loss",
        score=0,
        scoreLabel="Needs practice",
        decisionScore=0,
        flagScore=0,
        decisions=[
            DecisionRecord(
                nodeId="A1",
                choiceId="A1-a",
                riskLevel="critical",
                scoreDelta=-1,
                at="2026-10-13T00:00:00Z",
            )
        ],
        identifiedRedFlags=[],
        missedRedFlags=["A-RF1", "A-RF2", "A-RF3"],
        skillUpdates={
            "urgency": -5,
            "impersonation": 0,
            "payment_verification": -10,
            "qr_collect": 0,
            "safe_verification": -5,
        },
        skillsDemonstrated=[],
        areasToImprove=[
            AreaToImprove(skill="payment_verification", missedFlags=["A-RF1"])
        ],
        learningSummary="Summary",
        recommendedSafeActions=[],
        recommendedNext=None,
    )

    updated_prog = apply_session(
        progress, poor_results, sc_a, all_scenarios=all_scenarios_list
    )

    # pv=40, urgency=45, safe_ver=45, imp=50, qr=50
    assert updated_prog.skillEstimates["payment_verification"] == 40
    assert updated_prog.recommendedNextScenario is not None
    assert updated_prog.recommendedNextScenario.scenarioId == "payment-screenshot"
    assert "Payment verification" in updated_prog.recommendedNextScenario.reason


def test_demo_case_good_a_recommends_c(scenarios_map, all_scenarios_list):
    """
    Demo case 2: Good run of A (score = 100).
    pv=70, urgency=60, safe_ver=60.
    Tie between imp (50) and qr (50) -> tie-breaker picks impersonation.
    w(impersonation): C is 1.0 -> recommends C.
    """
    progress = initial_progress()
    sc_a = scenarios_map["payment-screenshot"]

    good_results = Results(
        sessionId="sess-good-a",
        scenarioId="payment-screenshot",
        outcomeType="safe",
        score=100,
        scoreLabel="Sharp eye",
        decisionScore=100,
        flagScore=100,
        decisions=[],
        identifiedRedFlags=["A-RF1", "A-RF2", "A-RF3", "A-RF4"],
        missedRedFlags=[],
        skillUpdates={
            "urgency": 10,
            "impersonation": 0,
            "payment_verification": 20,
            "qr_collect": 0,
            "safe_verification": 10,
        },
        skillsDemonstrated=["payment_verification", "urgency", "safe_verification"],
        areasToImprove=[],
        learningSummary="Summary",
        recommendedSafeActions=[],
        recommendedNext=None,
    )

    updated_prog = apply_session(
        progress, good_results, sc_a, all_scenarios=all_scenarios_list
    )

    assert updated_prog.skillEstimates["payment_verification"] == 70
    assert updated_prog.skillEstimates["impersonation"] == 50
    assert updated_prog.skillEstimates["qr_collect"] == 50
    assert updated_prog.recommendedNextScenario is not None
    assert updated_prog.recommendedNextScenario.scenarioId == "urgent-bank-call"
    assert "Impersonation detection" in updated_prog.recommendedNextScenario.reason


def test_just_completed_exclusion_when_score_ge_70(scenarios_map, all_scenarios_list):
    progress = initial_progress()
    # Force pv to be lowest, but last score was 85
    progress.sessionCount = 1
    progress.skillEstimates["payment_verification"] = 30
    progress.skillEstimates["urgency"] = 80

    # With score >= 70, payment-screenshot is excluded even if it's the highest weight for pv
    rec = recommend(
        progress,
        all_scenarios_list,
        last_scenario_id="payment-screenshot",
        last_score=85,
    )
    # payment-screenshot is excluded, so another scenario is selected
    assert rec is not None
    assert rec.scenarioId != "payment-screenshot"


def test_idempotent_reapply(scenarios_map, all_scenarios_list):
    progress = initial_progress()
    sc_a = scenarios_map["payment-screenshot"]

    sample_results = Results(
        sessionId="sess-idemp-1",
        scenarioId="payment-screenshot",
        outcomeType="safe",
        score=90,
        scoreLabel="Sharp eye",
        decisionScore=90,
        flagScore=90,
        decisions=[],
        identifiedRedFlags=[],
        missedRedFlags=["A-RF1"],
        skillUpdates={
            "urgency": 10,
            "impersonation": 0,
            "payment_verification": 10,
            "qr_collect": 0,
            "safe_verification": 10,
        },
        skillsDemonstrated=["payment_verification"],
        areasToImprove=[],
        learningSummary="Summary",
        recommendedSafeActions=[],
        recommendedNext=None,
    )

    prog1 = apply_session(progress, sample_results, sc_a, all_scenarios=all_scenarios_list)
    assert prog1.sessionCount == 1
    assert prog1.completedScenarios["payment-screenshot"] == 1

    # Re-applying identical session ID returns unchanged
    prog2 = apply_session(prog1, sample_results, sc_a, all_scenarios=all_scenarios_list)
    assert prog2.sessionCount == 1
    assert prog2.completedScenarios["payment-screenshot"] == 1
    assert len(prog2.recentResults) == 1


def test_clamps_skill_estimates(scenarios_map, all_scenarios_list):
    progress = initial_progress()
    sc_a = scenarios_map["payment-screenshot"]

    # Massive delta
    extreme_results = Results(
        sessionId="sess-extreme",
        scenarioId="payment-screenshot",
        outcomeType="safe",
        score=100,
        scoreLabel="Sharp eye",
        decisionScore=100,
        flagScore=100,
        decisions=[],
        identifiedRedFlags=[],
        missedRedFlags=[],
        skillUpdates={
            "urgency": 150,
            "impersonation": -120,
            "payment_verification": 150,
            "qr_collect": -120,
            "safe_verification": 150,
        },
        skillsDemonstrated=[],
        areasToImprove=[],
        learningSummary="Summary",
        recommendedSafeActions=[],
        recommendedNext=None,
    )

    prog = apply_session(progress, extreme_results, sc_a, all_scenarios=all_scenarios_list)
    assert prog.skillEstimates["urgency"] == 100
    assert prog.skillEstimates["impersonation"] == 0
    assert prog.skillEstimates["payment_verification"] == 100
    assert prog.skillEstimates["qr_collect"] == 0
    assert prog.skillEstimates["safe_verification"] == 100


def test_recent_results_capped_at_five(scenarios_map, all_scenarios_list):
    prog = initial_progress()
    sc_a = scenarios_map["payment-screenshot"]

    for i in range(8):
        res = Results(
            sessionId=f"sess-cap-{i}",
            scenarioId="payment-screenshot",
            outcomeType="safe",
            score=70 + i,
            scoreLabel="Getting there",
            decisionScore=70,
            flagScore=70,
            decisions=[],
            identifiedRedFlags=[],
            missedRedFlags=[],
            skillUpdates={s: 0 for s in ["urgency", "impersonation", "payment_verification", "qr_collect", "safe_verification"]},
            skillsDemonstrated=[],
            areasToImprove=[],
            learningSummary="Summary",
            recommendedSafeActions=[],
            recommendedNext=None,
        )
        prog = apply_session(prog, res, sc_a, all_scenarios=all_scenarios_list)

    assert len(prog.recentResults) == 5
    assert prog.sessionCount == 8
    # Most recent is at index 0
    assert prog.recentResults[0].sessionId == "sess-cap-7"
