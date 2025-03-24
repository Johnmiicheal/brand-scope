"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * A simple hook to protect routes that require authentication
 * @param redirectTo Where to redirect if user is not authenticated
 * @returns Auth state with user and loading information
 */
export function useAuthGuard(redirectTo: string = '/login') {
  const { session, user, isLoading } = useAuth()
  const router = useRouter()
  console.log(user, session)

  useEffect(() => {
    // Only run after the auth state has been determined (not loading)
    if (!isLoading) {
      // If no user is found, redirect to login
      if (!session) {
        router.push(redirectTo)
      }
    }
  }, [session, isLoading, router, redirectTo])

  return {
    user,
    isAuthenticated: !!user,
    isLoading
  }
} 