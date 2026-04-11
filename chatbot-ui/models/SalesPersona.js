import mongoose from 'mongoose'

const salesPersonaSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    scenario: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'retail sales',
    },
    productFocus: {
      type: String,
      trim: true,
      maxlength: 160,
      default: 'appliances, furniture, and bedding',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    voice: {
      type: String,
      trim: true,
      default: 'alloy',
    },
    temperature: {
      type: Number,
      min: 0,
      max: 1.2,
      default: 0.8,
    },
    speakingStyle: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    personalityTraits: {
      type: [String],
      default: [],
    },
    objections: {
      type: [String],
      default: [],
    },
    hiddenGoal: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    coachingFocus: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    systemPromptOverride: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

export const SalesPersona =
  mongoose.models.SalesPersona || mongoose.model('SalesPersona', salesPersonaSchema)
