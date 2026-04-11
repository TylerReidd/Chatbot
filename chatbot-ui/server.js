/* eslint-env node */
/* global process */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ChromaClient } from 'chromadb'
import OpenAI from 'openai'
import mongoose from 'mongoose'
import { resolvePreset, defaultPresetId } from './src/botPresets.js'
import { login } from './controllers/login.js'
import { signup } from './controllers/signup.js'
import { updateMe } from './controllers/updateMe.js'
import { addEmployeeByEmail, assignCourse, getManagedEmployees } from './controllers/manager.js'
import {
  buildPersonaInstructions,
  createSalesPersona,
  deleteSalesPersona,
  getSalesPersona,
  listSalesPersonas,
  resolvePersonaForUser,
  updateSalesPersona,
} from './controllers/salesPersonas.js'
import { authenticate, requireRole } from './middleware/auth.js'
import { UserRoles } from './models/User.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(express.json())
app.use(cors())

const client = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: process.env.CHROMA_SSL === 'true',
  apiPath: process.env.CHROMA_API_PATH || "/api/v2"
})
const FALLBACK_COLLECTION = 'sales_docs'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime'
const OPENAI_REALTIME_TRANSCRIBE_MODEL =
  process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'
const ENABLE_RAG = process.env.ENABLE_RAG !== 'false'
const PORT = process.env.PORT || 5001
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatbot'
const MONGO_DB_NAME = process.env.MONGO_DB_NAME

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, 'dist')

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY is not set. The /chat endpoint will fail until it is configured.")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const getCollection = async (collectionName) => {
  if (!ENABLE_RAG) return null
  const name = collectionName || FALLBACK_COLLECTION
  return client.getOrCreateCollection({ name })
}

const normalizeRagOptions = (presetConfig, rag) => {
  const enabled = ENABLE_RAG && rag?.enabled !== false
  const collectionName =
    typeof rag?.collection === "string" && rag.collection.trim()
      ? rag.collection.trim()
      : presetConfig.ragCollection
  const query =
    typeof rag?.query === "string" && rag.query.trim() ? rag.query.trim() : null
  const topKRaw = Number(rag?.topK)
  const topK = Number.isFinite(topKRaw) ? Math.min(Math.max(Math.trunc(topKRaw), 1), 8) : 2

  return { enabled, collectionName, query, topK }
}

const getContext = async (presetConfig, latestUserMsg, ragOptions = {}) => {
  if (!ragOptions.enabled) return "Context retrieval disabled."

  try {
    const collection = await getCollection(ragOptions.collectionName)
    if (!collection) return "No context available."

    const lookupText =
      ragOptions.query || latestUserMsg || presetConfig.description || "sales coaching"
    const results = await collection.query({
      queryTexts: [lookupText],
      nResults: ragOptions.topK || 2,
    })
    return results?.documents?.flat().join("\n\n") || "No relevant context found."
  } catch (err) {
    console.warn("Chroma unavailable, continuing without context:", err.message)
    return "Context temporarily unavailable."
  }
}

const trimString = (value, fallback = '') =>
  typeof value === 'string' ? value.trim() || fallback : fallback

const normalizeVoiceSpeed = (value, fallback = 1) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback
  return Math.min(Math.max(numericValue, 0.25), 1.5)
}

const buildPersonaChatMessages = async ({ personaId, user, messages, businessName, salesObjective }) => {
  const persona = await resolvePersonaForUser(personaId, user._id)
  if (!persona) {
    const error = new Error('Sales persona not found.')
    error.status = 404
    throw error
  }

  return {
    persona,
    messages: [
      {
        role: 'system',
        content: buildPersonaInstructions(persona, {
          sellerName: user.name,
          businessName,
          salesObjective,
        }),
      },
      ...messages.map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      })),
    ],
  }
}

app.post("/api/rag", async (req,res) => {
  const {query, preset = defaultPresetId} = req.body
  const presetConfig = resolvePreset(preset)

  if (!ENABLE_RAG) {
    return res.json({
      preset: presetConfig.id,
      context: "RAG is disabled. Enable by setting ENABLE_RAG=true.",
    })
  }

  try {
    const collection = await getCollection(presetConfig.ragCollection)
    if (!collection) throw new Error("Collection unavailable")

    const results = await collection.query({queryTexts: [query], nResults:2})
    const context = results?.documents?.flat().join("\n\n") || "No Relevant context found"
    res.json({preset: presetConfig.id, context})
  } catch (err) {
    console.error("RAG retrieval error: ", err)
    res.status(503).json({
      error: "RAG retrieval failed",
      details: err.message,
    })
  }
})

