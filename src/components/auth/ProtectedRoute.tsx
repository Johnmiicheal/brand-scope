"use client"

import { ReactNode } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Loader2 } from 'lucide-react'

type ProtectedRouteProps = {
  children: ReactNode
  redirectTo?: string
}

/**
 * A component to protect routes that require authentication
 * Shows a loading spinner while checking auth state
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isLoading } = useAuthGuard(redirectTo)

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If not authenticated, the redirect happens in the hook
  // This component will unmount when the redirect happens
  // If we reach this point, the user is authenticated
  return <>{children}</>
} 