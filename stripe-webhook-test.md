# Testing Stripe Webhooks Locally

To properly test Stripe webhooks locally, follow these steps:

## 1. Install Stripe CLI

First, install the Stripe CLI:

- **macOS**: `brew install stripe/stripe-cli/stripe`
- **Windows**: Download from [Stripe CLI GitHub releases](https://github.com/stripe/stripe-cli/releases/latest)
- **Linux**: Follow instructions at [Stripe CLI GitHub](https://github.com/stripe/stripe-cli#linux)

## 2. Login to Stripe

```bash
stripe login
```

Follow the prompts to authenticate with your Stripe account.

## 3. Forward Webhooks to Your Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret. Copy this value.

## 4. Set Environment Variables

Add the webhook signing secret to your `.env.local` file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_from_the_cli
```

Restart your Next.js server to apply the changes.

## 5. Test the Webhook

In a new terminal window, trigger a test webhook event:

```bash
stripe trigger checkout.session.completed
```

You can also test other events:

```bash
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## 6. Verify in the Console

Check your terminal where your Next.js app is running. You should see log messages from the webhook handler confirming that the events were received and processed.

## 7. Check Your Database

After triggering the `checkout.session.completed` event, check your database to confirm that a new subscription record was created.

## Troubleshooting

1. **Webhook not triggering**: Make sure your server is running and the webhook URL is correct
2. **Signature verification failing**: Ensure you're using the correct webhook secret
3. **Database errors**: Check your Supabase connection and table schema

Remember that the test events from `stripe trigger` use test data, not real customer data from your Stripe account. 