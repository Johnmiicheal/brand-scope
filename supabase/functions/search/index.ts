/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@11.0.0";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@latest";
import {
  generateObject,
  generateText,
  extractReasoningMiddleware,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from "https://esm.sh/ai@latest";
import Exa from "https://esm.sh/exa-js@latest";
import { createOpenRouter } from "https://esm.sh/@openrouter/ai-sdk-provider@latest";

interface AIRanking {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  user_id: string;
  llm_name: string;
  query: string;
  rank: number | null;
  score: number;
  reasoning: string;
  sentiment: string;
  mode: string;
  mode_id: string;
  analyzed_at: string;
}

interface CompetitorComparison {
  competitor: string;
  competitor_id: string;
  ranking_diff: number;
  analysis: string;
}

interface SocialInsight {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  user_id: string;
  search_id: string;
  platform: string;
  keyword: string;
  mention_count: number;
  sentiment: string;
  data_fetched_at: string;
  links?: Array<string>;
}

interface Recommendations {
  id: string;
  brand_id: string;
  mode_id: string;
  query: string;
  type: string;
  suggestion: string;
  reasoning: string;
  priority: number;
  created_at: string;
}

interface ChartData {
  keyword: string;
  trend_points: { date: string; value: number }[];
}

interface SearchResults {
  search_id: string;
  mode: string;
  mode_id: string;
  ai_rankings: AIRanking[];
  social_insights?: SocialInsight[];
}

interface Brand {
  name: string;
  description: string;
}

// System prompt for competitor analysis
// const COMPETITOR_ANALYSIS_PROMPT = `You are a competitive analysis expert. 
// Compare the brand "{brand_name}" with its competitor "{competitor_name}" (if no competitor provider, find the top 10 competitors and continue the analysis) for the query: "{query}".
// Provide a numerical rank (1-10, with 1 being the best) for both the brand and the competitor.
// Also assign a confidence score (0-100) and provide a detailed analysis of how the brand can gain an edge over this competitor.
// Focus on actionable insights and specific advantages/disadvantages.`

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

// const EXPLORER_RECOMMENDER_PROMPT = `
//   You are an expert brand analyst and marketing expert.
//   Analyze the query: "{query}".
//   Generate a detailed recommendation on how to improve the brand: "{brand}" which is in the industry: "{industry}" based on the query provided.
//   If the industry does not relate to the query, inform the user of this with a slight joke.
//   Focus on actionable and detailed steps on insights, keyword recommendations, SEO and Generative Engine Optimization and AI Search Engine visibility improvements.
// `

// System prompts
const BRAND_GENERATION_PROMPT = `You are a brand analysis expert. Generate a list of 10 leading brands in {industry} with a brief description of each. Format your response as a JSON array of objects, each with 'name' and 'description' fields.`;

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

const groq = createGroq({
  apiKey: Deno.env.get("GROQ_API_KEY"),
  baseUrl: "https://api.groq.com/openai/v1",
});

const openrouter = createOpenRouter({
  apiKey: Deno.env.get("OPEN_ROUTER_API_KEY"),
});

// Define analysis modes
const analysisModes = ["DeepFocus", "Voyager", "Explorer"] as const;
type AnalysisMode = (typeof analysisModes)[number];

// Request validation schema
const searchRequestSchema = z.object({
  mode: z.enum(analysisModes),
  user_id: z.string().uuid(),
  query: z.string(),
  brand_name: z.string(),
  brand_industry: z.string(),
  brand_id: z.string().uuid(),
  competitors: z.array(z.string()).optional(),
});

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = new Headers({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin":
        req.headers.get("Origin") || "https://brandscope.vercel.app",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Credentials": "true",
    });

    // Handle OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }

    // Only allow POST and GET
    if (!["POST", "GET"].includes(req.method)) {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers,
        status: 405,
      });
    }

    // Handle GET request
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode_id = url.searchParams.get("mode_id");
      const user_id = url.searchParams.get("user_id");
      
      if (!mode_id && !user_id) {
        return new Response(
          JSON.stringify({ error: "Missing mode_id or user_id parameter" }),
          { headers, status: 400 }
        );
      }
      
      // Initialize Supabase client
      const supabaseClient = createClient(
        Deno.env.get("SB_BRAND_URL") ?? "",
        Deno.env.get("SB_BRAND_ANON_KEY") ?? "",
        { 
          global: { 
            headers: { 
              Authorization: req.headers.get("Authorization")!,
            },
          },
            } 
      );

      let results;
      if (mode_id) {
        const { data, error } = await supabaseClient
          .from("ai_rankings")
          .select("*")
          .eq("mode_id", mode_id);

        if (error) throw error;
        results = data;
      } else if (user_id) {
        const { data, error } = await supabaseClient
          .from("ai_rankings")
          .select("*")
          .eq("user_id", user_id)
          .order("analyzed_at", { ascending: false });

        if (error) throw error;
        results = data;
      }
      
      if (!results) {
        return new Response(JSON.stringify({ error: "No results found" }), {
          headers,
          status: 404,
        });
      }

      return new Response(JSON.stringify(results), { headers });
    }

    // Handle POST request
    const body = await req.json();
    
    // Validate request body
    const { mode, user_id, query, brand_name, brand_industry, brand_id } =
      searchRequestSchema.parse(body);

    // Generate shared IDs for this search session
    const mode_id = uuidv4();
    const search_id = uuidv4();

    // Run mode-specific analysis
    let results;
    try {
      if (mode === "DeepFocus") {
        results = await deepFocusAnalysis(user_id, query, mode_id, search_id);
      } else if (mode === "Voyager") {
        results = await voyagerAnalysis(user_id, query, mode_id, search_id);
      } else if (mode === "Explorer") {
        results = await explorerAnalysis(
          user_id,
          query,
          mode_id,
          search_id,
          brand_name,
          brand_industry,
          brand_id
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid analysis mode" }),
          { headers, status: 400 }
        );
      }
    } catch (analysisError) {
      console.error("Error in analysis:", analysisError);
      return new Response(
        JSON.stringify({ 
          error: "Analysis failed",
          details:
            analysisError instanceof Error
              ? analysisError.message
              : "Unknown analysis error",
        }), 
        { headers, status: 500 }
      );
    }

    // Ensure results exist
    if (!results) {
      return new Response(
        JSON.stringify({ error: "Analysis returned no results" }),
        { headers, status: 500 }
      );
    }

    // Save results to Supabase
    try {
      await saveToSupabase(results, user_id);
    } catch (saveError) {
      console.error("Error saving to Supabase:", saveError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save results",
          details:
            saveError instanceof Error
              ? saveError.message
              : "Unknown save error",
        }), 
        { headers, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analysis complete for mode ${mode}. Results have been stored with search ID: ${mode_id}`,
        mode_id,
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error in search endpoint:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data",
          details: error.errors,
        }), 
        { headers, status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }), 
      { headers, status: 500 }
    );
  }
});

// Helper function to call the search-google endpoint
async function callSearchGoogleEndpoint(
  query: string,
  mode_id: string,
  user_id: string,
  brandName?: string,
  location?: string
): Promise<void> {
  try {
    const apiUrl = `${Deno.env.get("FRONTEND_URL") || "https://brandscope.vercel.app"}/api/search-google`;
    const internalApiKey = Deno.env.get("INTERNAL_API_KEY");
    
    // Log environment setup
    console.log("Google Search API call setup:");
    console.log("- Frontend URL:", Deno.env.get("FRONTEND_URL") || "https://brandscope.vercel.app");
    console.log("- Internal API key exists:", !!internalApiKey);
    console.log("- Using mode_id as monitoring_id:", mode_id);
    
    if (!internalApiKey) {
      console.error('INTERNAL_API_KEY is missing in environment variables - required for search-google API calls');
      return;
    }
    
    // Validate that mode_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mode_id)) {
      console.error(`Invalid mode_id format: ${mode_id}. Expected a valid UUID.`);
      // Continue with the call anyway, let the server decide how to handle it
    }
    
    const payload = {
      query,
      engine: 'google',
      includeAiOverview: true,
      monitoringId: mode_id,
      userId: user_id,
      brandName: brandName || undefined,
      location: location || 'United States'
    };
    
    console.log(`Calling search-google endpoint for query: "${query}" with monitoring ID: ${mode_id}`);
    console.log("Search payload:", JSON.stringify(payload, null, 2));
    
    // Make the request with a timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${internalApiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error calling search-google: ${response.status} - ${errorText}`);
        console.error(`Request details: ${JSON.stringify({
          url: apiUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer [REDACTED]'
          },
          body: JSON.stringify(payload)
        })}`);
        return; // Continue execution despite error
      }
      
      const data = await response.json();
      console.log(`Search-google endpoint called successfully. Search ID: ${data.searchId}`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Search-google request timed out after 20 seconds');
      } else {
        console.error('Fetch error calling search-google:', fetchError);
      }
    }
  } catch (error) {
    console.error('Failed to call search-google endpoint:', error);
    // Don't throw so the main analysis can continue even if this fails
  }
}

