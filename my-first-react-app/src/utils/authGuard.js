import { redirect } from "react-router";
import { isTokenExpired, refreshAccessToken } from "./auth.js";
import { supabase } from "./api.js";

/**
 * Logic to protect routes at the loader level.
 * Returns user info if authenticated, otherwise throws a redirect to /auth.
 */
export async function requireAuth() {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  let firstName = localStorage.getItem("first_name");

  // OAuth Sync: If tokens exist but firstName is missing, sync from Supabase metadata
  if (!firstName && accessToken) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      firstName = user.user_metadata?.firstName || user.user_metadata?.full_name || "User";
      localStorage.setItem("first_name", firstName);
      // Also ensure access_token is synced if it came from the session internally
      const { data: { session } } = await supabase.auth.getSession();
      if (session) localStorage.setItem("access_token", session.access_token);
    }
  }

  if (!firstName && !accessToken) {
    clearAuthStorage();
    throw redirect("/auth");
  }

  // If the access token is missing or expired, try to refresh it
  if (!accessToken || isTokenExpired(accessToken)) {
    if (refreshToken && !isTokenExpired(refreshToken)) {
      try {
        accessToken = await refreshAccessToken();
      } catch (error) {
        clearAuthStorage();
        throw redirect("/auth?message=session_expired");
      }
    } else {
      clearAuthStorage();
      throw redirect("/auth?message=session_expired");
    }
  }

  return { accessToken, refreshToken, firstName };
}

function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("first_name");
  localStorage.removeItem("username");
}

export function handleAuthError(error) {
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    throw redirect("/auth?message=session_expired");
  }
  throw error;
}