/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { deepFocusAnalysis } from './lib/deepFocusAnalysis';
import { voyagerAnalysis } from './lib/voyagerAnalysis';
import { explorerAnalysis } from './lib/explorerAnalysis';
import { getSearchResultsByModeId, getUserSearchResults, saveToSupabase } from './lib/supabaseUtils';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define analysis modes
const analysisModes = ['DeepFocus', 'Voyager', 'Explorer'] as const;
type AnalysisMode = typeof analysisModes[number];

// // Max duration for streaming
// export const maxDuration = 60;

// Request validation schema
const searchRequestSchema = z.object({
  mode: z.enum(analysisModes),
  user_id: z.string().uuid(),
  query: z.string(),
  competitors: z.array(z.string()).optional(),
});

// Main POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Validate request body
    const { mode, user_id, query, competitors } = searchRequestSchema.parse(body);

    // Generate shared IDs for this search session
    const mode_id = uuidv4();
    const search_id = uuidv4();

    // Run mode-specific analysis
    let results;
    try {
      if (mode === 'DeepFocus') {
        results = await deepFocusAnalysis(user_id, query, mode_id, search_id);
      } else if (mode === 'Voyager') {
        results = await voyagerAnalysis(user_id, query, mode_id, search_id);
      } else if (mode === 'Explorer') {
        if (!competitors || competitors.length === 0) {
          return NextResponse.json({ error: 'Explorer mode requires competitors' }, { status: 400 });
        }
        results = await explorerAnalysis([query], user_id, [query], competitors, mode_id, search_id);
      } else {
        // Handle the case where mode is invalid despite schema validation
        return NextResponse.json({ error: 'Invalid analysis mode' }, { status: 400 });
      }
    } catch (analysisError) {
      console.error('Error in analysis:', analysisError);
      return NextResponse.json({ 
        error: 'Analysis failed', 
        details: analysisError instanceof Error ? analysisError.message : 'Unknown analysis error'
      }, { status: 500 });
    }

    // Ensure results exist
    if (!results) {
      return NextResponse.json({ error: 'Analysis returned no results' }, { status: 500 });
    }

    // Save results to Supabase
    try {
      await saveToSupabase(results, user_id);
    } catch (saveError) {
      console.error('Error saving to Supabase:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save results', 
        details: saveError instanceof Error ? saveError.message : 'Unknown save error'
      }, { status: 500 });
    }

    // Return a streaming response with the search ID
    return NextResponse.json({ 
      success: true, 
      message: `Analysis complete for mode ${mode}. Results have been stored with search ID: ${mode_id}`,
      mode_id
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Endpoint to fetch search results
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode_id = searchParams.get('mode_id');
  const user_id = searchParams.get('user_id');
  
  if (!mode_id && !user_id) {
    return NextResponse.json({ error: 'Missing mode_id, or user_id parameter' }, { status: 400 });
  }
  
  try {
    let results;
    if (mode_id) {
      results = await getSearchResultsByModeId(mode_id);
    } else if (user_id) {
      results = await getUserSearchResults(user_id);
    }
    
    if (!results) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching search results:', error);
    return NextResponse.json({ error: 'Error fetching search results' }, { status: 500 });
  }
}