/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { supabase } from '@/lib/supabase';

export interface AIRanking extends Record<string, unknown> {
  entity_id: string;
  entity_type: 'brand' | 'competitor';
  llm_name: string;
  query: string;
  rank: number;
  score: number;
}

export async function createAIRanking(ranking: AIRanking) {
  try {
    // Note: Individual ranking creation is deprecated
    // Use the optimized structure through saveToSupabase in the Edge Function instead
    console.warn('createAIRanking is deprecated. Use optimized AI ranking sessions instead.');
    
    const { data, error } = await supabase
      .from('ai_rankings')
      .insert([ranking])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating AI ranking:', error);
    throw error;
  }
}

export async function getAIRankingsByEntityId(entityId: string) {
  try {
    // Try optimized structure first
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('ai_ranking_sessions')
      .select('rankings_data, analyzed_at, mode')
      .contains('rankings_data', JSON.stringify({ entity_id: entityId }));

    if (sessionsData && !sessionsError && sessionsData.length > 0) {
      // Extract rankings for this entity from all sessions
      const rankings: AIRanking[] = [];
      
      sessionsData.forEach(session => {
        if (session.rankings_data) {
          Object.values(session.rankings_data as Record<string, AIRanking[]>).forEach(queryRankings => {
            const entityRankings = queryRankings.filter(r => r.entity_id === entityId);
            rankings.push(...entityRankings);
          });
        }
      });
      
      return rankings;
    }

    // Fallback to old structure
    const { data, error } = await supabase
      .from('ai_rankings')
      .select('*')
      .eq('entity_id', entityId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI rankings:', error);
    throw error;
  }
}

export async function getAIRankingsByQuery(query: string) {
  try {
    // Try optimized structure first
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('ai_ranking_sessions')
      .select('rankings_data, analyzed_at, mode')
      .like('rankings_data', `%"${query}"%`);

    if (sessionsData && !sessionsError && sessionsData.length > 0) {
      // Extract rankings for this query from all sessions
      const rankings: AIRanking[] = [];
      
      sessionsData.forEach(session => {
        if (session.rankings_data && session.rankings_data[query]) {
          rankings.push(...(session.rankings_data[query] as AIRanking[]));
        }
      });
      
      return rankings;
    }

    // Fallback to old structure
    const { data, error } = await supabase
      .from('ai_rankings')
      .select('*')
      .eq('query', query);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI rankings:', error);
    throw error;
  }
} 