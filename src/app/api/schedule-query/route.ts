/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { countries } from "@/lib/countries";

// --- Supabase and AI Clients ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (
  !supabaseUrl ||
  !supabaseServiceKey ||
  !openRouterApiKey
) {
  console.error("Missing environment variables!");
  // Handle missing variables appropriately in production (e.g., throw error, exit)
  throw new Error(
    "Missing required environment variables for Supabase/AI clients."
  );
}

export const maxDuration = 200;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openrouter = createOpenRouter({ apiKey: openRouterApiKey });

// --- Zod Schemas ---

// Google AI Mode Response Schemas
const AiOverviewReferenceSchema = z.object({
  type: z.literal('ai_overview_reference'),
  position: z.string(),
  source: z.string(),
  domain: z.string(),
  url: z.string(),
  title: z.string(),
  text: z.string(),
});

const AiOverviewElementSchema = z.object({
  type: z.literal('ai_overview_element'),
  position: z.string(),
  title: z.string().nullable(),
  text: z.string(),
  markdown: z.string(),
  links: z.any().nullable(),
  images: z.any().nullable(),
  references: z.array(AiOverviewReferenceSchema).nullable(),
});

const ItemSchema = z.object({
  type: z.literal('ai_overview'),
  rank_group: z.number(),
  rank_absolute: z.number(),
  position: z.string(),
  xpath: z.string(),
  markdown: z.string(),
  items: z.array(AiOverviewElementSchema),
  references: z.array(AiOverviewReferenceSchema),
  rectangle: z.any().nullable(),
});

const ResultSchema = z.object({
  keyword: z.string(),
  type: z.string(),
  se_domain: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  check_url: z.string(),
  datetime: z.string(),
  spell: z.any().nullable(),
  refinement_chips: z.any().nullable(),
  item_types: z.array(z.string()),
  se_results_count: z.number(),
  items_count: z.number(),
  items: z.array(ItemSchema),
});

const DataSchema = z.object({
  api: z.string(),
  function: z.string(),
  se: z.string(),
  se_type: z.string(),
  keyword: z.string(),
  location_name: z.string(),
  language_name: z.string(),
  device: z.string(),
  os: z.string(),
  calculate_rectangles: z.boolean(),
});

const TaskSchema = z.object({
  id: z.string(),
  status_code: z.number(),
  status_message: z.string(),
  time: z.string(),
  cost: z.number(),
  result_count: z.number(),
  path: z.array(z.string()),
  data: DataSchema,
  result: z.array(ResultSchema),
});

const GoogleAiResponseSchema = z.array(
  z.object({
    version: z.string(),
    status_code: z.number(),
    status_message: z.string(),
    time: z.string(),
    cost: z.number(),
    tasks_count: z.number(),
    tasks_error: z.number(),
    tasks: z.array(TaskSchema),
  })
);

// Schema for a single brand analysis by one LLM
const BrandResultSchema = z.object({
  name: z.string().describe("The name of the brand analyzed."), // Changed from brand_name
  rank: z.number().min(1).max(10).describe("Numerical rank (1-10, 1 is best)."), // Made non-nullable
  score: z.number().min(0).max(100).describe("Confidence score (0-100)."),
  reasoning: z.string().describe("Detailed reasoning for the ranking."),
});

// Schema for the *direct output* expected from LLMs supporting generateObject
const LLMOutputSchema = z.object({
  brands: z
    .array(BrandResultSchema)
    .describe("List of analyzed brands with rank, score, and reasoning."),
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
  ),
});

// Schema for a single analysis run (one object in the 'results' array)
const AnalysisRunSchema = z.object({
  analysis_date: z
    .string()
    .datetime()
    .describe("ISO 8601 timestamp of when the analysis was performed."),
  model_results: z
    .array(
      z.object({
        llm_name: z.string().describe("Name of the language model used."),
        status: z
          .enum(["fulfilled", "rejected"])
          .describe("Status of the API call for this model."),
        data: LLMOutputSchema.nullable()
          .optional()
          .describe("The structured brand analysis data if successful."), // Store successful data
        error: z
          .string()
          .nullable()
          .optional()
          .describe("Error message if the API call failed."), // Store error message if rejected
      })
    )
    .describe("Results from each language model for this analysis run."),
    model_summary: z
    .array(
      z.object({
        model: z.string(),
        summary: z.string(),
        query: z.string(),
        reasoning: z.string(),
      })
    )
    .describe("Summary from each language model for this analysis run."),
    keyword_analysis: keywordAnalysisSchema.nullable()
    .describe("Keyword analysis from the keyword analysis model for this analysis run."),
});

// Schema for the entire 'results' column (a jsonb storing an array of runs)
const StoredResultsSchema = z
  .array(AnalysisRunSchema)
  .describe("Historical array of analysis runs.");