app.post("/chat", authenticate, async (req,res) => {
  try {
    const {
      preset = defaultPresetId,
      personaId,
      messages: userMessages = [],
      rag,
      businessName,
      salesObjective,
    } = req.body

    let completion
    let responsePreset = preset
    let responsePersonaId = null

    if (personaId) {
      const personaChat = await buildPersonaChatMessages({
        personaId,
        user: req.user,
        messages: userMessages,
        businessName,
        salesObjective,
      })

      completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: personaChat.persona.temperature ?? 0.8,
        messages: personaChat.messages,
      })

      responsePreset = null
      responsePersonaId = personaChat.persona.id
      console.log(`✅ Sent to OpenAI (persona ${personaChat.persona.name}), waiting for reply...`)
    } else {
      const presetConfig = resolvePreset(preset)
      const ragOptions = normalizeRagOptions(presetConfig, rag)
      const latestUserMsg = userMessages.filter((m) => m.sender === "user").pop()?.text || ""
      const context = await getContext(presetConfig, latestUserMsg, ragOptions)

      completion = await openai.chat.completions.create({
        model: presetConfig.model || OPENAI_MODEL,
        temperature: presetConfig.temperature ?? 0.7,
        messages: [
          {role: "system", content: presetConfig.systemPrompt},
          {role: "system", content: `Relevant knowledge base context:\n${context}`},
          ...userMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        ],
      })

      console.log(`✅ Sent to OpenAI (${presetConfig.displayName}), waiting for reply...`)
    }

    res.json({
      preset: responsePreset,
      personaId: responsePersonaId,
      choices: completion.choices,
    })
  } catch (error) {
    console.error("Chat error:", error)
    res
      .status(error.status || 500)
      .json({error: "Chat processing failed", details: error.message})
  }
})

app.get('/api/personas', authenticate, listSalesPersonas)
app.get('/api/personas/:personaId', authenticate, getSalesPersona)
app.post('/api/personas', authenticate, createSalesPersona)
app.patch('/api/personas/:personaId', authenticate, updateSalesPersona)
app.delete('/api/personas/:personaId', authenticate, deleteSalesPersona)

app.post('/api/realtime/session', authenticate, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' })
    }

    const persona = await resolvePersonaForUser(req.body?.personaId, req.user._id)
    if (!persona) {
      return res.status(404).json({ error: 'Sales persona not found.' })
    }

    const voice = trimString(req.body?.voice, persona.voice || 'alloy')
    const speed = normalizeVoiceSpeed(req.body?.speed, 1)
    const businessName = trimString(req.body?.businessName)
    const salesObjective = trimString(req.body?.salesObjective)
    const expiresAfterSeconds = Math.min(
      Math.max(Number(req.body?.expiresAfterSeconds) || 600, 10),
      7200
    )

    const session = await openai.realtime.clientSecrets.create({
      expires_after: {
        anchor: 'created_at',
        seconds: expiresAfterSeconds,
      },
      session: {
        type: 'realtime',
        model: OPENAI_REALTIME_MODEL,
        instructions: buildPersonaInstructions(persona, {
          sellerName: req.user.name,
          businessName,
          salesObjective,
        }),
        audio: {
          input: {
            turn_detection: {
              type: 'server_vad',
              create_response: true,
              interrupt_response: true,
            },
            transcription: {
              model: OPENAI_REALTIME_TRANSCRIBE_MODEL,
            },
          },
          output: {
            voice,
            speed,
          },
        },
      },
    })

    return res.status(201).json({
      session,
      persona,
      defaults: {
        realtimeModel: OPENAI_REALTIME_MODEL,
        transcriptionModel: OPENAI_REALTIME_TRANSCRIBE_MODEL,
      },
    })
  } catch (error) {
    console.error('Realtime session error:', error)
    return res.status(500).json({
      error: 'Unable to create realtime session.',
      details: error.message,
    })
  }
})

app.post('/api/login', login)
app.get('/api/me', authenticate, (req, res) => {
  res.json({ user: req.signedInUser })
})
app.patch('/api/me', authenticate, updateMe)
app.get('/api/manager/employees', authenticate, requireRole(UserRoles.MANAGER), getManagedEmployees)
app.post('/api/manager/employees', authenticate, requireRole(UserRoles.MANAGER), addEmployeeByEmail)
app.post('/api/manager/assignments', authenticate, requireRole(UserRoles.MANAGER), assignCourse)
app.post('/api/signup', signup)

console.log("loaded JWS secret", process.env.JWS_SECRET)
console.log("loaded JWt secret", process.env.JWT_SECRET)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath))
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return
  try {
    await mongoose.connect(MONGO_URI, MONGO_DB_NAME ? { dbName: MONGO_DB_NAME } : undefined)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const start = async () => {
  await connectToDatabase()
  app.listen(PORT, () => console.log(`RAG server running on port ${PORT}`))
}

start()
