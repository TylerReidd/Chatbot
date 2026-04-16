/* eslint-env node */
/* global process */
import mongoose from 'mongoose'
import { SalesPersona } from '../models/SalesPersona.js'

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime'
const TRANSCRIBE_MODEL =
  process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'

const builtinPersonaDefinitions = [
  {
    id: 'skeptical-homeowner',
    name: 'Skeptical Homeowner',
    description: 'Wants proof, asks detailed questions, and is cautious about being oversold.',
    scenario: 'Shopping for a kitchen package after being misled by a big-box salesperson on a previous purchase.',
    industry: 'retail appliance sales',
    productFocus: 'kitchen appliances',
    difficulty: 'medium',
    voice: 'cedar',
    temperature: 0.7,
    speakingStyle: 'Measured, practical, and a little guarded.',
    personalityTraits: ['skeptical', 'detail-oriented', 'practical'],
    objections: ['price', 'reliability', 'delivery timing'],
    hiddenGoal: 'Avoid being misled again and only commit if the recommendation feels credible and specific.',
    coachingFocus: 'Handling skepticism without sounding defensive or slipping into generic sales talk.',
    metadata: {
      roleGuardrail:
        'You are a wary homeowner speaking to a salesperson. Never speak as the salesperson or tell the seller what to say.',
    },
  },
  {
    id: 'budget-family-shopper',
    name: 'Budget-Focused Parent',
    description: 'Needs to solve a real household problem but is very price sensitive.',
    scenario: 'Replacing a broken washer quickly while balancing a tight monthly budget.',
    industry: 'retail appliance sales',
    productFocus: 'laundry appliances',
    difficulty: 'easy',
    voice: 'alloy',
    temperature: 0.8,
    speakingStyle: 'Warm but rushed, asks direct questions.',
    personalityTraits: ['budget-conscious', 'urgent', 'protective'],
    objections: ['monthly payment', 'installation costs', 'warranty value'],
    hiddenGoal: 'Avoid buyer’s remorse and hidden fees.',
    coachingFocus: 'Discovering budget constraints early and framing tradeoffs clearly.',
  },
  {
    id: 'comparison-shopper',
    name: 'Comparison Shopper',
    description: 'Has researched online, compares brands aggressively, and tests the rep’s expertise.',
    scenario: 'Comparing mid-range and premium options for a full bedroom and living room refresh.',
    industry: 'furniture sales',
    productFocus: 'living room and bedroom furniture',
    difficulty: 'hard',
    voice: 'marin',
    temperature: 0.75,
    speakingStyle: 'Fast, informed, and occasionally challenging.',
    personalityTraits: ['analytical', 'confident', 'questioning'],
    objections: ['brand differences', 'value for price', 'material quality'],
    hiddenGoal: 'Validate that the salesperson actually knows the category.',
    coachingFocus: 'Building authority while keeping the conversation collaborative.',
  },
]

const builtinPersonaMap = new Map(builtinPersonaDefinitions.map((persona) => [persona.id, persona]))

const trimString = (value, fallback = '') =>
  typeof value === 'string' ? value.trim() || fallback : fallback

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => trimString(entry))
    .filter(Boolean)
    .slice(0, 12)
}

const normalizeDifficulty = (value, fallback = 'medium') => {
  const candidate = trimString(value, fallback).toLowerCase()
  return ['easy', 'medium', 'hard'].includes(candidate) ? candidate : fallback
}

const normalizeTemperature = (value, fallback = 0.8) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback
  return Math.min(Math.max(numericValue, 0), 1.2)
}

