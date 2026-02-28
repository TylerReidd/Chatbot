import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { getDashboardPath, Roles } from '../utils/roles.js'

export default function SignupPage() {
  const { signup, isAuthenticated, isAuthenticating } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const [step, setStep] = useState(1)
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Roles.EMPLOYEE,
  })
  const [error, setError] = useState(null)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const canGoNextFromStep1 = () => {
    const { name, email, password, confirmPassword } = formValues
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return false
    if (password.length < 8) return false
    if (password !== confirmPassword) return false
    return true
  }

  const handleNext = (event) => {
    event.preventDefault()
    setError(null)

    if (!canGoNextFromStep1()) {
      setError('Please fill in all fields and make sure passwords match (min 8 characters).')
      return
    }

    setStep(2)
  }

  const handleBack = (event) => {
    event.preventDefault()
    setError(null)
    setStep(1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    try {
    await signup({
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
      role: formValues.role,
    })

    if (formValues.role === Roles.MANAGER) {
      navigate(getDashboardPath(Roles.MANAGER), {replace: true})
      return
    }

    navigate('/onboarding', {replace: true})
  } catch (err) {
    console.error(err)
    setError(err.message)
  }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Create your account</h1>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Step {step} of 2
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {step === 1 && (
          <form className="space-y-4" onSubmit={handleNext}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formValues.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formValues.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formValues.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formValues.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Re-type your password"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Continue
            </button>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
              <p className="font-medium mb-2">Review your details</p>
              <p><span className="font-semibold">Name:</span> {formValues.name}</p>
              <p><span className="font-semibold">Email:</span> {formValues.email}</p>
              <p><span className="font-semibold">Role:</span> {formValues.role === Roles.MANAGER ? 'Manager' : 'Employee'}</p>
              <p className="mt-2 text-xs text-slate-500">
                Your password won&apos;t be shown here, but it&apos;ll be securely stored.
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Account role
              </label>
              <select
                id="role"
                name="role"
                value={formValues.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value={Roles.EMPLOYEE}>Employee</option>
                <option value={Roles.MANAGER}>Manager</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/3 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
