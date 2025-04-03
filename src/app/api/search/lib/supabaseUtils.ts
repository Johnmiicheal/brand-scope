/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/env/server';
import { SearchResults, AIRanking, SocialInsight, AnalysisMode } from '@/types/search';


// Initialize Supabase client
const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

// Save search results to Supabase
export async function saveToSupabase(results: SearchResults, user_id: string): Promise<void> {
  // First, create brand records for each brand in the rankings
  const brandPromises = results.ai_rankings.map(async (ranking) => {
    // The entity_id contains the brand name from the AI response
    const brandName = ranking.entity_name;
    
    // Create brand record with the user_id from the ranking
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        name: brandName,
        industry: 'Technology', // We should extract this from the query or AI response
        user_id: user_id, // This should be a valid UUID from the users table
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (brandError) {
      console.error('Brand creation error:', brandError);
      throw new Error(`Failed to create brand: ${brandError.message}`);
    }
    return brand.id;
  });

  const brandIds = await Promise.all(brandPromises);

  // Transform AI rankings to match the table schema
  const aiRankingsToSave = results.ai_rankings.map((ranking, index) => ({
    id: ranking.id,
    entity_id: brandIds[index].toString(), // Use the brand ID as entity_id
    entity_name: ranking.entity_name,
    entity_type: ranking.entity_type || 'brand' as const, // Default to 'brand' type
    user_id: ranking.user_id.toString(),
    llm_name: ranking.llm_name || 'groq-llama-3.3-70b-versatile', // Default LLM name
    query: ranking.query,
    rank: ranking.rank,
    score: ranking.score,
    mode: results.mode,
    mode_id: results.mode_id.toString(),
    analyzed_at: new Date().toISOString(),
    reasoning: ranking.reasoning,
  }));

  console.log("aiRankingsToSave:", JSON.stringify(aiRankingsToSave, null, 2));

  // Save AI rankings
  const { error: rankingsError } = await supabase
    .from('ai_rankings')
    .insert(aiRankingsToSave);

  if (rankingsError) {
    console.error('AI Rankings save failed:', rankingsError);
    throw new Error(`AI Rankings save failed: ${rankingsError.message}`);
  }

  const socialInsightsToSave = results.social_insights?.map((insights, index) => ({
    id: insights.id,
    entity_id: brandIds[index].toString(),
    entity_name: insights.entity_name,
    entity_type: insights.entity_type || 'brand', // Default to 'brand' type
    user_id: insights.user_id.toString(),
    search_id: results.mode_id.toString(),
    platform: insights.platform || 'X', // Default platform
    keyword: insights.keyword || '', // Default to empty string if not provided
    mention_count: insights.mention_count || 0, // Default to 0 if not provided
    sentiment: insights.sentiment || 'neutral', // Default to 'neutral' if not provided
    data_fetched_at: new Date().toISOString(),
  }))

  // Save social insights if available
  if (results.social_insights && results.social_insights.length > 0) {
    const { error: socialError } = await supabase
      .from('social_insights')
      .insert(socialInsightsToSave);
    
    if (socialError) throw new Error(`Social Insights save failed: ${socialError.message}`);
  }
}

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
    .eq('search_id', rankingsData[0].id);
  
  return {
    search_id: rankingsData[0].id,
    mode: rankingsData[0].mode,
    mode_id,
    ai_rankings: rankingsData as AIRanking[],
    social_insights: insightsData as SocialInsight[] || [],
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