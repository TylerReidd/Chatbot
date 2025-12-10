import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiBase } from '../utils/api.js'

const TOKEN_KEY = 'auth.token'
const USER_KEY = 'auth.user'
const hasWindow = typeof window !== 'undefined'

const readStoredUser = () => {
  if (!hasWindow) return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_err) {
    window.localStorage.removeItem(USER_KEY)
    return null
  }
}

const persistSession = (token, user) => {
  if (!hasWindow) return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(USER_KEY)
  }
}

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => (hasWindow ? window.localStorage.getItem(TOKEN_KEY) : null))
  const [user, setUser] = useState(readStoredUser)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async ({ email, password }) => {
    if (!email || !password) {
      const message = 'Email and password are required.'
      setError(message)
      throw new Error(message)
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to login.')
      }

      persistSession(payload.token, payload.user)
      setToken(payload.token)
      setUser(payload.user)
      return payload
    } catch (err) {
      const message = err.message || 'Unable to login.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  const logout = useCallback(() => {
    persistSession(null, null)
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAuthenticating,
      error,
      login,
      logout,
      clearError,
    }),
    [token, user, isAuthenticating, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
