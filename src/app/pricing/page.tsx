'use client';

import { useEffect, useState } from 'react';
import { PricingCard } from '@/components/stripe/pricing-card';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();
  }, []);

  // Define pricing plans
  const plans = [
    {
      name: 'Free',
      description: 'Basic features for personal use',
      price: 'Free',
      priceId: 'free',
      features: [
        { text: 'Limited searches' },
        { text: 'Basic brand insights' },
        { text: 'Email support' },
      ],
    },
    {
      name: 'Pro',
      description: 'Advanced features for professionals',
      price: '$9.99',
      priceId: 'price_1234567890', // Replace with your actual Stripe price ID
      features: [
        { text: 'Unlimited searches' },
        { text: 'Advanced brand insights' },
        { text: 'Priority support' },
        { text: 'Custom reports' },
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Complete solution for businesses',
      price: '$29.99',
      priceId: 'price_0987654321', // Replace with your actual Stripe price ID
      features: [
        { text: 'Everything in Pro' },
        { text: 'API access' },
        { text: 'Dedicated account manager' },
        { text: 'Custom integrations' },
        { text: 'Team collaboration' },
      ],
    },
  ];

  return (
    <div className="container max-w-6xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that's right for you and start exploring brands today.
        </p>
      </div>

      {!user ? (
        <div className="text-center p-8 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Sign in to subscribe</h2>
          <p className="mb-4">You need to be signed in to subscribe to a plan.</p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              priceId={plan.priceId}
              userId={user.id}
              features={plan.features}
              popular={plan.popular}
            />
          ))}
        </div>
      )}
    </div>
  );
} 