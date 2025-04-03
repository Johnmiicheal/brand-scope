/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
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

    if(!user){
      getInitialSession()
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
      //   setSession(currentSession)
      //   setUser(currentSession?.user || null)
        
      //   // Only redirect to dashboard on initial sign in, not on page changes
      //   if (event === 'SIGNED_IN' && currentSession && !session) {
      //     toast({
      //       title: "Signed in successfully",
      //       duration: 3000,
      //     })
      //     router.push('/dashboard')
      //   }
        
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // After successful OAuth sign in, check if user exists in users table
      if (data.user) {
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking user:', userError);
          throw new Error('Failed to verify user');
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || null,
              created_at: new Date().toISOString()
            });

          if (createError) {
            console.error('Error creating user record:', createError);
            throw new Error('Failed to create user record');
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error?.message || "Failed to sign in with Google",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (authError) {
        throw authError;
      }

      // Create user record in the users table
      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: metadata?.full_name || null,
            created_at: new Date().toISOString()
          });

        if (userError) {
          console.error('Error creating user record:', userError);
          throw new Error('Failed to create user record');
        }
      }
      
      toast({
        title: "Account created",
        description: "Check your email to confirm your account",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error?.message || "Failed to create account",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if(!error){
        setUser(null)
        setSession(null)
        router.push('/login')
      }
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