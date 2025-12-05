import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
      <p className="text-sm text-slate-500">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
