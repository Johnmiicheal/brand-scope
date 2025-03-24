"use client"

import { createContext, useContext, ReactNode } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SupabaseContextType {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabaseState = useSupabase();

  return (
    <SupabaseContext.Provider value={supabaseState}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseContext() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider');
  }
  return context;
} 