// --- Prompt ---
// Updated prompt to be more explicit about the JSON structure and format.
const RANKING_PROMPT = `You are an expert brand analyst.
Based ONLY on the text provided below,
Extract a list of relevant brands based on the text. For each brand, provide:
1.  A numerical rank (integer from 1 to 10, where 1 is the most relevant/best).
2.  A confidence score (integer from 0 to 100) indicating certainty in the ranking.
3.  Detailed reasoning for the ranking, considering market analysis, consumer perception, and brand reputation.

Your response MUST be a valid JSON object adhering strictly to the following schema:
{
  "type": "object",
  "properties": {
    "brands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "The name of the brand analyzed." },
          "rank": { "type": "integer", "minimum": 1, "maximum": 10, "description": "Numerical rank (1-10, 1 is best)." },
          "score": { "type": "integer", "minimum": 0, "maximum": 100, "description": "Confidence score (0-100)." },
          "reasoning": { "type": "string", "description": "Detailed reasoning for the ranking." },
          "sentiment": { "type": "string", "description": "Sentiment of the brand." }
        },
        "required": ["name", "rank", "score", "reasoning"]
      },
      "description": "List of analyzed brands with rank, score, and reasoning."
    }
  },
  "required": ["brands"]
}

Text Analysis:
          ---
            "{text}"
          ---

Do NOT include any text outside of the JSON object. Do NOT use markdown code fences.
`;

// --- Helper Functions ---

/**
 * Safely parses and validates the existing results from Supabase.
 * Assumes 'results' is a single jsonb column storing an array adhering to StoredResultsSchema.
 * @param results - The raw data from the Supabase 'results' column.
 * @returns A validated array of analysis runs, or an empty array if invalid/null.
 */
function parseAndValidateExistingResults(
  results: any
): z.infer<typeof StoredResultsSchema> {
  if (!results) {
    console.log("No existing results found, starting fresh.");
    return [];
  }

  // If it's already an array (Supabase might parse jsonb automatically), use it directly.
  // Otherwise, try parsing if it's a string.
  let parsed: any;
  if (Array.isArray(results)) {
    parsed = results;
  } else if (typeof results === "string") {
    try {
      parsed = JSON.parse(results);
    } catch (e) {
      console.error("Error parsing existing results string:", e);
      return []; // Return empty array on parsing error
    }
  } else {
    console.warn(
      "Existing results are not an array or string, type:",
      typeof results
    );
    return []; // Return empty array if format is unexpected
  }

  // Validate the parsed structure against the schema
  const validation = StoredResultsSchema.safeParse(parsed);
  if (validation.success) {
    console.log(
      `Successfully parsed and validated ${validation.data.length} existing analysis runs.`
    );
    return validation.data;
  } else {
    console.error(
      "Existing results validation failed:",
      validation.error.errors
    );
    return [];
  }
}

/**
 * Extracts a JSON object from a string, potentially removing markdown fences.
 * @param text - The raw text response from an LLM.
 * @returns The cleaned JSON string, or null if no JSON object is found.
 */
