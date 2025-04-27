/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/env/server';
import { SearchResults, AIRanking, SocialInsight, AnalysisMode, Recommendations } from '@/types/search';


// Initialize Supabase client
const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

// Fetch search results by search ID
export async function getSearchResultsBySearchId(search_id: string): Promise<SearchResults | null> {
  // Get AI rankings
  const { data: rankingsData, error: rankingsError } = await supabase
    .from('ai_rankings')
    .select('*')
    .eq('id', search_id);
  
  if (rankingsError || !rankingsData || rankingsData.length === 0) return null;
  
  // Get social insights if any
  const { data: insightsData, error: insightsError } = await supabase
    .from('social_insights')
    .select('*')
    .eq('search_id', search_id);
  
  if (insightsError) throw new Error(`Failed to fetch social insights: ${insightsError.message}`);
  
  return {
    search_id,
    mode: rankingsData[0].mode,
    mode_id: rankingsData[0].mode_id,
    ai_rankings: rankingsData as AIRanking[],
    social_insights: insightsData as SocialInsight[],
  };
}

// Fetch results by mode ID (to get all results from a specific mode run)
export async function getSearchResultsByModeId(mode_id: string): Promise<SearchResults | null> {
  // Get all AI rankings with this mode_id
  const { data: rankingsData, error: rankingsError } = await supabase
    .from('ai_rankings')
    .select('*')
    .eq('mode_id', mode_id);
  
  if (rankingsError || !rankingsData || rankingsData.length === 0) return null;
  
  // Get social insights if any
  const { data: insightsData } = await supabase
    .from('social_insights')
    .select('*')
    .eq('search_id', mode_id);

    const { data: recs } = await supabase.from('recommendations').select('*').eq('mode_id', mode_id)
  
  return {
    search_id: rankingsData[0].id,
    mode: rankingsData[0].mode,
    mode_id,
    ai_rankings: rankingsData as AIRanking[],
    social_insights: insightsData as SocialInsight[] || [],
    recommendations: recs as Recommendations
  };
}

// Fetch all search results for a user
export async function getUserSearchResults(user_id: string): Promise<SearchResults[]> {
  // Get all AI rankings for this user
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
    const firstRanking = rankings[0] as AIRanking;
    return {
      search_id: firstRanking.id,
      mode: firstRanking.mode as AnalysisMode,
      mode_id,
      ai_rankings: rankings as AIRanking[],
      social_insights: [], // We would need to fetch these separately if needed
    };
  });
} 