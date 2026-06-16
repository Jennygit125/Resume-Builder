import { isTokenExpired, refreshAccessToken } from "./auth.js";

/**
 * A wrapper around fetch that automatically adds the Bearer token
 * and handles base URL configuration.
 */
export async function apiFetch(endpoint, options = {}) {
  // Fallback to empty string for relative paths. 
  // On Vercel, if your backend is in the /api directory, VITE_API_BASE_URL should be set to "/api" 
  // or left empty if the endpoint includes the /api prefix.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  
  const accessToken = localStorage.getItem("access_token");

  // MOCK BYPASS: Return immediate success for login and Tester requests to prevent server connection loop and redirects
  if (endpoint === "/signIn" || localStorage.getItem("first_name") === "Tester") {
    return {
      ok: true,
      status: 200,
      json: async () => ({ 
        user: { firstName: "Tester", email: "test@example.com" },
        token: "mock_token"
      }),
    };
  }

  // Standardize headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Automatically add the Bearer token if it exists
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  const startTime = Date.now();
  // Standard 60s limit for wake-up cycles. 
  // Note: Vercel Hobby tier serverless functions timeout at 10s.
  const TIMEOUT_LIMIT = 60000; 

  while (Date.now() - startTime < TIMEOUT_LIMIT) {
    const controller = new AbortController();
    const remainingTime = TIMEOUT_LIMIT - (Date.now() - startTime);
    const timeoutId = setTimeout(() => controller.abort(), remainingTime);

    // Robust URL joining to prevent double slashes or missing slashes
    // This ensures compatibility with Vercel's API directory routing
    const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    try {
      console.log(`🚀 Fetching (${Math.round((Date.now() - startTime) / 1000)}s): ${fullUrl}`);
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If the backend returns "Service Unavailable" or "Bad Gateway" while booting, retry
      if ([502, 503, 504].includes(response.status)) {
        console.warn(`Backend is waking up (Status ${response.status}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (response.status === 401) {
        // Attempt to silent refresh before giving up
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken && !isTokenExpired(refreshToken)) {
          try {
            const newToken = await refreshAccessToken();
            // Update the header for the retry attempt
            config.headers["Authorization"] = `Bearer ${newToken}`;
            continue; // Jump back to the start of the while loop to retry the fetch
          } catch (refreshError) {
            console.error("Silent refresh failed:", refreshError);
          }
        }

        console.warn("Unauthorized request. Redirecting to login...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("first_name");
        localStorage.removeItem("username");
        window.location.href = "/auth?message=session_expired";
        return null;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry on network errors (TypeError) if we haven't hit the 60s limit
      if (error.name === "TypeError" && (Date.now() - startTime < TIMEOUT_LIMIT)) {
        console.warn("Network unreachable, backend might be sleeping. Retrying in 2s...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (error.name === "AbortError") {
        throw new Error("The server is taking too long to respond. Please try again.");
      }
      console.error("API Fetch Error:", error);
      throw error;
    }
  }
  
  throw new Error("The server is taking too long to respond. Please try again.");
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url, options) => apiFetch(url, { ...options, method: "GET" }).then(res => res?.json()),
  post: (url, body, options) => apiFetch(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) => apiFetch(url, { ...options, method: "PUT", body: JSON.stringify(body) }).then(res => res?.json()),
  delete: (url, options) => apiFetch(url, { ...options, method: "DELETE" }).then(res => res?.json()),

  // Resume Operations
  getResumes: () => api.get('/resumes'),
  
  getDashboardStats: () => api.get('/stats/dashboard'),

  deleteResume: (id) => api.delete(`/resumes/${id}`),

  saveResume: (resumeData) => api.post('/resumes', resumeData).then(res => res?.json()),

  // AI Integration
  generateAiResume: (prompt) => 
    apiFetch('/ai/generate', { 
      method: 'POST', 
      body: JSON.stringify({ prompt }) 
    }).then(res => res?.json()),

  analyzeResume: (resumeId) => 
    apiFetch(`/ai/analyze/${resumeId}`, { 
      method: 'POST' 
    }).then(res => res?.json()),
};