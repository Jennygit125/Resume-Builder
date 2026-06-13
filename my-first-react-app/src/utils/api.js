/**
 * A wrapper around fetch that automatically adds the Bearer token
 * and handles base URL configuration.
 */
export async function apiFetch(endpoint, options = {}) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const accessToken = localStorage.getItem("access_token");

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
  const TIMEOUT_LIMIT = 60000;

  while (Date.now() - startTime < TIMEOUT_LIMIT) {
    const controller = new AbortController();
    const remainingTime = TIMEOUT_LIMIT - (Date.now() - startTime);
    const timeoutId = setTimeout(() => controller.abort(), remainingTime);

    try {
      console.log(`🚀 Fetching (${Math.round((Date.now() - startTime) / 1000)}s): ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
        console.warn("Unauthorized request. Redirecting to login...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("first_name");
        localStorage.removeItem("username");
        window.location.href = "/auth";
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
  get: (url, options) => apiFetch(url, { ...options, method: "GET" }),
  post: (url, body, options) => apiFetch(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) => apiFetch(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (url, options) => apiFetch(url, { ...options, method: "DELETE" }),
};