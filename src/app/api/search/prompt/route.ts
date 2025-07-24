/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  generateObject,
  generateText,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { countries } from "@/lib/countries";
import { calculateCreditsRequired, getAvailableModels } from "@/lib/constraints";
import { updateCreditUsage } from "@/lib/creditUsage";

// export const runtime = 'edge';
export const maxDuration = 200;

// Types
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
  mode: string;
  mode_id: string;
  ai_rankings: AIRanking[];
}

interface Brand {
  name: string;
  description: string;
}

interface SocialInsight {
  id: string;
  search_id: string;
  platform: string;
  sentiment: string;
  engagement: number;
  content: string;
  created_at: string;
}

// Initialize clients
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Define analysis modes
const analysisModes = ["DeepFocus", "Voyager", "Explorer"] as const;
type AnalysisMode = (typeof analysisModes)[number];

// Request validation schema
const searchRequestSchema = z.object({
  mode: z.enum(analysisModes),
  user_id: z.string().uuid(),
  query: z.string(),
  location: z.string().optional(),
  attached_brand_id: z.array(z.string().uuid()).optional().nullable(),
  selected_models: z.array(z.string()).optional().default([]),
  include_google_search: z.boolean().optional().default(true),
});

// Helper function to call the search-google endpoint
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
    console.log("Google Search API call setup:");
    console.log("- Frontend URL:", "https://airankia.com");
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
        })}`);
        return; // Continue execution despite error
      }
      
      const data = await response.json();
      console.log(`Search-google endpoint called successfully. Search ID: ${data.searchId}`);
    } catch (fetchError: any) {
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

/**
 * Calls the Claude Search webhook and processes the response
 * @param prompt - The query prompt to analyze
 * @param country - Country code for location-based search
 * @returns Object with text content and citations
 */
async function callClaudeSearch(prompt: string, country: string = 'US'): Promise<{
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
        country: country
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
async function callGeminiSearch(prompt: string, country: string = 'US'): Promise<{
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
        country: country
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

/**
 * Calls the Google AI Mode webhook and processes the response
 * @param prompt - The query prompt to analyze
 * @returns Object with text content and citations
 */
async function callGoogleAiMode(prompt: string): Promise<{
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
        chatInput: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI Mode API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

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

// Explorer: Competitor comparison and analysis - Optimized
async function explorerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string,
  location?: string,
  selectedModels: string[] = [],
  includeGoogleSearch: boolean = true
): Promise<SearchResults> {
  console.log(`🔍 [EXPLORER] Starting analysis for query: "${query}", user: ${user_id}, mode_id: ${mode_id}, location: ${location || 'Global'}`);
  
  if(!mode_id){
    throw new Error("Mode ID is required - Cannot be undefined");
  }
  
  // Get available models for Explorer mode
  const availableModels = getAvailableModels('explorer');
  
  // If no models selected, use all available models
  const modelsToUse = selectedModels.length > 0 ? selectedModels.filter(model => availableModels.includes(model)) : availableModels;
  
  // Calculate credits required
  const creditsRequired = calculateCreditsRequired('explorer', modelsToUse, includeGoogleSearch);
  console.log(`📊 [EXPLORER] Using ${modelsToUse.length} models, requiring ${creditsRequired} credits${includeGoogleSearch ? ' (including Google AI Overview)' : ''}`);
  
  // Call the search-google endpoint only if included
  if (includeGoogleSearch) {
    await callSearchGoogleEndpoint(query, mode_id, user_id, location);
  }
  
  const rankings: AIRanking[] = [];

  // 1. Define all available models and filter based on selection
  console.log(`📋 [EXPLORER] Defining models based on selection`);
  const allTextModels = [
    { modelId: "openai/gpt-4o-search-preview", name: "GPT 4o Web Search", key: "gpt-4o-search" },
    { modelId: "perplexity/sonar", name: "Perplexity Sonar", key: "perplexity-sonar" },
    { modelId: "gemini-search", name: "Gemini 2.5 Flash", key: "gemini-search" },
    { modelId: "claude-search", name: "Claude 4.0 Sonnet", key: "claude-search" },
    { modelId: "google-ai-mode", name: "Google AI Mode", key: "google-ai-mode" },
  ];

  const allObjectModels = [
    { model: openrouter("openai/gpt-4o"), name: "GPT 4o Web Search", key: "gpt-4o-search" },
    { model: openrouter("perplexity/sonar"), name: "Perplexity Sonar", key: "perplexity-sonar" },
    { model: "gemini-search", name: "Gemini 2.5 Flash", key: "gemini-search" },
    { model: "claude-search", name: "Claude 4.0 Sonnet", key: "claude-search" },
    { model: "google-ai-mode", name: "Google AI Mode", key: "google-ai-mode" },
  ];

  // Filter models based on user selection
  const textModels = allTextModels.filter(model => modelsToUse.includes(model.key));
  const objectModels = allObjectModels.filter(model => modelsToUse.includes(model.key));
  
  console.log(`📋 [EXPLORER] Using ${textModels.length} selected models`);

  // 2. Generate Text Summaries for all models
  console.log(`🤖 [EXPLORER] Starting text generation for ${textModels.length} models...`);
  async function generateTextForAllModels(models: any[]) {
    return Promise.all(
      models.map(async ({ modelId, name }) => {
        console.log(`  ⚡ [EXPLORER] Generating text for ${name}...`);
        try {
          // Handle Google AI Mode specially
          if (modelId === "google-ai-mode") {
            console.log(`    🌐 [EXPLORER] Using Google AI Mode webhook for ${name}`);
            const googleResult = await callGoogleAiMode(location ? `${query} in ${location}` : query);
            console.log(`    ✅ [EXPLORER] Google AI Mode ${googleResult.success ? 'succeeded' : 'failed'} for ${name}`);
            return {
              name,
              text: googleResult.text,
              citations: googleResult.citations,
              success: googleResult.success,
            };
          }

          // Handle Claude Search specially
          if (modelId === "claude-search") {
            console.log(`    🧠 [EXPLORER] Using Claude Search webhook for ${name}`);
            // Convert location to country code format using comprehensive countries list
            let countryCode = 'US'; // Default
            if (location) {
              // Create mapping from country label to uppercase country code
              const country = countries.find(c => c.label === location);
              countryCode = country ? country.value.toUpperCase() : 'US';
              console.log(`    📍 [EXPLORER] Converted location "${location}" to country code "${countryCode}"`);
            }
            
            const claudeResult = await callClaudeSearch(location ? `${query} in ${location}` : query, countryCode);
            console.log(`    ✅ [EXPLORER] Claude Search ${claudeResult.success ? 'succeeded' : 'failed'} for ${name}`);
            return {
              name,
              text: claudeResult.text,
              citations: claudeResult.citations,
              success: claudeResult.success,
            };
          }

          // Handle Gemini Search specially
          if (modelId === "gemini-search") {
            // Convert location to country code format using comprehensive countries list
            let countryCode = 'US'; // Default
            if (location) {
              // Create mapping from country label to uppercase country code
              const country = countries.find(c => c.label === location);
              countryCode = country ? country.value.toUpperCase() : 'US';
            }
            
            const geminiResult = await callGeminiSearch(location ? `${query} in ${location}` : query, countryCode);
            return {
              name,
              text: geminiResult.text,
              citations: geminiResult.citations,
              success: geminiResult.success,
            };
          }

          // Handle other models with OpenRouter
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey}`,
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: 'user', content: location ? `${query} in ${location}` : query }],
              temperature: 0.2,
              max_retries: 2,
              web_search_options: {
                user_location: {country: location}
              }
            })
          }).then(res => res.json());

          const text = response.choices[0].message.content;
          const citations = response.choices[0].message.annotations || null;

          console.log(`    ✅ [EXPLORER] OpenRouter model ${name} succeeded`);
          return { name, text, citations, success: true };
        } catch (error) {
          console.error(`    ❌ [EXPLORER] Error generating text for ${name}:`, error);
          return { name, text: null, citations: null, success: false };
        }
      })
    );
  }

  console.log(`🔄 [EXPLORER] Executing text generation for all models...`);
  const textGenerationResults = await generateTextForAllModels(textModels);
  
  const successfulResults = textGenerationResults.filter(r => r.success);
  const failedResults = textGenerationResults.filter(r => !r.success);
  console.log(`📊 [EXPLORER] Text generation complete - ✅ ${successfulResults.length} succeeded, ❌ ${failedResults.length} failed`);
  
  if (failedResults.length > 0) {
    console.warn(`⚠️  [EXPLORER] Failed models: ${failedResults.map(r => r.name).join(', ')}`);
  }

  // 3. Store Summaries in Supabase
  console.log(`💾 [EXPLORER] Storing summaries in Supabase for ${successfulResults.length} models...`);
  const insertPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text, citations }) => {
      console.log(`  📝 [EXPLORER] Storing summary for ${name} (${text?.length || 0} characters)`);
      const { error } = await supabase.from("ai_summary").insert({
        model: name,
        summary: text,
        query,
        mode_id,
        reasoning: citations || null, // Store citations in reasoning
      });

      if (error) {
        console.error(`    ❌ [EXPLORER] Error inserting summary for ${name}:`, error);
      } else {
        console.log(`    ✅ [EXPLORER] Successfully stored summary for ${name}`);
      }
    });

  // Wait for all summary insertions to complete before proceeding
  console.log(`⏳ [EXPLORER] Waiting for all summary insertions to complete...`);
  await Promise.all(insertPromises);
  console.log(`✅ [EXPLORER] All summaries stored in Supabase`);

  // 4. Extract Structured Rankings from Text
  console.log(`🔄 [EXPLORER] Starting structured data extraction from generated text...`);
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

  console.log(`🧮 [EXPLORER] Processing extraction for ${successfulResults.length} models...`);
  const extractionPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text }) => {
      console.log(`  🔍 [EXPLORER] Extracting structured data from ${name} (${text?.length || 0} chars)...`);
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

        // Handle Google AI Mode specially - use OpenAI for extraction
        if (name === "Google AI Mode") {
          console.log(`      Using OpenAI GPT-4o for Google AI Mode extraction...`);
          const formattedExtractionPrompt = `
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
                
                Respond ONLY with the valid JSON object.
                Do NOT include any text outside of the JSON object. Do NOT use markdown code fences.
`;

          const { object } = await generateObject({
            model: openrouter("openai/gpt-4o"),
            schema: rankingSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          extractedObject = object;
        }
        // Handle Claude Search specially - use Claude 4.0 Sonnet for extraction
        else if (name === "Claude 4.0 Sonnet") {
          console.log(`      Using Claude 4.0 Sonnet for ${name} extraction...`);
          const formattedExtractionPrompt = `
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
            model: openrouter("anthropic/claude-sonnet-4"),
            schema: rankingSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          extractedObject = object;
        }
        // Handle Gemini Search specially - use Gemini 2.5 Flash for extraction
        else if (name === "Gemini 2.5 Flash") {
          console.log(`      Using Gemini 2.5 Flash for ${name} extraction...`);
          const formattedExtractionPrompt = `
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
            model: openrouter("google/gemini-2.5-flash"),
            schema: rankingSchema,
            prompt: formattedExtractionPrompt,
            maxRetries: 2,
            temperature: 0.0,
          });
          extractedObject = object;
        }
        else {
          const modelConfig = objectModels.find((m) => m.name === name);
          if (!modelConfig || typeof modelConfig.model === 'string') {
            console.error(
              `Cannot find model config for ${name} during extraction.`
            );
            return { name, success: false };
          }

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
              maxRetries: 2,
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
              model: modelConfig.model,
              schema: rankingSchema,
              prompt: extractionPromptForObject,
              maxRetries: 2,
              temperature: 0.0,
            });
            extractedObject = object;
          }
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
        console.error(`    ❌ [EXPLORER] Error extracting rankings using ${name}:`, error);
        return { name, success: false }; // Indicate failure
      }
    });

  // Wait for all extraction attempts
  console.log(`⏳ [EXPLORER] Waiting for all extraction attempts to complete...`);
  await Promise.all(extractionPromises);
  
  console.log(`📈 [EXPLORER] Extraction complete - found ${rankings.length} total rankings`);

  // 5. Process Unique Brands and Social Insights (using the extracted rankings)
  console.log(`🔄 [EXPLORER] Processing unique brands and assigning consistent entity IDs...`);
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

  console.log(`🏢 [EXPLORER] Processed ${uniqueBrands.size} unique brands with ${rankings.length} total rankings`);

  // 6. Return results
  console.log(`✅ [EXPLORER] Analysis complete! Returning results for mode: Explorer, mode_id: ${mode_id}`);
  return {
    mode: "Explorer",
    mode_id,
    ai_rankings: rankings, // Use the rankings derived from text extraction
  };
}

