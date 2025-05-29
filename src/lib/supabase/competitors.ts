import { supabase } from '@/lib/supabase';

export interface Competitor extends Record<string, unknown> {
  name: string;
  industry?: string;
  website?: string;
  brand_id: string;
  user_id: string;
}

export async function createCompetitor(competitor: Competitor) {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .insert([competitor])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating competitor:', error);
    throw error;
  }
}

export async function getCompetitorsByBrandId(brandId: string) {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('brand_id', brandId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching competitors:', error);
    throw error;
  }
}

export async function getCompetitorById(id: string) {
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching competitor:', error);
    throw error;
  }
} 