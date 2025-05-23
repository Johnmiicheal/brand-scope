# Stripe Environment Variables Setup

To use the Stripe integration, you need to set up the following environment variables in your `.env.local` file:

```env
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to get these values:

1. **STRIPE_SECRET_KEY**: Find this in your Stripe Dashboard under Developers > API keys
2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Find this in your Stripe Dashboard under Developers > API keys
3. **STRIPE_WEBHOOK_SECRET**: Create a webhook endpoint in your Stripe Dashboard under Developers > Webhooks and use the signing secret

## Setting up Stripe webhook locally:

To test webhooks locally, you can use the Stripe CLI:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run `stripe login` to authenticate
3. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` to forward webhook events to your local server

## Important notes:

- Make sure to restart your Next.js server after updating environment variables
- Use test keys for development and live keys for production
- Keep your secret key and webhook secret secure and never expose them in client-side code 