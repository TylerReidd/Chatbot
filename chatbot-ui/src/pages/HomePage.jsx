import React from "react";
import MenuButton from "../components/MenuButton";
import { useAuth } from "../hooks/useAuth.jsx";

export default function HomePage() {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || "there";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-semibold text-gray-900">{displayName}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition"
        >
          Log out
        </button>
      </div>

      <h1 className="text-4xl font-extrabold text-gray-900 tracking-wide mb-2">Sales App</h1>
      <p className="text-lg text-gray-700 mb-8">Welcome back, {displayName}!</p>

      <div className="flex flex-col items-center space-y-4 w-full">
        <MenuButton label="Greeting" route='/greeting'></MenuButton>
        <MenuButton label="Presenting" route='/presenting' />
        <MenuButton label="Objection Handling" route='/objections' />
        <MenuButton label="Closing" route='/closing' />
        <MenuButton label="Follow-Up" route='/followup' />
      </div>
    </main>
    
  )
}