// Explorer: Competitor comparison and analysis - Optimized
export async function explorerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string = uuidv4(),
  search_id: string = uuidv4(),
  brand_name: string,
  brand_industry: string,
  brand_id: string
): Promise<SearchResults> {
  // Call the search-google endpoint after mode_id is defined
  await callSearchGoogleEndpoint(query, mode_id, user_id, brand_name);
  
  const rankings: AIRanking[] = [];
  const socialInsights: SocialInsight[] = [];

  // 1. Define Models for Text Generation
  const textModels = [
    { model: openrouter("openai/gpt-4o"), name: "GPT 4o" },
    {
      model: openrouter("anthropic/claude-3.5-sonnet"),
      name: "Claude 3.5 Sonnet",
    },
    {
      model: openrouter("google/gemini-2.0-flash-001"),
      name: "Gemini 2.0 Flash",
    },
    { model: openrouter("perplexity/sonar"), name: "Perplexity Sonar" }, // Keep Perplexity here
  ];

  // 2. Generate Text Summaries for all models
  async function generateTextForAllModels(models) {
    return Promise.all(
      models.map(async ({ model, name }) => {
        try {
          const response = await generateText({
            model,
            prompt: query,
            temperature: 0.1,
          });

          let text = response.text;
          let citations = null;

          // Only try to extract citations for Perplexity
          if (name.toLowerCase().includes("perplexity")) {
            const citationMatch = text.match(/Citations?:\\s*([\\s\\S]+)$/i);
            if (citationMatch) {
              try {
                citations = JSON.parse(citationMatch[1]);
                text = text.replace(citationMatch[0], "").trim();
              } catch {
                /* Ignore parse error */
              }
            }
            if (!citations) {
              const urlMatches = text.match(/https?:\/\/[^\\s)]+/g);
              if (urlMatches) citations = urlMatches;
            }
          }

          return { name, text, citations, success: true };
        } catch (error) {
          console.error(`Error generating text for ${name}:`, error);
          return { name, text: null, citations: null, success: false };
        }
      })
    );
  }

  const textGenerationResults = await generateTextForAllModels(textModels);

  // 3. Store Summaries in Supabase
  const insertPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text, citations }) => {
      const { error } = await supabase.from("ai_summary").insert({
        model: name,
        summary: text,
        query,
        mode_id,
        reasoning: citations || null, // Store citations in reasoning
      });

      if (error) {
        console.error(`Error inserting summary for ${name}:`, error);
      }
    });

  // Wait for all summary insertions to complete before proceeding
  await Promise.all(insertPromises);

  // 4. Extract Structured Rankings from Text
  const rankingSchema = z.object({
    brands: z.array(
      z.object({
      name: z.string(),
      rank: z.number().nullable(),
        sentiment: z.string(),
      score: z.number(),
        reasoning: z.string(),
      })
    ),
  });

  const extractionPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text }) => {
      const modelConfig = textModels.find((m) => m.name === name);
      if (!modelConfig) {
        console.error(
          `Cannot find model config for ${name} during extraction.`
        );
        return { name, success: false };
      }

      try {
        let extractedObject: {
          brands: {
            name: string;
            rank: number | null;
            sentiment: string;
            score: number;
            reasoning: string;
          }[];
        };

        if (name.toLowerCase().includes("perplexity")) {
          // Use generateText for Perplexity, asking for JSON
          const extractionPromptForText = `
          Based ONLY on the text provided below, extract brands/companies/services, rank them, score them out of 100 and rate their sentiment. 
          Output should be EXACTLY in this JSON format (a valid JSON array):
          [
            {
              "name": "Brand Name",
              "rank": 1-10, // Two brands cannot have the same rank
              "sentiment": "positive|negative|neutral",
              "score": 1-100,
              "reasoning": "Key benefits or features in 1-2 lines"
            }
          ]

          Rules:
          1. ONLY output the valid JSON array. No introductory text, no markdown backticks.
          2. Include ALL mentioned brands and order them as they appeared in the text.
          3. Keep reasons factual and concise based *only* on the provided text.
          4. Use only positive/negative/neutral for sentiment.
          5. Default sentiment to positive if benefits are mentioned and no negative sentiment is apparent.
          6. Each object in the array must have exactly these 5 fields.
          7. Two brands cannot have the same rank and always start with 1, rank based on your analysis and the score you determined.

          Text Analysis:
          ---
          ${text}
          ---
          
          Output the JSON array now:`;

          const response = await generateText({
            model: modelConfig.model,
            prompt: extractionPromptForText,
            temperature: 0.0,
            max_retries: 2,
          });

          // Attempt to parse the text response as JSON
          try {
            // Basic cleanup: remove potential markdown backticks
            const cleanedText = response.text
              .replace(/^```json\n?|\n?```$/g, "")
              .trim();
            extractedObject = JSON.parse(cleanedText);
            // Optionally, validate with Zod: rankingSchema.parse(extractedObject);
          } catch (parseError) {
            console.error(
              `Failed to parse JSON from Perplexity for ${name}:`,
              parseError,
              "Raw Text:",
              response.text
            );
            throw new Error(`JSON parsing failed for ${name}`);
          }
        } else {
          // Use generateObject for other models
          const extractionPromptForObject = `
          Extract brands/companies/services from the text, rank them, score them out of 100 and rate their sentiment. 
                Output should be EXACTLY in this JSON format:
                {
                  "brands": [
                    {
                      "name": "Brand Name",
                      "rank": 1-10, // Two brands cannot have the same rank
                      "sentiment": "positive|negative|neutral",
                      "score": 1-100, 
                      "reasoning": "Key benefits or features in 1-2 lines"
                    }
                  ]
                }

                Rules:
                1. ONLY output valid JSON object conforming to the schema.
                2. Include ALL mentioned brands and order it the way it was provided in the text
                3. Keep reasons factual and concise based *only* on the provided text
                4. Use only positive/negative/neutral for sentiment
                5. Default to positive if benefits are mentioned
                6. Each brand must have exactly these 5 fields
                7. Two brands cannot have the same rank and always start with 1, rank based on your analysis and the score you determined.
  
                Text Analysis:
                ---
                ${text}
                ---
                
                Respond ONLY with the valid JSON object.`;

          const { object } = await generateObject({
            model: modelConfig.model, // Use the original model
            schema: rankingSchema,
            prompt: extractionPromptForObject,
            max_retries: 2,
            temperature: 0.0,
          });
          extractedObject = object;
        }

        // Add extracted rankings to the main rankings array
        let brandsToProcess:
          | {
              name: string;
              rank: number | null;
              sentiment: string;
              score: number;
              reasoning: string;
            }[]
          | null = null;

        if (name.toLowerCase().includes("perplexity")) {
          // For Perplexity, extractedObject should be the array directly
          if (Array.isArray(extractedObject)) {
            brandsToProcess = extractedObject;
          } else {
            console.warn(
              `Parsed object from Perplexity is not an array for ${name}. Parsed:`,
              extractedObject
            );
          }
        } else {
          // For other models, the array is inside the .brands property
          if (extractedObject && Array.isArray(extractedObject.brands)) {
            brandsToProcess = extractedObject.brands;
          } else {
            console.warn(
              `Extracted object or brands array is invalid for ${name}. Extracted:`,
              extractedObject
            );
          }
        }

        // Process if we have a valid array of brands
        if (brandsToProcess) {
          for (const brand of brandsToProcess) {
            // Add null/type checks for safety
            const sentiment = brand.sentiment || "neutral";
            const score = typeof brand.score === "number" ? brand.score : 0;
            const rank = typeof brand.rank === "number" ? brand.rank : null;

      rankings.push({
        id: uuidv4(),
              entity_id: uuidv4(), // Will be updated later
              entity_name: brand.name || "Unknown Brand",
              entity_type: "brand",
        user_id,
              llm_name: name, // Attribute ranking to the original text model
        query,
              rank: rank,
              score: score,
              sentiment: sentiment, // Use checked sentiment
              reasoning: brand.reasoning || "",
              mode: "Explorer",
        mode_id,
        analyzed_at: new Date().toISOString(),
            });
          }
          return { name, success: true };
        } else {
          // Throw error if we couldn't get a valid brand array from either path
          console.error(`Could not obtain a valid brands array for ${name}.`); // Log specific error
          throw new Error(`Invalid structure processed for ${name}`);
        }
      } catch (error) {
        console.error(`Error extracting rankings using ${name}:`, error);
        return { name, success: false }; // Indicate failure
      }
    });

  // Wait for all extraction attempts
  await Promise.all(extractionPromises);

  // 5. Process Unique Brands and Social Insights (using the extracted rankings)
  const uniqueBrands = new Set();
  const brandEntityMap = new Map();

  // Assign consistent entity_ids based on extracted rankings
  const finalRankings: AIRanking[] = [];
  for (const ranking of rankings) {
    let entityId;
    if (brandEntityMap.has(ranking.entity_name)) {
      entityId = brandEntityMap.get(ranking.entity_name);
    } else {
      entityId = uuidv4();
      brandEntityMap.set(ranking.entity_name, entityId);
      uniqueBrands.add(ranking.entity_name);
    }
    finalRankings.push({ ...ranking, entity_id: entityId });
  }

  // Initialize Exa client (moved here as it's needed for social insights)
  const exa = new Exa(Deno.env.get("EXA_API_KEY") || "");

  // Process social data for each unique brand... (rest of the function remains similar)
  // ... (Keep the existing socialPromises loop and processing logic) ...
  // ... using `Array.from(uniqueBrands)` and `brandEntityMap` ...

  // Make sure to use `finalRankings` instead of `rankings` from now on

  const socialPromises: Promise<{
    brandName: string;
    entityId: string; // Add entityId here
    sentiment?: string;
    mentions?: number;
    sources?: any;
    xResults?: any;
    error?: Error;
  }>[] = [];

  // Use Array.from to convert Set to Array
  for (const brandName of Array.from(uniqueBrands).slice(0, 4)) {
    socialPromises.push(
      (async () => {
        const entityId = brandEntityMap.get(brandName); // Get the consistent entityId
        try {
          const searchQuery = `${brandName} ${query}`;
          const [xResults, sources] = await Promise.all([
            exa.searchAndContents(searchQuery, {
              type: "keyword",
              numResults: 2,
              includeDomains: ["x.com", "reddit.com"],
              text: true,
            }),
            exa.searchAndContents(query, {
              text: true,
              type: "keyword",
              summary: true,
              numResults: 10,
            }),
          ]);

          const brandMentions = sources.results.reduce((count, result) => {
            const text = result.text || "";
            const summary = result.summary || "";
            return (
              count +
              (text.includes(brandName) ? 1 : 0) +
              (summary.includes(brandName) ? 1 : 0)
            );
          }, 0);

          const posts = xResults.results.map((r) => r.text).join("\\n");
          const sentiment = await analyzeSentiment(posts);
          
          return {
            brandName,
            entityId, // Return entityId
            sentiment,
            mentions: brandMentions,
            sources: sources.results,
            xResults,
          };
        } catch (error) {
          console.error(
            `Error processing social data for ${brandName}:`,
            error
          );
          return {
            brandName,
            entityId, // Return entityId even on error
            error,
          };
        }
      })()
    );
  }

  // Process all social data results
  const socialResults = await Promise.all(socialPromises);
  
  // Create final data structures from results
  for (const result of socialResults) {
    if (result.error) {
      socialInsights.push({
        id: uuidv4(),
        entity_id: result.entityId, // Use consistent entityId
        entity_name: result.brandName,
        entity_type: "brand",
        user_id,
        search_id: mode_id, // Use mode_id consistently
        platform: "X",
        keyword: query,
        mention_count: 0,
        sentiment: "neutral",
        data_fetched_at: new Date().toISOString(),
        links: [""],
      });
    } else {
      socialInsights.push({
        id: uuidv4(),
        entity_id: result.entityId, // Use consistent entityId
        entity_name: result.brandName,
        entity_type: "brand",
        user_id,
        search_id: mode_id, // Use mode_id consistently
        platform: "X",
        keyword: query,
        mention_count: result.mentions || 0,
        sentiment: result.sentiment || "neutral",
        data_fetched_at: new Date().toISOString(),
        links: result.sources
          ? result.sources.map((s) => JSON.stringify(s))
          : [""], // Stringify sources
      });
    }
  }

  // 6. Return results
  return {
    search_id,
    mode: "Explorer",
    mode_id,
    ai_rankings: finalRankings, // Use the rankings derived from text extraction
    social_insights: socialInsights,
  };
}

