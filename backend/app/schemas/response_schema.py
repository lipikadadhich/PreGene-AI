from pydantic import BaseModel
from typing import Dict, List


class AnalysisResponse(BaseModel):
    recommendation: str
    risk_score: int
    risk_level: str
    inheritance: Dict[str, int]
    counselling: List[str]
