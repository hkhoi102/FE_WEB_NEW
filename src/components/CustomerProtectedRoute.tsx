import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserAuth } from '@/contexts/UserAuthContext'

interface CustomerProtectedRouteProps {
  children: ReactNode
}

const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useUserAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default CustomerProtectedRoute


