import os
import requests
from typing import Dict
from datetime import datetime
import arxiv
from keybert import KeyBERT
import pandas as pd
from collections import Counter
from langgraph.graph import StateGraph


class ResearchAgent:
    def __init__(self):
        self.keyword_extractor = KeyBERT()
        self.ollama_host = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        self.workflow = self._create_workflow()

    def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API with the given prompt."""
        response = requests.post(
            f"{self.ollama_host}/api/generate",
            json={
                "model": "mistral:7b",
                "prompt": prompt,
                "stream": False
            }
        )
        response.raise_for_status()
        return response.json()["response"]

    def _create_workflow(self) -> StateGraph:
        # Define the workflow graph
        workflow = StateGraph(Dict)

        # Add nodes for each step of the analysis
        workflow.add_node("fetch_papers", self._fetch_papers)
        workflow.add_node("extract_keywords", self._extract_keywords)
        workflow.add_node("analyze_trends", self._analyze_trends)
        workflow.add_node("generate_summary", self._generate_summary)

        # Define the edges of the workflow
        workflow.add_edge("fetch_papers", "extract_keywords")
        workflow.add_edge("extract_keywords", "analyze_trends")
        workflow.add_edge("analyze_trends", "generate_summary")

        # Set the entry and exit points
        workflow.set_entry_point("fetch_papers")
        workflow.set_finish_point("generate_summary")

        return workflow.compile()

    async def _fetch_papers(self, state: Dict) -> Dict:
        topic = state["topic"]
        max_papers = state.get("max_papers", 100)
        
        search = arxiv.Search(
            query=topic,
            max_results=max_papers,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )

        papers = []
        for result in search.results():
            paper = {
                "title": result.title,
                "abstract": result.summary,
                "authors": [author.name for author in result.authors],
                "published_date": result.published,
                "url": result.entry_id,
            }
            papers.append(paper)

        state["papers"] = papers
        return state

    async def _extract_keywords(self, state: Dict) -> Dict:
        papers = state["papers"]
        all_keywords = []

        for paper in papers:
            # Extract keywords from title and abstract
            text = f"{paper['title']} {paper['abstract']}"
            keywords = self.keyword_extractor.extract_keywords(text, 
                                                            keyphrase_ngram_range=(1, 2),
                                                            stop_words='english',
                                                            top_n=5)
            paper["keywords"] = [k[0] for k in keywords]
            all_keywords.extend(paper["keywords"])

        # Get top keywords
        keyword_freq = Counter(all_keywords)
        state["top_keywords"] = [k for k, _ in keyword_freq.most_common(10)]
        return state

    async def _analyze_trends(self, state: Dict) -> Dict:
        papers = state["papers"]
        top_keywords = state["top_keywords"]

        # Create a DataFrame for temporal analysis
        df = pd.DataFrame(papers)
        df["published_date"] = pd.to_datetime(df["published_date"])
        df = df.sort_values("published_date")

        # Calculate trends for each keyword
        trends = []
        for keyword in top_keywords:
            freq = []
            timestamps = []
            
            # Group by month and count keyword occurrences
            monthly_counts = df.set_index("published_date").resample("M").apply(
                lambda x: sum(keyword in k for paper in x["keywords"] for k in paper)
            )
            
            trends.append({
                "keyword": keyword,
                "frequency": monthly_counts.values.tolist(),
                "timestamps": monthly_counts.index.strftime("%Y-%m").tolist()
            })

        state["keyword_trends"] = trends
        return state

    async def _generate_summary(self, state: Dict) -> Dict:
        # Use Ollama to generate a natural language summary of the trends
        trends_text = "\n".join([
            f"- {trend['keyword']}: Started at {trend['frequency'][0]} mentions and ended at {trend['frequency'][-1]} mentions"
            for trend in state["keyword_trends"]
        ])

        prompt = f"""Analyze these research trends and provide a concise summary:
        Topic: {state['topic']}
        Time period: {state['keyword_trends'][0]['timestamps'][0]} to {state['keyword_trends'][0]['timestamps'][-1]}
        Trends:
        {trends_text}

        Provide a concise summary of the research trends, focusing on:
        1. Overall direction of the field
        2. Most significant changes in keyword frequency
        3. Emerging or declining topics
        """

        summary = self._call_ollama(prompt)
        state["trend_summary"] = summary
        state["time_period"] = f"{state['keyword_trends'][0]['timestamps'][0]} to {state['keyword_trends'][0]['timestamps'][-1]}"
        
        return state

    async def analyze_topic(self, topic: str, start_date: datetime = None, 
                          end_date: datetime = None, max_papers: int = 100) -> Dict:
        initial_state = {
            "topic": topic,
            "start_date": start_date,
            "end_date": end_date,
            "max_papers": max_papers
        }

        final_state = await self.workflow.ainvoke(initial_state)
        
        return {
            "topic": topic,
            "total_papers": len(final_state["papers"]),
            "keyword_trends": final_state["keyword_trends"],
            "top_keywords": final_state["top_keywords"],
            "papers": final_state["papers"],
            "trend_summary": final_state["trend_summary"],
            "time_period": final_state["time_period"]
        } 