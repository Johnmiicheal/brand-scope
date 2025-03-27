import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { supabase } from '@/lib/supabase';


// Define schemas
const brandAnalysisSchema = z.object({
  visibility_score: z.number(),
  sentiment_analysis: z.object({
    positive: z.number(),
    negative: z.number(),
    neutral: z.number(),
  }),
  consumer_perception: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
});

const competitorAnalysisSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      website: z.string().optional(),
      ranking_diff: z.number(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    })
  )
});

const keywordAnalysisSchema = z.object({
  keywords: z.array(
    z.object({
      keyword: z.string(),
      search_volume: z.number(),
      difficulty: z.number(),
      opportunity_score: z.number(),
      relevance: z.number(),
    })
  )
});

export async function POST(req: Request) {
  try {
    const { brandId } = await req.json();

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // Get brand details
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      console.error('Error fetching brand:', brandError);
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Initialize LLM
    const model = groq('llama3-70b-8192');
    
    // Initialize Exa for web search
    const exa = new Exa(process.env.NEXT_PUBLIC_EXA_API_KEY!);

    // Step 1: Analyze brand perception
    const brandAnalysisPrompt = `You are an expert brand analyst representing the collective opinion of 10,000 diverse consumers.
    
    Analyze the brand "${brand.name}" in the "${brand.industry}" industry with website "${brand.website}".
    
    Consider the following factors:
    1. Brand visibility and awareness
    2. Consumer sentiment
    3. Market positioning
    4. Unique selling propositions
    5. Brand reputation
    
    Provide a comprehensive analysis of how consumers perceive this brand.`;

    try {
      // Search the web for information about the brand
      const searchResults = await exa.searchAndContents(`${brand.name} ${brand.industry} brand analysis reviews reputation`, {
        numResults: 3,
        useAutoprompt: true,
      });
      
      // Limit the text length from each search result to prevent token limit errors
      const processedResults = searchResults.results.map(r => ({
        url: r.url,
        // Truncate text to approximately 300 characters
        text: r.text.length > 300 ? r.text.substring(0, 300) + '...' : r.text
      }));
      
      const searchContext = processedResults.map(r => `Source (${r.url}): ${r.text}`).join('\n\n');
      
      // Analyze the brand with limited context
      const { object: brandAnalysis } = await generateObject({
        model,
        schema: brandAnalysisSchema,
        prompt: `${brandAnalysisPrompt}\n\nHere is some brief context about the brand from the web:\n\n${searchContext}`,
        temperature: 0.3,
      });

      // Step 2: Find competitors and analyze them
      const competitorsPrompt = `You are a market research expert. 
      
      Identify the top 10 competitors of "${brand.name}" in the "${brand.industry}" industry.
      
      For each competitor:
      1. Provide their name
      2. Estimate their website if known (or leave blank if uncertain)
      3. Analyze how they compare to ${brand.name} (higher or lower ranking)
      4. List their strengths
      5. List their weaknesses
      
      Focus on direct competitors in the same market segment.`;

      const { object: competitorAnalysis } = await generateObject({
        model,
        schema: competitorAnalysisSchema,
        prompt: competitorsPrompt,
      });

      // Step 3: Generate relevant keywords
      const keywordPrompt = `You are an SEO specialist.
      
      Generate a list of 20 high-value keywords for "${brand.name}" in the "${brand.industry}" industry.
      
      For each keyword:
      1. Estimate monthly search volume (realistic numbers)
      2. Rate difficulty to rank on a scale of 0.0-10.0
      3. Calculate an opportunity score on a scale of 0.0-10.0 based on search volume and competition
      4. Rate relevance to the brand on a scale of 0.0-10.0
      
      Focus on both high-volume and long-tail keywords that would drive valuable traffic.`;

      const { object: keywordAnalysis } = await generateObject({
        model,
        schema: keywordAnalysisSchema,
        prompt: keywordPrompt,
      });

      // Save brand analysis metrics
      await supabase
        .from('brand_metrics')
        .insert([
          {
            id: uuidv4(),
            brand_id: brandId,
            visibility_score: brandAnalysis.visibility_score,
            positive_sentiment: brandAnalysis.sentiment_analysis.positive,
            negative_sentiment: brandAnalysis.sentiment_analysis.negative,
            neutral_sentiment: brandAnalysis.sentiment_analysis.neutral,
            consumer_perception: brandAnalysis.consumer_perception,
            strengths: brandAnalysis.strengths,
            weaknesses: brandAnalysis.weaknesses,
            opportunities: brandAnalysis.opportunities,
            analyzed_at: new Date().toISOString(),
          }
        ]);

      // Save competitors
      for (const competitor of competitorAnalysis.competitors) {
        const competitorId = uuidv4();
        
        await supabase
          .from('competitors')
          .insert([
            {
              id: competitorId,
              user_id: brand.user_id,
              brand_id: brandId,
              name: competitor.name,
              website: competitor.website || null,
              industry: brand.industry,
              ranking_diff: competitor.ranking_diff,
              created_at: new Date().toISOString(),
            }
          ]);
      }

      // Save keywords
      for (const keyword of keywordAnalysis.keywords) {
        await supabase
          .from('keywords')
          .insert([
            {
              id: uuidv4(),
              entity_id: brandId,
              entity_name: brand.name,
              entity_type: 'brand',
              user_id: brand.user_id,
              keyword: keyword.keyword,
              search_volume: keyword.search_volume,
              difficulty: keyword.difficulty,
              opportunity_score: keyword.opportunity_score,
              created_at: new Date().toISOString(),
            }
          ]);
      }

      // Set up daily analysis job
      // This would typically be done with a cron job or scheduler
      // For now, we'll record that we need to run daily analysis for this brand

      return NextResponse.json({
        success: true,
        message: 'Brand analysis completed successfully',
        data: {
          brand_analysis: brandAnalysis,
          competitors: competitorAnalysis.competitors,
          keywords: keywordAnalysis.keywords,
        }
      });
    } catch (error) {
      console.error('Error in brand analysis:', error);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 