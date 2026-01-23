import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function RequireAuth({ roles }) {
  const { isAuthenticated, user, isAuthenticating } = useAuth()
  const location = useLocation()

  if (isAuthenticating) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