// Voyager: Multi-model analysis with social sentiment - Optimized
async function voyagerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string,
  location?: string,
  selectedModels: string[] = [],
  includeGoogleSearch: boolean = true
): Promise<SearchResults> {
  console.log(`🚀 [VOYAGER] Starting analysis for query: "${query}", user: ${user_id}, mode_id: ${mode_id}, location: ${location || 'Global'}`);
  
  if(!mode_id){
    throw new Error("Mode ID is required - Cannot be undefined");
  }
  
  // Get available models for Voyager mode
  const availableModels = getAvailableModels('voyager');
  
  // If no models selected, use all available models
  const modelsToUse = selectedModels.length > 0 ? selectedModels.filter(model => availableModels.includes(model)) : availableModels;
  
  // Calculate credits required
  const creditsRequired = calculateCreditsRequired('voyager', modelsToUse, includeGoogleSearch);
  console.log(`📊 [VOYAGER] Using ${modelsToUse.length} models, requiring ${creditsRequired} credits${includeGoogleSearch ? ' (including Google AI Overview)' : ''}`);
  
  // Call the search-google endpoint only if included
  if (includeGoogleSearch) {
    console.log(`🔍 [VOYAGER] Calling search-google endpoint...`);
    await callSearchGoogleEndpoint(query, mode_id, user_id, location);
  }
  
  console.log(`📋 [VOYAGER] Defining available AI models for analysis`);
  const allModels = [
    {
      model: openrouter("deepseek/deepseek-chat-v3-0324:free"),
      name: "DeepSeek v3",
      key: "deepseek-v3",
    },
    {
      model: openrouter("openai/gpt-4.1-nano"),
      name: "GPT 4.1 Nano",
      key: "gpt-4.1-nano",
    },
    {
      model: openrouter("x-ai/grok-3-mini"),
      name: "Grok 3 Mini",
      key: "grok-3-mini",
    },
    {
      model: openrouter("meta-llama/llama-4-maverick:free"),
      name: "Llama 4 Maverick",
      key: "llama-4-maverick",
    },
  ];

  // Filter models based on user selection
  const models = allModels.filter(model => modelsToUse.includes(model.key));
  console.log(`📋 [VOYAGER] Using ${models.length} selected models for analysis`);

  const rankings: AIRanking[] = [];

  // 2. Generate Text Summaries for all models
  console.log(`🤖 [VOYAGER] Starting text generation for ${models.length} models...`);
  async function generateTextForAllModels(models: any[]) {
    return Promise.all(
      models.map(async ({ model, name }) => {
        console.log(`  ⚡ [VOYAGER] Generating text for ${name}...`);
        try {
          // Extract model ID from the model object
          let modelId;
          if (typeof model === 'string') {
            modelId = model;
          } else {
            // For OpenRouter models, extract the model ID
            modelId = model.model || model.modelId;
          }
          
          console.log(`    🔗 [VOYAGER] Calling OpenRouter API for ${name} (model: ${modelId})`);
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey}`,
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: 'user', content: location ? `${query} in ${location}` : query }],
              temperature: 0.1,
              max_retries: 2,
            })
          }).then(res => res.json());

          const text = response.choices[0].message.content;
          const citations = null;

          console.log(`    ✅ [VOYAGER] Successfully generated text for ${name} (${text?.length || 0} characters)`);
          return { name, text, citations, success: true };
        } catch (error) {
          console.error(`    ❌ [VOYAGER] Error generating text for ${name}:`, error);
          return { name, text: null, citations: null, success: false };
        }
      })
    );
  }

  console.log(`🔄 [VOYAGER] Executing text generation for all models...`);
  const textGenerationResults = await generateTextForAllModels(models);
  
  const successfulResults = textGenerationResults.filter(r => r.success);
  const failedResults = textGenerationResults.filter(r => !r.success);
  console.log(`📊 [VOYAGER] Text generation complete - ✅ ${successfulResults.length} succeeded, ❌ ${failedResults.length} failed`);
  
  if (failedResults.length > 0) {
    console.warn(`⚠️  [VOYAGER] Failed models: ${failedResults.map(r => r.name).join(', ')}`);
  }

  // 3. Store Summaries in Supabase
  console.log(`💾 [VOYAGER] Storing summaries in Supabase for ${successfulResults.length} models...`);
  const insertPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text, citations }) => {
      console.log(`  📝 [VOYAGER] Storing summary for ${name} (${text?.length || 0} characters)`);
      const { error } = await supabase.from("ai_summary").insert({
        model: name,
        summary: text,
        query,
        mode_id,
        reasoning: citations || null, // Store citations in reasoning
      });

      if (error) {
        console.error(`    ❌ [VOYAGER] Error inserting summary for ${name}:`, error);
      } else {
        console.log(`    ✅ [VOYAGER] Successfully stored summary for ${name}`);
      }
    });

  // Wait for all summary insertions to complete before proceeding
  console.log(`⏳ [VOYAGER] Waiting for all summary insertions to complete...`);
  await Promise.all(insertPromises);
  console.log(`✅ [VOYAGER] All summaries stored in Supabase`);

  // 4. Extract Structured Rankings from Text
  console.log(`🔄 [VOYAGER] Starting structured data extraction from generated text...`);
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

  console.log(`🧮 [VOYAGER] Processing extraction for ${successfulResults.length} models...`);
  const extractionPromises = textGenerationResults
    .filter((result) => result.success && result.text)
    .map(async ({ name, text }) => {
      console.log(`  🔍 [VOYAGER] Extracting structured data from ${name} (${text?.length || 0} chars)...`);
      const modelConfig = models.find((m) => m.name === name);
      if (!modelConfig) {
        console.error(
          `    ❌ [VOYAGER] Cannot find model config for ${name} during extraction.`
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
            maxRetries: 2,
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
            model: openrouter("openai/gpt-4o"), 
            schema: rankingSchema,
            prompt: extractionPromptForObject,
            maxRetries: 2,
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
        console.error(`    ❌ [VOYAGER] Error extracting rankings using ${name}:`, error);
        return { name, success: false }; // Indicate failure
      }
    });

  // Wait for all extraction attempts
  console.log(`⏳ [VOYAGER] Waiting for all extraction attempts to complete...`);
  await Promise.all(extractionPromises);
  
  console.log(`📈 [VOYAGER] Extraction complete - found ${rankings.length} total rankings`);

  // 5. Process Unique Brands and Social Insights (using the extracted rankings)
  console.log(`🔄 [VOYAGER] Processing unique brands and assigning consistent entity IDs...`);
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

  console.log(`🏢 [VOYAGER] Processed ${uniqueBrands.size} unique brands with ${rankings.length} total rankings`);

  console.log(`✅ [VOYAGER] Analysis complete! Returning results for mode: Voyager, mode_id: ${mode_id}`);
  return {
    mode: "Voyager",
    mode_id,
    ai_rankings: rankings,
  };
}

// Save search results to Supabase using optimized structure
async function saveToSupabase(
  results: SearchResults,
  user_id: string,
  attached_brand_id: string[] | null
): Promise<void> {
  try {
    // Ensure brand records exist (using the consistent entity IDs)
    const brandPromises = results.ai_rankings.map(async (ranking) => {
      // Check if brand exists by entity_id FIRST
      const { data: existingBrand, error: checkError } = await supabase
        .from("brands")
        .select("id")
        .eq("id", ranking.entity_id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking for existing brand:", checkError);
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
            user_id: user_id,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) {
          console.error(
            `Brand creation error for ${ranking.entity_name} (ID: ${ranking.entity_id}):`,
            createError
          );
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
    const validRankings = results.ai_rankings.filter((r) =>
      brandIds.includes(r.entity_id)
    );

    if (validRankings.length === 0) {
      console.warn("No valid AI rankings to save after brand check/creation.");
      return;
    }

    // Group rankings by query for optimized storage
    const rankingsByQuery: Record<string, AIRanking[]> = {};
    let totalScore = 0;
    const sentimentCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    validRankings.forEach((ranking) => {
      // Group by query
      if (!rankingsByQuery[ranking.query]) {
        rankingsByQuery[ranking.query] = [];
      }
      rankingsByQuery[ranking.query].push(ranking);

      // Calculate stats
      totalScore += ranking.score || 0;
      const sentiment = ranking.sentiment || 'neutral';
      sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
      entityCounts[ranking.entity_name] = (entityCounts[ranking.entity_name] || 0) + 1;
    });

    // Get top 5 entities across all queries (by frequency and average score)
    const entityStats = Object.entries(entityCounts).map(([name, count]) => {
      const entityRankings = validRankings.filter(r => r.entity_name === name);
      const avgScore = entityRankings.reduce((sum, r) => sum + (r.score || 0), 0) / entityRankings.length;
      const bestRank = Math.min(...entityRankings.map(r => r.rank || 999));
      
      return {
        entity_name: name,
        entity_id: entityRankings[0].entity_id,
        count,
        avg_score: Math.round(avgScore * 10) / 10,
        best_rank: bestRank,
        entity_type: entityRankings[0].entity_type
      };
    });

    const topEntities = entityStats
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 5);

    // Calculate summary stats
    const avgScore = Math.round((totalScore / validRankings.length) * 10) / 10;
    const queryCount = Object.keys(rankingsByQuery).length;
    const totalRankings = validRankings.length;

    const stats = {
      avg_score: avgScore,
      query_count: queryCount,
      total_rankings: totalRankings,
      sentiment_distribution: sentimentCounts,
      entity_distribution: entityCounts,
      top_performing_entities: topEntities.slice(0, 3)
    };

    // Determine the main query (use the first query or most common one)
    const mainQuery = Object.keys(rankingsByQuery)[0] || 'Analysis';

    // Save as single optimized session record
    const { error: sessionError } = await supabase
      .from("ai_ranking_sessions")
      .insert({
        id: results.mode_id, // Use mode_id as primary key
        user_id: user_id,
        mode: results.mode,
        query: mainQuery,
        query_count: queryCount,
        total_rankings: totalRankings,
        rankings_data: rankingsByQuery,
        top_entities: topEntities,
        stats: stats,
        analyzed_at: new Date().toISOString(),
        attached_brand_id: attached_brand_id
      });

    if (sessionError) {
      console.error("AI Rankings session save failed:", sessionError);
      // Fallback: save to old structure if new structure fails
      const { error: fallbackError } = await supabase
        .from("ai_rankings")
        .insert(validRankings);
      
      if (fallbackError) {
        console.error("Fallback AI Rankings save also failed:", fallbackError);
      }
    } else {
      console.log(`Successfully saved AI ranking session with ${totalRankings} rankings grouped by ${queryCount} queries`);
    }

  } catch (error) {
    console.error("Error in saveToSupabase:", error);
    // Don't throw to prevent breaking the analysis flow
  }
}

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { mode, user_id, query, location, attached_brand_id, selected_models, include_google_search } = searchRequestSchema.parse(body);

    // Clean up attached_brand_id - remove empty strings and null values
    const cleanedBrandId = attached_brand_id 
      ? attached_brand_id.filter(id => id && id.trim() !== "" && id !== "null")
      : null;
    const finalBrandId = cleanedBrandId && cleanedBrandId.length > 0 ? cleanedBrandId : null;

    // Calculate credits required for the analysis
    const creditsRequired = calculateCreditsRequired(mode.toLowerCase() as 'explorer' | 'voyager', selected_models, include_google_search);
    console.log(`💳 Analysis will require ${creditsRequired} credits for ${selected_models.length} selected models${include_google_search ? ' + Google AI Overview' : ''}`);

    // Generate shared IDs for this search session
    const mode_id = uuidv4();

    // Run mode-specific analysis
    let results;
    try {
      if (!mode_id) {
        throw new Error("Mode ID is required");
      }
      
      if (mode === "Voyager") {
        results = await voyagerAnalysis(user_id, query, mode_id, location, selected_models, include_google_search);
      } else if (mode === "Explorer") {
        results = await explorerAnalysis(user_id, query, mode_id, location, selected_models, include_google_search);
      } else {
        return NextResponse.json(
          { error: "Invalid analysis mode" },
          { status: 400 }
        );
      }
    } catch (analysisError) {
      console.error("Error in analysis:", analysisError);
      return NextResponse.json(
        { 
          error: "Analysis failed",
          details: analysisError instanceof Error ? analysisError.message : "Unknown analysis error",
        }, 
        { status: 500 }
      );
    }

    // Ensure results exist
    if (!results) {
      return NextResponse.json(
        { error: "Analysis returned no results" },
        { status: 500 }
      );
    }

    // Save results to Supabase
    try {
      await saveToSupabase(results, user_id, finalBrandId);
    } catch (saveError) {
      console.error("Error saving to Supabase:", saveError);
      return NextResponse.json(
        { 
          error: "Failed to save results",
          details: saveError instanceof Error ? saveError.message : "Unknown save error",
        }, 
        { status: 500 }
      );
    }

    // Track credit usage for query
    try {
      const creditResult = await updateCreditUsage(user_id, creditsRequired, 'query');
      if (!creditResult.success) {
        console.error("Error tracking credit usage:", creditResult.error);
        // Don't fail the request, just log the error
      }
    } catch (creditError) {
      console.error("Error tracking credit usage:", creditError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      success: true, 
      message: `Analysis complete for mode ${mode}. Results have been stored with search ID: ${mode_id}`,
      mode_id,
      credits_used: creditsRequired,
      models_used: selected_models.length,
    });
  } catch (error) {
    console.error("Error in search endpoint:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: error.errors,
        }, 
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode_id = searchParams.get("mode_id");
  const user_id = searchParams.get("user_id");
  
  if (!mode_id && !user_id) {
    return NextResponse.json(
      { error: "Missing mode_id or user_id parameter" },
      { status: 400 }
    );
  }

  try {
    let results;
    if (mode_id) {
      const { data, error } = await supabase
        .from("ai_rankings")
        .select("*")
        .eq("mode_id", mode_id);

      if (error) throw error;
      results = data;
    } else if (user_id) {
      const { data, error } = await supabase
        .from("ai_rankings")
        .select("*")
        .eq("user_id", user_id)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;
      results = data;
    }
    
    if (!results) {
      return NextResponse.json(
        { error: "No results found" },
        { status: 404 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch results",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}
