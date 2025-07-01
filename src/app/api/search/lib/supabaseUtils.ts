import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/env/server';
import { SearchResults, AIRanking, AnalysisMode, Summary, GoogleSearch, Search } from '@/types/search';


// Initialize Supabase client
const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

// Fetch search results by search ID (optimized)
export async function getSearchResultsBySearchId(search_id: string): Promise<SearchResults | null> {
  // Try optimized structure first
  const { data: sessionData, error: sessionError } = await supabase
    .from('ai_ranking_sessions')
    .select('*')
    .eq('id', search_id)
    .single();
  
  if (sessionData && !sessionError) {
    // Convert JSONB rankings back to array format
    const ai_rankings: AIRanking[] = [];
    
    if (sessionData.rankings_data) {
      Object.entries(sessionData.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
        ai_rankings.push(...rankings);
      });
    }
    
    return {
      search_id,
      mode: sessionData.mode,
      mode_id: sessionData.id,
      ai_rankings,
      search_results: [],
      searches: []
    };
  }
  
  // Fallback to old structure
  const { data: rankingsData, error: rankingsError } = await supabase
    .from('ai_rankings')
    .select('*')
    .eq('id', search_id);
  
  if (rankingsError || !rankingsData || rankingsData.length === 0) return null;

  return {
    search_id,
    mode: rankingsData[0].mode,
    mode_id: rankingsData[0].mode_id,
    ai_rankings: rankingsData as AIRanking[],
    search_results: [],
    searches: []
  };
}

// Fetch results by mode ID (optimized)
export async function getSearchResultsByModeId(mode_id: string): Promise<SearchResults | null> {
  // Try optimized structure first
  const { data: sessionData, error: sessionError } = await supabase
    .from('ai_ranking_sessions')
    .select('*')
    .eq('id', mode_id)
    .single();
  
  if (sessionData && !sessionError) {
    // Convert JSONB rankings back to array format
    const ai_rankings: AIRanking[] = [];
    
    if (sessionData.rankings_data) {
      Object.entries(sessionData.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
        ai_rankings.push(...rankings);
      });
    }
    
    // Get related data
    const { data: summs } = await supabase.from('ai_summary').select('*').eq('mode_id', mode_id);
    const { data: searches } = await supabase.from('searches').select('*').eq('monitoring_id', mode_id);
    const { data: search_results } = await supabase.from('search_results').select('*').eq('mode_id', mode_id);
    
    return {
      search_id: mode_id,
      mode: sessionData.mode,
      mode_id,
      ai_rankings,
      summary: summs as Summary[],
      search_results: search_results as GoogleSearch[],
      searches: searches as Search[]
    };
  }
  
  // Fallback to old structure
  const { data: rankingsData, error: rankingsError } = await supabase
    .from('ai_rankings')
    .select('*')
    .eq('mode_id', mode_id);
  
  if (rankingsError || !rankingsData || rankingsData.length === 0) return null;

  const { data: summs } = await supabase.from('ai_summary').select('*').eq('mode_id', mode_id);
  const { data: searches } = await supabase.from('searches').select('*').eq('monitoring_id', mode_id);
  const { data: search_results } = await supabase.from('search_results').select('*').eq('mode_id', mode_id);
  
  return {
    search_id: rankingsData[0].id,
    mode: rankingsData[0].mode,
    mode_id,
    ai_rankings: rankingsData as AIRanking[],
    summary: summs as Summary[],
    search_results: search_results as GoogleSearch[],
    searches: searches as Search[]
  };
}

// Fetch all search results for a user (optimized)
export async function getUserSearchResults(user_id: string): Promise<SearchResults[]> {
  // Try optimized structure first
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('ai_ranking_sessions')
    .select('*')
    .eq('user_id', user_id)
    .order('analyzed_at', { ascending: false });
  
  if (sessionsData && !sessionsError && sessionsData.length > 0) {
    return sessionsData.map((session): SearchResults => {
      // Convert JSONB rankings back to array format
      const ai_rankings: AIRanking[] = [];
      
      if (session.rankings_data) {
        Object.entries(session.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
          ai_rankings.push(...rankings);
        });
      }
      
      return {
        search_id: session.id,
        mode: session.mode as AnalysisMode,
        mode_id: session.id,
        ai_rankings,
        search_results: [],
        searches: []
      };
    });
  }
  
  // Fallback to old structure
  const { data: rankingsData, error: rankingsError } = await supabase
    .from('ai_rankings')
    .select('*')
    .eq('user_id', user_id)
    .order('analyzed_at', { ascending: false });
  
  if (rankingsError || !rankingsData || rankingsData.length === 0) return [];
  
  // Group rankings by mode_id
  const modeGroups = rankingsData.reduce((acc, ranking) => {
    if (!acc[ranking.mode_id]) {
      acc[ranking.mode_id] = [];
    }
    acc[ranking.mode_id].push(ranking);
    return acc;
  }, {} as Record<string, AIRanking[]>);
  
  // Create SearchResults for each mode group
  return Object.entries(modeGroups).map(([mode_id, rankings]): SearchResults => {
    // Ensure rankings is properly typed
    const typedRankings = rankings as AIRanking[];
    const firstRanking = typedRankings[0];
    return {
      search_id: firstRanking.id,
      mode: firstRanking.mode as AnalysisMode,
      mode_id,
      ai_rankings: rankings as AIRanking[],
      search_results: [],
      searches: []
    };
  });
} 