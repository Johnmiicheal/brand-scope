/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient, User } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function CheckoutSuccess() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking subscription status...');
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        if (success && sessionId) {
          // Check if the subscription was saved to the database
          const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (error) {
            console.error('Error checking subscription:', error);
            setStatus('error');
            setMessage('Could not verify your subscription. Please contact support.');
            return;
          }
          
          if (data) {
            setStatus('success');
            setMessage('Your subscription was successful! You now have access to premium features.');
          } else {
            // If no subscription is found, it might be that the webhook hasn't processed yet
            setStatus('loading');
            setMessage('Processing your subscription. This may take a moment...');
            
            // Check again after a delay
            setTimeout(checkAuth, 5000);
          }
        } else if (canceled) {
          setStatus('error');
          setMessage('You canceled the checkout process. Your subscription was not completed.');
        }
      }
    };
    
    checkAuth();
  }, [success, canceled, sessionId, supabase]);
  
  if (!success && !canceled) {
    return null;
  }
  
  return (
    <Alert className={`mb-6 ${status === 'success' ? 'bg-green-50 border-green-200' : 
                             status === 'error' ? 'bg-red-50 border-red-200' : 
                             'bg-blue-50 border-blue-200'}`}>
      {status === 'loading' ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      ) : status === 'success' ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <AlertTitle>
        {status === 'success' ? 'Payment Successful' : 
         status === 'error' ? 'Payment Failed' : 
         'Processing Payment'}
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
} 