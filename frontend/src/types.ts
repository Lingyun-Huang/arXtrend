export interface KeywordTrend {
    keyword: string;
    frequency: number[];
    timestamps: string[];
}

export interface Paper {
    title: string;
    abstract: string;
    authors: string[];
    published_date: string;
    url: string;
    keywords: string[];
}

export interface ResearchRequest {
    topic: string;
    max_papers?: number;
    start_date?: string;
    end_date?: string;
}

export interface ResearchResponse {
    topic: string;
    total_papers: number;
    keyword_trends: KeywordTrend[];
    top_keywords: string[];
    papers: Paper[];
    trend_summary: string;
    time_period: string;
} 