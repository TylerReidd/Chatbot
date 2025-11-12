import React from 'react'
import ChatUI from '../components/ChatUI'

export default function FollowUp() {
  return (
    <main className="min-h-screen bg-purple-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-purple-700">Follow-Up Momentum</h1>
          <p className="text-lg text-gray-700 mt-2">
            Keep deals warm with thoughtful recaps, layered value, and helpful nudges.
          </p>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div>
            <p className="text-gray-500 text-sm mb-3">Your Follow-Up Coach</p>
            <ChatUI preset="followup" variant="embedded" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-purple-600 mb-2">Message Blueprint</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-1">
                <li>Recap key outcomes or aha moments.</li>
                <li>Bridge to new insight or asset.</li>
                <li>Create a gentle, specific call-to-action.</li>
              </ol>
            </div>
            <aside className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-purple-600 mb-2">Nurture Tip</h2>
              <p className="text-gray-700">
                Stack value: send a resource, client story, or intro that shows you’re invested.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
