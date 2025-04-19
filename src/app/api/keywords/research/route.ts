/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Consider restricting this in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Models
const models = [
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1' },
];

// Define a schema for search prompts
const searchPromptsSchema = z.object({
  prompts: z.array(z.string()).min(5).max(5),
  search_volume: z.number(),
  difficulty: z.number(),
  opportunity_score: z.number(),
  relevance: z.number()
});

export async function OPTIONS() {
  // Handle preflight requests for CORS
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // --- Debug: Log incoming request details ---
    console.log(`Received POST request to ${req.nextUrl.pathname}`);
    const requestOrigin = req.headers.get('origin');
    console.log(`Request Origin: ${requestOrigin}`);
    // Be cautious logging full headers/cookies in production due to sensitive data
    // console.log("Incoming Headers:", Object.fromEntries(req.headers.entries()));
    const cookieHeader = req.headers.get('cookie');
    console.log("Raw Cookie Header:", cookieHeader);
    // --- End Debug ---

    // Initialize Supabase client using createRouteHandlerClient
    // This is generally preferred for Route Handlers (API routes)

    // 1. Extract request data
    const data = await req.json();
    const { keywords, brandName, domain, intent, user } = data;
    console.log("Request Body Parsed:", { keywords, brandName, domain, intent });

    // 2. Validate input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0 || keywords.length > 5) {
      console.warn("Validation Failed: Invalid keywords", keywords);
      return NextResponse.json(
        { error: 'Please provide 1-5 keywords' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!brandName) {
      console.warn("Validation Failed: Missing brandName");
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    // Add validation for intent if necessary
    // if (!intent) { ... }

    // --- Debug: Authentication Check ---
    console.log("Attempting to get Supabase session...");

    if (!user) {
      console.error("Authentication Failed: No session or user found in Supabase response.");
      // Log cookies specifically (be careful in production)
      const allCookies = (await cookies()).getAll();
      console.log("Cookies available to Route Handler:", allCookies);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401, headers: corsHeaders }
      );
    }
    // --- End Debug ---

    const userId = user.id;
    console.log("Authenticated user ID:", userId);

    // 5. Find or create brand
    let brandId;
    console.log(`Searching for brand "${brandName}" for user ${userId}`);
    const { data: existingBrand, error: brandSelectError } = await supabase
      .from('brands')
      .select('id')
      .eq('name', brandName)
      .eq('user_id', userId)
      .maybeSingle();

    if (brandSelectError) {
        console.error('Error searching for brand:', brandSelectError);
        return NextResponse.json(
          { error: 'Database error checking for brand' },
          { status: 500, headers: corsHeaders }
        );
    }

    if (existingBrand) {
      brandId = existingBrand.id;
      console.log(`Found existing brand ID: ${brandId}`);
    } else {
      console.log(`Brand "${brandName}" not found, creating new one.`);
      const newBrandId = uuidv4();
      const { error: brandInsertError } = await supabase.from('brands').insert({
        id: newBrandId,
        name: brandName,
        user_id: userId,
        website: domain || null, // Ensure domain is handled if empty/null
        created_at: new Date().toISOString(),
      });

      if (brandInsertError) {
        console.error('Error creating brand:', brandInsertError);
        return NextResponse.json(
          { error: 'Failed to create brand' },
          { status: 500, headers: corsHeaders }
        );
      }
      brandId = newBrandId;
      console.log(`Created new brand ID: ${brandId}`);
    }

    // Initialize Groq provider
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API configuration error - please contact support' },
        { status: 500, headers: corsHeaders }
      );
    }
    const groqProvider = createGroq({ apiKey: groqApiKey });
    console.log("Groq provider initialized.");

    // 7. Process keywords and generate prompts
    const results: Record<string, Array<{
      keyword: string;
      prompts: string[];
      search_volume?: number;
      difficulty?: number;
      opportunity_score?: number;
      relevance?: number;
      error?: string;
    }>> = {};

    // Initialize result structure
    for (const model of models) {
      results[model.name] = [];
    }

    // Process each keyword asynchronously (optional improvement)
    // Consider Promise.all for parallel processing if order doesn't matter
    // and you want faster responses for multiple keywords.
    for (const keyword of keywords) {
     

      // Generate prompts for each model
      for (const model of models) {
        console.log(`Generating prompts for keyword "${keyword}" using model "${model.name}"`);
        try {
          const systemPrompt = `You are an AI assistant specialized in SEO and understanding user search intent.
Your task is to transform the given SEO keyword into potential search prompts that a user might type into a search engine like Google or AI-powered search/answer engines.

Generate exactly 5 distinct search prompts based on the keyword "${keyword}" for the brand "${brandName}".
${domain ? `The brand domain is ${domain}.` : ''}

Use the following intent level guidance:
- Intent Level: ${intent || 'no_intent'}
- "no_intent": Create general prompts that cover various search intents
- "low": Create prompts with slight purchasing/conversion intent
- "medium": Create prompts with moderate purchasing/conversion intent
- "high": Create prompts with strong purchasing/conversion intent

Consider all the following types of intents when appropriate:
1. Informational (seeking information)
2. Navigational (finding a specific resource)
3. Transactional (looking to purchase)
4. Commercial investigation (researching before purchase)

For each keyword, also provide:
1. search_volume: A realistic estimate of the monthly search volume as a number between 10 and 10000
2. difficulty: How difficult it is to rank for this keyword on a scale from 0.0 to 10.0
3. opportunity_score: A score from 0.0 to 10.0 representing the opportunity value based on volume and competition
4. relevance: How relevant the keyword is to the brand "${brandName}" from 0.0 to 10.0

The prompts should be realistic queries users might ask.
If a brand name is provided, some prompts can incorporate it naturally where relevant.
If a domain is provided, consider it as context about the brand's offerings.`;

          // Use generateObject with schema to get structured response
          const { object: promptAnalysis } = await generateObject({
            model: groqProvider(model.id),
            schema: searchPromptsSchema,
            prompt: systemPrompt,
            temperature: 0.7, // Adjust temperature as needed
          });

          console.log(`Generated ${promptAnalysis.prompts.length} prompts for "${keyword}" with ${model.name}`);

          // Store all prompts for this keyword as a single entry with a JSONB array
          const promptId = uuidv4();
          const { error: promptInsertError } = await supabase.from('search_prompts').insert({
            prompt_id: promptId,
            keyword_text: keyword,
            prompts: promptAnalysis.prompts, // Store all prompts as a JSONB array
            model: model.name,
            search_volume: promptAnalysis.search_volume,
            difficulty: promptAnalysis.difficulty,
            opportunity_score: promptAnalysis.opportunity_score,
            relevance: promptAnalysis.relevance,
            entity_id: brandId,
            entity_name: brandName,
            entity_type: 'brand',
            user_id: userId,
            created_at: new Date().toISOString(),
          });

          if (promptInsertError) {
            console.error(`Error saving prompts for keyword "${keyword}":`, promptInsertError);
          } else {
            console.log(`Successfully saved prompts for keyword "${keyword}" with ${model.name}`);
          }

          // Add to results with the new metrics
          results[model.name].push({
            keyword,
            prompts: promptAnalysis.prompts,
            search_volume: promptAnalysis.search_volume,
            difficulty: promptAnalysis.difficulty,
            opportunity_score: promptAnalysis.opportunity_score,
            relevance: promptAnalysis.relevance
          });

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown AI generation error";
          console.error(`Error generating prompts with ${model.name} for "${keyword}":`, error);
          // Add error information to the results for this keyword/model combination
          results[model.name].push({
            keyword,
            prompts: [],
            error: `Failed to generate prompts: ${errorMessage}`,
          });
        }
      }
    }

    // 8. Return successful response
    console.log("Successfully processed all keywords. Returning results.");
    return NextResponse.json(
      { success: true, results },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: unknown) {
    // Catch unexpected errors during processing
    const errorMessage = error instanceof Error ? error.message : "Unknown server error occurred";
    console.error('Unhandled API error:', error);
    return NextResponse.json(
      // Provide a generic error message to the client
      { error: "An internal server error occurred. Please try again later." },
      { status: 500, headers: corsHeaders }
    );
  }
}