// Function to identify potential competitors
export async function findCompetitors(
  brand: string,
  industry: string
): Promise<string[]> {
  const exa = new Exa(Deno.env.get("EXA_API_KEY") || "");
  const query = `top competitors of ${brand} in ${industry}`;
  
  try {
    const searchResults = await exa.search(query, {
      type: "keyword",
      numResults: 5,
    });
    
    // Extract competitor names using LLM
    const model = groq("gemma2-9b-it");
    const prompt = `Based on the following search results about competitors of ${brand} in the ${industry} industry, 
    identify the top 3-5 competitor brands. Return ONLY the list of competitor brand names as a JSON array of strings.
    
    Search results:
    ${searchResults.results.map((r) => r.title + ": " + r.text).join("\n\n")}
    
    The response should be formatted as a JSON array, for example: ["Competitor 1", "Competitor 2", "Competitor 3"]`;
    
    const { object } = await generateObject({
      model,
      schema: z.array(z.string()),
      prompt,
      max_retries: 3,
    });
    
    return object;
  } catch (error) {
    console.error("Error finding competitors:", error);
    return [];
  }
}

// Edge Function handler if you want to expose this as a standalone function
serve(async (req) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

    const {
      user_id,
      query,
      mode_id,
      search_id,
      brand_name,
      brand_industry,
      brand_id,
    } = await req.json();
    
    if (!user_id || !query || !brand_name) {
      return new Response(
        JSON.stringify({
          error:
            "Query and Brand Name are required to perform this search analysis",
        }),
        { status: 400, headers }
      );
    }

    const results = await explorerAnalysis(
      user_id,
      query,
      mode_id,
      search_id,
      brand_name,
      brand_industry,
      brand_id
    );

    return new Response(JSON.stringify(results), { headers });
  } catch (error) {
    console.error("Error in explorerAnalysis edge function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});

// Voyager: Multi-model analysis with social sentiment - Optimized
export async function voyagerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  // Call the search-google endpoint after mode_id is defined
  await callSearchGoogleEndpoint(query, mode_id, user_id);
  
  const models = [
    {
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      name: "Llama 4 Scout",
    },
    { model: groq("deepseek-r1-distill-llama-70b"), name: "DeepSeek R1" },
    { model: groq("mistral-saba-24b"), name: "Mistral Saba 24B" },
    { model: groq("gemma2-9b-it"), name: "Gemma 2 9B" },
  ];

  const rankings: AIRanking[] = [];
  const socialInsights: SocialInsight[] = [];

  // 2. Generate Text Summaries for all models
  async function generateTextForAllModels(models) {
    return Promise.all(
      models.map(async ({ model, name }) => {
        try {
          const response = await generateText({
            model,
            prompt: query,
            temperature: 0.1,
          });

          let text = response.text;
          let citations = null;

          // Only try to extract citations for Perplexity
          if (name.toLowerCase().includes("perplexity")) {
            const citationMatch = text.match(/Citations?:\\s*([\\s\\S]+)$/i);
            if (citationMatch) {
              try {
                citations = JSON.parse(citationMatch[1]);
                text = text.replace(citationMatch[0], "").trim();
              } catch {
                /* Ignore parse error */
              }
            }
            if (!citations) {
              const urlMatches = text.match(/https?:\/\/[^\\s)]+/g);
              if (urlMatches) citations = urlMatches;
            }
          }

          return { name, text, citations, success: true };
        } catch (error) {
          console.error(`Error generating text for ${name}:`, error);
          return { name, text: null, citations: null, success: false };
        }
      })
    );
  }

  const textGenerationResults = await generateTextForAllModels(models);

  // 3. Store Summaries in Supabase
  const insertPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text, citations }) => {
      const { error } = await supabase.from("ai_summary").insert({
        model: name,
        summary: text,
        query,
        mode_id,
        reasoning: citations || null, // Store citations in reasoning
      });

      if (error) {
        console.error(`Error inserting summary for ${name}:`, error);
      }
    });

  // Wait for all summary insertions to complete before proceeding
  await Promise.all(insertPromises);

  // 4. Extract Structured Rankings from Text
  const rankingSchema = z.object({
    brands: z.array(
      z.object({
      name: z.string(),
      rank: z.number().nullable(),
        sentiment: z.string(),
      score: z.number(),
        reasoning: z.string(),
      })
    ),
  });

  const extractionPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text }) => {
      const modelConfig = models.find((m) => m.name === name);
      if (!modelConfig) {
        console.error(
          `Cannot find model config for ${name} during extraction.`
        );
        return { name, success: false };
      }

      try {
        let extractedObject: {
          brands: {
            name: string;
            rank: number | null;
            sentiment: string;
            score: number;
            reasoning: string;
          }[];
        };

        if (name.toLowerCase().includes("perplexity")) {
          // Use generateText for Perplexity, asking for JSON
          const extractionPromptForText = `
          Based ONLY on the text provided below, extract brands/companies/services, rank them, score them out of 100 and rate their sentiment. 
          Output should be EXACTLY in this JSON format (a valid JSON array):
          [
            {
              "name": "Brand Name",
              "rank": 1-10, // Two brands cannot have the same rank
              "sentiment": "positive|negative|neutral",
              "score": 1-100,
              "reasoning": "Key benefits or features in 1-2 lines"
            }
          ]

          Rules:
          1. ONLY output the valid JSON array. No introductory text, no markdown backticks.
          2. Include ALL mentioned brands and order them as they appeared in the text.
          3. Keep reasons factual and concise based *only* on the provided text.
          4. Use only positive/negative/neutral for sentiment.
          5. Default sentiment to positive if benefits are mentioned and no negative sentiment is apparent.
          6. Each object in the array must have exactly these 5 fields.
          7. Two brands cannot have the same rank and always start with 1, rank based on your analysis and the score you determined.

          Text Analysis:
          ---
          ${text}
          ---
          
          Output the JSON array now:`;

          const response = await generateText({
            model: modelConfig.model,
            prompt: extractionPromptForText,
            temperature: 0.0,
            max_retries: 2,
          });

          // Attempt to parse the text response as JSON
          try {
            // Basic cleanup: remove potential markdown backticks
            const cleanedText = response.text
              .replace(/^```json\n?|\n?```$/g, "")
              .trim();
            extractedObject = JSON.parse(cleanedText);
            // Optionally, validate with Zod: rankingSchema.parse(extractedObject);
          } catch (parseError) {
            console.error(
              `Failed to parse JSON from Perplexity for ${name}:`,
              parseError,
              "Raw Text:",
              response.text
            );
            throw new Error(`JSON parsing failed for ${name}`);
          }
        } else {
          // Use generateObject for other models
          const extractionPromptForObject = `
          Extract brands/companies/services from the text, rank them, score them out of 100 and rate their sentiment. 
                Output should be EXACTLY in this JSON format:
                {
                  "brands": [
                    {
                      "name": "Brand Name",
                      "rank": 1-10, // Two brands cannot have the same rank
                      "sentiment": "positive|negative|neutral",
                      "score": 1-100, 
                      "reasoning": "Key benefits or features in 1-2 lines"
                    }
                  ]
                }

                Rules:
                1. ONLY output valid JSON object conforming to the schema.
                2. Include ALL mentioned brands and order it the way it was provided in the text
                3. Keep reasons factual and concise based *only* on the provided text
                4. Use only positive/negative/neutral for sentiment
                5. Default to positive if benefits are mentioned
                6. Each brand must have exactly these 5 fields
                7. Two brands cannot have the same rank and always start with 1, rank based on your analysis and the score you determined.
  
                Text Analysis:
                ---
                ${text}
                ---
                
                Respond ONLY with the valid JSON object.`;

          const { object } = await generateObject({
            model: modelConfig.model, // Use the original model
            schema: rankingSchema,
            prompt: extractionPromptForObject,
            max_retries: 2,
            temperature: 0.0,
          });
          extractedObject = object;
        }

        // Add extracted rankings to the main rankings array
        let brandsToProcess:
          | {
              name: string;
              rank: number | null;
              sentiment: string;
              score: number;
              reasoning: string;
            }[]
          | null = null;

        if (name.toLowerCase().includes("perplexity")) {
          // For Perplexity, extractedObject should be the array directly
          if (Array.isArray(extractedObject)) {
            brandsToProcess = extractedObject;
          } else {
            console.warn(
              `Parsed object from Perplexity is not an array for ${name}. Parsed:`,
              extractedObject
            );
          }
        } else {
          // For other models, the array is inside the .brands property
          if (extractedObject && Array.isArray(extractedObject.brands)) {
            brandsToProcess = extractedObject.brands;
          } else {
            console.warn(
              `Extracted object or brands array is invalid for ${name}. Extracted:`,
              extractedObject
            );
          }
        }

        // Process if we have a valid array of brands
        if (brandsToProcess) {
          for (const brand of brandsToProcess) {
            // Add null/type checks for safety
            const sentiment = brand.sentiment || "neutral";
            const score = typeof brand.score === "number" ? brand.score : 0;
            const rank = typeof brand.rank === "number" ? brand.rank : null;

      rankings.push({
        id: uuidv4(),
              entity_id: uuidv4(), // Will be updated later
              entity_name: brand.name || "Unknown Brand",
              entity_type: "brand",
        user_id,
              llm_name: name, // Attribute ranking to the original text model
        query,
              rank: rank,
              score: score,
              sentiment: sentiment, // Use checked sentiment
              reasoning: brand.reasoning || "",
              mode: "Voyager",
        mode_id,
        analyzed_at: new Date().toISOString(),
            });
          }
          return { name, success: true };
        } else {
          // Throw error if we couldn't get a valid brand array from either path
          console.error(`Could not obtain a valid brands array for ${name}.`); // Log specific error
          throw new Error(`Invalid structure processed for ${name}`);
        }
      } catch (error) {
        console.error(`Error extracting rankings using ${name}:`, error);
        return { name, success: false }; // Indicate failure
      }
    });

  // Wait for all extraction attempts
  await Promise.all(extractionPromises);

  // 5. Process Unique Brands and Social Insights (using the extracted rankings)
  const uniqueBrands = new Set();
  const brandEntityMap = new Map();

  // Assign consistent entity_ids based on extracted rankings
  const finalRankings: AIRanking[] = [];
  for (const ranking of rankings) {
    let entityId;
    if (brandEntityMap.has(ranking.entity_name)) {
      entityId = brandEntityMap.get(ranking.entity_name);
    } else {
      entityId = uuidv4();
      brandEntityMap.set(ranking.entity_name, entityId);
      uniqueBrands.add(ranking.entity_name);
    }
    finalRankings.push({ ...ranking, entity_id: entityId });
  }

  // Initialize Exa client (moved here as it's needed for social insights)
  const exa = new Exa(Deno.env.get("EXA_API_KEY") || "");

  // Process social data for each unique brand... (rest of the function remains similar)
  // ... (Keep the existing socialPromises loop and processing logic) ...
  // ... using `Array.from(uniqueBrands)` and `brandEntityMap` ...

  // Make sure to use `finalRankings` instead of `rankings` from now on

  const socialPromises: Promise<{
    brandName: string;
    entityId: string; // Add entityId here
    sentiment?: string;
    mentions?: number;
    sources?: any;
    xResults?: any;
    error?: Error;
  }>[] = [];

  // Use Array.from to convert Set to Array
  for (const brandName of Array.from(uniqueBrands).slice(0, 4)) {
    socialPromises.push(
      (async () => {
        const entityId = brandEntityMap.get(brandName); // Get the consistent entityId
        try {
          const searchQuery = `${brandName} ${query}`;
          const [xResults, sources] = await Promise.all([
            exa.searchAndContents(searchQuery, {
              type: "keyword",
              numResults: 2,
              includeDomains: ["x.com", "reddit.com"],
              text: true,
            }),
            exa.searchAndContents(query, {
              text: true,
              type: "keyword",
              summary: true,
              numResults: 10,
            }),
          ]);

          const brandMentions = sources.results.reduce((count, result) => {
            const text = result.text || "";
            const summary = result.summary || "";
            return (
              count +
              (text.includes(brandName) ? 1 : 0) +
              (summary.includes(brandName) ? 1 : 0)
            );
          }, 0);

          const posts = xResults.results.map((r) => r.text).join("\\n");
          const sentiment = await analyzeSentiment(posts);
          
          return {
            brandName,
            entityId, // Return entityId
            sentiment,
            mentions: brandMentions,
            sources: sources.results,
            xResults,
          };
        } catch (error) {
          console.error(
            `Error processing social data for ${brandName}:`,
            error
          );
          return {
            brandName,
            entityId, // Return entityId even on error
            error,
          };
        }
      })()
    );
  }

  // Process all social data results
  const socialResults = await Promise.all(socialPromises);
  
  // Create final data structures from results
  for (const result of socialResults) {
    if (result.error) {
      socialInsights.push({
        id: uuidv4(),
        entity_id: result.entityId, // Use consistent entityId
        entity_name: result.brandName,
        entity_type: "brand",
        user_id,
        search_id: mode_id, // Use mode_id consistently
        platform: "X",
        keyword: query,
        mention_count: 0,
        sentiment: "neutral",
        data_fetched_at: new Date().toISOString(),
        links: [""],
      });
    } else {
      socialInsights.push({
        id: uuidv4(),
        entity_id: result.entityId, // Use consistent entityId
        entity_name: result.brandName,
        entity_type: "brand",
        user_id,
        search_id: mode_id, // Use mode_id consistently
        platform: "X",
        keyword: query,
        mention_count: result.mentions || 0,
        sentiment: result.sentiment || "neutral",
        data_fetched_at: new Date().toISOString(),
        links: result.sources
          ? result.sources.map((s) => JSON.stringify(s))
          : [""], // Stringify sources
      });
    }
  }

  return {
    search_id,
    mode: "Voyager",
    mode_id,
    ai_rankings: rankings,
    social_insights: socialInsights,
  };
}

