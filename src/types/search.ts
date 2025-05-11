/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

// Define analysis modes
export const analysisModes = ['Voyager', 'Explorer'] as const;
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
  entity_name: z.string(),
  entity_type: z.enum(['brand', 'competitor']),
  user_id: z.string().uuid(),
  llm_name: z.string(),
  query: z.string(),
  rank: z.number().nullable(),
  score: z.number().default(0),
  reasoning: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).nullable(),
  mode: z.enum(analysisModes),
  mode_id: z.string().uuid(),
  analyzed_at: z.string().datetime(),
  is_monitoring: z.boolean().default(false)
});

export type AIRanking = z.infer<typeof aiRankingSchema>;

export const socialInsightSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_name: z.string(),
  entity_type: z.enum(['brand', 'competitor']),
  user_id: z.string().uuid(),
  search_id: z.string().uuid(),
  platform: z.string().default('X'),
  keyword: z.string().nullable(),
  mention_count: z.number(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).nullable(),
  data_fetched_at: z.string().datetime(),
  links: z.string().array()
});

export type SocialInsight = z.infer<typeof socialInsightSchema>;

export const chartDataSchema = z.object({
  keyword: z.string(),
  trend_points: z.array(z.object({ date: z.string(), value: z.number() })),
});

export interface Summary {
  id: string
  model: string
  summary: string
  query: string
  mode_id: string
  reasoning: string
  created_at: string
}

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
  summary?: Summary[]
  search_results: GoogleSearch[];
  searches: Search[];
} 

export interface Search {
  id: string;
  user_id?: string;
  query: string;
  engine: string;
  brand_name?: string;
  monitoring_id?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoogleSearch {
  id: string;
  search_id?: string;
  engine: string;
  results: any; // jsonb type
  ai_overview?: string;
  created_at?: string;
  mode_id?: string;
  rankings: any;
}


export interface GoogleSearchResult {
  search_metadata: SearchMetadata;
  search_parameters: SearchParameters;
  search_information: SearchInformation;
  knowledge_graph: KnowledgeGraph;
  inline_videos: InlineVideo[];
  inline_images: {
    thumbnail: string;
  }[];
  related_questions: RelatedQuestion[];
  ai_overview: AIOverview;
  answer_box: AnswerBox;
  organic_results: OrganicResult[];
  perspectives: Perspective[];
  top_stories_link: string;
  top_stories_serpapi_link: string;
  related_searches: RelatedSearch[];
  discussions_and_forums: DiscussionForum[];
  pagination: Pagination;
}

interface SearchMetadata {
  id: string;
  status: string;
  json_endpoint: string;
  created_at: string;
  processed_at: string;
  google_url: string;
  raw_html_file: string;
  total_time_taken: number;
}

interface SearchParameters {
  engine: string;
  q: string;
  location_requested: string;
  location_used: string;
  google_domain: string;
  hl: string;
  gl: string;
  device: string;
}

interface SearchInformation {
  query_displayed: string;
  total_results: number;
  time_taken_displayed: number;
  organic_results_state: string;
}

interface KnowledgeGraph {
  entity_type: string;
}

interface InlineVideo {
  position: number;
  title: string;
  link: string;
  thumbnail: string;
  channel: string;
  duration: string;
  platform: string;
  key_moments?: KeyMoment[];
}

interface KeyMoment {
  time: string;
  title: string;
  link: string;
  thumbnail: string;
}

interface RelatedQuestion {
  question: string;
  snippet?: string;
  title?: string;
  date?: string;
  link?: string;
  displayed_link?: string;
  source_logo?: string;
  next_page_token?: string;
  serpapi_link?: string;
  list?: string[];
}

interface AIOverview {
  text_blocks: TextBlock[];
  references: Reference[];
}

interface TextBlock {
  type: string;
  snippet?: string;
  snippet_highlighted_words?: string[];
  reference_indexes?: number[];
  list?: ListItem[];
}

interface ListItem {
  title?: string;
  snippet?: string;
  reference_indexes?: number[];
}

interface Reference {
  title: string;
  link: string;
  snippet?: string;
  source: string;
  index: number;
}

interface AnswerBox {
  type: string;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  snippet_highlighted_words: string[];
  favicon: string;
  source: string;
  images: string[];
}

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  redirect_link: string;
  displayed_link: string;
  favicon: string;
  date?: string;
  snippet: string;
  snippet_highlighted_words: string[];
  sitelinks?: Sitelinks;
  source: string;
}

interface Sitelinks {
  inline?: SitelinkItem[];
  list?: SitelinkItem[];
}

interface SitelinkItem {
  title: string;
  link: string;
  answer_count?: number;
  date?: string;
}

interface Perspective {
  author: string;
  author_description: string;
  source: string;
  extensions?: string[];
  thumbnails: string[];
  title: string;
  link: string;
  date: string;
}

interface RelatedSearch {
  block_position: number;
  items?: RelatedSearchItem[];
  query?: string;
  link?: string;
  serpapi_link?: string;
}

interface RelatedSearchItem {
  name: string;
  image: string;
  link: string;
  serpapi_link: string;
}

interface DiscussionForum {
  title: string;
  link: string;
  date: string;
  extensions: string[];
  source: string;
  answers: Answer[];
}

interface Answer {
  snippet: string;
  link: string;
  extensions: string[];
}

interface Pagination {
  current: number;
  next: string;
  other_pages: Record<string, string>;
  serpapi_pagination: SerpapiPagination;
}

interface SerpapiPagination {
  current: number;
  next_link: string;
  next: string;
  other_pages: Record<string, string>;
}