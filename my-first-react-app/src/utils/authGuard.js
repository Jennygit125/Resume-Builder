import { redirect } from "react-router";
import { isTokenExpired, refreshAccessToken } from "./auth.js";

/**
 * Logic to protect routes at the loader level.
 * Returns user info if authenticated, otherwise throws a redirect to /auth.
 */
export async function requireAuth() {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const firstName = localStorage.getItem("first_name");

  // If we don't even have a name, the user isn't logged in at all
  if (!firstName) {
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