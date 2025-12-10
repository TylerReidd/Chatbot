import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 text-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access denied</h1>
        <p className="text-gray-600 mb-8">
          You do not have permission to view this page. Please sign in with an account that has the appropriate role.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
