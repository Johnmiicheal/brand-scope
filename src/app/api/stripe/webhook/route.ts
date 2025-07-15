/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Define custom interfaces for Stripe types that might have outdated typings
interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string;
}

interface StripeSubscriptionWithPeriodEnd extends Stripe.Subscription {
  current_period_end: number;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  console.log(`Webhook event received: ${event.type}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const priceId = session.metadata?.priceId;

      console.log('Checkout session completed:', session.id);
      console.log('User ID:', userId);
      console.log('Price ID:', priceId);
      console.log('Subscription:', session.subscription);

      if (userId && session.subscription) {
        // Store the subscription in your database
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            status: 'active',
            price_id: priceId,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          });

        if (error) {
          console.error('Error inserting subscription:', error);
          return NextResponse.json(
            { error: 'Error saving subscription' },
            { status: 500 }
          );
        }
        
        console.log('Subscription saved to database');
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      // Use the custom interface to access the subscription property
      const invoice = event.data.object as StripeInvoiceWithSubscription;
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        try {
          // Use any to bypass type checking issues
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
          
          // Update the subscription in your database
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_end: subscription.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              price_id: subscription.items.data[0].price.id,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Error updating subscription:', error);
            return NextResponse.json(
              { error: 'Error updating subscription' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error retrieving subscription:', error);
          return NextResponse.json(
            { error: 'Error retrieving subscription' },
            { status: 500 }
          );
        }
      }
      break;
    }
    case 'customer.subscription.updated': {
      // Use custom interface to access the current_period_end property
      const subscription = event.data.object as StripeSubscriptionWithPeriodEnd;
      
      // Update the subscription in your database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          price_id: subscription.items.data[0].price.id,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Error updating subscription' },
          { status: 500 }
        );
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Update the subscription in your database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error canceling subscription:', error);
        return NextResponse.json(
          { error: 'Error canceling subscription' },
          { status: 500 }
        );
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 