import { Outlet } from "react-router";
import { requireAuth } from "../utils/authGuard.js";
import FloatingAiAssistant from "./FloatingAiAssistant.jsx";

/**
 * A layout component that enforces authentication via its loader.
 * Use this to wrap protected route groups in your main App/Router config.
 */
export async function clientLoader() {
  return await requireAuth();
}

export default function AuthGuard() {
  // Protection happens in the loader; this component just renders the 
  // matched child route (e.g., Dashboard, Profile, etc.)
  return (
    <>
      <Outlet />
      <FloatingAiAssistant />
    </>
  );
}