import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Objections() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-rose-50">
      <header className="mt-12 text-center px-4 max-w-3xl">
        <h1 className="text-4xl font-extrabold text-rose-700">Objection Handling Lab</h1>
        <p className="text-lg text-gray-700 mt-2">
          Surface the real concern, validate emotions, and guide buyers toward clarity.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 mt-12 w-full max-w-4xl px-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-rose-600 mb-2">3R Framework</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li><strong>Reveal</strong> – Dig for the root hesitation.</li>
            <li><strong>Reassure</strong> – Share proof and perspective.</li>
            <li><strong>Redirect</strong> – Co-create the next best step.</li>
          </ol>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-rose-600 mb-2">Language Swap</h2>
          <p className="text-gray-700">
            Replace “I understand, but…” with “What would need to be true for this to feel like a yes?”
          </p>
        </div>
      </section>

      <section className="w-full max-w-4xl mt-10 px-4 pb-12">
        <p className="text-gray-500 text-sm mb-2">Your Objection Coach</p>
        <ChatUI preset="objections" variant="embedded" />
      </section>
    </main>
  )
}
