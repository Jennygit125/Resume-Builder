import { useNavigate, useRevalidator, redirect } from "react-router";

/**
 * Checks if a JWT token is expired by decoding its payload.
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Global variable to hold the single refresh promise to prevent race conditions
let refreshPromise = null;

/**
 * Attempts to refresh the access token. Ensures only one refresh request is in flight at a time.
 */
export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    localStorage.clear();
    throw redirect("/auth");
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) throw new Error("Refresh failed");
      const data = await response.json();
      localStorage.setItem("access_token", data.accessToken || data.token);
      localStorage.setItem("refresh_token", data.refreshToken);
      return data.accessToken || data.token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function useLogout() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const logout = () => {
    // Clear only authentication-related data to preserve app state (like history)
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("first_name");
    localStorage.removeItem("username");

    // Trigger revalidation so the Root loader (and Header) updates instantly
    revalidator.revalidate();

    // 3. Redirect the user to the authentication page
    navigate("/auth");
  };

  return logout;
}