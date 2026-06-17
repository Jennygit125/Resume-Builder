import { redirect } from "react-router";
import { isTokenExpired, refreshAccessToken, getAuthItem, getAuthStorage } from "./auth.js";
import { supabase } from "./api.js";

/**
 * Logic to protect routes at the loader level.
 * Returns user info if authenticated, otherwise throws a redirect to /auth.
 */
export async function requireAuth() {
  let accessToken = getAuthItem("access_token");
  const refreshToken = getAuthItem("refresh_token");
  let firstName = getAuthItem("first_name");

  // Proactive Session Sync: If custom storage is empty, check if Supabase has a session (common after OAuth redirect)
  if (!accessToken) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      accessToken = session.access_token;
      // Default to localStorage for the synced session unless a session flag exists
      const storage = localStorage; 
      storage.setItem("access_token", session.access_token);
      storage.setItem("refresh_token", session.refresh_token);
    }
  }

  // OAuth Identity Sync: If tokens exist but firstName is missing (common after social login)
  if (!firstName && accessToken) {
    // getUser() is more secure than getSession() as it verifies the JWT with the Supabase Auth server
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      firstName = user.user_metadata?.firstName || user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
      
      // Save the resolved identity back to the correct storage type
      const storage = getAuthStorage();
      storage.setItem("first_name", firstName);
    } else if (error) {
      console.error("Auth Guard: Failed to sync identity:", error.message);
      clearAuthStorage();
      throw redirect("/auth");
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
  [localStorage, sessionStorage].forEach(s => {
    s.removeItem("access_token");
    s.removeItem("refresh_token");
    s.removeItem("first_name");
    s.removeItem("username");
    s.removeItem("login_history");
  });
}

export function handleAuthError(error) {
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    throw redirect("/auth?message=session_expired");
  }
  throw error;
}