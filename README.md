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
2. Install NVIDIA Container Toolkit (for GPU support):
   ```bash
   # For Windows, install NVIDIA Container Toolkit from:
   # https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker
   ```

3. Build and run the application:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Ollama API: http://localhost:11434

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
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── frontend/               # React frontend
├── Dockerfile.backend      # Backend Dockerfile
├── Dockerfile.frontend     # Frontend Dockerfile
├── docker-compose.yml      # Docker Compose configuration
└── requirements.txt        # Python dependencies
```

## Technologies Used

- Backend: FastAPI, LangGraph, arXiv API
- Frontend: React, Plotly.js
- NLP: KeyBERT for keyword extraction
- Data Analysis: Pandas, NumPy
- LLM: Ollama (local LLM)
- Containerization: Docker, Docker Compose 