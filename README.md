# arXtrend - AI Research Trend Analysis Agent

arXtrend is an intelligent agent that analyzes research trends from arXiv papers. It provides insights into the evolution of research fields through keyword analysis and temporal trend tracking.

## Features

- Extract keywords from arXiv papers (titles, abstracts, and keywords)
- Track research trends over time
- Visualize field evolution through interactive dashboards
- Generate textual analysis of research trends

## Setup

### Option 1: Running with Docker (Recommended)

1. Install Docker and Docker Compose

2. Host model with Ollama

   ```bash
   ollama run mistral:7b
   ```

3. Build and run the application:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Ollama API: http://localhost:11434

5. Test Backend api

   ```
   curl -X POST \
   http://localhost:8000/analyze \
   -H 'Content-Type: application/json' \
   -d '{
      "topic": "large language models",
      "max_papers": 50,
      "start_date": "2023-01-01T00:00:00Z",
      "end_date": "2024-03-01T00:00:00Z"
   }'
   ```

### Option 2: Manual Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the backend:
```bash
python -m uvicorn app.main:app --reload
```

3. Open the frontend in your browser:
```bash
# Navigate to frontend directory
cd frontend
npm install
npm run dev
```

## Project Structure

```
arXtrend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── agents/              # LangGraph agents
│   └── models/              # FastAPI Data models
├── frontend/               # React frontend
├── Dockerfile.backend      # Backend Dockerfile
├── Dockerfile.frontend     # Frontend Dockerfile
└── docker-compose.yml      # Docker Compose configuration
```

## Technologies Used

- Backend: FastAPI, LangGraph, arXiv API
- Frontend: React, Plotly.js
- NLP: KeyBERT for keyword extraction
- Data Analysis: Pandas, NumPy
- LLM: Ollama (local LLM)
- Containerization: Docker, Docker Compose 