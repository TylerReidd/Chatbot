import React from 'react'
import ChatUI from '../components/ChatUI'

export default function FollowUp() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-purple-50">
      <header className="mt-12 text-center px-4 max-w-3xl">
        <h1 className="text-4xl font-extrabold text-purple-700">Follow-Up Momentum</h1>
        <p className="text-lg text-gray-700 mt-2">
          Keep deals warm with thoughtful recaps, layered value, and helpful nudges.
        </p>
      </header>

      <section className="flex flex-col md:flex-row gap-6 items-start justify-center mt-12 w-full max-w-4xl px-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-purple-600 mb-2">Message Blueprint</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>Recap key outcomes or aha moments.</li>
            <li>Bridge to new insight or asset.</li>
            <li>Create a gentle, specific call-to-action.</li>
          </ol>
        </div>
        <aside className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-purple-600 mb-2">Nurture Tip</h2>
          <p className="text-gray-700">
            Stack value: send a resource, client story, or intro that shows you’re invested.
          </p>
        </aside>
      </section>

      <section className="w-full max-w-4xl mt-10 px-4 pb-12">
        <p className="text-gray-500 text-sm mb-2">Your Follow-Up Coach</p>
        <ChatUI preset="followup" variant="embedded" />
      </section>
    </main>
  )
}
