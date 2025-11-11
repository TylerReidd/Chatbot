import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Presenting() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-blue-50">
      <header className="mt-12 text-center px-4">
        <h1 className="text-4xl font-extrabold text-blue-700">Presenting with Purpose</h1>
        <p className="text-lg text-gray-700 mt-2">
          Turn features into stories that connect emotionally.
        </p>
      </header>

      <section className="flex flex-col md:flex-row gap-6 items-start justify-center mt-12 w-full max-w-4xl px-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-blue-600 mb-2">Example Structure</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Hook: Capture interest with a question</li>
            <li>Problem: Relate to their pain point</li>
            <li>Solution: Introduce your offer naturally</li>
            <li>Proof: Show a quick example or result</li>
          </ul>
        </div>

        <aside className="bg-white rounded-xl shadow-md p-6 flex-1">
          <h2 className="font-semibold text-blue-600 mb-2">Speaker Tips</h2>
          <p className="text-gray-700">
            Maintain natural pauses. Confidence lives in silence.
          </p>
        </aside>
      </section>

      <section className="w-full max-w-4xl mt-10 px-4 pb-12">
        <p className="text-gray-500 text-sm mb-2">Your Presentation Coach</p>
        <ChatUI preset="presenting" variant="embedded" />
      </section>
    </main>
  )
}
