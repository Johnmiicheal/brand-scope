/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { UserSubscription } from '@/hooks/useAuth'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

// Simple type for auth context
type AuthContextType = {
  user: User | null
  user_subscriptions: UserSubscription | null
  product: Stripe.Product | null
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
  const [user_subscriptions, setUserSubscriptions] = useState<UserSubscription | null>(null)
  const [product, setProduct] = useState<Stripe.Product | null>(null)
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

        // *** Handle user creation AFTER sign-in ***
        if (event === 'SIGNED_IN' && data.session?.user) {
          try {
            // Check if user exists
            const { data: existingUser, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('id', data.session?.user.id)
              .single();
  
            // Handle potential errors (excluding 'not found')
            if (userError && userError.code !== 'PGRST116') {
              console.error('Error checking user existence:', userError);
              // Maybe show a toast notification
              return;
            }
  
            // If user doesn't exist, create them
            if (!existingUser) {
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || null,
                  created_at: new Date().toISOString(),
                  plan_type: "free"
                });
  
              if (createError) {
                console.error('Error creating user record:', createError);
                // Maybe show a toast notification
              } else {
                 console.log('New user record created successfully.');
              }
            }
          } catch (checkCreateError) {
             console.error('Error during post-signin user check/create:', checkCreateError);
             // Maybe show a toast notification
          }
        }
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
            plan_type: 'free',
            created_at: new Date().toISOString(),
            user_type: metadata?.user_type
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

  useEffect(() => {
    const fetchUserSubscription = async (userId: string) => {
      try {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (subscriptionError) {
          if (subscriptionError.code === 'PGRST116') {
            // No subscription found
            return null;
          }
          throw subscriptionError;
        }

        // If subscription exists, get the associated Stripe product details
        if (subscriptionData?.price_id) {
          setUserSubscriptions(subscriptionData)
          try {
            const stripePrice = await stripe.prices.retrieve(subscriptionData.price_id);
            const stripeProduct = await stripe.products.retrieve(stripePrice.product as string);
            setProduct(stripeProduct)
          } catch (stripeError) {
            console.error('Error fetching Stripe details:', stripeError);
            // Return subscription data even if Stripe fetch fails
            return subscriptionData;
          }
        }

        return subscriptionData;
      } catch (error) {
        console.error('Error fetching user subscription:', error);
        toast({
          title: "Error fetching subscription",
          description: "Failed to load subscription details",
          variant: "destructive",
          duration: 3000,
        });
        return null;
      }
    }

    if (user) {
      fetchUserSubscription(user.id);
    }
  }, [user]);

  // Auth context value
  const value = {
    user,
    user_subscriptions,
    product,
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