const sanitizePersona = (persona) => {
  if (!persona) return null
  const doc = persona.toObject ? persona.toObject() : persona
  return {
    id: doc._id ? String(doc._id) : doc.id,
    ownerId: doc.ownerId ? String(doc.ownerId) : null,
    isBuiltin: Boolean(doc.isBuiltin),
    name: doc.name,
    description: doc.description || '',
    scenario: doc.scenario || '',
    industry: doc.industry || 'retail sales',
    productFocus: doc.productFocus || '',
    difficulty: doc.difficulty || 'medium',
    voice: doc.voice || 'alloy',
    temperature: doc.temperature ?? 0.8,
    speakingStyle: doc.speakingStyle || '',
    personalityTraits: Array.isArray(doc.personalityTraits) ? doc.personalityTraits : [],
    objections: Array.isArray(doc.objections) ? doc.objections : [],
    hiddenGoal: doc.hiddenGoal || '',
    coachingFocus: doc.coachingFocus || '',
    systemPromptOverride: doc.systemPromptOverride || '',
    metadata: doc.metadata || {},
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  }
}

const serializeBuiltinPersona = (persona) =>
  sanitizePersona({
    ...persona,
    isBuiltin: true,
    ownerId: null,
    createdAt: null,
    updatedAt: null,
  })

const buildDifficultyGuidance = (difficulty) => {
  if (difficulty === 'easy') {
    return 'Be cooperative overall. Surface one or two objections, but respond well to competent discovery and explanation.'
  }
  if (difficulty === 'hard') {
    return 'Be demanding and realistic. Force the seller to earn trust through strong questions, precise explanations, and confident next steps.'
  }
  return 'Be realistic and moderately challenging. Offer enough friction to test the seller without stonewalling the conversation.'
}

export const buildPersonaInstructions = (persona, options = {}) => {
  const sellerName = trimString(options.sellerName, 'the salesperson')
  const businessName = trimString(options.businessName, 'the store')
  const salesObjective = trimString(
    options.salesObjective,
    'Run a realistic customer conversation so the salesperson can practice discovery, objection handling, and closing.'
  )

  if (persona.systemPromptOverride) {
    return persona.systemPromptOverride
  }

  const traits = persona.personalityTraits?.length
    ? persona.personalityTraits.join(', ')
    : 'realistic, human, and situation-aware'
  const objections = persona.objections?.length
    ? persona.objections.join(', ')
    : 'price, trust, and fit'
  const roleGuardrail = trimString(persona.metadata?.roleGuardrail)

  return `You are roleplaying as a customer in a sales practice conversation with ${sellerName} at ${businessName}.

Stay in character as the customer for the full conversation. The user is always the salesperson and you are always the customer. Never act as the salesperson, sales coach, narrator, or trainer. Do not reveal hidden goals unless the salesperson earns that information naturally. If the user asks for feedback or evaluation during the roleplay, stay in customer role and answer from the customer's perspective instead of switching roles.

Customer profile:
- Name: ${persona.name}
- Scenario: ${persona.scenario || persona.description || 'Shopping for a meaningful household purchase.'}
- Industry context: ${persona.industry || 'retail sales'}
- Product focus: ${persona.productFocus || 'consumer products'}
- Personality: ${traits}
- Speaking style: ${persona.speakingStyle || 'Natural spoken conversation'}
- Likely objections: ${objections}
- Hidden goal: ${persona.hiddenGoal || 'Make a confident purchase without regret'}

Conversation rules:
- Respond like a real buyer, not a trainer.
- Never speak on behalf of ${sellerName} or tell the seller what they should say next.
- If the user asks a meta question, answer briefly as the customer or ask to continue the roleplay.
- Keep spoken responses concise and natural for voice chat.
- Ask follow-up questions when appropriate.
- Provide information gradually; do not dump every need at once.
- Challenge weak sales technique realistically.
- Reward strong discovery, empathy, and recommendation quality.
- ${roleGuardrail || 'Remain firmly in the buyer role throughout the session.'}
- ${buildDifficultyGuidance(persona.difficulty)}

Session objective: ${salesObjective}`
}

