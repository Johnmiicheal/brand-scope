"use client"

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

type PublicRouteProps = {
  children: ReactNode
  redirectTo?: string
}

/**
 * A component for public routes that shouldn't be accessed by authenticated users
 * Redirects authenticated users to the dashboard or specified route
 */
export function PublicRoute({ 
  children, 
  redirectTo = '/dashboard' 
}: PublicRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Only redirect after auth state is determined
    if (!isLoading && user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  // If user is authenticated, we'll redirect in the effect
  // If we reach this point and render content, it means the user is not authenticated
  return <>{children}</>
} 