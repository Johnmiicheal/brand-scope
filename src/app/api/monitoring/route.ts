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

  async function getSearchResultsByUserId(user_id: string, brand_id?: string) {
    console.log(`🔍 Fetching queries for user: ${user_id}, brand: ${brand_id || 'all'}`);
    
    let query = supabase
      .from('scheduled_queries')
      .select(`
       *
      `)
      .eq('user_id', user_id)
      .order('last_analysis_at', { ascending: false });

    // Server-side brand filtering if brand_id provided
    if (brand_id) {
      console.log(`🎯 Filtering by brand_id: ${brand_id}`);
      // attached_brand_id is an array field, use contains operator
      query = query.contains('attached_brand_id', [brand_id]);
    }

    const { data: monitoringData, error: monitoringError } = await query;

    if (monitoringError) {
      console.error('❌ Error fetching monitoring data:', monitoringError);
      return null;
    }

    if (!monitoringData || monitoringData.length === 0) {
      console.log('📭 No monitoring data found');
      return null;
    }

    console.log(`✅ Found ${monitoringData.length} queries`);
    
    return {
      search_id: monitoringData[0]?.id,
      mode: monitoringData[0]?.mode,
      monitoring: monitoringData,
    };
  }

  async function getSearchResultsByBrandId(brand_id: string) {
    console.log(`🎯 Fetching queries for brand_id: ${brand_id}`);
    
    // Get all monitoring searches for a brand - EXCLUDE massive results field
    const { data: monitoringData, error: monitoringError } = await supabase
      .from('scheduled_queries')
      .select(`
        *
      `)
      .contains('attached_brand_id', [brand_id])
      .order('last_analysis_at', { ascending: false });

    if (monitoringError) {
      console.error('❌ Error fetching brand monitoring data:', monitoringError);
      return null;
    }

    if (!monitoringData || monitoringData.length === 0) {
      console.log('📭 No monitoring data found for brand');
      return null;
    }

    console.log(`✅ Found ${monitoringData.length} queries for brand`);
    
    return {
      monitoring: monitoringData,
    };
  }

// Endpoint to fetch search results  
export async function GET(req: Request) {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const mode_id = searchParams.get('mode_id');
    const user_id = searchParams.get('user_id');
    const brand_id = searchParams.get('brand_id');
    
    console.log(`🚀 API /monitoring called with: mode_id=${mode_id}, user_id=${user_id}, brand_id=${brand_id}`);
    
    if (!mode_id && !user_id && !brand_id) {
      return NextResponse.json({ error: 'Missing mode_id, user_id, or brand_id parameter' }, { status: 400 });
    }
    
    try {
      let results;
      
      if (mode_id) {
        results = await getSearchResultsByModeId(mode_id);
      } else if (user_id) {
        // NEW: Support brand filtering for user queries  
        const brandFilter = searchParams.get('filter_brand_id');
        results = await getSearchResultsByUserId(user_id, brandFilter || undefined);
      } else if (brand_id) {
        results = await getSearchResultsByBrandId(brand_id);
      }
      
      if (!results) {
        console.log('❌ No results found');
        return NextResponse.json({ error: 'No results found' }, { status: 404 });
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ API completed in ${duration}ms, returning ${results.monitoring?.length || 0} queries`);
      
      return NextResponse.json(results);
    } catch (error) {
      console.error('❌ Error fetching search results:', error);
      return NextResponse.json({ error: 'Error fetching search results' }, { status: 500 });
    }
  }