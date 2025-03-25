import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'mock-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
);

export interface Brand {
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