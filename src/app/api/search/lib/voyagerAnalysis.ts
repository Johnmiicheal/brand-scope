/* eslint-disable @typescript-eslint/no-explicit-any */
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import Exa from 'exa-js';
import { AIRanking, SearchResults, SocialInsight, ChartData } from '@/types/search';
import { z } from 'zod';

// System prompt for brand analysis
const VOYAGER_RANKING_PROMPT = `You are an expert brand analyst. 
Analyze the following query: "{query}".
Generate a list of relevant brands and provide a numerical rank (1-10, with 1 being the best) and a confidence score (0-100) for each brand.
Also provide detailed reasoning for each ranking based on market analysis, consumer perception, and brand reputation.
Your reasoning should be comprehensive yet concise.

Return the results in the following format:
{
  "brands": [
    {
      "name": "Brand Name",
      "rank": number,
      "score": number,
      "reasoning": "Detailed analysis..."
    }
  ]
}`;

// Voyager: Multi-model analysis with social sentiment
export async function voyagerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const models = [
    { model: groq('llama3-8b-8192'), name: 'Llama 3.3 8B' },
    { model: groq('mistral-saba-24b'), name: 'Mistral Saba 24B' },
    { model: groq('gemma2-9b-it'), name: 'Gemma 2 9B' },
    { model: groq('deepseek-r1-distill-llama-70b'), name: 'DeepSeek R-1' },
    { model: groq('qwen-2.5-32b'), name: 'Qwen 2.5 32B' }
  ];
  
  const rankings: AIRanking[] = [];
  const socialInsights: SocialInsight[] = [];
  const charts: ChartData[] = [];

  // Initialize Exa client
  const exa = new Exa(process.env.NEXT_PUBLIC_EXA_API_KEY!);

  // Multi-model ranking
  for (const { model, name } of models) {
    const responseSchema = z.object({ 
      brands: z.array(z.object({
        name: z.string(),
        rank: z.number().nullable(),
        score: z.number(),
        reasoning: z.string()
      }))
    });

    const formattedPrompt = VOYAGER_RANKING_PROMPT
      .replace('{query}', query);

    const { object } = await generateObject({
      model,
      schema: responseSchema,
      prompt: formattedPrompt,
    });

    // Convert brand analysis results to rankings
    for (const brand of object.brands) {
      rankings.push({
        id: uuidv4(),
        entity_id: brand.name,
        entity_type: 'brand',
        user_id,
        llm_name: name,
        query,
        rank: brand.rank,
        score: brand.score,
        reasoning: brand.reasoning,
        mode: 'Voyager',
        mode_id,
        analyzed_at: new Date().toISOString(),
      });

      // Get social sentiment for each brand
      const searchQuery = `${brand.name} ${query}`;
      const xResults = await exa.searchAndContents(searchQuery, {
        type: 'keyword',
        numResults: 5,
        includeDomains: ['x.com'],
        text: true,
      });

      // Extract post text for sentiment analysis
      const posts = xResults.results.map(r => r.text).join('\n');
      
      // Analyze sentiment with Llama 3
      const sentiment = await analyzeSentiment(posts);
      
      socialInsights.push({
        id: uuidv4(),
        entity_id: brand.name,
        entity_type: 'brand',
        user_id,
        search_id: mode_id,
        platform: 'X',
        keyword: query,
        mention_count: xResults.results.length,
        sentiment,
        data_fetched_at: new Date().toISOString(),
      });

      // Generate trend data based on the results
      charts.push({
        keyword: brand.name,
        trend_points: generateTrendPoints(xResults.results),
      });
    }
  }

  return {
    search_id,
    mode: 'Voyager',
    mode_id,
    ai_rankings: rankings,
    social_insights: socialInsights,
    charts,
  };
}

// Helper function to analyze sentiment
async function analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
  // Truncate text to approximately 2000 tokens (about 1500 words)
  const MAX_CHARS = 2000;
  const truncatedText = text.length > MAX_CHARS 
    ? text.substring(0, MAX_CHARS) + "..." 
    : text;
  
  try {
    const { object } = await generateObject({
      model: groq('llama3-70b-8192'),
      schema: z.object({ sentiment: z.enum(['positive', 'negative', 'neutral']) }),
      prompt: `Analyze the sentiment of this text: "${truncatedText}"`,
      temperature: 0.1,
    });
    
    return object.sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Default to neutral if analysis fails
    return 'neutral';
  }
}

// Helper function to generate trend points from search results
function generateTrendPoints(xResults: any[]): { date: string; value: number }[] {
  // For now, generate mock trend data
  // In a real implementation, you'd extract actual dates from the posts
  return Array.from({ length: Math.min(xResults.length, 7) }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 30 + Math.floor(Math.random() * 70), // Random value between 30-100
  })).reverse(); // Reverse to show oldest to newest
} 