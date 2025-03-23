import axios from 'axios';
import { ResearchRequest, ResearchResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const analyzeResearch = async (request: ResearchRequest): Promise<ResearchResponse> => {
    try {
        const response = await axios.post<ResearchResponse>(`${API_BASE_URL}/analyze`, request);
        return response.data;
    } catch (error) {
        console.error('Error analyzing research:', error);
        throw error;
    }
}; 