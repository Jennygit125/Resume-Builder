import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  // The Index route (home)
  index("components/greeting.jsx"),
  // Protected Dashboard Group
  route("dashboard", "components/AuthGuard.jsx", [
    index("components/Dashboard.jsx"),
    route("new", "components/Inputs/ResumeInput.jsx"),
  ]),

  route("auth", "pages/Auth/LoginPage.jsx"),

  route("about", "pages/About.jsx"),
  route("services", "pages/Services.jsx"),
  route("contact", "pages/Contact.jsx"),

  // Catch-all route for 404 Not Found
  route("*", "pages/NotFound.jsx"),
] satisfies RouteConfig;