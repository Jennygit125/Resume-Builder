/**
 * Centralized API Service for PostgreSQL-backed operations
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
});

export const api = {
  // Resume Operations
  getResumes: async () => {
    const response = await fetch(`${BASE_URL}/resumes`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch resumes');
    return response.json();
  },

  getDashboardStats: async () => {
    const response = await fetch(`${BASE_URL}/stats/dashboard`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  deleteResume: async (id) => {
    const response = await fetch(`${BASE_URL}/resumes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  },

  // AI Integration
  generateAiResume: async (prompt) => {
    const response = await fetch(`${BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt })
    });
    return response.json();
  },

  analyzeResume: async (resumeId) => {
    const response = await fetch(`${BASE_URL}/ai/analyze/${resumeId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return response.json();
  }
};