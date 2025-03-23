import React, { useState } from 'react';
import { TextField, Button, Box, Paper } from '@mui/material';
import { ResearchRequest } from '../types';

interface SearchFormProps {
    onSubmit: (request: ResearchRequest) => void;
    isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, isLoading }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ topic });
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Research Topic"
                        variant="outlined"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a research topic (e.g., 'quantum computing')"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!topic || isLoading}
                        sx={{ minWidth: 120 }}
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
}; 