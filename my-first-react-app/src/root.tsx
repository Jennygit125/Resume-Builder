import { useEffect } from "react";
import "./index.css";
import {
  type LinksFunction,
  type MetaFunction,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import Header from "./components/Templates/header.jsx";
import BackToTopButton from "./components/BackToTopButton.jsx";
import Footer from "./components/Templates/footer.jsx";
import { ThemeProvider } from "./components/context/ThemeContext.jsx";

export const meta: MetaFunction = () => {
  return [
    { title: "Resume Builder" },
    { name: "description", content: "Create and edit your professional resume easily." },
    { name: "keywords", content: "resume builder, professional resume, cv maker, career tools" },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: "Resume Builder" },
    { property: "og:description", content: "Create and edit your professional resume easily." },
    { property: "og:image", content: "https://first-react-ryjt.vercel.app/og-image.png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: "https://first-react-ryjt.vercel.app" },
    { property: "og:site_name", content: "Resume Builder" },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Resume Builder" },
    { name: "twitter:description", content: "Create and edit your professional resume easily." },
    { name: "twitter:image", content: "https://first-react-ryjt.vercel.app/og-image.png" },
    { name: "theme-color", content: "#2563eb" }, 
  ];
};

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

/**
 * Makes user data globally available to all routes and the Header.
 */
export async function clientLoader() {
  // Temporarily bypass auth for testing
  // const firstName = localStorage.getItem("first_name");
  // return { firstName };
  return { firstName: "Tester" };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // The browser's native jump is often bypassed by SPA routers.
        // We manually trigger it here. The global CSS scroll-behavior: smooth
        // will handle the animation.
        element.scrollIntoView();
      }
    }
  }, [hash]);

  return (
    <ThemeProvider>
      <Header />
      <main className="min-h-screen animate-classy-fade">
        <Outlet />
      </main>
      <BackToTopButton />
      <Footer />
    </ThemeProvider>
  );
}