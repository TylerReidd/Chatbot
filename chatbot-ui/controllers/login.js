import { User, sanitizeUser } from '../models/User.js'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const passwordMatches = await user.comparePassword(password)
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = user.generateAuthToken()
    return res.json({
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Unable to process login request.' })
  }
}
