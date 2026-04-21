import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { botPresets, defaultPresetId, resolvePreset } from '../botPresets'
import { useAuth } from '../hooks/useAuth.jsx'
import { apiBase } from '../utils/api.js'
import { getDashboardPath } from '../utils/roles.js'

const coachIntroPrompt =
  'Begin the coaching session now. Greet me first as a live sales coach with a short natural opening line.'

const customerIntroPrompt =
  'Begin the roleplay now. Greet me first as the customer with a short natural opening line.'

const customerResponseGuardrail =
  'Stay in customer role. The user is the salesperson. Do not switch to salesperson, coach, or narrator. If the user asks for feedback, answer only from the customer perspective and continue the roleplay.'

const buildCustomerRealtimeInstructions = ({ persona, sellerName, businessName, salesObjective }) => {
  const personaName = persona?.name || 'the customer'
  const scenario =
    persona?.scenario || persona?.description || 'Shopping for a meaningful household purchase.'
  const industry = persona?.industry || 'retail sales'
  const productFocus = persona?.productFocus || 'consumer products'
  const speakingStyle = persona?.speakingStyle || 'Natural spoken conversation'
  const personality = Array.isArray(persona?.personalityTraits) && persona.personalityTraits.length
    ? persona.personalityTraits.join(', ')
    : 'realistic, human, and situation-aware'
  const objections = Array.isArray(persona?.objections) && persona.objections.length
    ? persona.objections.join(', ')
    : 'price, trust, and fit'
  const roleGuardrail = persona?.metadata?.roleGuardrail || 'Remain firmly in the buyer role throughout the session.'

  return `You are roleplaying as a customer in a live sales practice conversation with ${
    sellerName || 'the salesperson'
  } at ${businessName || 'the store'}.

The user is always the salesperson. You are always the customer. Never act as the salesperson, sales coach, narrator, or trainer. Never speak on behalf of the salesperson. Do not tell the salesperson what they should say next.

Customer profile:
- Name: ${personaName}
- Scenario: ${scenario}
- Industry context: ${industry}
- Product focus: ${productFocus}
- Personality: ${personality}
- Speaking style: ${speakingStyle}
- Likely objections: ${objections}

Conversation rules:
- Speak naturally as the customer and keep answers concise for voice chat.
- Ask follow-up questions when appropriate.
- Share information gradually instead of front-loading everything.
- Stay realistic and challenge weak sales technique.
- If asked for feedback, answer only from the customer's perspective and continue the roleplay.
- ${roleGuardrail}

Session objective: ${
    salesObjective ||
    'Run a realistic customer conversation so the salesperson can practice discovery, objection handling, and closing.'
  }`
}

const parseRealtimeEvent = (event, assistantLabel) => {
  if (event.type === 'response.audio_transcript.done' && event.transcript) {
    return { speaker: assistantLabel, text: event.transcript }
  }

  if (
    event.type === 'conversation.item.input_audio_transcription.completed' &&
    event.transcript
  ) {
    return { speaker: 'you', text: event.transcript }
  }

  if (event.type === 'response.text.done' && event.text) {
    return { speaker: assistantLabel, text: event.text }
  }

  return null
}

const coachPresets = Object.values(botPresets)

