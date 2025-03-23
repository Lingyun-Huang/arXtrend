from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.agents.research_agent import ResearchAgent
from app.models.research_request import ResearchRequest, ResearchResponse

app = FastAPI(title="arXtrend API", description="AI Research Trend Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to arXtrend API"}

@app.post("/analyze", response_model=ResearchResponse)
async def analyze_research(request: ResearchRequest):
    try:
        agent = ResearchAgent()
        result = await agent.analyze_topic(
            topic=request.topic,
            start_date=request.start_date,
            end_date=request.end_date,
            max_papers=request.max_papers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 