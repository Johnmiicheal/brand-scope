/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

// Simple type for auth context
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
}

// Create context with default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth and set up listeners
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true)
      
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user || null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user || null)
        
        if (event === 'SIGNED_IN' && currentSession) {
          toast({
            title: "Signed in successfully",
            duration: 3000,
          })
          router.push('/dashboard')
        }
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            duration: 3000,
          })
          router.push('/login')
        }
      }
    )

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if(data){
        setUser(data.user);
        setSession(data.session)
      }
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error?.message || "Failed to sign in",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error?.message || "Failed to sign in with Google",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Account created",
        description: "Check your email to confirm your account",
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error?.message || "Failed to create account",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error?.message || "Failed to sign out",
        variant: "destructive",
        duration: 3000,
      })
      throw error
    }
  }

  // Auth context value
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
} 