import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'mock-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
);

export interface AIRanking {
  entity_id: string;
  entity_type: 'brand' | 'competitor';
  llm_name: string;
  query: string;
  rank: number;
  score: number;
}

export async function createAIRanking(ranking: AIRanking) {
  try {
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