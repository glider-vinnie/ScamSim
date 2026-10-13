import json
import re
from pathlib import Path

from app.models import DecisionNode, Scenario

BRAND_BLOCKLIST = [
    "SBI",
    "HDFC",
    "ICICI",
    "Axis",
    "Paytm",
    "PhonePe",
    "GPay",
    "Google Pay",
    "BHIM",
    "NPCI",
    "RBI",
    "Amazon",
    "Flipkart",
]

EXPECTED_SCORE_DELTA = {
    "safe": 2,
    "cautious": 1,
    "risky": 0,
    "critical": -1,
}

EXPECTED_PRIMARY_DELTA = {
    "safe": 10,
    "cautious": 4,
    "risky": -4,
    "critical": -10,
}


class ScenarioValidationError(ValueError):
    """Raised when a scenario fails validation against spec §12.5."""


def _check_content_lint(text: str, context: str) -> None:
    if "http://" in text or "https://" in text:
        raise ScenarioValidationError(f"Content lint failure in {context}: contains URL/http link")

    if re.search(r"\d{6,}", text):
        raise ScenarioValidationError(f"Content lint failure in {context}: contains 6+ digit sequence")

    for brand in BRAND_BLOCKLIST:
        pattern = r"\b" + re.escape(brand) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            raise ScenarioValidationError(f"Content lint failure in {context}: contains forbidden brand '{brand}'")


def _lint_scenario_content(scenario: Scenario) -> None:
    _check_content_lint(scenario.title, "scenario.title")
    _check_content_lint(scenario.startingContext, "scenario.startingContext")
    _check_content_lint(scenario.learningSummary, "scenario.learningSummary")

    for obj in scenario.learningObjectives:
        _check_content_lint(obj, "scenario.learningObjectives")

    for act in scenario.recommendedSafeActions:
        _check_content_lint(act, "scenario.recommendedSafeActions")

    for rf in scenario.redFlags:
        _check_content_lint(rf.label, f"redFlag[{rf.id}].label")
        _check_content_lint(rf.explanation, f"redFlag[{rf.id}].explanation")

    for node in scenario.decisionNodes:
        _check_content_lint(node.messageOrEvent.text, f"node[{node.id}].text")
        for k, v in node.messageOrEvent.details.items():
            _check_content_lint(v, f"node[{node.id}].details[{k}]")

        if node.outcome:
            _check_content_lint(node.outcome.title, f"node[{node.id}].outcome.title")
            _check_content_lint(node.outcome.text, f"node[{node.id}].outcome.text")

        for choice in node.choices:
            _check_content_lint(choice.label, f"choice[{choice.id}].label")
            _check_content_lint(choice.explanation.whatHappened, f"choice[{choice.id}].whatHappened")
            _check_content_lint(choice.explanation.why, f"choice[{choice.id}].why")


def _check_acyclic_and_reachability(nodes_by_id: dict[str, DecisionNode], start_id: str) -> None:
    # 1. Detect cycles using DFS
    visited: set[str] = set()
    rec_stack: set[str] = set()

    def dfs(curr_id: str) -> None:
        visited.add(curr_id)
        rec_stack.add(curr_id)
        curr = nodes_by_id.get(curr_id)
        if curr and not curr.terminal:
            for ch in curr.choices:
                if ch.nextNodeId not in visited:
                    dfs(ch.nextNodeId)
                elif ch.nextNodeId in rec_stack:
                    raise ScenarioValidationError(f"Cycle detected involving node '{ch.nextNodeId}'")
        rec_stack.remove(curr_id)

    dfs(start_id)

    # 2. Check every reachable node reaches at least one terminal
    memo_can_reach_terminal: dict[str, bool] = {}

    def can_reach_terminal(n_id: str, path: set[str]) -> bool:
        if n_id in memo_can_reach_terminal:
            return memo_can_reach_terminal[n_id]
        node = nodes_by_id.get(n_id)
        if not node:
            return False
        if node.terminal:
            memo_can_reach_terminal[n_id] = True
            return True

        path.add(n_id)
        for choice in node.choices:
            if choice.nextNodeId not in path and can_reach_terminal(choice.nextNodeId, path):
                memo_can_reach_terminal[n_id] = True
                return True
        path.remove(n_id)
        memo_can_reach_terminal[n_id] = False
        return False

    for node_id in visited:
        if not can_reach_terminal(node_id, set()):
            raise ScenarioValidationError(f"Node '{node_id}' cannot reach any terminal node")


