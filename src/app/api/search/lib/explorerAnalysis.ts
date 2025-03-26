import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import Exa from 'exa-js';
import { serverEnv } from '@/env/server';
import { AIRanking, CompetitorComparison, SearchResults } from '@/types/search';
import { z } from 'zod';

// System prompt for competitor analysis
const COMPETITOR_ANALYSIS_PROMPT = `You are a competitive analysis expert. 
Compare the brand "{brand_name}" with its competitor "{competitor_name}" (if no competitor provider, find the top 10 competitors and continue the analysis) for the query: "{query}".
Provide a numerical rank (1-10, with 1 being the best) for both the brand and the competitor.
Also assign a confidence score (0-100) and provide a detailed analysis of how the brand can gain an edge over this competitor.
Focus on actionable insights and specific advantages/disadvantages.`;

// Explorer: Competitor comparison and analysis
export async function explorerAnalysis(
  brands: string[],
  user_id: string,
  queries: string[],
  competitors: string[],
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const model = groq('deepseek-r1-distill-llama-70b');
  const rankings: AIRanking[] = [];
  const comparisons: CompetitorComparison[] = [];

  for (const query of queries) {
    // Brand ranking
    const brand_id = uuidv4()
    const { object: brandResult } = await generateObject({
      model,
      schema: z.object({ 
        rank: z.number().nullable(), 
        score: z.number(),
        reasoning: z.string()
      }),
      prompt: `Analyze brand "${brands}" for query "${query}". Provide rank, confidence score, and detailed reasoning.`,
    });

    rankings.push({
      id: uuidv4(),
      entity_id: brand_id,
      entity_name: "",
      entity_type: 'brand',
      user_id,
      llm_name: 'DeepSeek R-1',
      query,
      rank: brandResult.rank,
      score: brandResult.score,
      reasoning: brandResult.reasoning,
      mode: 'Explorer',
      mode_id,
      analyzed_at: new Date().toISOString(),
    });

    // Competitor rankings and comparison
    for (const competitor of competitors) {
      // Get competitor analysis
      const competitor_id = uuidv4()
      const comparisonPrompt = COMPETITOR_ANALYSIS_PROMPT
        .replace('{brand_name}', brand_id)
        .replace('{competitor_name}', competitor)
        .replace('{query}', query);
      
      const { object: compResult } = await generateObject({
        model,
        schema: z.object({ 
          brand_rank: z.number().nullable(), 
          competitor_rank: z.number().nullable(),
          score: z.number(),
          analysis: z.string(),
        }),
        prompt: comparisonPrompt,
      });

      // Add competitor ranking
      rankings.push({
        id: uuidv4(),
        entity_id: competitor_id,
        entity_name: competitor,
        entity_type: 'competitor',
        user_id,
        llm_name: 'DeepSeek R-1',
        query,
        rank: compResult.competitor_rank,
        score: compResult.score,
        reasoning: `Competitor analysis vs ${brand_id}: ${compResult.analysis.substring(0, 100)}...`,
        mode: 'Explorer',
        mode_id,
        analyzed_at: new Date().toISOString(),
      });

      // Add comparison
      comparisons.push({
        competitor: competitor,
        competitor_id: competitor_id,
        ranking_diff: (brandResult.rank || 0) - (compResult.competitor_rank || 0),
        analysis: compResult.analysis,
      });
    }
  }

  return {
    search_id,
    mode: 'Explorer',
    mode_id,
    ai_rankings: rankings,
    comparisons,
  };
}

// Function to identify potential competitors
export async function findCompetitors(
  brand: string,
  industry: string
): Promise<string[]> {
  const exa = new Exa(serverEnv.EXA_API_KEY);
  const query = `top competitors of ${brand} in ${industry}`;
  
  try {
    const searchResults = await exa.search(query, {
      type: 'keyword',
      numResults: 5,
    });
    
    // Extract competitor names using LLM
    const model = groq('gemma2-9b-it');
    const prompt = `Based on the following search results about competitors of ${brand} in the ${industry} industry, 
    identify the top 3-5 competitor brands. Return only the list of competitor brand names without additional text.
    
    Search results:
    ${searchResults.results.map(r => r.title + ': ' + r.text).join('\n\n')}`;
    
    const { object } = await generateObject({
      model,
      schema: z.array(z.string()),
      prompt,
    });
    
    return object;
  } catch (error) {
    console.error('Error finding competitors:', error);
    return [];
  }
} 