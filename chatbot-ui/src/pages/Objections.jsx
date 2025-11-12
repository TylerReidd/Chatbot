import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Objections() {
  return (
    <main className="min-h-screen bg-rose-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-rose-700">Objection Handling Lab</h1>
          <p className="text-lg text-gray-700 mt-2">
            Surface the real concern, validate emotions, and guide buyers toward clarity.
          </p>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div>
            <p className="text-gray-500 text-sm mb-3">Your Objection Coach</p>
            <ChatUI preset="objections" variant="embedded" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
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
          </div>
        </section>
      </div>
    </main>
  )
}
