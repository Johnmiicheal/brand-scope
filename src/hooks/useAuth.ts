/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  stripe_subscription_id: string;
  price_id: string;
  status: string;
  query_count: number;
  monitoring_count: number;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Stripe.Product | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);


  useEffect(() => {
    const checkSubs = async (currentUser: User | null) => {
      if (!currentUser) return;
      
      try {
        const { data: fetchedSubscriptionData, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();
  
        if (subscriptionError) {
          if (subscriptionError.code === 'PGRST116') {
            setSubscription(null);
          } else {
            setSubscription(null);
          }
        } else {
          setSubscription(fetchedSubscriptionData as unknown as UserSubscription);
          
          // Safely fetch price and product data from server API
          try {
            const response = await fetch(`/api/stripe/subscription-info?priceId=${fetchedSubscriptionData.price_id}`);
            if (response.ok) {
              const { product } = await response.json();
              setProduct(product);
              console.log("Product: ", product);
            }
          } catch (error) {
            console.error('Error fetching subscription info:', error);
          }
        }
      } catch (e) {
        setSubscription(null);
      }
    };

    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
          setSession(session.access_token)
          if(!subscription){
            await checkSubs(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if(!user){
      getUser();
    }

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, product, subscription };
} 