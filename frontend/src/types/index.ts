export interface ResearchRequest {
    topic: string;
    startDate?: Date;
    endDate?: Date;
    maxPapers?: number;
}

export interface KeywordTrend {
    keyword: string;
    frequency: number[];
    timestamps: string[];
}

export interface PaperInfo {
    title: string;
    abstract: string;
    authors: string[];
    publishedDate: Date;
    url: string;
    keywords: string[];
}

export interface ResearchResponse {
    topic: string;
    totalPapers: number;
    keywordTrends: KeywordTrend[];
    topKeywords: string[];
    papers: PaperInfo[];
    trendSummary: string;
    timePeriod: string;
} 