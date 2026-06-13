import { type RouteConfig, route, index, redirect } from "@react-router/dev/routes";
import { isTokenExpired, refreshAccessToken } from "./utils/auth";

export default [
  // The Index route (home)
  index("components/greeting.jsx"),

  route("dashboard", "components/Dashboard.jsx"),
  route("dashboard/new", "components/Inputs/resumeInput.jsx"),
  route("auth", "pages/Auth/LoginPage.jsx"),

  route("about", "pages/About.jsx"),
  route("services", "pages/Services.jsx"),
  route("contact", "pages/Contact.jsx"),

  // Catch-all route for 404 Not Found
  route("*", "pages/NotFound.jsx"),
] satisfies RouteConfig;