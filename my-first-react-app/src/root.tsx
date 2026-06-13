import "./index.css";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import Header from "./components/Templates/header";
import BackToTopButton from "./components/BackToTopButton";
import Footer from "./components/Templates/footer";

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My First React App</title>
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