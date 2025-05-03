/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // Optional: Secure the endpoint with a secret token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch queries where next_analysis_at is due
    const { data: queries, error } = await supabase
      .from('scheduled_queries')
      .select('id, query, frequency, mode, user_id')
      .lte('next_analysis_at', new Date().toISOString())
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching queries:', error);
      return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 });
    }

    console.log(`Found ${queries.length} queries to process`);

    // Process each query by calling the processQuery endpoint
    const results = [];
    for (const query of queries) {
      console.log(`Processing query ID: ${query.id}`);
      const response = await fetch(
        `${process.env.BASE_SYSTEM_URL}/api/schedule-query`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      results.push({ queryId: query.id, result });
      if (!response.ok) {
        console.error(`Failed to process query ${query.id}:`, result);
      }
    }

    return NextResponse.json({
      message: `Processed ${queries.length} queries`,
      results,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}