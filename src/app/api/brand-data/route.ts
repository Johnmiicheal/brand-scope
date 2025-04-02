/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: `User ID is required, provided ${userId}` }, { status: 400 });
    }

    // Verify the brand belongs to the user and has logo_url and website
    const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', userId)
    .not('logo_url', 'is', null)
    .not('website', 'is', null)
    .single();

    const brandId = brand?.id!
    
    if (brandError || !brand) {
      return NextResponse.json({ error: `Brand with id ${userId} not found` }, { status: 404 });
    }
    if (!brandId) {
      return NextResponse.json({ error: `Brand ID is required, provided ${brandId}` }, { status: 400 });
    }

    // Fetch all data in parallel
    const [
      { data: metrics, error: metricsError },
      { data: competitors, error: competitorsError },
      { data: keywords, error: keywordsError }
    ] = await Promise.all([
      supabase
        .from('brand_metrics')
        .select('*')
        .eq('brand_id', brandId)
        .order('analyzed_at', { ascending: false })
        .limit(1),
      supabase
        .from('competitors')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false }),
      supabase
        .from('keywords')
        .select('*')
        .eq('entity_id', brandId)
        .eq('entity_type', 'brand')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    if (metricsError || competitorsError || keywordsError) {
      throw new Error('Failed to fetch data');
    }

    return NextResponse.json({
      data: {
        brand,
        metrics: metrics?.[0],
        competitors,
        keywords,
      },
    });
  } catch (error) {
    console.error('Error fetching brand data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand data' },
      { status: 500 }
    );
  }
} 