# Stripe Integration

This document explains how to set up and use the Stripe integration in your application.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update with your production URL
```

## Setting Up Stripe Products and Prices

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create Products and Prices for your subscription plans
3. Note the Price IDs (e.g., `price_abc123`)

## Using the Checkout Button

Import and use the `CheckoutButton` component in your pricing or checkout page:

```tsx
import { CheckoutButton } from '@/components/stripe/checkout-button';

// In your component
<CheckoutButton 
  priceId="your_price_id_here"
  className="w-full"
>
  Subscribe Now
</CheckoutButton>
```

## Webhook Setup

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Use the webhook secret provided by the CLI in your `.env.local` file

## Testing

- Use test card numbers from Stripe: https://stripe.com/docs/testing#cards
- For webhook testing, use the Stripe CLI to trigger test events:
  ```bash
  stripe trigger payment_intent.succeeded
  ```

## Implementation Details

- Checkout session creation: `/api/create-checkout-session/route.ts`
- Webhook handler: `/api/webhooks/stripe/route.ts`
- Success page: `/app/success/page.tsx`
- Checkout button component: `/components/stripe/checkout-button.tsx`
- Stripe utilities: `/lib/stripe.ts`
