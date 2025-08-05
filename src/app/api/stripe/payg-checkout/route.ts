import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPaygPackage, calculateCustomCreditPrice, getCustomCreditPricing } from '@/lib/constraints';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { packageId, customCredits, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let credits: number;
    let price: number; // in cents
    let productName: string;
    let description: string;

    if (packageId) {
      // Predefined package
      const paygPackage = getPaygPackage(packageId);
      if (!paygPackage) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        );
      }

      credits = paygPackage.credits;
      price = paygPackage.price;
      productName = paygPackage.name;
      description = paygPackage.description;
    } else if (customCredits) {
      // Custom credit amount
      const customPricing = getCustomCreditPricing();
      
      if (!customPricing.enabled) {
        return NextResponse.json(
          { error: 'Custom credit orders are not enabled' },
          { status: 400 }
        );
      }

      if (customCredits < customPricing.min_credits || customCredits > customPricing.max_credits) {
        return NextResponse.json(
          { error: `Custom credits must be between ${customPricing.min_credits} and ${customPricing.max_credits}` },
          { status: 400 }
        );
      }

      credits = customCredits;
      price = calculateCustomCreditPrice(customCredits);
      productName = `Custom Credit Pack - ${customCredits} Credits`;
      description = `${customCredits} credits at $${customPricing.price_per_credit} per credit`;

      if (price === 0) {
        return NextResponse.json(
          { error: 'Invalid custom credit amount' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either packageId or customCredits is required' },
        { status: 400 }
      );
    }

    console.log(`Creating pay-as-you-go checkout for user ${userId}:`, {
      packageId,
      customCredits,
      credits,
      price,
      productName
    });

    // Create a one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
              metadata: {
                type: 'payg_credits',
                credits: credits.toString(),
                package_id: packageId || 'custom',
              },
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payg_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payg_canceled=true`,
      metadata: {
        userId,
        packageId: packageId || 'custom',
        customCredits: customCredits ? customCredits.toString() : '',
        credits: credits.toString(),
        type: 'payg_credits',
      },
    });

    // Record the transaction in our database as pending
    const { error: transactionError } = await supabase
      .from('payg_transactions')
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        package_id: packageId || 'custom',
        credits_purchased: credits,
        amount_paid: price,
        status: 'pending'
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Continue anyway - webhook will handle it
    }

    console.log(`Pay-as-you-go checkout session created: ${session.id}`);
    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      credits,
      price: price / 100 // Return price in dollars
    });
  } catch (error) {
    console.error('Error creating pay-as-you-go checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}