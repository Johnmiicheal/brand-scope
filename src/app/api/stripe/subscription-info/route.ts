import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get('priceId');

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Safely retrieve price and product data on the server
    const stripePrice = await stripe.prices.retrieve(priceId);
    const stripeProduct = await stripe.products.retrieve(stripePrice.product as string);

    return NextResponse.json({
      price: stripePrice,
      product: stripeProduct,
    });
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription info' },
      { status: 500 }
    );
  }
} 