function extractJsonFromString(text: string): string | null {
  // Regex to find JSON possibly enclosed in ```json ... ``` or just starting with {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```|^\s*({[\s\S]*})\s*$/;
  const match = text.trim().match(jsonRegex);

  if (match) {
    // Return the captured group (either from ```json ... ``` or the standalone object)
    return match[1] || match[2];
  }
  console.warn("Could not extract JSON object from text:", text);
  return null; // Return null if no JSON object pattern is found
}
async function callSearchGoogleEndpoint(
  query: string,
  mode_id: string,
  user_id: string,
  location?: string,
  brandName?: string,
): Promise<void> {
  try {
    const apiUrl = `https://airankia.com/api/search-google`;
    const internalApiKey = process.env.INTERNAL_API_KEY;
    
    // Log environment setup
    console.log("Search API call setup:");
    console.log("- Using URL:", apiUrl);
    console.log("- Internal API key exists:", !!internalApiKey);
    console.log("- Using mode_id as monitoring_id:", mode_id);
    
    if (!internalApiKey) {
      console.error('INTERNAL_API_KEY is missing - required for server-to-server API calls');
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
      location: location || 'United States',
      brandName: brandName || undefined,
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
        }, null, 2)}`);
        return; // Continue execution despite error
      }
      
      const data = await response.json();
      console.log(`Search-google endpoint called successfully. Search ID: ${data.searchId}`);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
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

/**
 * Calls the Google AI Mode webhook and processes the response
 * @param prompt - The query prompt to analyze
 * @returns Object with text content and citations
 */
async function callGoogleAiMode(prompt: string, location: string, brandName: string, brandIndustry: string, brandLogoUrl: string, brandWebsite: string, brandLanguage: string, brandLocation: string): Promise<{
  text: string;
  citations: any[];
  success: boolean;
  error: string | null;
}> {
  try {
    console.log(`    Calling Google AI Mode for prompt: "${prompt}"`);
    
    const response = await fetch('https://primary-production-20a3.up.railway.app/webhook/2b8d1b46-8acd-4717-8870-88b7030eb2af', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: prompt,
        country: location,
        brandName: brandName,
        brandIndustry: brandIndustry,
        brandLogoUrl: brandLogoUrl,
        brandWebsite: brandWebsite,
        brandLanguage: brandLanguage,
        brandLocation: brandLocation
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI Mode API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response against our schema
    const validationResult = GoogleAiResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.warn('Google AI Mode response validation failed:', validationResult.error);
      // Continue with raw data if validation fails, but log the issue
    }

    // Extract markdown content and citations
    let combinedMarkdown = '';
    const allCitations: any[] = [];

    // Process each task result
    for (const responseItem of data) {
      for (const task of responseItem.tasks) {
        for (const result of task.result) {
          // Extract AI overview items
          const aiOverviewItems = result.items.filter((item: any) => item.type === 'ai_overview');
          
          for (const item of aiOverviewItems) {
            // Add the main markdown content
            if (item.markdown) {
              combinedMarkdown += item.markdown + '\n\n';
            }
            
            // Add citations from references
            if (item.references && Array.isArray(item.references)) {
              allCitations.push(...item.references.map((ref: any) => ({
                url: ref.url,
                title: ref.title,
                text: ref.text,
                domain: ref.domain,
                source: ref.source
              })));
            }
            
            // Also process items within the AI overview
            if (item.items && Array.isArray(item.items)) {
              for (const subItem of item.items) {
                if (subItem.markdown) {
                  combinedMarkdown += subItem.markdown + '\n\n';
                }
                if (subItem.references && Array.isArray(subItem.references)) {
                  allCitations.push(...subItem.references.map((ref: any) => ({
                    url: ref.url,
                    title: ref.title,
                    text: ref.text,
                    domain: ref.domain,
                    source: ref.source
                  })));
                }
              }
            }
          }
        }
      }
    }

    console.log(`    Google AI Mode success. Extracted ${combinedMarkdown.length} chars of content and ${allCitations.length} citations`);
    
    return {
      text: combinedMarkdown.trim() || 'No AI overview content found',
      citations: allCitations,
      success: true,
      error: null
    };

  } catch (error: any) {
    console.error(`    Error calling Google AI Mode:`, error.message);
    return {
      text: '',
      citations: [],
      success: false,
      error: error.message || "Google AI Mode call failed"
    };
  }
}

/**
 * Calls the Claude Search webhook and processes the response
 * @param prompt - The query prompt to analyze
 * @param country - Country code for location-based search
 * @returns Object with text content and citations
 */
async function callClaudeSearch(prompt: string, country: string = 'US', brandName: string, brandIndustry: string, brandLogoUrl: string, brandWebsite: string, brandLanguage: string, brandLocation: string): Promise<{
  text: string;
  citations: any[];
  success: boolean;
  error: string | null;
}> {
  try {
    console.log(`    Calling Claude Search for prompt: "${prompt}" with country: ${country}`);
    
    const response = await fetch('https://primary-production-20a3.up.railway.app/webhook/claudesearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: prompt,
        country: country,
        brandName: brandName,
        brandIndustry: brandIndustry,
        brandLogoUrl: brandLogoUrl,
        brandWebsite: brandWebsite,
        brandLanguage: brandLanguage,
        brandLocation: brandLocation
      })
    });

    if (!response.ok) {
      throw new Error(`Claude Search API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Claude webhook returns an array with the first element containing the response
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format from Claude Search webhook');
    }

    const responseData = data[0];
    
    // Extract content and references
    const text = responseData.numbered_content || '';
    const references = responseData.references || [];
    
    // Transform references to our standard citation format
    const citations = references.map((ref: any) => ({
      url: ref.url,
      title: ref.title,
      text: ref.quote || '', // Use quote if available
      domain: ref.url ? new URL(ref.url).hostname : '',
      source: ref.title,
      number: ref.number
    }));

    console.log(`    Claude Search success. Extracted ${text.length} chars of content and ${citations.length} citations`);
    
    return {
      text: text || 'No content found',
      citations: citations,
      success: true,
      error: null
    };

  } catch (error: any) {
    console.error(`    Error calling Claude Search:`, error.message);
    return {
      text: '',
      citations: [],
      success: false,
      error: error.message || "Claude Search call failed"
    };
  }
}

/**
 * Calls the Gemini Search webhook and processes the response
 * @param prompt - The query prompt to analyze
 * @returns Object with text content and citations
 */
