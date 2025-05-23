'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setMessage('No session ID found');
      setLoading(false);
      return;
    }

    // Here you would typically verify the session with your backend
    // and update your database accordingly
    setLoading(false);
    setMessage('Payment successful! Your subscription is now active.');
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Thank you!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <Button asChild>
          <Link href="/dashboard">
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
