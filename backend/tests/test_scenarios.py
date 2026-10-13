import copy

import pytest

from app.models import Scenario
from app.scenarios_loader import (
    ScenarioValidationError,
    load_all,
    validate_scenario,
)


@pytest.fixture
def valid_scenario_dict():
    # Base minimal valid scenario fixture
    return {
        "id": "valid-test-scenario",
        "title": "Valid Test Scenario",
        "category": "fake_confirmation",
        "difficulty": "easy",
        "estimatedDuration": 3,
        "learningObjectives": [
          "Learn safe payments",
          "Verify balances directly",
          "Resist rush pressure",
        ],
        "startingContext": "A student wants to purchase your book.",
        "skills": ["payment_verification", "urgency", "safe_verification"],
        "redFlags": [
            {
                "id": "T-RF1",
                "label": "Screenshot presented as receipt",
                "explanation": "Screenshots can be forged.",
            },
            {
                "id": "T-RF2",
                "label": "Urgent timeline pressure",
                "explanation": "Pressure to act hastily.",
            },
        ],
        "startNodeId": "N1",
        "decisionNodes": [
            {
                "id": "N1",
                "terminal": False,
                "messageOrEvent": {
                    "eventType": "chat",
                    "speaker": "Aarav (fictional)",
                    "text": "Please give me the book quickly.",
                    "details": {"amount": "₹500"},
                },
                "relevantSkills": [
                    "payment_verification",
                    "urgency",
                    "safe_verification",
                ],
                "redFlagsPresent": ["T-RF1", "T-RF2"],
                "feedback": {
                    "safeAlternative": "Check your bank directly.",
                    "considerNext": "Never rush transfers.",
                },
                "choices": [
                    {
                        "id": "N1-a",
                        "label": "Give book now",
                        "riskLevel": "critical",
                        "scoreDelta": -1,
                        "skillUpdates": {
                            "payment_verification": -10,
                            "urgency": -5,
                            "safe_verification": -5,
                        },
                        "nextNodeId": "N-LOSS",
                        "catches": [],
                        "explanation": {
                            "whatHappened": "You handed over the book without checking.",
                            "why": "Unverified handovers cause loss.",
                        },
                    },
                    {
                        "id": "N1-b",
                        "label": "Check account first",
                        "riskLevel": "safe",
                        "scoreDelta": 2,
                        "skillUpdates": {
                            "payment_verification": 10,
                            "urgency": 5,
                            "safe_verification": 5,
                        },
                        "nextNodeId": "N-SAFE",
                        "catches": ["T-RF1", "T-RF2"],
                        "explanation": {
                            "whatHappened": "You verified your account.",
                            "why": "Independent verification is safe.",
                        },
                    },
                ],
            },
            {
                "id": "N-LOSS",
                "terminal": True,
                "messageOrEvent": {"eventType": "outcome", "text": "Book lost."},
                "outcome": {
                    "type": "loss",
                    "title": "Item Lost",
                    "text": "In this simulation, you lost the item.",
                },
                "choices": [],
            },
            {
                "id": "N-SAFE",
                "terminal": True,
                "messageOrEvent": {
                    "eventType": "outcome",
                    "text": "Item Protected.",
                },
                "outcome": {
                    "type": "safe",
                    "title": "Item Protected",
                    "text": "You safely verified funds.",
                },
                "choices": [],
            },
        ],
        "recommendedSafeActions": [
            "Check bank app balance",
            "Do not rush decisions",
            "Politely decline unverified transfers",
        ],
        "learningSummary": "Always verify directly before handing over items.",
    }


def test_real_scenarios_load_and_validate():
    scenarios = load_all()
    assert len(scenarios) == 3
    assert "payment-screenshot" in scenarios
    assert "refund-qr" in scenarios
    assert "urgent-bank-call" in scenarios

    for sc_id, sc in scenarios.items():
        assert sc.id == sc_id
        # Confirm startNodeId is present
        node_ids = {n.id for n in sc.decisionNodes}
        assert sc.startNodeId in node_ids

        # Confirm terminals
        terminals = [n for n in sc.decisionNodes if n.terminal]
        loss_terminals = [t for t in terminals if t.outcome.type == "loss"]
        safe_terminals = [t for t in terminals if t.outcome.type == "safe"]
        assert len(loss_terminals) >= 1
        assert len(safe_terminals) >= 1

        # Check all non-terminal nodes have distinct choices branching
        for n in sc.decisionNodes:
            if not n.terminal:
                assert 2 <= len(n.choices) <= 4
                next_ids = {c.nextNodeId for c in n.choices}
                assert len(next_ids) > 1, f"Node {n.id} in {sc.id} has non-branching choices"

                # Check flag subsets
                for c in n.choices:
                    for rf in c.catches:
                        assert rf in n.redFlagsPresent