export default function Practice() {
  const { token, user, logout } = useAuth()
  const [mode, setMode] = useState('coach')
  const [personas, setPersonas] = useState([])
  const [selectedPersonaId, setSelectedPersonaId] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPresetId)
  const [businessName, setBusinessName] = useState('Reid Home Furnishings')
  const [salesObjective, setSalesObjective] = useState(
    'Practice discovery, objection handling, and a clean close.'
  )
  const [status, setStatus] = useState('Loading practice options...')
  const [error, setError] = useState('')
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [activityLog, setActivityLog] = useState([])

  const peerConnectionRef = useRef(null)
  const dataChannelRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const assistantLabelRef = useRef('coach')

  const selectedPersona = personas.find((persona) => persona.id === selectedPersonaId) ?? null
  const selectedPreset = resolvePreset(selectedPresetId)

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
        setStatus('Choose sales coach or customer mode, then start voice practice.')
      } catch (err) {
        if (ignore) return
        setError(err.message || 'Unable to load personas.')
        setStatus('Could not load practice options.')
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

  useEffect(() => {
    if (isConnected || isConnecting) return

    if (mode === 'coach') {
      setStatus(`Ready to start live coaching with the ${selectedPreset.displayName}.`)
      return
    }

    setStatus(
      selectedPersona
        ? `Ready to roleplay with ${selectedPersona.name}.`
        : 'Choose a customer persona to start roleplay.'
    )
  }, [mode, selectedPersona, selectedPreset, isConnected, isConnecting])

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
    if (!token || isConnecting) return
    if (mode === 'customer' && !selectedPersonaId) return

    disconnectSession()
    setIsConnecting(true)
    setError('')
    setActivityLog([])

    const isCoachMode = mode === 'coach'
    assistantLabelRef.current = isCoachMode ? 'coach' : 'customer'
    setStatus(isCoachMode ? 'Creating live sales coach session...' : 'Creating customer roleplay session...')

    try {
      const sessionResponse = await fetch(`${apiBase}/api/realtime/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          preset: isCoachMode ? selectedPresetId : null,
          personaId: isCoachMode ? null : selectedPersonaId,
          businessName,
          salesObjective,
        }),
      })

      const sessionPayload = await sessionResponse.json().catch(() => ({}))
      if (!sessionResponse.ok) {
        throw new Error(sessionPayload?.error || 'Unable to create realtime session.')
      }

      const customerRealtimeInstructions = !isCoachMode
        ? buildCustomerRealtimeInstructions({
            persona: sessionPayload?.persona || selectedPersona,
            sellerName: user?.name,
            businessName,
            salesObjective,
          })
        : null

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
          setStatus(
            isCoachMode
              ? `Live. Speak naturally with the ${selectedPreset.displayName}.`
              : `Live. Speak naturally to ${selectedPersona?.name || 'the selected customer persona'}.`
          )
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

        if (!isCoachMode && customerRealtimeInstructions) {
          dataChannel.send(
            JSON.stringify({
              type: 'session.update',
              session: {
                instructions: customerRealtimeInstructions,
              },
            })
          )
        }

        dataChannel.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: isCoachMode ? coachIntroPrompt : customerIntroPrompt,
                },
              ],
            },
          })
        )

        dataChannel.send(
          JSON.stringify({
            type: 'response.create',
            response: !isCoachMode
              ? {
                  instructions: `${customerRealtimeInstructions}\n\n${customerResponseGuardrail}`,
                }
              : undefined,
          })
        )
      })

      dataChannel.addEventListener('message', (messageEvent) => {
        try {
          const event = JSON.parse(messageEvent.data)
          const transcriptEntry = parseRealtimeEvent(event, assistantLabelRef.current)
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

  return (
    <main className="min-h-svh bg-linear-to-br from-stone-100 via-white to-sky-50 px-4 py-5 sm:py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Realtime Practice</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Voice practice lab</h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Choose whether you want live coaching from a sales coach or a customer roleplay session.
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
          <section className="min-w-0 rounded-4xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Session setup</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Idle'}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Conversation mode</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode('coach')}
                    disabled={isConnecting || isConnected}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      mode === 'coach'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Sales Coach
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('customer')}
                    disabled={isConnecting || isConnected || isLoadingPersonas}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      mode === 'customer'
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Customer Persona
                  </button>
                </div>
              </div>

              {mode === 'coach' ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Coach mode</span>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-slate-500"
                    value={selectedPresetId}
                    onChange={(event) => setSelectedPresetId(event.target.value)}
                    disabled={isConnecting || isConnected}
                  >
                    {coachPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
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
              )}

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

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {mode === 'coach' ? 'Coach summary' : 'Persona summary'}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {mode === 'coach' ? selectedPreset.displayName : selectedPersona?.name || 'No persona selected'}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {mode === 'coach'
                  ? selectedPreset.description
                  : selectedPersona?.description || 'Choose a persona to see the roleplay summary.'}
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                {mode === 'coach' ? (
                  <p>
                    <span className="font-semibold text-slate-800">Focus:</span> {selectedPreset.displayName}
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold text-slate-800">Scenario:</span>{' '}
                      {selectedPersona?.scenario || 'No scenario provided.'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Difficulty:</span>{' '}
                      {selectedPersona?.difficulty || 'n/a'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Voice:</span>{' '}
                      {selectedPersona?.voice || 'alloy'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startPracticeSession}
                disabled={
                  isLoadingPersonas ||
                  isConnecting ||
                  isConnected ||
                  (mode === 'customer' && !selectedPersonaId)
                }
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

          <section className="min-w-0 rounded-4xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Conversation activity</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Live transcripts appear here as you and the selected voice mode speak.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Mic via browser
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-slate-100">
              <p className="text-sm text-slate-300">
                Signed in as <span className="font-semibold text-white">{user?.name || user?.email}</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                The session starts with the {mode === 'coach' ? 'coach' : 'customer'} greeting first. Use Chrome or another modern browser and allow microphone access when prompted.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {activityLog.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                  No transcript yet. Start a practice session to begin voice coaching or roleplay.
                </div>
              ) : (
                activityLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={[
                      'rounded-3xl px-5 py-4 text-sm shadow-sm',
                      entry.speaker === 'customer' && 'bg-sky-50 text-slate-800',
                      entry.speaker === 'coach' && 'bg-violet-50 text-slate-800',
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
