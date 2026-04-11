import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { apiBase } from '../utils/api.js'
import { getDashboardPath } from '../utils/roles.js'

const introPrompt =
  'Begin the roleplay now. Greet me first as the customer with a short natural opening line.'

const parseRealtimeEvent = (event) => {
  if (event.type === 'response.audio_transcript.done' && event.transcript) {
    return { speaker: 'customer', text: event.transcript }
  }

  if (
    event.type === 'conversation.item.input_audio_transcription.completed' &&
    event.transcript
  ) {
    return { speaker: 'you', text: event.transcript }
  }

  if (event.type === 'response.text.done' && event.text) {
    return { speaker: 'customer', text: event.text }
  }

  return null
}

export default function Practice() {
  const { token, user, logout } = useAuth()
  const [personas, setPersonas] = useState([])
  const [selectedPersonaId, setSelectedPersonaId] = useState('')
  const [businessName, setBusinessName] = useState('Reid Home Furnishings')
  const [salesObjective, setSalesObjective] = useState(
    'Practice discovery, objection handling, and a clean close.'
  )
  const [status, setStatus] = useState('Loading personas...')
  const [error, setError] = useState('')
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [activityLog, setActivityLog] = useState([])

  const peerConnectionRef = useRef(null)
  const dataChannelRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)

  useEffect(() => {
    if (!token) return undefined
    let ignore = false

    const loadPersonas = async () => {
      setIsLoadingPersonas(true)
      setError('')

      try {
        const response = await fetch(`${apiBase}/api/personas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load personas.')
        }

        if (ignore) return

        const nextPersonas = Array.isArray(payload.personas) ? payload.personas : []
        setPersonas(nextPersonas)
        setSelectedPersonaId((currentId) => currentId || nextPersonas[0]?.id || '')
        setStatus(nextPersonas.length ? 'Pick a persona and start voice practice.' : 'No personas found.')
      } catch (err) {
        if (ignore) return
        setError(err.message || 'Unable to load personas.')
        setStatus('Could not load personas.')
      } finally {
        if (!ignore) setIsLoadingPersonas(false)
      }
    }

    loadPersonas()

    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }, [])

  const appendLog = (speaker, text) => {
    if (!text) return
    setActivityLog((currentLog) => [
      ...currentLog,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        speaker,
        text,
      },
    ])
  }

  const disconnectSession = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop()
      })
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setStatus('Voice session disconnected.')
  }

  const startPracticeSession = async () => {
    if (!token || !selectedPersonaId || isConnecting) return

    disconnectSession()
    setIsConnecting(true)
    setError('')
    setActivityLog([])
    setStatus('Creating realtime voice session...')

    try {
      const sessionResponse = await fetch(`${apiBase}/api/realtime/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          businessName,
          salesObjective,
        }),
      })

      const sessionPayload = await sessionResponse.json().catch(() => ({}))
      if (!sessionResponse.ok) {
        throw new Error(sessionPayload?.error || 'Unable to create realtime session.')
      }

      const ephemeralKey = sessionPayload?.session?.value || sessionPayload?.session?.client_secret?.value
      if (!ephemeralKey) {
        throw new Error('Realtime session was created without a client secret.')
      }

      const peerConnection = new RTCPeerConnection()
      peerConnectionRef.current = peerConnection

      const remoteAudio = new Audio()
      remoteAudio.autoplay = true
      remoteAudioRef.current = remoteAudio

      peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0]
      }

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState
        if (state === 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
          setStatus('Live. Speak naturally to the selected customer persona.')
        } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          setIsConnected(false)
          setIsConnecting(false)
          setStatus(`Connection ${state}.`)
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      const dataChannel = peerConnection.createDataChannel('oai-events')
      dataChannelRef.current = dataChannel

      dataChannel.addEventListener('open', () => {
        appendLog('system', 'Realtime event channel connected.')

        dataChannel.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: introPrompt,
                },
              ],
            },
          })
        )

        dataChannel.send(
          JSON.stringify({
            type: 'response.create',
          })
        )
      })

      dataChannel.addEventListener('message', (messageEvent) => {
        try {
          const event = JSON.parse(messageEvent.data)
          const transcriptEntry = parseRealtimeEvent(event)
          if (transcriptEntry) {
            appendLog(transcriptEntry.speaker, transcriptEntry.text)
          }
        } catch {
          appendLog('system', 'Received a realtime event that could not be parsed.')
        }
      })

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      })

      if (!sdpResponse.ok) {
        const details = await sdpResponse.text()
        throw new Error(details || 'OpenAI realtime call setup failed.')
      }

      const answerSdp = await sdpResponse.text()
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })
    } catch (err) {
      disconnectSession()
      setError(err.message || 'Could not start practice session.')
      setStatus('Practice session failed to start.')
    } finally {
      setIsConnecting(false)
    }
  }

  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId)

  return (
    <main className="min-h-[100svh] bg-linear-to-br from-stone-100 via-white to-sky-50 px-4 py-5 sm:py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Realtime Practice</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Voice roleplay lab</h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Practice live sales conversations with configurable customer personas powered by the
              OpenAI Realtime API.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/home"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Back to Menu
            </Link>
            <Link
              to={getDashboardPath(user?.role)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Session setup</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Idle'}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Customer persona</span>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-slate-500"
                  value={selectedPersonaId}
                  onChange={(event) => setSelectedPersonaId(event.target.value)}
                  disabled={isConnecting || isConnected || isLoadingPersonas}
                >
                  {personas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Business name</span>
                <input
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-500"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  disabled={isConnecting || isConnected}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Practice objective</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-500"
                  value={salesObjective}
                  onChange={(event) => setSalesObjective(event.target.value)}
                  disabled={isConnecting || isConnected}
                />
              </label>
            </div>

            {selectedPersona && (
              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Persona summary
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{selectedPersona.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{selectedPersona.description}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Scenario:</span>{' '}
                    {selectedPersona.scenario || 'No scenario provided.'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Difficulty:</span>{' '}
                    {selectedPersona.difficulty}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Voice:</span> {selectedPersona.voice}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startPracticeSession}
                disabled={!selectedPersonaId || isLoadingPersonas || isConnecting || isConnected}
                className="flex-1 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Start Practice'}
              </button>
              <button
                type="button"
                onClick={disconnectSession}
                disabled={!isConnecting && !isConnected}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Disconnect
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {status}
            </div>
            {error && (
              <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}
          </section>

          <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Conversation activity</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Live transcripts appear here as you and the persona speak.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Mic via browser
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-5 text-slate-100">
              <p className="text-sm text-slate-300">
                Signed in as <span className="font-semibold text-white">{user?.name || user?.email}</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                The session starts with the persona greeting first. Use Chrome or another modern browser
                and allow microphone access when prompted.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {activityLog.length === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                  No transcript yet. Start a practice session to begin voice roleplay.
                </div>
              ) : (
                activityLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={[
                      'rounded-[1.5rem] px-5 py-4 text-sm shadow-sm',
                      entry.speaker === 'customer' && 'bg-sky-50 text-slate-800',
                      entry.speaker === 'you' && 'bg-amber-50 text-slate-800',
                      entry.speaker === 'system' && 'bg-slate-100 text-slate-600',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {entry.speaker}
                    </p>
                    <p>{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