// Helper function to analyze sentiment
async function analyzeSentiment(
  text: string
): Promise<"positive" | "negative" | "neutral"> {
  // Truncate text to approximately 2000 tokens (about 1500 words)
  const MAX_CHARS = 2000;
  const truncatedText =
    text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "..." : text;
  
  try {
    const { object } = await generateObject({
      model: groq("llama3-70b-8192"),
      schema: z.object({
        sentiment: z.enum(["positive", "negative", "neutral"]),
      }),
      prompt: `Analyze the sentiment of the following text and respond with ONLY one of these exact words: "positive", "negative", or "neutral".      
        Text to analyze: "${truncatedText}"

        Your response should follow this format exactly:
        {"sentiment": "positive"} or {"sentiment": "negative"} or {"sentiment": "neutral"}`,
      temperature: 0.1,
      max_retries: 3,
    });
    
    return object.sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Default to neutral if analysis fails
    return "neutral";
  }
}

// Helper function to generate trend points from search results
function generateTrendPoints(
  xResults: any[]
): { date: string; value: number }[] {
  // For now, generate mock trend data
  // In a real implementation, you'd extract actual dates from the posts
  return Array.from({ length: Math.min(xResults.length, 7) }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    value: 30 + Math.floor(Math.random() * 70), // Random value between 30-100
  })).reverse(); // Reverse to show oldest to newest
}