async function callGeminiSearch(prompt: string, country: string, brandName: string, brandIndustry: string, brandLogoUrl: string, brandWebsite: string, brandLanguage: string, brandLocation: string): Promise<{
  text: string;
  citations: any[];
  success: boolean;
  error: string | null;
}> {
  try {
    console.log(`    Calling Gemini Search for prompt: "${prompt}"`);
    
    const response = await fetch('https://primary-production-20a3.up.railway.app/webhook/geminisearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: prompt,
        country: country,
        brandName: brandName,
        brandIndustry: brandIndustry,
        brandLogoUrl: brandLogoUrl,
        brandWebsite: brandWebsite,
        brandLanguage: brandLanguage,
        brandLocation: brandLocation
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Search API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Gemini webhook returns an array with the first element containing the response
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format from Gemini Search webhook');
    }

    const responseData = data[0];
    
    // Extract content from new nested output structure
    const text = responseData.output?.output?.[0] || '';
    
    // Extract citations from groundingChunks
    const citations: any[] = [];
    if (responseData.output?.groundingChunks) {
      responseData.output.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.titledomain) {
          citations.push({
            url: chunk.web.uri,
            title: chunk.web.titledomain,
            text: '',
            domain: chunk.web.titledomain,
            source: chunk.web.titledomain
          });
        }
      });
    }

    console.log(`    Gemini Search success. Extracted ${text.length} chars of content and ${citations.length} citations`);
    
    return {
      text: text || 'No content found',
      citations: citations,
      success: true,
      error: null
    };

  } catch (error: any) {
    console.error(`    Error calling Gemini Search:`, error.message);
    return {
      text: '',
      citations: [],
      success: false,
      error: error.message || "Gemini Search call failed"
    };
  }
}

// --- Core Logic ---

/**
 * Processes a single query by calling multiple LLMs, combining results,
 * and updating the database.
 * @param query - The query object from the database.
 * @param now - The current timestamp (ISO string) for this analysis run.
 */
