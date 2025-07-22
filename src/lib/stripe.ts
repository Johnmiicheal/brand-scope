import Stripe from 'stripe';

// Check for environment variables at runtime, not during module initialization
export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY!
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  
  return new Stripe(key, {
    apiVersion: '2025-04-30.basil',
    typescript: true,
  });
};

export const stripe = getStripe();

export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! as string;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined in environment variables');
  }
  return key;
};

export const clientStripe = getStripePublishableKey()
