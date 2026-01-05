from pydantic import BaseModel, Field, validator
from typing import List
import re

class DecisionBriefSchema(BaseModel):
    headline: str = Field(..., description="A 1-line institutional summary of the current state.")
    primary_observation: str = Field(..., description="The single most important alignment or misalignment.")
    dominant_risk: str = Field(..., description="The top quantified risk constraint.")
    monitoring_points: List[str] = Field(..., min_items=2, max_items=3, description="Transitions to watch.")
    confidence_note: str = Field(..., description="Non-predictive disclaimer.")

    @validator("headline", "primary_observation", "dominant_risk", "confidence_note")
    def reject_disallowed_language(cls, v):
        disallowed_patterns = [
            r"\bbuy\b", r"\bsell\b", r"\bpredict\b", r"\btarget\b", 
            r"\bupside\b", r"\bdownside\b", r"\brecommend\b"
        ]
        for pattern in disallowed_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(f"Language violation: '{pattern}' is not allowed in institutional briefings.")
        return v

    @validator("monitoring_points", each_item=True)
    def reject_disallowed_language_list(cls, v):
        return cls.reject_disallowed_language(v)

def validate_decision_brief(data: dict) -> dict:
    """Validate and clean the decision brief data."""
    try:
        validated = DecisionBriefSchema(**data)
        return validated.dict()
    except Exception as e:
        raise ValueError(f"Schema Validation Error: {str(e)}")