async function processQuery(
  query: { id: string; query: string; frequency: string; mode?: string | null, mode_id: string, user_id: string, location?: string, attached_brand_name?: string, attached_brand_industry?: string, attached_brand_logo_url?: string, attached_brand_website?: string, attached_brand_language?: string, attached_brand_location?: string },
  now: string,
): Promise<{ id: string; newAnalysisRun: z.infer<typeof AnalysisRunSchema> }> {
  console.log(
    `Processing query ID: ${query.id}, Text: "${query.query}", Mode: ${
      query.mode || "Default"
    }`
  );


  
  // Call the search-google endpoint to get Google search results
  // This helps enrich our analysis with current web data
  await callSearchGoogleEndpoint(query.query, query.mode_id, query.user_id, query.location);

  // --- Define Models ---
  const textModels = [
    { modelId: "openai/gpt-4o-search-preview", name: "GPT 4o Web Search" },
    {
      modelId: "gemini-search",
      name: "Gemini 2.5 Flash",
    },
    { modelId: "claude-search", name: "Claude 4.0 Sonnet" }, // Custom Claude Search
    { modelId: "perplexity/sonar", name: "Perplexity Sonar" }, // Keep Perplexity here
    { modelId: "google-ai-mode", name: "Google AI Mode" }, // Custom Google AI Mode
  ];

  const objectModels = [
    { model: openrouter("openai/gpt-4o"), name: "GPT 4o Web Search" },
    {
      model: "claude-search", // Use string to indicate special handling
      name: "Claude 4.0 Sonnet",
    },
    {
      model: "gemini-search", // Use string to indicate special handling
      name: "Gemini 2.5 Flash",
    },
    { model: openrouter("perplexity/sonar"), name: "Perplexity Sonar" }, // Keep Perplexity here
    { model: "google-ai-mode", name: "Google AI Mode" }, // Custom Google AI Mode
  ];

  // --- Fetch Existing Results --- (Moved to the top)
  let existingResultsArray: z.infer<typeof AnalysisRunSchema>[] = [];
  try {
    const { data: existingData, error: fetchError } = await supabase
      .from("scheduled_queries")
      .select("results")
      .eq("id", query.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error(
        `Error fetching existing results for query ${query.id}:`,
        fetchError
      );
    } else {
      existingResultsArray = parseAndValidateExistingResults(
        existingData?.results
      );
    }
  } catch (fetchCatchError) {
    console.error(
      `Caught error during fetch/parse of existing results for query ${query.id}:`,
      fetchCatchError
    );
  }
  // --- End Fetch Existing Results ---

  // --- 1. Generate Text ---
  console.log(
    `  Starting text generation for ${textModels.length} models...`
  );

  // Refactored text generation logic
  const textPromises = textModels.map(async ({ modelId, name }) => {
    console.log(`    Generating text for ${name}...`);
    try {
      // Handle Google AI Mode specially
      if (modelId === "google-ai-mode") {
        let countryCode = 'US'; // Default
        if (query.location) {
          // Create mapping from country label to uppercase country code
          const country = countries.find(c => c.label === query.location);
          countryCode = country ? country.value.toUpperCase() : 'US';
        }
        const googleResult = await callGoogleAiMode(query.query, countryCode, query.attached_brand_name!, query.attached_brand_industry!, query.attached_brand_logo_url!, query.attached_brand_website!, query.attached_brand_language!, query.attached_brand_location!);
        return {
          name,
          text: googleResult.text,
          citations: googleResult.citations,
          success: googleResult.success,
          error: googleResult.error,
        };
      }

      // Handle Claude Search specially
      if (modelId === "claude-search") {
        // Convert location to country code format using comprehensive countries list
        let countryCode = 'US'; // Default
        if (query.location) {
          // Create mapping from country label to uppercase country code
          const country = countries.find(c => c.label === query.location);
          countryCode = country ? country.value.toUpperCase() : 'US';
        }
        
        const claudeResult = await callClaudeSearch(query.query, countryCode, query.attached_brand_name!, query.attached_brand_industry!, query.attached_brand_logo_url!, query.attached_brand_website!, query.attached_brand_language!, query.attached_brand_location!);
        return {
          name,
          text: claudeResult.text,
          citations: claudeResult.citations,
          success: claudeResult.success,
          error: claudeResult.error,
        };
      }

      // Handle Gemini Search specially
      if (modelId === "gemini-search") {
        let countryCode = 'US'; // Default
        if (query.location) {
          // Create mapping from country label to uppercase country code
          const country = countries.find(c => c.label === query.location);
          countryCode = country ? country.value.toUpperCase() : 'US';
        }
        const geminiResult = await callGeminiSearch(query.query, countryCode, query.attached_brand_name!, query.attached_brand_industry!, query.attached_brand_logo_url!, query.attached_brand_website!, query.attached_brand_language!, query.attached_brand_location!);
        return {
          name,
          text: geminiResult.text,
          citations: geminiResult.citations,
          success: geminiResult.success,
          error: geminiResult.error,
        };
      }

      // Handle other models with OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
          'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: query.query }],
          temperature: 0.2,
          max_retries: 2,
          web_search_options: {
            user_location: {country: query.location}
          }
        })
      }).then(res => res.json());
      console.log(`    ${name} text generated.`);
      console.log('Response', response)
      // Handle citations for Perplexity specifically if needed
      const citations = response.choices[0].message.annotations || null;
      return { name, text: response.choices[0].message.content, citations, success: true, error: null };
    } catch (error: any) {
      console.error(`    Error generating text for ${name}:`, error.message);
      return {
        name,
        text: null,
        citations: null,
        success: false,
        error: error.message || "Text generation failed",
      };
    }
  });
  const textGenerationResults = await Promise.all(textPromises);

  // --- 1.5 Store Raw Text in ai_summary ---
  const ai_summary = textGenerationResults.map((result) => ({
    model: result.name,
    summary: result.text || "",
    query: query.query,
    reasoning: result.citations || [],
  }));

  // --- 2. Extract Structured Data from Generated Text ---
  console.log(`  Starting structure extraction from generated text...`);
  const extractionPromises = textGenerationResults.map(
    async ({ name, text, success: textSuccess, error: textGenError }) => {
      if (!textSuccess || !text) {
        return {
          llm_name: name,
          status: "rejected" as const,
          data: null,
          error: textGenError || "Text generation failed, skipping extraction.",
        };
      }
      console.log(`    Extracting structure from ${name}'s text...`);
      
      // Handle Google AI Mode specially - use OpenAI for extraction
      if (name === "Google AI Mode") {
        try {
          console.log(`      Using OpenAI GPT-4o for ${name} extraction...`);
          const formattedExtractionPrompt = RANKING_PROMPT.replace("{text}", text);
          
          const { object } = await generateObject({
            model: openrouter("openai/gpt-4o"),
            schema: LLMOutputSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          
          const validation = LLMOutputSchema.safeParse(object);
          if (!validation.success) {
            throw new Error(`Schema validation failed for ${name}.`);
          }
          
          console.log(`      ${name} successful (via OpenAI GPT-4o).`);
          return {
            llm_name: name,
            status: "fulfilled" as const,
            data: validation.data,
            error: null,
          };
        } catch (error: any) {
          console.error(`    Error during extraction phase for ${name}:`, error.message);
          return {
            llm_name: name,
            status: "rejected" as const,
            data: null,
            error: error.message || "Extraction phase failed",
          };
        }
      }

      // Handle Claude Search specially - use Claude 4.0 Sonnet for extraction
      if (name === "Claude 4.0 Sonnet") {
        try {
          console.log(`      Using Claude 4.0 Sonnet for ${name} extraction...`);
          const formattedExtractionPrompt = RANKING_PROMPT.replace("{text}", text);
          
          const { object } = await generateObject({
            model: openrouter("anthropic/claude-sonnet-4"),
            schema: LLMOutputSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          
          const validation = LLMOutputSchema.safeParse(object);
          if (!validation.success) {
            throw new Error(`Schema validation failed for ${name}.`);
          }
          
          console.log(`      ${name} successful (via Claude 4.0 Sonnet).`);
          return {
            llm_name: name,
            status: "fulfilled" as const,
            data: validation.data,
            error: null,
          };
        } catch (error: any) {
          console.error(`    Error during extraction phase for ${name}:`, error.message);
          return {
            llm_name: name,
            status: "rejected" as const,
            data: null,
            error: error.message || "Extraction phase failed",
          };
        }
      }

      // Handle Gemini Search specially - use Gemini 2.5 Flash for extraction
      if (name === "Gemini 2.5 Flash") {
        try {
          console.log(`      Using Gemini 2.5 Flash for ${name} extraction...`);
          const formattedExtractionPrompt = RANKING_PROMPT.replace("{text}", text);
          
          const { object } = await generateObject({
            model: openrouter("google/gemini-2.5-flash"),
            schema: LLMOutputSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          
          const validation = LLMOutputSchema.safeParse(object);
          if (!validation.success) {
            throw new Error(`Schema validation failed for ${name}.`);
          }
          
          console.log(`      ${name} successful (via Gemini 2.5 Flash).`);
          return {
            llm_name: name,
            status: "fulfilled" as const,
            data: validation.data,
            error: null,
          };
        } catch (error: any) {
          console.error(`    Error during extraction phase for ${name}:`, error.message);
          return {
            llm_name: name,
            status: "rejected" as const,
            data: null,
            error: error.message || "Extraction phase failed",
          };
        }
      }

      const modelConfig = objectModels.find((m) => m.name === name);
      if (!modelConfig || typeof modelConfig.model === 'string') {
        return {
          llm_name: name,
          status: "rejected" as const,
          data: null,
          error: "Internal configuration error.",
        };
      }
      try {
        let extractedData: z.infer<typeof LLMOutputSchema>;
        const formattedExtractionPrompt = RANKING_PROMPT.replace(
          "{text}",
          text
        );
        if (name.toLowerCase().includes("perplexity")) {
          console.log(`      Using generateText for Perplexity (${name})...`);
          const { text: jsonTextResponse } = await generateText({
            model: modelConfig.model,
            prompt: formattedExtractionPrompt,
            temperature: 0.0,
            maxRetries: 2,
          });
          console.log(
            `      ${name} raw extraction text response:`,
            jsonTextResponse
          );
          const jsonString = extractJsonFromString(jsonTextResponse);
          if (!jsonString) {
            throw new Error(
              `Could not extract valid JSON structure from ${name}'s text response.`
            );
          }
          try {
            const parsed = JSON.parse(jsonString);
            const validation = LLMOutputSchema.safeParse(parsed);
            if (!validation.success) {
              throw new Error(
                `Schema validation failed for ${name} after parsing text.`
              );
            }
            extractedData = validation.data;
            console.log(`      ${name} successful (generateText + parse).`);
          } catch (parseError: any) {
            throw new Error(
              `JSON parsing failed for ${name}: ${parseError.message}`
            );
          }
        } else {
          console.log(`      Using generateObject for ${name}...`);
          const { object } = await generateObject({
            model: modelConfig.model,
            schema: LLMOutputSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          const validation = LLMOutputSchema.safeParse(object);
          if (!validation.success) {
            throw new Error(`Schema validation failed for ${name}.`);
          }
          extractedData = validation.data;
          console.log(`      ${name} successful (generateObject).`);
        }
        return {
          llm_name: name,
          status: "fulfilled" as const,
          data: extractedData,
          error: null,
        };
      } catch (error: any) {
        console.error(
          `    Error during extraction phase for ${name}:`,
          error.message
        );
        return {
          llm_name: name,
          status: "rejected" as const,
          data: null,
          error: error.message || "Extraction phase failed",
        };
      }
    }
  );
  const finalModelResultsForDB = await Promise.all(extractionPromises);
  console.log(`  Finished extraction attempts.`);


  // --- 3. Keyword Analysis ---
  const keywordPrompt = `You are an SEO specialist. Generate a list of 25 high-value keywords for "${query.query}". For each keyword: estimate monthly search volume, rate difficulty (0.0-10.0), calculate opportunity score (0.0-10.0), and rate relevance (0.0-10.0). Include high-volume and long-tail keywords.`;

  // Generate keyword analysis object using the LLM
  const { object: keywordAnalysis } = await generateObject({
    model: openrouter("openai/gpt-4o"),
    schema: keywordAnalysisSchema, // Use the defined Zod schema
    prompt: keywordPrompt,
    maxRetries: 2,
    temperature: 0.0,
  });

  // --- 4. Auto-generate Steps if Citations Exist ---
  const hasCitations = ai_summary.some(summary => 
    Array.isArray(summary.reasoning) && summary.reasoning.length > 0
  );

  if (hasCitations) {
    console.log(`  Auto-generating steps for query ${query.id} due to citations found...`);
    try {
      // Extract citations from the first model that has them
      const citationsData = ai_summary.find(summary => 
        Array.isArray(summary.reasoning) && summary.reasoning.length > 0
      )?.reasoning || [];

      // Transform citations to the expected format
      const citations = citationsData.map((citation: any) => ({
        url: citation.url_citation?.url || citation.url || '',
        title: citation.url_citation?.title || citation.title || 'No title',
        snippet: citation.url_citation?.snippet || citation.snippet || 'No snippet',
      })).filter((c: any) => c.url); // Filter out citations without URLs

      if (citations.length > 0) {
        // Call the generate-steps API internally
        const stepsResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-steps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: query.query,
            country: query.location || 'United States',
            citations: citations,
            monitoringId: query.mode_id,
            userId: query.user_id,
          }),
        });

        if (stepsResponse.ok) {
          await stepsResponse.json(); // Consume the response
          console.log(`  Steps generated successfully for query ${query.id}`);
        } else {
          console.warn(`  Failed to generate steps for query ${query.id}: ${stepsResponse.status}`);
        }
      }
    } catch (stepsError) {
      console.warn(`  Error generating steps for query ${query.id}:`, stepsError);
      // Don't fail the main analysis if steps generation fails
    }
  } else {
    console.log(`  No citations found for query ${query.id}, skipping steps generation`);
  }


  // --- Prepare New Analysis Run Object (Matches existing DB Schema) ---
  const newAnalysisRun: z.infer<typeof AnalysisRunSchema> = {
    analysis_date: now,
    model_results: finalModelResultsForDB, // Contains results conforming to the schema
    model_summary: ai_summary,
    keyword_analysis: keywordAnalysis,
  };

  // --- Update Database ---
  const updatedResultsArray: z.infer<typeof AnalysisRunSchema>[] = [
    ...existingResultsArray,
    newAnalysisRun,
  ];
    // Create date from current time and add the days first
    const nextAnalysisDate = new Date();
    nextAnalysisDate.setDate(
      nextAnalysisDate.getDate() + (query.frequency === "daily" ? 1 : 7)
    );
    
    // Then set to midnight of that next day
    nextAnalysisDate.setHours(0, 0, 0, 0);

  console.log(
    `  Updating Supabase for query ${
      query.id
    }. Next run: ${nextAnalysisDate.toISOString()}`
  );

  const { error: updateError } = await supabase
    .from("scheduled_queries")
    .update({
      results: updatedResultsArray as any,
      last_analysis_at: now,
      next_analysis_at: nextAnalysisDate.toISOString(),
    })
    .eq("id", query.id);

  if (updateError) {
    console.error(
      `  Failed to update query ${query.id} in Supabase:`,
      updateError
    );
    throw new Error(
      `Failed to update query results in DB: ${updateError.message}`
    );
  } else {
    const successfulExtraction = newAnalysisRun.model_results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failedExtraction = newAnalysisRun.model_results.filter(
      (r) => r.status === "rejected"
    ).length;
    console.log(
      `  Successfully updated query ${query.id}. Success: ${successfulExtraction}/${objectModels.length}. Failures: ${failedExtraction}.`
    );
    return {
      id: query.id,
      newAnalysisRun, // This object now matches AnalysisRunSchema
    };
  }
}

// --- API Route Handlers ---

// Handler for POST requests (User scheduling a new query)
export async function POST(req: Request) {
  const now = new Date().toISOString();
  console.log(`POST /api/schedule-query received at ${now}`);

  try {
    const body = await req.json();
    // --- Input Validation (using Zod) ---
    const inputSchema = z.object({
      query: z.string().min(3, "Query must be at least 3 characters long."),
      frequency: z.enum(["daily", "weekly"]),
      mode: z.string().optional(), // Mode is optional
      user_id: z.string().uuid("Invalid user ID format."),
      location: z.string().optional(),
      attached_brand_id: z.array(z.string()).optional(),
      attached_brand_name: z.string().optional(),
      attached_brand_industry: z.string().optional(),
      attached_brand_logo_url: z.string().optional(),
      attached_brand_website: z.string().optional(),
      attached_brand_language: z.string().optional(),
      attached_brand_location: z.string().optional(),
    });

    const validation = inputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { query, frequency, mode, user_id, location, attached_brand_id, attached_brand_name, attached_brand_industry, attached_brand_logo_url, attached_brand_website, attached_brand_language, attached_brand_location } = validation.data;

    // --- Check for Duplicate Query ---
    const { data: existingQuery, error: checkError } = await supabase
      .from("scheduled_queries")
      .select("id")
      .eq("user_id", user_id)
      .eq("query", query)
      .eq("location", location || "global")
      .maybeSingle();

    if (checkError) {
      console.error("Duplicate check error:", checkError);
      // Don't expose detailed DB errors to the client
      return NextResponse.json(
        { error: "Failed to check for existing queries" },
        { status: 500 }
      );
    }

    if (existingQuery) {
      console.warn(
        `Attempt to add duplicate query "${query}" for user ${user_id}`
      );
      return NextResponse.json(
        { error: `Query "${query}" already exists for this user.` },
        { status: 409 }
      ); // 409 Conflict
    }

    const mode_id = uuidv4(); // Generate UUID for mode_id if needed

    // --- Insert New Query ---
    console.log(`Inserting new query "${query}" for user ${user_id}`);
    const { data: newQueryData, error: insertError } = await supabase
      .from("scheduled_queries")
      .insert({
        query,
        frequency,
        mode: mode || null,
        user_id: user_id,
        mode_id: mode_id, // Use the generated UUID
        next_analysis_at: now, // Schedule immediate analysis
        last_analysis_at: null,
        status: "active",
        location: location,
        results: [], // Initialize with an empty array in the jsonb column
        attached_brand_id: attached_brand_id,
      })
      .select("id, query, frequency, mode") // Select necessary fields
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create scheduled query" },
        { status: 500 }
      );
    }

    if (!newQueryData) {
      console.error("Failed to retrieve data after insert for query:", query);
      return NextResponse.json(
        { error: "Failed to confirm query creation" },
        { status: 500 }
      );
    }

    // --- Process New Query Immediately ---
    console.log(`Running initial analysis for new query ${newQueryData.id}...`);
    try {
      // Pass the essential parts of the new query data
      const {
        id,
        query: queryText,
        frequency: queryFreq,
        mode: queryMode,
      } = newQueryData;
      const initialAnalysis = await processQuery(
        { id, query: queryText, frequency: queryFreq, mode: queryMode, mode_id: mode_id, user_id: user_id, location: location, attached_brand_name: attached_brand_name, attached_brand_industry: attached_brand_industry, attached_brand_logo_url: attached_brand_logo_url, attached_brand_website: attached_brand_website, attached_brand_language: attached_brand_language, attached_brand_location: attached_brand_location },
        now,
      );
      console.log(`Initial analysis complete for query ${newQueryData.id}`);

      // Return success with the initial analysis results
      return NextResponse.json(
        {
          message: "Query scheduled and initial analysis performed.",
          query: newQueryData,
          initialAnalysis: initialAnalysis.newAnalysisRun, // Return the structured run
        },
        { status: 201 }
      ); // 201 Created
    } catch (analysisError: any) {
      console.error(
        `Initial analysis failed for query ${newQueryData.id}:`,
        analysisError
      );
      // Query was created, but analysis failed. Return a success but with a warning.
      return NextResponse.json(
        {
          message: "Query scheduled, but initial analysis failed.",
          query: newQueryData,
          warning: `Initial analysis failed: ${analysisError.message}`,
        },
        { status: 207 }
      ); // 207 Multi-Status might be appropriate
    }
  } catch (error: any) {
    console.error("Error processing POST request:", error);
    // Handle JSON parsing errors or other unexpected issues
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}

// Handler for GET requests (Intended for Cron Job trigger)
export async function GET(req: Request) {
  // --- Security Check (Highly Recommended for Cron) ---
  // Implement a check for a secret header or specific IP ranges
  // to ensure only your cron service can trigger this endpoint.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized GET request attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // --- End Security Check ---

  const now = new Date().toISOString();
  console.log(`GET /api/schedule-query (Cron Job) triggered at ${now}`);

  try {
    const { data: existingQueries, error: existingError } = await supabase
      .from("scheduled_queries")
      .select("id, query, frequency, mode, user_id, mode_id")
      .lte("next_analysis_at", now)
      .not("next_analysis_at", "is", null); // Ensure it has a scheduled time

    if (existingError) {
      console.error("Error fetching due queries:", existingError);
      return NextResponse.json(
        { error: "Failed to fetch due queries" },
        { status: 500 }
      );
    }

    if (!existingQueries || existingQueries.length === 0) {
      console.log("No queries due for processing.");
      return NextResponse.json({ message: "No queries due" }, { status: 200 });
    }

    console.log(`Processing ${existingQueries.length} due queries...`);

    let processedCount = 0;
    let failedCount = 0;

    // Process queries sequentially to avoid overwhelming APIs/DB
    // Consider Promise.allSettled with concurrency limits for larger scale
    for (const query of existingQueries) {
      try {
        await processQuery(query, now);
        processedCount++;
      } catch (error: any) {
        console.error(
          `Failed to process query ${query.id} during cron run:`,
          error
        );
        failedCount++;
        // Optional: Update the specific query record with an error status
        // or schedule a retry later? For now, just log and continue.
      }
    }

    console.log(
      `Search monitoring completed. Processed: ${processedCount}, Failed: ${failedCount}`
    );
    return NextResponse.json(
      {
        message: `Search monitoring completed`,
        processed: processedCount,
        failed: failedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing GET request (cron):", error);
    return NextResponse.json(
      { error: "Failed to process cron request", details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS handler for CORS if needed
// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Or specific origins
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// }
