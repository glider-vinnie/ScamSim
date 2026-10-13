from typing import Literal

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict

from app.adaptive import apply_session, initial_progress
from app.engine import apply_decision, public_node, start_session
from app.errors import AppError
from app.routes.common import get_client_id
from app.scenarios_loader import load_all
from app.scoring import compute_results
from app.store import get_store

router = APIRouter()


class StartSessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scenarioId: str
    mode: Literal["quick", "practice", "challenge"]


class SubmitDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nodeId: str
    choiceId: str


def _get_scenario_or_404(scenario_id: str):
    scenarios = load_all()
    scenario = scenarios.get(scenario_id)
    if not scenario:
        raise AppError(404, "SCENARIO_NOT_FOUND", f"Scenario '{scenario_id}' not found")
    return scenario


def _get_owned_session_or_404(session_id: str, client_id: str):
    store = get_store()
    entry = store.get_session(session_id)
    if not entry:
        raise AppError(404, "SESSION_NOT_FOUND", f"Session '{session_id}' not found")
    session, owner_id = entry
    if owner_id != client_id:
        # Ownership check: wrong owner -> SESSION_NOT_FOUND 404
        raise AppError(404, "SESSION_NOT_FOUND", f"Session '{session_id}' not found")
    return session


# 3. POST /api/sessions -> 201 {session, node: PublicNode}
@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    body: StartSessionRequest,
    client_id: str = Depends(get_client_id),
):
    scenario = _get_scenario_or_404(body.scenarioId)
    session = start_session(scenario, client_id, body.mode)
    node = public_node(scenario, session.currentNodeId, step=1)

    store = get_store()
    store.put_session(session, client_id)

    return {"session": session, "node": node}


# 4. POST /api/sessions/{id}/decisions
@router.post("/sessions/{id}/decisions")
def post_decision(
    id: str,
    body: SubmitDecisionRequest,
    client_id: str = Depends(get_client_id),
):
    session = _get_owned_session_or_404(id, client_id)
    scenario = _get_scenario_or_404(session.scenarioId)
    all_scenarios = list(load_all().values())
    store = get_store()

    # Apply decision via engine
    updated_session, decision_result = apply_decision(
        session, scenario, body.nodeId, body.choiceId
    )

    if updated_session.status == "completed":
        # Finalize and compute results
        results = compute_results(updated_session, scenario)

        # Retrieve user progress to attach adaptive recommendation
        user_prog = store.get_progress(client_id) or initial_progress()
        user_prog = apply_session(
            user_prog, results, scenario, all_scenarios=all_scenarios
        )
        results.recommendedNext = user_prog.recommendedNextScenario

        # Persist session, results, and progress
        store.put_session(updated_session, client_id, results=results)
        store.put_progress(client_id, user_prog)

        terminal_node = public_node(
            scenario,
            updated_session.currentNodeId,
            step=len(updated_session.decisions) + 1,
        )

        return {
            "decision": decision_result,
            "nextNode": terminal_node,
            "status": "completed",
            "results": results,
        }
    else:
        # Non-terminal transition
        store.put_session(updated_session, client_id)
        next_public = public_node(
            scenario,
            updated_session.currentNodeId,
            step=len(updated_session.decisions) + 1,
        )

        return {
            "decision": decision_result,
            "nextNode": next_public,
            "status": "in_progress",
        }


# 5. POST /api/sessions/{id}/complete
@router.post("/sessions/{id}/complete")
def finalize_session(
    id: str,
    client_id: str = Depends(get_client_id),
):
    session = _get_owned_session_or_404(id, client_id)
    scenario = _get_scenario_or_404(session.scenarioId)
    store = get_store()
    nodes_by_id = {n.id: n for n in scenario.decisionNodes}
    current_node = nodes_by_id.get(session.currentNodeId or "")

    if (not current_node or not current_node.terminal) and session.status != "completed":
        raise AppError(
            409,
            "INVALID_TRANSITION",
            f"Session '{id}' is not at a terminal node and cannot be completed.",
        )

    # Idempotent: return stored results if already finalized
    existing_results = store.get_results(id)
    if existing_results:
        return existing_results

    # Finalize
    all_scenarios = list(load_all().values())
    if session.status != "completed":
        session.status = "completed"

    results = compute_results(session, scenario)
    user_prog = store.get_progress(client_id) or initial_progress()
    user_prog = apply_session(user_prog, results, scenario, all_scenarios=all_scenarios)
    results.recommendedNext = user_prog.recommendedNextScenario

    store.put_session(session, client_id, results=results)
    store.put_progress(client_id, user_prog)

    return results


# 6. GET /api/sessions/{id}
@router.get("/sessions/{id}")
def get_session_status(
    id: str,
    client_id: str = Depends(get_client_id),
):
    session = _get_owned_session_or_404(id, client_id)
    scenario = _get_scenario_or_404(session.scenarioId)

    if session.currentNodeId:
        node = public_node(
            scenario,
            session.currentNodeId,
            step=len(session.decisions) + 1,
        )
    else:
        node = None

    return {"session": session, "node": node}


# 7. GET /api/sessions/{id}/results
@router.get("/sessions/{id}/results")
def get_session_results(
    id: str,
    client_id: str = Depends(get_client_id),
):
    session = _get_owned_session_or_404(id, client_id)
    if session.status != "completed":
        raise AppError(
            409,
            "INVALID_TRANSITION",
            f"Session '{id}' is still in progress. Complete all steps to view results.",
        )

    store = get_store()
    results = store.get_results(id)
    if not results:
        scenario = _get_scenario_or_404(session.scenarioId)
        results = compute_results(session, scenario)
        user_prog = store.get_progress(client_id) or initial_progress()
        results.recommendedNext = user_prog.recommendedNextScenario
        store.put_results(id, results)

    return results
