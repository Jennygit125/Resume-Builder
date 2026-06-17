import { Outlet, redirect } from "react-router";
import { getAuthItem, isTokenExpired } from "../utils/auth.js";

/**
 * Prevents authenticated users from accessing login/signup pages.
 */
export async function clientLoader() {
  const accessToken = getAuthItem("access_token");
  const firstName = getAuthItem("first_name");

  if (accessToken && firstName && !isTokenExpired(accessToken)) {
    throw redirect("/dashboard");
  }
  return null;
}

export default function GuestGuard() {
  return <Outlet />;
}