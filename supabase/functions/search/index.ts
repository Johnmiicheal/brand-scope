/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@11.0.0";
import {
  generateObject,
  generateText,
  extractReasoningMiddleware,
  experimental_wrapLanguageModel as wrapLanguageModel,
} from "https://esm.sh/ai@4.2.2";
import { createOpenRouter } from "https://esm.sh/@openrouter/ai-sdk-provider@0.4.5";

// Countries data for location mapping
const countries = [
  { label: "Afghanistan", value: "af" },
  { label: "Albania", value: "al" },
  { label: "Algeria", value: "dz" },
  { label: "Andorra", value: "ad" },
  { label: "Angola", value: "ao" },
  { label: "Antigua and Barbuda", value: "ag" },
  { label: "Argentina", value: "ar" },
  { label: "Armenia", value: "am" },
  { label: "Australia", value: "au" },
  { label: "Austria", value: "at" },
  { label: "Azerbaijan", value: "az" },
  { label: "Bahamas", value: "bs" },
  { label: "Bahrain", value: "bh" },
  { label: "Bangladesh", value: "bd" },
  { label: "Barbados", value: "bb" },
  { label: "Belarus", value: "by" },
  { label: "Belgium", value: "be" },
  { label: "Belize", value: "bz" },
  { label: "Benin", value: "bj" },
  { label: "Bhutan", value: "bt" },
  { label: "Bolivia", value: "bo" },
  { label: "Bosnia and Herzegovina", value: "ba" },
  { label: "Botswana", value: "bw" },
  { label: "Brazil", value: "br" },
  { label: "Brunei", value: "bn" },
  { label: "Bulgaria", value: "bg" },
  { label: "Burkina Faso", value: "bf" },
  { label: "Burundi", value: "bi" },
  { label: "Cabo Verde", value: "cv" },
  { label: "Cambodia", value: "kh" },
  { label: "Cameroon", value: "cm" },
  { label: "Canada", value: "ca" },
  { label: "Central African Republic", value: "cf" },
  { label: "Chad", value: "td" },
  { label: "Chile", value: "cl" },
  { label: "China", value: "cn" },
  { label: "Colombia", value: "co" },
  { label: "Comoros", value: "km" },
  { label: "Congo", value: "cg" },
  { label: "Costa Rica", value: "cr" },
  { label: "Croatia", value: "hr" },
  { label: "Cuba", value: "cu" },
  { label: "Cyprus", value: "cy" },
  { label: "Czech Republic", value: "cz" },
  { label: "Denmark", value: "dk" },
  { label: "Djibouti", value: "dj" },
  { label: "Dominica", value: "dm" },
  { label: "Dominican Republic", value: "do" },
  { label: "Ecuador", value: "ec" },
  { label: "Egypt", value: "eg" },
  { label: "El Salvador", value: "sv" },
  { label: "Equatorial Guinea", value: "gq" },
  { label: "Eritrea", value: "er" },
  { label: "Estonia", value: "ee" },
  { label: "Eswatini", value: "sz" },
  { label: "Ethiopia", value: "et" },
  { label: "Fiji", value: "fj" },
  { label: "Finland", value: "fi" },
  { label: "France", value: "fr" },
  { label: "Gabon", value: "ga" },
  { label: "Gambia", value: "gm" },
  { label: "Georgia", value: "ge" },
  { label: "Germany", value: "de" },
  { label: "Ghana", value: "gh" },
  { label: "Greece", value: "gr" },
  { label: "Grenada", value: "gd" },
  { label: "Guatemala", value: "gt" },
  { label: "Guinea", value: "gn" },
  { label: "Guinea-Bissau", value: "gw" },
  { label: "Guyana", value: "gy" },
  { label: "Haiti", value: "ht" },
  { label: "Honduras", value: "hn" },
  { label: "Hungary", value: "hu" },
  { label: "Iceland", value: "is" },
  { label: "India", value: "in" },
  { label: "Indonesia", value: "id" },
  { label: "Iran", value: "ir" },
  { label: "Iraq", value: "iq" },
  { label: "Ireland", value: "ie" },
  { label: "Israel", value: "il" },
  { label: "Italy", value: "it" },
  { label: "Jamaica", value: "jm" },
  { label: "Japan", value: "jp" },
  { label: "Jordan", value: "jo" },
  { label: "Kazakhstan", value: "kz" },
  { label: "Kenya", value: "ke" },
  { label: "Kiribati", value: "ki" },
  { label: "Korea, North", value: "kp" },
  { label: "Korea, South", value: "kr" },
  { label: "Kosovo", value: "xk" },
  { label: "Kuwait", value: "kw" },
  { label: "Kyrgyzstan", value: "kg" },
  { label: "Laos", value: "la" },
  { label: "Latvia", value: "lv" },
  { label: "Lebanon", value: "lb" },
  { label: "Lesotho", value: "ls" },
  { label: "Liberia", value: "lr" },
  { label: "Libya", value: "ly" },
  { label: "Liechtenstein", value: "li" },
  { label: "Lithuania", value: "lt" },
  { label: "Luxembourg", value: "lu" },
  { label: "Madagascar", value: "mg" },
  { label: "Malawi", value: "mw" },
  { label: "Malaysia", value: "my" },
  { label: "Maldives", value: "mv" },
  { label: "Mali", value: "ml" },
  { label: "Malta", value: "mt" },
  { label: "Marshall Islands", value: "mh" },
  { label: "Mauritania", value: "mr" },
  { label: "Mauritius", value: "mu" },
  { label: "Mexico", value: "mx" },
  { label: "Micronesia", value: "fm" },
  { label: "Moldova", value: "md" },
  { label: "Monaco", value: "mc" },
  { label: "Mongolia", value: "mn" },
  { label: "Montenegro", value: "me" },
  { label: "Morocco", value: "ma" },
  { label: "Mozambique", value: "mz" },
  { label: "Myanmar", value: "mm" },
  { label: "Namibia", value: "na" },
  { label: "Nauru", value: "nr" },
  { label: "Nepal", value: "np" },
  { label: "Netherlands", value: "nl" },
  { label: "New Zealand", value: "nz" },
  { label: "Nicaragua", value: "ni" },
  { label: "Niger", value: "ne" },
  { label: "Nigeria", value: "ng" },
  { label: "North Macedonia", value: "mk" },
  { label: "Norway", value: "no" },
  { label: "Oman", value: "om" },
  { label: "Pakistan", value: "pk" },
  { label: "Palau", value: "pw" },
  { label: "Palestine", value: "ps" },
  { label: "Panama", value: "pa" },
  { label: "Papua New Guinea", value: "pg" },
  { label: "Paraguay", value: "py" },
  { label: "Peru", value: "pe" },
  { label: "Philippines", value: "ph" },
  { label: "Poland", value: "pl" },
  { label: "Portugal", value: "pt" },
  { label: "Qatar", value: "qa" },
  { label: "Romania", value: "ro" },
  { label: "Russia", value: "ru" },
  { label: "Rwanda", value: "rw" },
  { label: "Saint Kitts and Nevis", value: "kn" },
  { label: "Saint Lucia", value: "lc" },
  { label: "Saint Vincent and the Grenadines", value: "vc" },
  { label: "Samoa", value: "ws" },
  { label: "San Marino", value: "sm" },
  { label: "Sao Tome and Principe", value: "st" },
  { label: "Saudi Arabia", value: "sa" },
  { label: "Senegal", value: "sn" },
  { label: "Serbia", value: "rs" },
  { label: "Seychelles", value: "sc" },
  { label: "Sierra Leone", value: "sl" },
  { label: "Singapore", value: "sg" },
  { label: "Slovakia", value: "sk" },
  { label: "Slovenia", value: "si" },
  { label: "Solomon Islands", value: "sb" },
  { label: "Somalia", value: "so" },
  { label: "South Africa", value: "za" },
  { label: "South Sudan", value: "ss" },
  { label: "Spain", value: "es" },
  { label: "Sri Lanka", value: "lk" },
  { label: "Sudan", value: "sd" },
  { label: "Suriname", value: "sr" },
  { label: "Sweden", value: "se" },
  { label: "Switzerland", value: "ch" },
  { label: "Syria", value: "sy" },
  { label: "Taiwan", value: "tw" },
  { label: "Tajikistan", value: "tj" },
  { label: "Tanzania", value: "tz" },
  { label: "Thailand", value: "th" },
  { label: "Timor-Leste", value: "tl" },
  { label: "Togo", value: "tg" },
  { label: "Tonga", value: "to" },
  { label: "Trinidad and Tobago", value: "tt" },
  { label: "Tunisia", value: "tn" },
  { label: "Turkey", value: "tr" },
  { label: "Turkmenistan", value: "tm" },
  { label: "Tuvalu", value: "tv" },
  { label: "Uganda", value: "ug" },
  { label: "Ukraine", value: "ua" },
  { label: "United Arab Emirates", value: "ae" },
  { label: "United Kingdom", value: "gb" },
  { label: "United States", value: "us" },
  { label: "Uruguay", value: "uy" },
  { label: "Uzbekistan", value: "uz" },
  { label: "Vanuatu", value: "vu" },
  { label: "Vatican City", value: "va" },
  { label: "Venezuela", value: "ve" },
  { label: "Vietnam", value: "vn" },
  { label: "Yemen", value: "ye" },
  { label: "Zambia", value: "zm" },
  { label: "Zimbabwe", value: "zw" }
];

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


