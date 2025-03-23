import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SearchForm } from './components/SearchForm';
import { ResearchResults } from './components/ResearchResults';
import { analyzeResearch } from './services/api';
import { ResearchRequest, ResearchResponse } from './types';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ResearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (request: ResearchRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await analyzeResearch(request);
            setResults(response);
        } catch (err) {
            setError('Failed to analyze research. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <SearchForm onSubmit={handleSubmit} isLoading={isLoading} />
                {error && (
                    <div style={{ color: 'red', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                {results && <ResearchResults results={results} />}
            </Container>
        </ThemeProvider>
    );
}

export default App;
 