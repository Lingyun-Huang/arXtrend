import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Link } from '@mui/material';
import Plot from 'react-plotly.js';

import { ResearchResponse, KeywordTrend } from '../types';
import { Data, Layout } from 'plotly.js';

interface ResearchResultsProps {
    results: ResearchResponse;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({ results }) => {
    const createTrendPlot = (trends: KeywordTrend[]) => {
        const traces: Data[] = trends.map((trend) => ({
            x: trend.timestamps,
            y: trend.frequency,
            name: trend.keyword,
            type: 'scatter' as const,
            mode: 'lines+markers',
        }));

        const layout: Partial<Layout> = {
            title: 'Keyword Trends Over Time',
            xaxis: { title: 'Time' },
            yaxis: { title: 'Frequency' },
            autosize: true,
            height: 400,
            showlegend: true,
            legend: {
                orientation: 'h',
                y: -0.2
            }
        };

        return (
            <Plot
                data={traces}
                layout={layout}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
            />
        );
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Research Analysis: {results.topic}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
                Time Period: {results.time_period}
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Trend Summary
                </Typography>
                <Typography>{results.trend_summary}</Typography>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Keyword Trends
                        </Typography>
                        {createTrendPlot(results.keyword_trends)}
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Top Keywords
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {results.top_keywords.map((keyword: string, index: number) => (
                                <Chip key={index} label={keyword} color="primary" variant="outlined" />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Related Papers ({results.total_papers})
                        </Typography>
                        {results.papers.map((paper: any, index: number) => (
                            <Box key={index} sx={{ mb: 3 }}>
                                <Link href={paper.url} target="_blank" rel="noopener">
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {paper.title}
                                    </Typography>
                                </Link>
                                <Typography variant="body2" color="text.secondary">
                                    {paper.authors.join(', ')}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {paper.abstract}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {paper.keywords.map((keyword: string, kidx: number) => (
                                        <Chip
                                            key={kidx}
                                            label={keyword}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}; 