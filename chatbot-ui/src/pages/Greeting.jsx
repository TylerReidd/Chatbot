import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Greeting() {
  return (
    <main className="min-h-screen bg-orange-50 py-12 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-orange-700">Mastering the First Hello</h1>
          <p className="text-lg text-gray-700 mt-2">
            Learn how to open conversations that feel natural and build trust.
          </p>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div>
            <p className="text-gray-500 text-sm mb-3">Your Greeting Coach</p>
            <ChatUI preset="greeting" variant="embedded" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="bg-white shadow-md rounded-xl p-6 text-left">
              <h2 className="text-lg font-semibold text-orange-600 mb-2">Tip of the Day</h2>
              <p className="text-gray-800">
                Smile through your voice — people can hear it.
              </p>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-semibold text-orange-600 mb-2">Example Greeting</h2>
              <p className="text-gray-700">
                “Hey Alex, great to meet you! How’s your week going so far?”
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
