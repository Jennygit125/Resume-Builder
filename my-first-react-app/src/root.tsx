import "./index.css";
import {
  type LinksFunction,
  type MetaFunction,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import Header from "./components/Templates/header";
import BackToTopButton from "./components/BackToTopButton";
import Footer from "./components/Templates/footer";

export const meta: MetaFunction = () => {
  return [
    { title: "Resume Builder" },
    { name: "description", content: "Create and edit your professional resume easily." },
    { name: "keywords", content: "resume builder, professional resume, cv maker, career tools" },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: "Resume Builder" },
    { property: "og:description", content: "Create and edit your professional resume easily." },
    { property: "og:image", content: "/og:image.png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: "https://first-react-ryjt.vercel.app" },
    { property: "og:site_name", content: "Resume Builder" },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Resume Builder" },
    { name: "twitter:description", content: "Create and edit your professional resume easily." },
    { name: "twitter:image", content: "https://first-react-ryjt.vercel.app/og:image.png" },
    { name: "theme-color", content: "#2563eb" }, // Match this to your brand color
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
  const firstName = localStorage.getItem("first_name");
  return { firstName };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
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
  return (
    <>
      <Header />
      <main className="min-h-screen animate-classy-fade">
        <Outlet />
      </main>
      <BackToTopButton />
      <Footer />
    </>
  );
}