// Edge Function handler for direct invocation

serve(async (req) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

    const { user_id, query } = await req.json();
    
    if (!user_id || !query) {
      return new Response(
        JSON.stringify({ error: "user_id and query are required" }),
        { status: 400, headers }
      );
    }

    const results = await voyagerAnalysis(user_id, query);
    
    return new Response(JSON.stringify(results), { headers });
  } catch (error) {
    console.error("Error in voyagerAnalysis edge function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});

// DeepFocus: Analysis with gemma2 and llama-3.3 - Optimized
export async function deepFocusAnalysis(
  user_id: string, 
  query: string, 
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const models = [
    { model: groq("gemma2-9b-it"), name: "Gemma 2 9B" },
    { model: groq("llama-3.3-70b-versatile"), name: "Llama 3.3 70B" },
  ];

  const rankings: AIRanking[] = [];

  try {
    const formattedPrompt = BRAND_RANKING_PROMPT.replace("{query}", query);
    const responseSchema = z.object({ 
      brands: z.array(
        z.object({
        name: z.string(),
        rank: z.number().nullable(),
        score: z.number(),
          reasoning: z.string(),
    })
      ),
    });

    // Run all model queries in parallel
    const modelPromises = models.map(({ model, name }) => 
      generateObject({
        model,
        schema: responseSchema,
        prompt: formattedPrompt,
      }).then((response) => ({ response, name }))
    );

    // Wait for all model responses
    const modelResults = await Promise.all(modelPromises);
    
    // Process results
    for (const { response, name } of modelResults) {
      for (const brand of response.object.brands) {
        rankings.push({
          id: uuidv4(),
          entity_id: uuidv4(),
          entity_name: brand.name,
          entity_type: "brand",
          user_id,
          llm_name: name,
          query,
          rank: brand.rank,
          score: brand.score,
          reasoning: brand.reasoning,
          mode: "DeepFocus",
          mode_id,
          analyzed_at: new Date().toISOString(),
        });
      }
    }
    
    return {
      search_id,
      mode: "DeepFocus",
      mode_id,
      ai_rankings: rankings,
    };
  } catch (error) {
    console.error("Error in deepFocusAnalysis:", error);
    throw error;
  }
}

// Function to generate top brands in an industry
export async function generateTopBrands(industry: string): Promise<Brand[]> {
  try {
    const model = groq("llama-3.3-70b-versatile");
    const prompt =
      BRAND_GENERATION_PROMPT.replace("{industry}", industry) +
      "\n\nThe response should be a valid JSON array of objects, with each object having 'name' and 'description' fields.";
    
    const { object } = await generateObject({
      model,
      schema: z.array(
        z.object({
        name: z.string(),
          description: z.string(),
        })
      ),
      prompt,
      max_retries: 3,
      temperature: 0.1,
    });
    
    return object;
  } catch (error) {
    console.error("Error in generateTopBrands:", error);
    throw error;
  }
}

// Edge Function handler for direct invocation

serve(async (req) => {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  });

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

    const { pathname } = new URL(req.url);
    
    // Handle generateTopBrands endpoint
    if (pathname.endsWith("/generate-brands")) {
      const { industry } = await req.json();
      if (!industry) {
        return new Response(
          JSON.stringify({ error: "Industry parameter is required" }),
          { status: 400, headers }
        );
      }
      
      const brands = await generateTopBrands(industry);
      return new Response(JSON.stringify(brands), { headers });
}

    // Handle deepFocusAnalysis endpoint
    const { user_id, query } = await req.json();
    
    if (!user_id || !query) {
      return new Response(
        JSON.stringify({ error: "user_id and query are required" }),
        { status: 400, headers }
      );
    }

    const results = await deepFocusAnalysis(user_id, query);
    
    return new Response(JSON.stringify(results), { headers });
  } catch (error) {
    console.error("Error in deepFocusAnalysis edge function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SB_BRAND_URL") ?? "",
  Deno.env.get("SB_BRAND_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      persistSession: false,
    },
    }
);

