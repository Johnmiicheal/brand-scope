import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'mock-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'
);

export type AnalysisMode = 'DeepFocus' | 'Voyager' | 'Explorer';

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
}

export interface SocialMetrics {
  platform: string;
  mentions: number;
  sentiment: SentimentScore;
  trending_topics: string[];
  engagement_rate: number;
}

export interface CompetitorAnalysis {
  competitor_name: string;
  market_share?: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  sentiment: SentimentScore;
}

export interface BrandAnalysis {
  id?: string;
  brand_id: string;
  user_id: string;
  mode: AnalysisMode;
  query: string;
  analysis_date: string;
  overall_sentiment: SentimentScore;
  key_findings: string[];
  recommendations: string[];
  social_metrics?: SocialMetrics[];
  competitor_analysis?: CompetitorAnalysis[];
  industry_trends?: string[];
  citations?: string[];
  model_used: string[];
}

export async function createBrandAnalysis(analysis: BrandAnalysis) {
  try {
    const { data, error } = await supabase
      .from('brand_analysis')
      .insert([analysis])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating brand analysis:', error);
    throw error;
  }
}

export async function getBrandAnalysisByBrandId(brandId: string) {
  try {
    const { data, error } = await supabase
      .from('brand_analysis')
      .select('*')
      .eq('brand_id', brandId)
      .order('analysis_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching brand analysis:', error);
    throw error;
  }
}

export async function getBrandAnalysisById(id: string) {
  try {
    const { data, error } = await supabase
      .from('brand_analysis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching brand analysis:', error);
    throw error;
  }
} 