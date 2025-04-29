/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optional: Secure the endpoint with a secret token
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch queries where next_analysis_at is due
    const { data: queries, error } = await supabase
      .from('scheduled_queries')
      .select('id, query, frequency, mode')
      .lte('next_analysis_at', new Date().toISOString())
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching queries:', error);
      return res.status(500).json({ error: 'Failed to fetch queries' });
    }

    console.log(`Found ${queries.length} queries to process`);

    // Process each query by calling the processQuery endpoint
    const results = [];
    for (const query of queries) {
      console.log(`Processing query ID: ${query.id}`);
      const response = await fetch(
        `${process.env.BASE_SYSTEM_URL}/api/schedule-query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: query.id,
            query: query.query,
            frequency: query.frequency,
            mode: query.mode,
            now: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();
      results.push({ queryId: query.id, result });
      if (!response.ok) {
        console.error(`Failed to process query ${query.id}:`, result);
      }
    }

    return res.status(200).json({
      message: `Processed ${queries.length} queries`,
      results,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}