// Save search results to Supabase
export async function saveToSupabase(
  results: SearchResults,
  user_id: string
): Promise<void> {
  try {
    // ai_summary data is already saved during the text generation phase.
    // We only need to save ai_rankings (which now uses consistent entity_ids)
    // and social_insights.

    // Ensure brand records exist (using the consistent entity IDs)
    const brandPromises = results.ai_rankings.map(async (ranking) => {
      // Check if brand exists by entity_id FIRST
      const { data: existingBrand, error: checkError } = await supabase
        .from("brands")
        .select("id")
        .eq("id", ranking.entity_id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // Ignore 'not found' error
        console.error("Error checking for existing brand:", checkError);
        // Decide how to handle - maybe skip this ranking or throw?
        return null;
      }

      if (existingBrand) {
        return existingBrand.id; // Brand exists, return ID
      } else {
        // Brand doesn't exist, create it WITH the specific entity_id
        const { data: newBrand, error: createError } = await supabase
          .from("brands")
        .insert({
            id: ranking.entity_id, // Use the pre-generated UUID
            name: ranking.entity_name,
            // industry: 'Unknown', // Maybe add industry if available?
            user_id: user_id, // Ensure user_id is correctly passed
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) {
          console.error(
            `Brand creation error for ${ranking.entity_name} (ID: ${ranking.entity_id}):`,
            createError
          );
          // Decide how to handle error
          return null;
        }
        return newBrand.id;
      }
    });

    // Wait for all brand checks/creations
    const brandIds = (await Promise.all(brandPromises)).filter(
      (id) => id !== null
    );

    // Filter rankings to only include those whose brands were successfully found/created
    const validRankingsToSave = results.ai_rankings.filter((r) =>
      brandIds.includes(r.entity_id)
    );

    if (validRankingsToSave.length > 0) {
      console.log("Saving AI rankings:", validRankingsToSave.length);
    const { error: rankingsError } = await supabase
        .from("ai_rankings")
        .insert(validRankingsToSave); // Insert the validated rankings

    if (rankingsError) {
        console.error("AI Rankings save failed:", rankingsError);
        // Don't necessarily throw, maybe just log, depending on desired behavior
      }
    } else {
      console.warn("No valid AI rankings to save after brand check/creation.");
    }

    // Save social insights (ensure entity_ids match the ones used in rankings)
    if (results.social_insights && results.social_insights.length > 0) {
      // Filter insights to match valid brand IDs
      const validSocialInsights = results.social_insights.filter((insight) =>
        brandIds.includes(insight.entity_id)
      );

      if (validSocialInsights.length > 0) {
        console.log("Saving Social Insights:", validSocialInsights.length);
      const { error: socialError } = await supabase
          .from("social_insights")
          .insert(validSocialInsights);
      
      if (socialError) {
          console.error(`Social Insights save failed: ${socialError.message}`);
          // Don't necessarily throw
        }
      } else {
        console.warn("No valid social insights to save after brand check.");
      }
    }

    // Recommendations saving logic (if applicable for the mode) remains the same
    if (results.recommendations && results.recommendations.suggestion) {
      const { error: recommendationsError } = await supabase
        .from("recommendations")
        .insert(results.recommendations); // Assuming recommendations schema is correct

      if (recommendationsError) {
        console.error("Recommendations save failed:", recommendationsError);
        // Don't necessarily throw
      }
    }
  } catch (error) {
    console.error("Error in saveToSupabase:", error);
    // Decide if this function should throw or just log errors
    // throw error;
  }
}

// Fetch search results by search ID
export async function getSearchResultsBySearchId(
  search_id: string
): Promise<SearchResults | null> {
  try {
    // Get AI rankings
    const { data: rankingsData, error: rankingsError } = await supabase
      .from("ai_rankings")
      .select("*")
      .eq("id", search_id);
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return null;
    }
    
    // Get social insights if any
    const { data: insightsData, error: insightsError } = await supabase
      .from("social_insights")
      .select("*")
      .eq("search_id", search_id);
    
    if (insightsError) {
      throw new Error(
        `Failed to fetch social insights: ${insightsError.message}`
      );
    }
    
    return {
      search_id,
      mode: rankingsData[0].mode,
      mode_id: rankingsData[0].mode_id,
      ai_rankings: rankingsData as AIRanking[],
      social_insights: insightsData as SocialInsight[],
    };
  } catch (error) {
    console.error("Error in getSearchResultsBySearchId:", error);
    throw error;
  }
}

