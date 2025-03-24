import React, { useState } from 'react';
import { TextField, Button, Box, Paper, Grid, Typography } from '@mui/material';
import { ResearchRequest } from '../types';

interface SearchFormProps {
    onSubmit: (request: ResearchRequest) => void;
    isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [maxPapers, setMaxPapers] = useState('100');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            topic,
            max_papers: parseInt(maxPapers) || 100,
            start_date: startDate || undefined,
            end_date: endDate || undefined
        });
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                arXiv Research Trend Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fields marked with * are required
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            required
                            label="Research Topic"
                            variant="outlined"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter a research topic (e.g., 'quantum computing')"
                            disabled={isLoading}
                            helperText="Required field"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            required
                            type="number"
                            label="Max Papers"
                            variant="outlined"
                            value={maxPapers}
                            onChange={(e) => setMaxPapers(e.target.value)}
                            inputProps={{ min: 1, max: 1000 }}
                            disabled={isLoading}
                            helperText="Required field (1-1000)"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Start Date (Optional)"
                            variant="outlined"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={isLoading}
                            helperText="Optional: Filter papers from this date"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            type="date"
                            label="End Date (Optional)"
                            variant="outlined"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={isLoading}
                            helperText="Optional: Filter papers until this date"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!topic || isLoading}
                                sx={{ minWidth: 120 }}
                            >
                                {isLoading ? 'Analyzing...' : 'Analyze'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}; 