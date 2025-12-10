import jwt from 'jsonwebtoken'
import { User, sanitizeUser } from '../models/User.js'

const extractToken = (req) => {
  const authHeader = req.headers?.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return req.cookies?.token || req.query?.token || null
}

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const secret = process.env.JWS_SECRET || process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT/JWS secret is not configured')
    }

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.sub || decoded.id)
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    req.authToken = token
    req.user = user
    req.signedInUser = sanitizeUser(user)
    return next()
  } catch (error) {
    console.error('Authentication error:', error)
    const status = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : 500
    const message = status === 401 ? 'Invalid or expired token.' : 'Unable to authenticate request.'
    return res.status(status).json({ error: message })
  }
}

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(req.user.role)) {
    return next()
  }

  return res.status(403).json({ error: 'You do not have permission to perform this action.' })
}
