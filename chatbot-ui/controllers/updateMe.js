import { sanitizeUser } from '../models/User.js'

export const updateMe = async (req, res) => {
  try {
    const { onboardingComplete } = req.body || {}

    if (typeof onboardingComplete !== 'boolean') {
      return res.status(400).json({ error: 'onboardingComplete must be a boolean.' })
    }

    req.user.onboardingComplete = onboardingComplete
    await req.user.save()

    return res.json({ user: sanitizeUser(req.user) })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Unable to update user.' })
  }
}
