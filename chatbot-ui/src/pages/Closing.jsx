import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Closing() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-emerald-50">
      <header className="mt-12 text-center px-4">
        <h1 className="text-4xl font-extrabold text-emerald-700">Confident Closing</h1>
        <p className="text-lg text-gray-700 mt-2">
          Secure commitments with clarity, calm, and customer alignment.
        </p>
      </header>

      <section className="flex flex-col md:flex-row gap-6 items-start justify-center mt-12 w-full max-w-4xl px-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-emerald-600 mb-2">Checklist</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Summarize outcomes and ROI.</li>
            <li>Confirm decision process and stakeholders.</li>
            <li>Remove final friction (legal, pricing, timing).</li>
            <li>Ask directly for the next commitment.</li>
          </ul>
        </div>
        <aside className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-emerald-600 mb-2">Closer’s Script</h2>
          <p className="text-gray-700">
            “Does it make sense to lock this in so your team can start seeing results next quarter?”
          </p>
        </aside>
      </section>

      <section className="w-full max-w-4xl mt-10 px-4 pb-12">
        <p className="text-gray-500 text-sm mb-2">Your Closing Coach</p>
        <ChatUI preset="closing" variant="embedded" />
      </section>
    </main>
  )
}