def validate_scenario(scenario: Scenario) -> None:
    scenario_rf_ids = {rf.id for rf in scenario.redFlags}

    # Check unique node ids
    node_ids = set()
    nodes_by_id: dict[str, DecisionNode] = {}
    for node in scenario.decisionNodes:
        if node.id in node_ids:
            raise ScenarioValidationError(f"Duplicate node id '{node.id}' in scenario '{scenario.id}'")
        node_ids.add(node.id)
        nodes_by_id[node.id] = node

    # Check startNodeId exists
    if scenario.startNodeId not in nodes_by_id:
        raise ScenarioValidationError(f"startNodeId '{scenario.startNodeId}' not found in decisionNodes")

    # Terminal reachability counts
    terminal_nodes = [n for n in scenario.decisionNodes if n.terminal]
    loss_terminals = [n for n in terminal_nodes if n.outcome and n.outcome.type == "loss"]
    safe_terminals = [n for n in terminal_nodes if n.outcome and n.outcome.type == "safe"]

    if not loss_terminals or not safe_terminals:
        raise ScenarioValidationError(f"Scenario '{scenario.id}' must have ≥1 loss and ≥1 safe terminal outcome")

    for node in scenario.decisionNodes:
        # Terminal checks
        if node.terminal:
            if not node.outcome:
                raise ScenarioValidationError(f"Terminal node '{node.id}' must have an outcome")
            if len(node.choices) != 0:
                raise ScenarioValidationError(f"Terminal node '{node.id}' must have 0 choices")
        else:
            # Non-terminal checks
            if node.outcome:
                raise ScenarioValidationError(f"Non-terminal node '{node.id}' cannot have an outcome")
            if not (2 <= len(node.choices) <= 4):
                raise ScenarioValidationError(f"Non-terminal node '{node.id}' must have 2–4 choices (has {len(node.choices)})")

            # Check redFlagsPresent ⊆ redFlags
            for rf_id in node.redFlagsPresent:
                if rf_id not in scenario_rf_ids:
                    raise ScenarioValidationError(f"Node '{node.id}' redFlagsPresent contains unknown flag '{rf_id}'")

            # Check nextNodeIds exist and choices do not all share one nextNodeId
            next_node_ids = set()
            for ch in node.choices:
                if ch.nextNodeId not in nodes_by_id:
                    raise ScenarioValidationError(f"Choice '{ch.id}' points to non-existent node '{ch.nextNodeId}'")
                next_node_ids.add(ch.nextNodeId)

                # Check catches ⊆ redFlagsPresent
                for caught_rf in ch.catches:
                    if caught_rf not in node.redFlagsPresent:
                        raise ScenarioValidationError(
                            f"Choice '{ch.id}' catches '{caught_rf}' which is not in node '{node.id}' redFlagsPresent"
                        )

                # Validate scoreDelta per §12.2
                expected_delta = EXPECTED_SCORE_DELTA[ch.riskLevel]
                if ch.scoreDelta != expected_delta:
                    raise ScenarioValidationError(
                        f"Choice '{ch.id}' has scoreDelta={ch.scoreDelta}, expected {expected_delta} for riskLevel='{ch.riskLevel}'"
                    )

                # Validate skillUpdates per §12.2
                if node.relevantSkills:
                    primary_skill = node.relevantSkills[0]
                    secondary_skills = node.relevantSkills[1:]

                    expected_primary = EXPECTED_PRIMARY_DELTA[ch.riskLevel]
                    expected_secondary = int(expected_primary / 2)

                    if ch.skillUpdates.get(primary_skill) != expected_primary:
                        raise ScenarioValidationError(
                            f"Choice '{ch.id}' primary skill '{primary_skill}' update is {ch.skillUpdates.get(primary_skill)}, expected {expected_primary}"
                        )

                    for sec_skill in secondary_skills:
                        if ch.skillUpdates.get(sec_skill) != expected_secondary:
                            raise ScenarioValidationError(
                                f"Choice '{ch.id}' secondary skill '{sec_skill}' update is {ch.skillUpdates.get(sec_skill)}, expected {expected_secondary}"
                            )

            if len(next_node_ids) == 1 and len(node.choices) > 1:
                raise ScenarioValidationError(f"Node '{node.id}' choices all share the same nextNodeId '{next_node_ids.pop()}'")

        # Confirmation/screenshot node banner check
        if node.messageOrEvent.eventType == "payment_screenshot" or "screenshot" in node.messageOrEvent.text.lower():
            banner = node.messageOrEvent.details.get("banner", "")
            if "SIMULATION — NOT A REAL TRANSACTION." not in banner:
                raise ScenarioValidationError(
                    f"Screenshot/confirmation node '{node.id}' must include 'SIMULATION — NOT A REAL TRANSACTION.' in details.banner"
                )

    # Check graph is acyclic and every reachable node reaches a terminal
    _check_acyclic_and_reachability(nodes_by_id, scenario.startNodeId)

    # Content lint
    _lint_scenario_content(scenario)


class ScenariosLoader:
    def __init__(self, scenarios_dir: str | None = None):
        if scenarios_dir:
            self.scenarios_dir = Path(scenarios_dir)
        else:
            self.scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
        self._scenarios: dict[str, Scenario] = {}
        self.load_all()

    def load_all(self) -> dict[str, Scenario]:
        loaded: dict[str, Scenario] = {}
        if not self.scenarios_dir.exists():
            raise ScenarioValidationError(f"Scenarios directory does not exist: {self.scenarios_dir}")

        json_files = list(self.scenarios_dir.glob("*.json"))
        if not json_files:
            raise ScenarioValidationError(f"No scenario JSON files found in {self.scenarios_dir}")

        for path in json_files:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            scenario = Scenario.model_validate(data)
            validate_scenario(scenario)
            if scenario.id in loaded:
                raise ScenarioValidationError(f"Duplicate scenario id across files: '{scenario.id}'")
            loaded[scenario.id] = scenario

        self._scenarios = loaded
        return self._scenarios

    def get(self, scenario_id: str) -> Scenario:
        if scenario_id not in self._scenarios:
            raise KeyError(f"Scenario with id '{scenario_id}' not found")
        return self._scenarios[scenario_id]

    def list_all(self) -> list[Scenario]:
        return list(self._scenarios.values())


# Module-level singleton that fails fast on startup
loader = ScenariosLoader()


def load_all() -> dict[str, Scenario]:
    return loader.load_all()


def get(scenario_id: str) -> Scenario:
    return loader.get(scenario_id)
