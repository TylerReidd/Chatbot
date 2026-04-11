import React from "react";
import { Link } from "react-router-dom";
import MenuButton from "../components/MenuButton";
import { useAuth } from "../hooks/useAuth.jsx";
import { getDashboardPath } from "../utils/roles.js";

export default function HomePage() {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || "there";

  return (
    <main className="relative min-h-[100svh] flex flex-col items-center justify-center bg-white px-4 py-24 text-center sm:py-16">
      <div className="absolute left-4 right-4 top-4 flex flex-col gap-3 sm:left-auto sm:right-4 sm:flex-row sm:items-center sm:space-x-3 sm:gap-0">
        <Link
          to={getDashboardPath(user?.role)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
        <div className="text-center sm:text-right">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="break-all font-semibold text-gray-900 sm:break-normal">{displayName}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-300"
        >
          Log out
        </button>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold tracking-wide text-gray-900 sm:text-4xl">Sales App</h1>
      <p className="mb-8 text-base text-gray-700 sm:text-lg">Welcome back, {displayName}!</p>

      <div className="flex w-full flex-col items-center space-y-4">
        <MenuButton label="Practice" route='/practice' />
        <MenuButton label="Greeting" route='/greeting'></MenuButton>
        <MenuButton label="Presenting" route='/presenting' />
        <MenuButton label="Objection Handling" route='/objections' />
        <MenuButton label="Closing" route='/closing' />
        <MenuButton label="Management" route='/followup' />
      </div>
    </main>
    
  )
}
