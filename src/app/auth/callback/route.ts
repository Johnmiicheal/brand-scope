import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route for handling OAuth redirects
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  
  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth', request.url));
  }
  
  // Exchange code for session if code is present
  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=exchange', request.url));
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 