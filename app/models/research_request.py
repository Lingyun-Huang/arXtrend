from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ResearchRequest(BaseModel):
    topic: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_papers: Optional[int] = 100

class KeywordTrend(BaseModel):
    keyword: str
    frequency: List[int]
    timestamps: List[str]

class PaperInfo(BaseModel):
    title: str
    abstract: str
    authors: List[str]
    published_date: datetime
    url: str
    keywords: List[str]

class ResearchResponse(BaseModel):
    topic: str
    total_papers: int
    keyword_trends: List[KeywordTrend]
    top_keywords: List[str]
    papers: List[PaperInfo]
    trend_summary: str
    time_period: str
    research_evolution: str 