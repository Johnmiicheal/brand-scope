import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// This route would be triggered by a scheduled job (e.g., using Vercel Cron Jobs)
export async function GET(req: Request) {
  try {
    // Verify secret to ensure only authorized callers can trigger this
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all brands that need daily analysis
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id')
      .not('website', 'is', null)
      .not('logo', 'is', null);
    
    if (error) {
      console.error('Error fetching brands:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // Process each brand (in a real implementation, this would be done in batches or with a queue)
    const results = [];
    
    for (const brand of brands) {
      try {
        // Call the analyze-brand API for each brand
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analyze-brand`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brandId: brand.id }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error(`Error analyzing brand ${brand.id}:`, error);
          results.push({ brandId: brand.id, status: 'error', message: error.error });
          continue;
        }
        
        const result = await response.json();
        results.push({ brandId: brand.id, status: 'success', data: result });
        
      } catch (err) {
        console.error(`Error processing brand ${brand.id}:`, err);
        results.push({ brandId: brand.id, status: 'error', message: 'Internal error' });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Daily analysis completed for ${results.filter(r => r.status === 'success').length} brands`,
      results,
    });
    
  } catch (error) {
    console.error('Error in daily analysis cron:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 