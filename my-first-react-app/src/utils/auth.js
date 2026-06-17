import { useNavigate, useRevalidator, redirect } from "react-router";
import { supabase } from "./api.js";

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

/**
 * Returns the expiration timestamp in milliseconds from a JWT token.
 */
export const getTokenExp = (token) => {
  if (!token) return null;
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

// Global variable to hold the single refresh promise to prevent race conditions
let refreshPromise = null;

/**
 * Attempts to refresh the access token. Ensures only one refresh request is in flight at a time.
 */
export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
        return data.session.access_token;
      }
      throw new Error("No session returned");
    } catch (err) {
      localStorage.clear();
      throw redirect("/auth?message=session_expired");
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function useLogout() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const logout = async () => {
    // 1. Notify Supabase to invalidate the session on the server
    await supabase.auth.signOut();

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