import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { AIRanking, SearchResults } from '@/types/search';
import { z } from 'zod';

// System prompt for generating brands
const BRAND_GENERATION_PROMPT = `You are a brand analysis expert. Generate a list of 10 leading brands in {industry} with a brief description of each. Format your response as a JSON array of objects, each with 'name' and 'description' fields.`;

// System prompt for ranking brands
const BRAND_RANKING_PROMPT = `You are an expert brand analyst. 
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

// DeepFocus: Analysis with gemma2 and llama-3.3
export async function deepFocusAnalysis(
  user_id: string, 
  query: string, 
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const models = [
    { model: groq('gemma2-9b-it'), name: 'Gemma 2 9B' },
    { model: groq('llama-3.3-70b-versatile'), name: 'Llama 3.3 70B' }
  ];
  
  const rankings: AIRanking[] = [];

  for (const { model, name } of models) {
    // Response schema for brand analysis
    const responseSchema = z.object({ 
      brands: z.array(z.object({
        name: z.string(),
        rank: z.number().nullable(),
        score: z.number(),
        reasoning: z.string()
      }))
    });

    const formattedPrompt = BRAND_RANKING_PROMPT
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
        mode: 'DeepFocus',
        mode_id,
        analyzed_at: new Date().toISOString(),
      });
    }
  }

  console.log("AI COntent: ", rankings)

  return {
    search_id,
    mode: 'DeepFocus',
    mode_id,
    ai_rankings: rankings,
  };
}

// Function to generate top brands in an industry
export async function generateTopBrands(industry: string): Promise<Array<{ name: string, description: string }>> {
  const model = groq('llama-3.3-70b-versatile');
  const prompt = BRAND_GENERATION_PROMPT.replace('{industry}', industry);
  
  const { object } = await generateObject({
    model,
    schema: z.array(z.object({
      name: z.string(),
      description: z.string()
    })),
    prompt,
  });
  
  return object;
} 