def test_validation_rule_passing_fixture(valid_scenario_dict):
    sc = Scenario.model_validate(valid_scenario_dict)
    validate_scenario(sc)


def test_validation_rule_duplicate_node_id(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["decisionNodes"].append(copy.deepcopy(bad["decisionNodes"][0]))
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="Duplicate node id"):
        validate_scenario(sc)


def test_validation_rule_missing_start_node(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["startNodeId"] = "NON_EXISTENT_START"
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="startNodeId .* not found"):
        validate_scenario(sc)


def test_validation_rule_unknown_next_node_id(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["decisionNodes"][0]["choices"][0]["nextNodeId"] = "GHOST_NODE"
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="points to non-existent node"):
        validate_scenario(sc)


def test_validation_rule_cycle_detection(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Make N1 point to a new node N2, and N2 point back to N1
    n2 = copy.deepcopy(bad["decisionNodes"][0])
    n2["id"] = "N2"
    n2["choices"][0]["nextNodeId"] = "N1"
    n2["choices"][1]["nextNodeId"] = "N-SAFE"
    bad["decisionNodes"].append(n2)
    bad["decisionNodes"][0]["choices"][0]["nextNodeId"] = "N2"

    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="Cycle detected"):
        validate_scenario(sc)


def test_validation_rule_missing_loss_or_safe_terminal(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Remove loss terminal and replace with another safe terminal
    bad["decisionNodes"] = [n for n in bad["decisionNodes"] if n["id"] != "N-LOSS"]
    safe2 = copy.deepcopy(bad["decisionNodes"][1])
    safe2["id"] = "N-SAFE-2"
    bad["decisionNodes"].append(safe2)
    bad["decisionNodes"][0]["choices"][0]["nextNodeId"] = "N-SAFE-2"

    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="must have ≥1 loss and ≥1 safe terminal outcome"):
        validate_scenario(sc)


def test_validation_rule_choices_count(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Non-terminal node with only 1 choice
    bad["decisionNodes"][0]["choices"] = [bad["decisionNodes"][0]["choices"][0]]
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="must have 2–4 choices"):
        validate_scenario(sc)


def test_validation_rule_terminal_with_choices(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Terminal node with choices
    bad["decisionNodes"][1]["choices"] = [bad["decisionNodes"][0]["choices"][0]]
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="must have 0 choices"):
        validate_scenario(sc)


def test_validation_rule_flags_subset(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Choice catches a flag not present in node
    bad["decisionNodes"][0]["choices"][0]["catches"] = ["T-RF999_UNSEEN"]
    bad["redFlags"].append({
        "id": "T-RF999_UNSEEN",
        "label": "Unseen flag",
        "explanation": "Flag not in node",
    })
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="which is not in node .* redFlagsPresent"):
        validate_scenario(sc)


def test_validation_rule_identical_branching(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # All choices pointing to the same next node
    bad["decisionNodes"][0]["choices"][0]["nextNodeId"] = "N-SAFE"
    bad["decisionNodes"][0]["choices"][1]["nextNodeId"] = "N-SAFE"
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="choices all share the same nextNodeId"):
        validate_scenario(sc)


def test_validation_rule_score_delta_mismatch(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Safe choice with wrong scoreDelta
    bad["decisionNodes"][0]["choices"][1]["scoreDelta"] = 99
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="scoreDelta=99, expected 2"):
        validate_scenario(sc)


def test_validation_rule_skill_delta_mismatch(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    # Safe choice primary skill should be 10, set to 50
    bad["decisionNodes"][0]["choices"][1]["skillUpdates"]["payment_verification"] = 50
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="primary skill .* expected 10"):
        validate_scenario(sc)


def test_validation_rule_content_lint_url(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["startingContext"] = "Visit https://malicious-link.com to see the book."
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="contains URL/http link"):
        validate_scenario(sc)


def test_validation_rule_content_lint_6_digit_run(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["startingContext"] = "Transfer secret passcode 982145 to proceed."
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="contains 6\\+ digit sequence"):
        validate_scenario(sc)


def test_validation_rule_content_lint_brand(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["startingContext"] = "The buyer said he sent money via GPay app."
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="contains forbidden brand 'GPay'"):
        validate_scenario(sc)


def test_validation_rule_missing_simulation_banner(valid_scenario_dict):
    bad = copy.deepcopy(valid_scenario_dict)
    bad["decisionNodes"][0]["messageOrEvent"]["eventType"] = "payment_screenshot"
    bad["decisionNodes"][0]["messageOrEvent"]["details"] = {}  # missing banner
    sc = Scenario.model_validate(bad)
    with pytest.raises(ScenarioValidationError, match="must include 'SIMULATION — NOT A REAL TRANSACTION.' in details.banner"):
        validate_scenario(sc)