const parsePersonaPayload = (body = {}) => ({
  name: trimString(body.name),
  description: trimString(body.description),
  scenario: trimString(body.scenario),
  industry: trimString(body.industry, 'retail sales'),
  productFocus: trimString(body.productFocus),
  difficulty: normalizeDifficulty(body.difficulty),
  voice: trimString(body.voice, 'alloy'),
  temperature: normalizeTemperature(body.temperature),
  speakingStyle: trimString(body.speakingStyle),
  personalityTraits: normalizeStringList(body.personalityTraits),
  objections: normalizeStringList(body.objections),
  hiddenGoal: trimString(body.hiddenGoal),
  coachingFocus: trimString(body.coachingFocus),
  systemPromptOverride: trimString(body.systemPromptOverride),
  metadata:
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {},
})

export const resolvePersonaForUser = async (personaId, userId) => {
  const normalizedPersonaId = trimString(personaId)
  if (!normalizedPersonaId) {
    return serializeBuiltinPersona(builtinPersonaDefinitions[0])
  }

  const builtinPersona = builtinPersonaMap.get(normalizedPersonaId)
  if (builtinPersona) {
    return serializeBuiltinPersona(builtinPersona)
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedPersonaId)) {
    return null
  }

  const persona = await SalesPersona.findOne({
    _id: normalizedPersonaId,
    ownerId: userId,
  }).lean()

  return sanitizePersona(persona)
}

export const listSalesPersonas = async (req, res) => {
  try {
    const customPersonas = await SalesPersona.find({ ownerId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean()

    return res.json({
      personas: [
        ...builtinPersonaDefinitions.map((persona) => serializeBuiltinPersona(persona)),
        ...customPersonas.map((persona) => sanitizePersona(persona)),
      ],
      defaults: {
        realtimeModel: REALTIME_MODEL,
        transcriptionModel: TRANSCRIBE_MODEL,
      },
    })
  } catch (error) {
    console.error('Sales persona list error:', error)
    return res.status(500).json({ error: 'Unable to load sales personas.' })
  }
}

export const getSalesPersona = async (req, res) => {
  try {
    const persona = await resolvePersonaForUser(req.params.personaId, req.user._id)
    if (!persona) {
      return res.status(404).json({ error: 'Sales persona not found.' })
    }

    return res.json({ persona })
  } catch (error) {
    console.error('Sales persona lookup error:', error)
    return res.status(500).json({ error: 'Unable to load sales persona.' })
  }
}

export const createSalesPersona = async (req, res) => {
  try {
    const payload = parsePersonaPayload(req.body)
    if (!payload.name) {
      return res.status(400).json({ error: 'Persona name is required.' })
    }

    const persona = await SalesPersona.create({
      ownerId: req.user._id,
      ...payload,
    })

    return res.status(201).json({ persona: sanitizePersona(persona) })
  } catch (error) {
    console.error('Sales persona create error:', error)
    return res.status(500).json({ error: 'Unable to create sales persona.' })
  }
}

export const updateSalesPersona = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.personaId)) {
      return res.status(400).json({ error: 'Invalid sales persona id.' })
    }

    const payload = parsePersonaPayload(req.body)
    if (!payload.name) {
      return res.status(400).json({ error: 'Persona name is required.' })
    }

    const persona = await SalesPersona.findOneAndUpdate(
      {
        _id: req.params.personaId,
        ownerId: req.user._id,
      },
      payload,
      { new: true, runValidators: true }
    )

    if (!persona) {
      return res.status(404).json({ error: 'Sales persona not found.' })
    }

    return res.json({ persona: sanitizePersona(persona) })
  } catch (error) {
    console.error('Sales persona update error:', error)
    return res.status(500).json({ error: 'Unable to update sales persona.' })
  }
}

export const deleteSalesPersona = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.personaId)) {
      return res.status(400).json({ error: 'Invalid sales persona id.' })
    }

    const persona = await SalesPersona.findOneAndDelete({
      _id: req.params.personaId,
      ownerId: req.user._id,
    })

    if (!persona) {
      return res.status(404).json({ error: 'Sales persona not found.' })
    }

    return res.status(204).send()
  } catch (error) {
    console.error('Sales persona delete error:', error)
    return res.status(500).json({ error: 'Unable to delete sales persona.' })
  }
}
