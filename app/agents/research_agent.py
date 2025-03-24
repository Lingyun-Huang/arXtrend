import os
import requests
from typing import Dict, List
from datetime import datetime
import arxiv
from keybert import KeyBERT
import pandas as pd
from collections import Counter
from langgraph.graph import StateGraph
from typing_extensions import TypedDict
from sklearn.feature_extraction.text import CountVectorizer
import re
from itertools import combinations


class State(TypedDict):
    topic: str
    papers: List[Dict]
    total_papers: int         # Total number of papers fetched
    max_papers: int           # Maximum number of papers to fetch
    top_keywords: List[str]   # Top 10 keywords
    keyword_trends: List[Dict]
    trend_summary: str
    time_period: str
    research_evolution: str
    


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
        """
        This function creates the StateGraph for the entire research agent workflow.

        fetch_papers (start state) -> extract_keywords -> analyze_trends -> analyze_evolution -> generate_summary (end state)
        """
        # Define the workflow graph
        workflow = StateGraph(State)

        # Add nodes for each step of the analysis
        workflow.add_node("fetch_papers", self._fetch_papers)
        workflow.add_node("extract_keywords", self._extract_keywords)
        workflow.add_node("analyze_trends", self._analyze_trends)
        workflow.add_node("analyze_evolution", self._analyze_evolution)
        workflow.add_node("generate_summary", self._generate_summary)

        # Define the edges of the workflow
        workflow.add_edge("fetch_papers", "extract_keywords")
        workflow.add_edge("extract_keywords", "analyze_trends")
        workflow.add_edge("analyze_trends", "analyze_evolution")
        workflow.add_edge("analyze_evolution", "generate_summary")

        # Set the entry and exit points
        workflow.set_entry_point("fetch_papers")
        workflow.set_finish_point("generate_summary")

        return workflow.compile()

    def _normalize_keyword(self, keyword: str) -> str:
        """Normalize keywords by converting to lowercase and handling plurals."""
        keyword = keyword.lower().strip()
        # Remove common plural forms
        if keyword.endswith('ies'):
            keyword = keyword[:-3] + 'y'
        elif keyword.endswith('es'):
            keyword = keyword[:-2]
        elif keyword.endswith('s'):
            keyword = keyword[:-1]
        return keyword

    def _are_keywords_similar(self, kw1: str, kw2: str) -> bool:
        """Check if two keywords are similar based on various criteria."""
        kw1, kw2 = kw1.lower(), kw2.lower()
        
        # Check for exact match after normalization
        if self._normalize_keyword(kw1) == self._normalize_keyword(kw2):
            return True
            
        # Check for word order variations
        words1 = set(kw1.split())
        words2 = set(kw2.split())
        if words1 == words2:
            return True
            
        return False

    def _cluster_similar_keywords(self, keywords: List[str]) -> Dict[str, List[str]]:
        """Group similar keywords together."""
        clusters = {}
        processed = set()

        for kw1, kw2 in combinations(keywords, 2):
            if kw1 in processed or kw2 in processed:
                continue

            if self._are_keywords_similar(kw1, kw2):
                # Use the shorter or alphabetically first keyword as the representative
                rep = min([kw1, kw2], key=lambda x: (len(x), x))
                if rep not in clusters:
                    clusters[rep] = []
                clusters[rep].extend([kw1, kw2])
                processed.add(kw1)
                processed.add(kw2)

        # Add remaining unclustered keywords
        for kw in keywords:
            if kw not in processed:
                clusters[kw] = [kw]
                processed.add(kw)

        return clusters

    async def _fetch_papers(self, state: State) -> State:
        topic = state["topic"]
        max_papers = state.get("max_papers")
        
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

    async def _extract_keywords(self, state: State) -> State:
        papers = state["papers"]
        all_keywords = []

        for paper in papers:
            # Extract keywords from title and abstract
            text = f"{paper['title']} {paper['abstract']}"
            keywords = self.keyword_extractor.extract_keywords(text, 
                                                            keyphrase_ngram_range=(1, 2),
                                                            stop_words='english',
                                                            top_n=15)
            
            # Normalize and cluster similar keywords
            extracted_keywords = [k[0] for k in keywords]
            clusters = self._cluster_similar_keywords(extracted_keywords)
            
            # Use representative keywords
            paper["keywords"] = list(clusters.keys())
            all_keywords.extend(paper["keywords"])

        # Get top keywords after clustering
        keyword_freq = Counter(all_keywords)
        state["top_keywords"] = [k for k, _ in keyword_freq.most_common(10)]
        return state

    async def _analyze_trends(self, state: State) -> State:
        papers = state["papers"]
        top_keywords = state["top_keywords"]

        # Create a DataFrame for temporal analysis
        df = pd.DataFrame(papers)
        df["published_date"] = pd.to_datetime(df["published_date"])
        df = df.sort_values("published_date")

        # Calculate trends for each keyword
        trends = []
        for main_keyword in top_keywords:
            freq = []
            timestamps = []
            
            # Group by month and count keyword occurrences, including similar keywords
            monthly_counts = df.set_index("published_date").resample("M").apply(
                lambda x: sum(
                    any(self._are_keywords_similar(main_keyword, k) for k in paper)
                    for paper in x["keywords"]
                )
            )
            
            trends.append({
                "keyword": main_keyword,
                "frequency": monthly_counts.values.tolist(),
                "timestamps": monthly_counts.index.strftime("%Y-%m").tolist()
            })

        state["keyword_trends"] = trends
        return state

    async def _analyze_evolution(self, state: State) -> State:
        papers = state["papers"]
        df = pd.DataFrame(papers)
        df["published_date"] = pd.to_datetime(df["published_date"])
        df = df.sort_values("published_date")

        # Group papers by year
        df["year"] = df["published_date"].dt.year
        yearly_abstracts = df.groupby("year")["abstract"].agg(list).to_dict()

        # Create a prompt for research evolution analysis
        evolution_prompt = f"""Analyze how the research direction has evolved over time for the topic: {state['topic']}

        Here are the abstracts grouped by year:

        {chr(10).join(f"Year {year}:{chr(10)}{chr(10).join(abstracts[:3])}" for year, abstracts in yearly_abstracts.items())}

        Please provide a comprehensive analysis of how the research focus and approaches have evolved over time. Consider:
        1. Major shifts in research methodology
        2. New techniques or approaches introduced
        3. Changes in the scope or application areas
        4. Emerging challenges or opportunities addressed

        Format the response with clear numbering (1. 2. 3.) and line breaks between points.
        """

        evolution_summary = self._call_ollama(evolution_prompt)
        state["research_evolution"] = evolution_summary
        return state

    async def _generate_summary(self, state: State) -> State:
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

        Format the response with clear numbering (1. 2. 3.) and line breaks between points.
        """

        summary = self._call_ollama(prompt)
        state["trend_summary"] = summary
        state["time_period"] = f"{state['keyword_trends'][0]['timestamps'][0]} to {state['keyword_trends'][0]['timestamps'][-1]}"
        
        return state

    async def analyze_topic(self, topic: str, start_date: datetime = None, 
                          end_date: datetime = None, max_papers: int = 100) -> State:
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
            "time_period": final_state["time_period"],
            "research_evolution": final_state["research_evolution"]
        } 
