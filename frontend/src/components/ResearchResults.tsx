import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Chip, Link, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Plot from 'react-plotly.js';
import { ResearchResponse, KeywordTrend, Paper as ResearchPaper } from '../types';
import { Data, Layout } from 'plotly.js';

interface ResearchResultsProps {
    results: ResearchResponse;
}

type AggregationPeriod = 'month' | '3months' | '6months' | 'year';

export const ResearchResults: React.FC<ResearchResultsProps> = ({ results }) => {
    const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('month');

    const renderTrendSummary = (summary: string) => {
        return summary.split(/(\d+\.)/).map((part, index) => {
            if (part.trim()) {
                return (
                    <Typography key={index} paragraph={part.match(/^\d+\.$/) !== null}>
                        {part}
                    </Typography>
                );
            }
            return null;
        });
    };

    const aggregateData = (data: { x: string[], y: number[] }, period: AggregationPeriod) => {
        const dates = data.x.map(date => new Date(date));
        const values = data.y;
        const aggregated: { [key: string]: number } = {};

        dates.forEach((date, index) => {
            let key: string;
            switch (period) {
                case '3months':
                    key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
                    break;
                case '6months':
                    key = `${date.getFullYear()}-${date.getMonth() < 6 ? 'H1' : 'H2'}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default: // month
                    key = date.toISOString().slice(0, 7);
            }
            aggregated[key] = (aggregated[key] || 0) + values[index];
        });

        return {
            x: Object.keys(aggregated),
            y: Object.values(aggregated)
        };
    };

    const traces: Data[] = results.keyword_trends.map((trend: KeywordTrend) => {
        const aggregatedData = aggregateData(
            { x: trend.timestamps, y: trend.frequency },
            aggregationPeriod
        );
        return {
            x: aggregatedData.x,
            y: aggregatedData.y,
            type: 'scatter',
            mode: 'lines+markers',
            name: trend.keyword,
        } as const;
    });

    const layout: Partial<Layout> = {
        title: 'Keyword Trends Over Time',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Frequency' },
        height: 500,
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderResearchEvolution = (text: string) => {
        return text.split('\n\n').map((section, sectionIndex) => {
            const [title, ...items] = section.split('\n');
            return (
                <Box key={sectionIndex} sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {title.trim()}
                    </Typography>
                    {items.map((item, itemIndex) => {
                        if (item.trim().startsWith('-')) {
                            return (
                                <Typography 
                                    key={itemIndex} 
                                    component="div" 
                                    sx={{ 
                                        pl: 3, 
                                        mb: 1,
                                        display: 'flex',
                                        '&:before': {
                                            content: '"•"',
                                            width: '20px',
                                            display: 'inline-block',
                                            marginLeft: '-20px'
                                        }
                                    }}
                                >
                                    {item.trim().substring(1).trim()}
                                </Typography>
                            );
                        }
                        return (
                            <Typography key={itemIndex} paragraph>
                                {item.trim()}
                            </Typography>
                        );
                    })}
                </Box>
            );
        });
    };

    return (
        <Box>

            {results.research_evolution && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Research Evolution
                    </Typography>
                    {renderResearchEvolution(results.research_evolution)}
                </Paper>
            )}

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">
                        Keyword Trends
                    </Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Aggregation Period</InputLabel>
                        <Select
                            value={aggregationPeriod}
                            label="Aggregation Period"
                            onChange={(e) => setAggregationPeriod(e.target.value as AggregationPeriod)}
                        >
                            <MenuItem value="month">Monthly</MenuItem>
                            <MenuItem value="3months">Quarterly</MenuItem>
                            <MenuItem value="6months">Semi-Annually</MenuItem>
                            <MenuItem value="year">Yearly</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Plot
                    data={traces}
                    layout={layout}
                    config={{ responsive: true }}
                />
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Keyword Trends Summary
                </Typography>
                {renderTrendSummary(results.trend_summary)}
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Related Papers
                </Typography>
                <List>
                    {results.papers.map((paper: ResearchPaper, index: number) => (
                        <ListItem key={index} divider={index < results.papers.length - 1}>
                            <ListItemText
                                primary={
                                    <Link href={paper.url} target="_blank" rel="noopener noreferrer">
                                        {index + 1}. {paper.title}
                                    </Link>
                                }
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2" color="text.primary">
                                            Published: {formatDate(paper.published_date)}
                                        </Typography>
                                        <br />
                                        {paper.abstract}
                                    </>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
}; 