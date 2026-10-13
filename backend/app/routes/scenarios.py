
from fastapi import APIRouter, Query

from app.scenarios_loader import load_all

router = APIRouter()


@router.get("/scenarios")
def list_scenarios(category: str | None = Query(None)):
    all_scenarios = load_all()
    summaries = []

    for sc in all_scenarios.values():
        if category and category != "all" and sc.category != category:
            continue
        summaries.append(
            {
                "id": sc.id,
                "title": sc.title,
                "category": sc.category,
                "difficulty": sc.difficulty,
                "estimatedDuration": sc.estimatedDuration,
                "skills": sc.skills,
                "learningObjectives": sc.learningObjectives,
            }
        )

    return {"scenarios": summaries}