const openrouter = createOpenRouter({
  apiKey: Deno.env.get("OPEN_ROUTER_API_KEY"),
});

const openRouterApiKey = Deno.env.get("OPEN_ROUTER_API_KEY");

// Define analysis modes
const analysisModes = ["DeepFocus", "Voyager", "Explorer"] as const;
type AnalysisMode = (typeof analysisModes)[number];

// Request validation schema
const searchRequestSchema = z.object({
  mode: z.enum(analysisModes),
  user_id: z.string().uuid(),
  query: z.string(),
  location: z.string().optional(),
});

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = new Headers({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin":
        req.headers.get("Origin") || "https://usebrandscope.vercel.app",
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
    const { mode, user_id, query, location } =
      searchRequestSchema.parse(body);

    // Generate shared IDs for this search session
    const mode_id = uuidv4();
    const search_id = uuidv4();

    // Run mode-specific analysis
    let results;
    try {
      if(!mode_id){
        throw new Error("Mode ID is required");
      }
      
      if (mode === "Voyager") {
        results = await voyagerAnalysis(user_id, query, mode_id, location);
      } else if (mode === "Explorer") {
        results = await explorerAnalysis(
          user_id,
          query,
          mode_id,
          location
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
  location?: string,
  brandName?: string,
): Promise<void> {
  try {
    const apiUrl = `https://usebrandscope.vercel.app/api/search-google`;
    const internalApiKey = Deno.env.get("INTERNAL_API_KEY");
    
    // Log environment setup
    console.log("Google Search API call setup:");
    console.log("- Frontend URL:", "https://usebrandscope.vercel.app");
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
export async function explorerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string,
  location: string  
): Promise<SearchResults> {
  if(!mode_id){
    throw new Error("Mode ID is required - Cannot be undefined");
  }
  // Call the search-google endpoint after mode_id is defined
  // await callSearchGoogleEndpoint(query, mode_id, user_id, location);
  
  const rankings: AIRanking[] = [];
  const socialInsights: SocialInsight[] = [];

  // 1. Define Models for Text Generation (Search-Enabled + Webhooks)
  const textModels = [
    { modelId: "openai/gpt-4o-search-preview", name: "GPT 4o Web Search" },
    { modelId: "perplexity/sonar", name: "Perplexity Sonar" },
    { modelId: "gemini-search", name: "Gemini 2.5 Flash" },
    { modelId: "claude-search", name: "Claude 4.0 Sonnet" },
    { modelId: "google-ai-mode", name: "Google AI Mode" },
  ];

  const objectModels = [
    { model: openrouter("openai/gpt-4o"), name: "GPT 4o Web Search" },
    { model: openrouter("perplexity/sonar"), name: "Perplexity Sonar" },
    { model: "gemini-search", name: "Gemini 2.5 Flash" },
    { model: "claude-search", name: "Claude 4.0 Sonnet" },
    { model: "google-ai-mode", name: "Google AI Mode" },
  ];

  // 2. Generate Text Summaries for all models
  async function generateTextForAllModels(models) {
    return Promise.all(
      models.map(async ({ modelId, name }) => {
        try {
          // Handle Google AI Mode specially
          if (modelId === "google-ai-mode") {
            const googleResult = await callGoogleAiMode(location ? `${query} in ${location}` : query);
            return {
              name,
              text: googleResult.text,
              citations: googleResult.citations,
              success: googleResult.success,
            };
          }

          // Handle Claude Search specially
          if (modelId === "claude-search") {
            // Convert location to country code format using comprehensive countries list
            let countryCode = 'US'; // Default
            if (location) {
              // Create mapping from country label to uppercase country code
              const country = countries.find(c => c.label === location);
              countryCode = country ? country.value.toUpperCase() : 'US';
            }
            
            const claudeResult = await callClaudeSearch(location ? `${query} in ${location}` : query, countryCode);
            return {
              name,
              text: claudeResult.text,
              citations: claudeResult.citations,
              success: claudeResult.success,
            };
          }

          // Handle Gemini Search specially
          if (modelId === "gemini-search") {
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
          const citations = null;

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
            max_retries: 2,
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
            max_retries: 2,
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
            max_retries: 2,
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
               model: modelConfig.model, // Use the OpenRouter model
               schema: rankingSchema,
               prompt: extractionPromptForObject,
               max_retries: 2,
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

  // 6. Return results
  return {
    mode: "Explorer",
    mode_id,
    ai_rankings: rankings, // Use the rankings derived from text extraction
  };
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
  mode_id: string,
  location: string
): Promise<SearchResults> {
  if(!mode_id){
    throw new Error("Mode ID is required - Cannot be undefined");
  }
  // Call the search-google endpoint after mode_id is defined
  await callSearchGoogleEndpoint(query, mode_id, user_id, location);
  
  const models = [
    {
      model: openrouter("deepseek/deepseek-r1-0528:free"),
      name: "DeepSeek R1",
    },
    {
      model: openrouter("openai/gpt-4.1-nano"),
      name: "GPT 4.1 Nano",
    },
    {
      model: openrouter("x-ai/grok-3-mini"),
      name: "Grok 3 Mini",
    },
    {
      model: openrouter("meta-llama/llama-4-maverick:free"),
      name: "Llama 4 Maverick",
    },
  ];

  const rankings: AIRanking[] = [];
  const socialInsights: SocialInsight[] = [];

  // 2. Generate Text Summaries for all models
  async function generateTextForAllModels(models) {
    return Promise.all(
      models.map(async ({ model, name }) => {
        try {
          // Extract model ID from the model object
          let modelId;
          if (typeof model === 'string') {
            modelId = model;
          } else {
            // For OpenRouter models, extract the model ID
            modelId = model.model || model.modelId;
          }
          
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
            model: openrouter("openai/gpt-4o"), 
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

  return {
    mode: "Voyager",
    mode_id,
    ai_rankings: rankings,
  };
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

// Save search results to Supabase using optimized structure
export async function saveToSupabase(
  results: SearchResults,
  user_id: string
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
        analyzed_at: new Date().toISOString()
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
      
      // Update user summary stats asynchronously
      supabase.rpc('update_ai_ranking_summary', { p_user_id: user_id })
        .then(({ error: summaryError }) => {
          if (summaryError) {
            console.error('Error updating AI ranking summary stats:', summaryError);
          }
        });
    }

  } catch (error) {
    console.error("Error in saveToSupabase:", error);
    // Don't throw to prevent breaking the analysis flow
  }
}

// Fetch search results by search ID (fallback to old structure if needed)
export async function getSearchResultsBySearchId(
  search_id: string
): Promise<SearchResults | null> {
  try {
    // First try optimized structure
    const { data: sessionData, error: sessionError } = await supabase
      .from("ai_ranking_sessions")
      .select("*")
      .eq("id", search_id)
      .single();
    
    if (sessionData && !sessionError) {
      // Convert JSONB rankings back to array format
      const ai_rankings: AIRanking[] = [];
      
      if (sessionData.rankings_data) {
        Object.entries(sessionData.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
          ai_rankings.push(...rankings);
        });
      }
      
      return {
        search_id,
        mode: sessionData.mode,
        mode_id: sessionData.id,
        ai_rankings,
      };
    }
    
    // Fallback to old structure
    const { data: rankingsData, error: rankingsError } = await supabase
      .from("ai_rankings")
      .select("*")
      .eq("id", search_id);
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return null;
    }
    
    return {
      search_id,
      mode: rankingsData[0].mode,
      mode_id: rankingsData[0].mode_id,
      ai_rankings: rankingsData as AIRanking[],
    };
  } catch (error) {
    console.error("Error in getSearchResultsBySearchId:", error);
    throw error;
  }
}

// Fetch results by mode ID (optimized)
export async function getSearchResultsByModeId(
  mode_id: string
): Promise<SearchResults | null> {
  try {
    // Try optimized structure first
    const { data: sessionData, error: sessionError } = await supabase
      .from("ai_ranking_sessions")
      .select("*")
      .eq("id", mode_id)
      .single();
    
    if (sessionData && !sessionError) {
      // Convert JSONB rankings back to array format
      const ai_rankings: AIRanking[] = [];
      
      if (sessionData.rankings_data) {
        Object.entries(sessionData.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
          ai_rankings.push(...rankings);
        });
      }
      
      return {
        search_id: mode_id,
        mode: sessionData.mode,
        mode_id,
        ai_rankings,
        social_insights: [], // Would need to fetch separately if needed
      };
    }
    
    // Fallback to old structure
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

// Fetch all search results for a user (optimized)
export async function getUserSearchResults(
  user_id: string
): Promise<SearchResults[]> {
  try {
    // Try optimized structure first
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("ai_ranking_sessions")
      .select("*")
      .eq("user_id", user_id)
      .order("analyzed_at", { ascending: false });
    
    if (sessionsData && !sessionsError && sessionsData.length > 0) {
      return sessionsData.map((session): SearchResults => {
        // Convert JSONB rankings back to array format
        const ai_rankings: AIRanking[] = [];
        
        if (session.rankings_data) {
          Object.entries(session.rankings_data as Record<string, AIRanking[]>).forEach(([query, rankings]) => {
            ai_rankings.push(...rankings);
          });
        }
        
        return {
          search_id: session.id,
          mode: session.mode as AnalysisMode,
          mode_id: session.id,
          ai_rankings,
          social_insights: [], // Would need to fetch separately if needed
        };
      });
    }
    
    // Fallback to old structure
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
