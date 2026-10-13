from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

from app.ai import check_ai_rate_limit, generate_gemini_variation
from app.errors import AppError
from app.routes.common import get_client_id
from app.scenarios_loader import load_all

router = APIRouter()


class VariationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scenarioId: str
    nodeId: str


# 10. POST /api/ai/variation
@router.post("/ai/variation")
def get_variation(
    body: VariationRequest,
    client_id: str = Depends(get_client_id),
):
    # Stricter rate limit: 10/min/client
    check_ai_rate_limit(client_id)

    scenarios = load_all()
    scenario = scenarios.get(body.scenarioId)
    if not scenario:
        raise AppError(404, "SCENARIO_NOT_FOUND", f"Scenario '{body.scenarioId}' not found")

    node = next((n for n in scenario.decisionNodes if n.id == body.nodeId), None)
    if not node:
        raise AppError(422, "VALIDATION_ERROR", f"Node '{body.nodeId}' not found in scenario")

    original_message = node.messageOrEvent.text
    original_explanation = (
        node.choices[0].explanation.whatHappened if node.choices else ""
    )

    source, message_var, explanation_var = generate_gemini_variation(
        scenario_id=body.scenarioId,
        node_id=body.nodeId,
        original_message=original_message,
        original_explanation=original_explanation,
    )

    return {
        "source": source,
        "messageVariant": message_var,
        "explanationVariant": explanation_var,
    }
