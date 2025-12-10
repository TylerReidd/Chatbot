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
import { authenticate } from './middleware/auth.js'
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

const getContext = async (presetConfig, latestUserMsg) => {
  if (!ENABLE_RAG) return "Context retrieval disabled."

  try {
    const collection = await getCollection(presetConfig.ragCollection)
    if (!collection) return "No context available."

    const lookupText = latestUserMsg || presetConfig.description || "sales coaching"
    const results = await collection.query({ queryTexts: [lookupText], nResults: 2 })
    return results?.documents?.flat().join("\n\n") || "No relevant context found."
  } catch (err) {
    console.warn("Chroma unavailable, continuing without context:", err.message)
    return "Context temporarily unavailable."
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
    const { preset = defaultPresetId, messages: userMessages = [] } = req.body
    const presetConfig = resolvePreset(preset)

    const latestUserMsg = userMessages.filter((m) => m.sender === "user").pop()?.text || ""

    const context = await getContext(presetConfig, latestUserMsg)

    const completion = await openai.chat.completions.create({
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
    res.json({ preset: presetConfig.id, choices: completion.choices })
  } catch (error) {
    console.error("Chat error:", error)
    res.status(500).json({error: "Chat processing failed", details: error.message})
  }
})

app.post('/api/login', login)
app.get('/api/me', authenticate, (req, res) => {
  res.json({ user: req.signedInUser })
})
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
