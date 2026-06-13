import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-9xl font-extrabold text-brand-blue opacity-20">404</h1>
      <div className="absolute">
        <h2 className="text-3xl font-bold mb-2">Lost in the veil?</h2>
        <p className="text-gray-600 mb-8 max-w-sm">
          The page you are looking for doesn't exist or has been moved to another dimension.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-brand-blue text-white font-medium rounded-full hover:bg-button-hover transition-all shadow-lg hover:shadow-xl"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}