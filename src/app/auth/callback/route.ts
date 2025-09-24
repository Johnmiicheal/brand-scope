import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Auth callback route for handling OAuth redirects
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard/search' // Default redirect to dashboard

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options)
          },
          remove(name: string) {
            cookieStore.delete(name);
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      try {
        // Get user data after successful authentication
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Check if user already exists in the users table
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            // Log error but continue (PGRST116 means no rows returned)
            console.error('Error checking for existing user:', fetchError)
          }
          
          // If user doesn't exist, insert into users table
          if (!existingUser) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                created_at: new Date().toISOString(),
                plan_type: 'free'
              })
            
            if (insertError) {
              console.error('Error inserting new user:', insertError)
            } else {
              console.log('User successfully created in users table')
            }
          } else {
            // Update last sign in time for existing users
            const { error: updateError } = await supabase
              .from('users')
              .update({ last_sign_in: new Date().toISOString() })
              .eq('id', user.id)
            
            if (updateError) {
              console.error('Error updating last_sign_in:', updateError)
            }
          }
        }
      } catch (err) {
        console.error('Error in user management:', err)
        // Continue with redirect despite errors in user management
      }
      
      // Redirect based on 'next' parameter or default
      return NextResponse.redirect(`https://usebrandscope.vercel.app${next}`)
    } else {
      console.error("Auth Callback Error:", error.message)
      // Optionally redirect to an error page
      return NextResponse.redirect(`https://usebrandscope.vercel.app/login`)
    }
  }

  // return the user to an error page with instructions
  console.error("Auth Callback Error: No code received or exchange failed.")
  return NextResponse.redirect(`https://usebrandscope.vercel.app/login`)
} 