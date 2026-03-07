import jwt from 'jsonwebtoken'
import { User, sanitizeUser } from '../models/User.js'

const extractToken = (req) => {
  const authHeader = req.headers?.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7), source: 'authorization-header' }
  }

  if (req.cookies?.token) {
    return { token: req.cookies.token, source: 'cookie' }
  }

  if (req.query?.token) {
    return { token: req.query.token, source: 'query' }
  }

  return { token: null, source: null }
}

export const authenticate = async (req, res, next) => {
  let decodedSub = null
  let tokenSource = null

  try {
    const { token, source } = extractToken(req)
    tokenSource = source

    if (!token) {
      console.warn('Authentication failed: missing token', {
        method: req.method,
        path: req.originalUrl,
      })
      return res.status(401).json({ error: 'Authentication required.' })
    }

    // Match token-signing secret precedence in models/User.js
    const secret = process.env.JWT_SECRET || process.env.JWS_SECRET
    if (!secret) {
      throw new Error('JWT/JWS secret is not configured')
    }

    const decoded = jwt.verify(token, secret)
    decodedSub = decoded.sub || decoded.id || null

    const user = await User.findById(decoded.sub || decoded.id)
    if (!user) {
      console.warn('Authentication failed: token decoded but user not found', {
        method: req.method,
        path: req.originalUrl,
        tokenSource,
        decodedSub,
      })
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    req.authToken = token
    req.user = user
    req.signedInUser = sanitizeUser(user)
    return next()
  } catch (error) {
    console.error('Authentication error:', {
      method: req.method,
      path: req.originalUrl,
      tokenSource,
      decodedSub,
      name: error?.name,
      message: error?.message,
    })
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
