import { z } from 'zod';

// Define analysis modes
export const analysisModes = ['DeepFocus', 'Voyager', 'Explorer'] as const;
export type AnalysisMode = typeof analysisModes[number];

// Supported LLM models
export const supportedModels = [
  'llama-3.3-70b-versatile',
  'mistral-saba-24b',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b',
  'qwen-2.5-32b'
] as const;
export type SupportedModel = typeof supportedModels[number];

// DB-compatible result schemas
export const aiRankingSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string(),
  entity_type: z.enum(['brand', 'competitor']),
  user_id: z.string().uuid(),
  llm_name: z.string(),
  query: z.string(),
  rank: z.number().nullable(),
  score: z.number().default(0),
  reasoning: z.string().optional(),
  mode: z.enum(analysisModes),
  mode_id: z.string().uuid(),
  analyzed_at: z.string().datetime(),
});

export type AIRanking = z.infer<typeof aiRankingSchema>;

export const socialInsightSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string(),
  entity_type: z.enum(['brand', 'competitor']),
  user_id: z.string().uuid(),
  search_id: z.string().uuid(),
  platform: z.string().default('X'),
  keyword: z.string().nullable(),
  mention_count: z.number(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).nullable(),
  data_fetched_at: z.string().datetime(),
});

export type SocialInsight = z.infer<typeof socialInsightSchema>;

export const chartDataSchema = z.object({
  keyword: z.string(),
  trend_points: z.array(z.object({ date: z.string(), value: z.number() })),
});

export type ChartData = z.infer<typeof chartDataSchema>;

export const competitorComparisonSchema = z.object({
  competitor: z.string(),
  competitor_id: z.string().uuid(),
  ranking_diff: z.number(),
  analysis: z.string().optional(),
});

export type CompetitorComparison = z.infer<typeof competitorComparisonSchema>;

export interface SearchResults {
  search_id: string;
  mode: AnalysisMode;
  mode_id: string;
  ai_rankings: AIRanking[];
  social_insights?: SocialInsight[];
  charts?: ChartData[];
  comparisons?: CompetitorComparison[];
} 