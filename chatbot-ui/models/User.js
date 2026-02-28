import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const UserRoles = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  REPRESENTATIVE: 'representative',
})

const validRoles = Object.values(UserRoles)
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: validRoles,
      default: UserRoles.EMPLOYEE,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedCourses: {
      type: [String],
      default: [],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.path('role').set(function setRole(value) {
  if (value === UserRoles.REPRESENTATIVE) {
    return UserRoles.EMPLOYEE
  }
  return value
})

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.generateAuthToken = function generateAuthToken(options = {}) {
  const secret = process.env.JWT_SECRET || process.env.JWS_SECRET
  if (!secret) {
    throw new Error('JWT/JWS secret is not configured')
  }

  const payload = {
    sub: this._id.toString(),
    role: this.role,
    email: this.email,
    ...(options.payload || {}),
  }

  const signOptions = {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '1h',
  }

  return jwt.sign(payload, secret, signOptions)
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)

export const normalizeUserRole = (role) =>
  role === UserRoles.REPRESENTATIVE ? UserRoles.EMPLOYEE : role

export const sanitizeUser = (userDoc) => {
  if (!userDoc) return null
  const doc = userDoc.toObject ? userDoc.toObject() : userDoc
  doc.role = normalizeUserRole(doc.role)
  delete doc.password
  return doc
}
