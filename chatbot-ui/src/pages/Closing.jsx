import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Closing() {
  return (
    <main className="min-h-screen bg-emerald-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-emerald-700">Confident Closing</h1>
          <p className="text-lg text-gray-700 mt-2">
            Secure commitments with clarity, calm, and customer alignment.
          </p>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div>
            <p className="text-gray-500 text-sm mb-3">Your Closing Coach</p>
            <ChatUI preset="closing" variant="embedded" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-emerald-600 mb-2">Checklist</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Summarize outcomes and ROI.</li>
                <li>Confirm decision process and stakeholders.</li>
                <li>Remove final friction (legal, pricing, timing).</li>
                <li>Ask directly for the next commitment.</li>
              </ul>
            </div>

            <aside className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-emerald-600 mb-2">Closer’s Script</h2>
              <p className="text-gray-700">
                “Does it make sense to lock this in so your team can start seeing results next quarter?”
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
