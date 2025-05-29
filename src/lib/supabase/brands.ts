import { supabase } from '@/lib/supabase';

export interface Brand extends Record<string, unknown> {
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  user_id: string;
}

export async function createBrand(brand: Brand) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .insert([brand])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
}

export async function getBrandsByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}

export async function getBrandById(id: string) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching brand:', error);
    throw error;
  }
} 