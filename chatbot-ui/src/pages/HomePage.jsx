import React from "react";
import MenuButton from "../components/MenuButton";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-wide mb-2">Sales App</h1>
      <p className="text-lg text-gray-700 mb-8">Welcome!</p>

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
