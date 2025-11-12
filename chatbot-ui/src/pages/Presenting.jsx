import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Presenting() {
  return (
    <main className="min-h-screen bg-blue-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-700">Presenting with Purpose</h1>
          <p className="text-lg text-gray-700 mt-2">
            Turn features into stories that connect emotionally.
          </p>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div>
            <p className="text-gray-500 text-sm mb-3">Your Presentation Coach</p>
            <ChatUI preset="presenting" variant="embedded" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-blue-600 mb-2">Example Structure</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Hook: Capture interest with a question</li>
                <li>Problem: Relate to their pain point</li>
                <li>Solution: Introduce your offer naturally</li>
                <li>Proof: Show a quick example or result</li>
              </ul>
            </div>

            <aside className="bg-white rounded-xl shadow-md p-6">
              <h2 className="font-semibold text-blue-600 mb-2">Speaker Tips</h2>
              <p className="text-gray-700">
                Maintain natural pauses. Confidence lives in silence.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
