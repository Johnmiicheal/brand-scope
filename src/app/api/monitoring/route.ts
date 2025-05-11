import { serverEnv } from "@/env/server";
import { GoogleSearch } from "@/types/search";
import { Search } from "@/types/search";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);


async function getSearchResultsByModeId(mode_id: string) {
    // Get all AI rankings with this mode_id
    const { data: monitoringData, error: monitoringError } = await supabase
      .from('scheduled_queries')
      .select('*')
      .eq('mode_id', mode_id);

      const { data: searches } = await supabase.from('searches').select('*').eq('monitoring_id', mode_id)
      const { data: search_results } = await supabase.from('search_results').select('*').eq('mode_id', mode_id)
    
    if (monitoringError || !monitoringData || monitoringData.length === 0) return null;
    
    return {
      search_id: monitoringData[0].id,
      mode: monitoringData[0].mode,
      mode_id,
      monitoring: monitoringData,
      search_results: search_results as GoogleSearch[],
      searches: searches as Search[]
    };
  }

  async function getSearchResultsByUserId(user_id: string) {
    // Get all monitoring searches for a user
    const { data: monitoringData, error: monitoringError } = await supabase
      .from('scheduled_queries')
      .select('*')
      .eq('user_id', user_id)
      .order('last_analysis_at', { ascending: false });

    if (monitoringError || !monitoringData || monitoringData.length === 0) return null;
    
    return {
      search_id: monitoringData[0].id,
      mode: monitoringData[0].mode,
      monitoring: monitoringData,
    };
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
        results = await getSearchResultsByUserId(user_id);
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