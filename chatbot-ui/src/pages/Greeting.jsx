import React from 'react'
import ChatUI from '../components/ChatUI'

export default function Greeting() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-orange-50">
      <header className="mt-12 text-center px-4">
        <h1 className="text-4xl font-extrabold text-orange-700">Mastering the First Hello</h1>
        <p className="text-lg text-gray-700 mt-2">
          Learn how to open conversations that feel natural and build trust.
        </p>
      </header>

      <section className="flex flex-col items-center mt-12 space-y-6 px-6 w-full max-w-2xl">
        <div className="bg-white shadow-md rounded-xl p-6 w-full text-left">
          <h2 className="text-lg font-semibold text-orange-600 mb-2">Tip of the Day</h2>
          <p className="text-gray-800">
            Smile through your voice — people can hear it.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 w-full">
          <h2 className="text-lg font-semibold mb-2">Example Greeting</h2>
          <p className="text-gray-700">
            “Hey Alex, great to meet you! How’s your week going so far?”
          </p>
        </div>
      </section>

      <section className="w-full max-w-2xl mt-10 px-4 pb-12">
        <p className="text-gray-500 text-sm mb-2">Your Greeting Coach</p>
        <ChatUI preset="greeting" variant="embedded" />
      </section>
    </main>
  )
}
