import { Outlet, redirect } from "react-router";

/**
 * Prevents authenticated users from accessing login/signup pages.
 */
export async function clientLoader() {
  const accessToken = localStorage.getItem("access_token");
  const firstName = localStorage.getItem("first_name");

  if (accessToken && firstName) {
    throw redirect("/dashboard");
  }
  return null;
}

export default function GuestGuard() {
  return <Outlet />;
}