// Fetch results by mode ID
export async function getSearchResultsByModeId(
  mode_id: string
): Promise<SearchResults | null> {
  try {
    // Get all AI rankings with this mode_id
    const { data: rankingsData, error: rankingsError } = await supabase
      .from("ai_rankings")
      .select("*")
      .eq("mode_id", mode_id);
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return null;
    }
    
    // Get social insights if any
    const { data: insightsData } = await supabase
      .from("social_insights")
      .select("*")
      .eq("search_id", rankingsData[0].id);
    
    return {
      search_id: rankingsData[0].id,
      mode: rankingsData[0].mode,
      mode_id,
      ai_rankings: rankingsData as AIRanking[],
      social_insights: (insightsData as SocialInsight[]) || [],
    };
  } catch (error) {
    console.error("Error in getSearchResultsByModeId:", error);
    throw error;
  }
}

// Fetch all search results for a user
export async function getUserSearchResults(
  user_id: string
): Promise<SearchResults[]> {
  try {
    // Get all AI rankings for this user
    const { data: rankingsData, error: rankingsError } = await supabase
      .from("ai_rankings")
      .select("*")
      .eq("user_id", user_id)
      .order("analyzed_at", { ascending: false });
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return [];
    }
    
    // Group rankings by mode_id
    const modeGroups = rankingsData.reduce((acc, ranking) => {
      if (!acc[ranking.mode_id]) {
        acc[ranking.mode_id] = [];
      }
      acc[ranking.mode_id].push(ranking);
      return acc;
    }, {} as Record<string, AIRanking[]>);
    
    // Create SearchResults for each mode group
    return Object.entries(modeGroups).map(
      ([mode_id, rankings]): SearchResults => {
        const firstRanking = rankings[0] as AIRanking;
      return {
        search_id: firstRanking.id,
        mode: firstRanking.mode as AnalysisMode,
        mode_id,
        ai_rankings: rankings as AIRanking[],
        social_insights: [], // Would need to fetch separately if needed
        };
      }
    );
  } catch (error) {
    console.error("Error in getUserSearchResults:", error);
    throw error;
  }
}

// Edge Function handler for direct invocation if needed

serve(async (req) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });

  const { searchParams } = new URL(req.url);
  const mode_id = searchParams.get("mode_id");
  const user_id = searchParams.get("user_id");

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

     let results;
    if (mode_id) {
      results = await getSearchResultsByModeId(mode_id);
    } else if (user_id) {
      results = await getUserSearchResults(user_id);
    }

    if (!results) {
      return new Response(JSON.stringify({ error: "Not found" }), { headers });
    }

    return new Response(JSON.stringify(results || { error: "Not found" }), {
      headers,
    });
  } catch (error) {
    console.error("Error in supabaseUtils edge function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});
