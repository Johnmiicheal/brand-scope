import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { domains } from "@/types/domains";

export const maxDuration = 60;


// Define a type for search record data
interface SearchRecordData {
  query: string;
  engine: string;
  brand_name?: string;
  monitoring_id?: string;
  location?: string;
  user_id?: string;
}

interface SerpAPIResponse {
  ai_overview?: {
    text_blocks: Array<{
      type: string;
      snippet?: string;
      list?: Array<{ title: string; snippet: string }>;
    }>;
  };
  answer_box?: { snippet: string };
  knowledge_graph?: { description: string };
  organic_results?: Array<Record<string, unknown>>;
  error?: string;
}

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouter = createOpenRouter({ apiKey: openRouterApiKey });


// Define the ranking schema for brand extraction
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

// Create a search record in the database and return the ID
async function createSearchRecord(
  query: string,
  supabase: SupabaseClient,
  engine: string = "google",
  brandName?: string,
  monitoringId?: string,
  location?: string,
  userId?: string
): Promise<string> {
  console.log("Creating search record with params:", {
    query,
    engine,
    brandName,
    monitoringId,
    location,
    userId
  });

  // Make sure engine is properly set
  const searchData: SearchRecordData = { 
    query, 
    engine: engine || "google", // Default to 'google' if no engine is specified
  };
  
  // Add additional fields if provided, ensuring proper types
  if (brandName) searchData.brand_name = brandName;
  if (monitoringId) searchData.monitoring_id = monitoringId;
  if (location) searchData.location = location;
  if (userId) searchData.user_id = userId;
  
  console.log(`Storing search with engine type: ${searchData.engine}`);
  
  try {
  const { data: search, error: searchError } = await supabase
      .from("searches")
    .insert([searchData])
    .select()
    .single();

  if (searchError) {
      console.error("Error storing search:", searchError);
      // Detailed error logging for debugging
      console.error("Error details:", JSON.stringify(searchError, null, 2));
      console.error("Attempted to save data:", JSON.stringify(searchData, null, 2));
      throw new Error(`Database insert error: ${searchError.message}`);
    }

    if (!search || !search.id) {
      throw new Error("Search record created but no ID returned");
  }

  const searchId = search.id;
    console.log(
      "Created search with ID:",
      searchId,
      "for brand:",
      brandName || "none",
      "with engine:",
      searchData.engine
    );
  
  return searchId;
  } catch (error) {
    console.error("Failed to create search record:", error);
    
    // Better error handling to prevent [object Object] errors
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    
    throw new Error(`Failed to create search record: ${errorMessage}`);
  }
}

// Perform the actual Google search using SerpAPI
async function performGoogleSearch(
  query: string,
  apiKey: string,
  engine: string = "google",
  includeAiOverview: boolean = true,
  location?: string,
): Promise<SerpAPIResponse> {
  // Validate inputs
  if (!query) throw new Error("Search query is required");
  if (!apiKey) throw new Error("SerpAPI key is required");

  const google_domain = domains.find((domain) => domain.country_name === location)?.domain || "google.com";
  // Prepare search parameters for SerpAPI
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google", // Always use 'google' for SerpAPI
    q: query,
    location: location || "United States",
    google_domain: google_domain,
  });

  // Add parameters to include enhanced results
  params.append("include_answer_box", "true");
  params.append("include_knowledge_graph", "true");
  params.append("include_ai_overview", includeAiOverview ? "true" : "false");

  console.log(
    `Performing Google search: query=${query}, engine=${engine}, location=${
      location || "United States"
    }, includeAiOverview=${includeAiOverview}`
  );

  try {
  // Perform Google search using SerpAPI
    const response = await fetch(`https://serpapi.com/search.json?${params}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  
  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SerpAPI request failed with status: ${response.status} - ${errorText}`
      );
  }
  
    const data: SerpAPIResponse = await response.json();
    console.log("Received Google search data successfully");
  
  return data;
  } catch (error) {
    console.error("Error performing search:", error);
    throw new Error(
      `Failed to perform search: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Extract AI overview text from the search data
function extractAiOverviewText(data: SerpAPIResponse): string {
  // First try to get data from ai_overview structure
  if (data.ai_overview?.text_blocks) {
    return data.ai_overview.text_blocks
      .map((block) => {
        if (block.type === "paragraph" && block.snippet) {
          return block.snippet;
        } else if (block.type === "list" && block.list) {
          return block.list
            .map((item) => `${item.title}: ${item.snippet}`)
            .join("\n");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  
  // Fgoogleback to answer_box or knowledge_graph if ai_overview is not available
  if (data.answer_box?.snippet) {
    return data.answer_box.snippet;
  } else if (data.knowledge_graph?.description) {
    return data.knowledge_graph.description;
  }
  
  return "";
}

// Function to analyze AI overview and extract brands
async function analyzeAiOverview(aiOverviewText: string): Promise<string> {
  try {
    const extractionPrompt = `
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
    ${aiOverviewText}
    ---    
    Respond ONLY with the valid JSON object.`;

    const { object } = await generateObject({
      model: openrouter("openai/gpt-4.1"),
      output: 'no-schema',
      prompt: extractionPrompt,
      maxRetries: 2,
      temperature: 0.0,
    });

    // Validate the response against our schema
    const validation = rankingSchema.safeParse(object);
    if (!validation.success) {
      console.error("LLM response failed schema validation:", validation.error);
      return JSON.stringify({ brands: [] });
    }

    return JSON.stringify(validation.data);
  } catch (error) {
    console.error("Error analyzing AI overview:", error);
    return JSON.stringify({ brands: [] });
  }
}

// Next.js App Router API handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      query,
      engine = "google",
      includeAiOverview = true,
      brandName,
      monitoringId,
      userId,
      location,
    } = body;
    
    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    // Get the SerpAPI key from environment variables
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      console.error("SERPAPI_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Search service is not properly configured" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const internalApiKey = process.env.INTERNAL_API_KEY;

    console.log("Environment check:");
    console.log("- Supabase URL exists:", !!supabaseUrl);
    console.log("- Service key exists:", !!supabaseServiceKey);
    console.log("- Internal API key exists:", !!internalApiKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables!");
      throw new Error(
        "Missing required environment variables for Supabase/AI clients."
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract the auth token from the request header
    const authHeader = request.headers.get("Authorization");
    console.log("Authorization header:", authHeader ? "Present" : "Missing");
    
    // Check all request headers for debugging
    console.log("All request headers:");
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${key === 'authorization' ? 'REDACTED' : value}`);
    });
    
   
    if (!userId) {
      console.log("No authentication token provided");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create a search record in the database
    const searchId = await createSearchRecord(
      query,
      supabase,
      engine,
      brandName,
      monitoringId,
      location,
      userId
    );

    // Perform the search
    const searchData = await performGoogleSearch(
      query,
      apiKey,
      engine,
      includeAiOverview,
      location
    );

    // Extract AI overview text
    const aiOverviewText = extractAiOverviewText(searchData);

    

    // Validate search results data conforms to schema
    const searchResultData = {
      search_id: searchId,
      engine: engine || "google",
      results: searchData,
      ai_overview: aiOverviewText,
      mode_id: monitoringId
    };
    
    console.log("Storing search results with ID:", searchId);
    
    try {
      // Analyze AI overview and extract brands
      const brandAnalysis = await analyzeAiOverview(aiOverviewText);
      
      // Store search results in database with brand analysis
      const { error: resultsError } = await supabase
        .from("search_results")
        .insert([{
          search_id: searchId,
          engine: engine || "google",
          results: searchData,
          ai_overview: aiOverviewText,
          mode_id: monitoringId,
          rankings: brandAnalysis // Add the brand analysis here
        }]);
      
      if (resultsError) {
        console.error("Error storing search results:", resultsError);
        console.error("Error details:", JSON.stringify(resultsError, null, 2));
        console.error("Attempted to save search results with schema:", {
          search_id: typeof searchId,
          engine: typeof searchResultData.engine,
          results: "jsonb object",
          ai_overview: typeof aiOverviewText,
          rankings: "json string"
        });
        console.warn("Continuing execution despite search results storage error");
      } else {
        console.log("Successfully stored search results for search ID:", searchId);
      }
    } catch (saveError) {
      console.error("Exception occurred while storing search results:", saveError);
      // Continue execution to return results to user
    }
    
    // Return the search results and ID
    return NextResponse.json({
      searchId,
      results: searchData,
      aiOverview: aiOverviewText,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: `Search failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

// GET handler for retrieving previous searches
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const internalApiKey = process.env.INTERNAL_API_KEY;
    
    // Check if this is a browser request
    const acceptHeader = request.headers.get("Accept") || "";
    const userAgentHeader = request.headers.get("User-Agent") || "";
    const isBrowserRequest = acceptHeader.includes("text/html") || 
                             userAgentHeader.includes("Mozilla") || 
                             userAgentHeader.includes("Chrome") || 
                             userAgentHeader.includes("Safari");
    
    console.log("GET request - Environment check:");
    console.log("- Supabase URL exists:", !!supabaseUrl);
    console.log("- Service key exists:", !!supabaseServiceKey);
    console.log("- Internal API key exists:", !!internalApiKey);
    console.log("- Is browser request:", isBrowserRequest);

    // If this is a direct browser request, return helpful documentation
    if (isBrowserRequest) {
      return new Response(`
        <html>
          <head>
            <title>Brand Scope API - Search</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
              pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
              code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
              h1, h2 { color: #0070f3; }
            </style>
          </head>
          <body>
            <h1>Brand Scope API - Search Endpoint</h1>
            <p>This is a REST API endpoint that requires authentication. You cannot access it directly from a browser.</p>
            
            <h2>How to use this API:</h2>
            
            <h3>POST /api/search-google</h3>
            <p>Performs a Google search using SerpAPI and stores the results in the database.</p>
            
            <h4>Example with curl:</h4>
            <pre>curl -X POST https://brandscope.vercel.app/api/search-google \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "query": "tesla electric vehicles",
    "engine": "google",
    "includeAiOverview": true,
    "monitoringId": "test-monitoring-123",
    "brandName": "Tesla",
    "location": "United States"
  }'</pre>
            
            <h3>GET /api/search-google</h3>
            <p>Retrieves previous search results from the database.</p>
            
            <h4>Example with curl:</h4>
            <pre>curl -X GET https://brandscope.vercel.app/api/search-google \\
  -H "Authorization: Bearer YOUR_API_KEY"</pre>
            
            <h4>Or to get a specific search:</h4>
            <pre>curl -X GET https://brandscope.vercel.app/api/search-google?id=SEARCH_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"</pre>
            
            <p>Replace <code>YOUR_API_KEY</code> with your actual authentication token.</p>
          </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables!");
      throw new Error(
        "Missing required environment variables for Supabase/AI clients."
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract the auth token from the request header
    const authHeader = request.headers.get("Authorization");
    console.log("GET - Authorization header:", authHeader ? "Present" : "Missing");
    
    // Check all request headers for debugging
    console.log("GET - All request headers:");
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${key === 'authorization' ? 'REDACTED' : value}`);
    });
    
    let userId = undefined;
    let isInternalRequest = false;
    
    // Get the user_id from query params if it exists
    const userIdParam = request.nextUrl.searchParams.get("user_id");
    
    // Check if this is a server-to-server request with INTERNAL_API_KEY
    if (internalApiKey && authHeader === `Bearer ${internalApiKey}`) {
      console.log("GET - Valid internal API key used");
      isInternalRequest = true;
      
      // For internal API calls with a specific user ID
      if (userIdParam) {
        userId = userIdParam;
        console.log("GET - Using provided user_id param:", userId);
      }
    } else {
      console.log("GET - Attempting regular user authentication");
      // For regular user requests, get the token from Authorization header
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return NextResponse.json(
          { 
            error: "Authentication required", 
            message: "Please provide an Authorization header with a valid token",
            example: "Authorization: Bearer YOUR_TOKEN"
          },
          { status: 401 }
        );
      }
      
      try {
        // Verify the token and get user data
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
          console.error("GET - Auth error:", error);
          return NextResponse.json(
            { error: "Invalid authentication token", details: error?.message },
            { status: 401 }
          );
        }
        
        userId = data.user.id;
        console.log("GET - Authenticated user:", userId);
      } catch (authError) {
        console.error("GET - Error processing authentication:", authError);
        return NextResponse.json(
          { error: "Authentication failed", details: authError instanceof Error ? authError.message : String(authError) },
          { status: 401 }
        );
      }
    }

    // Get search ID from query params if provided
    const searchId = request.nextUrl.searchParams.get("id");
    
    if (searchId) {
      // Retrieve specific search and its results
      let query = supabase
        .from("searches")
        .select(`
          *,
          search_results:search_results(*)
        `)
        .eq("id", searchId);
      
      // Only filter by user_id if this is not an internal request or if a specific userId was provided
      if (!isInternalRequest && userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data: search, error: searchError } = await query.single();
      
      if (searchError) {
        return NextResponse.json(
          { error: "Search not found or access denied" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ search });
    } else {
      // List user's recent searches
      let query = supabase
        .from("searches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      // Filter by user_id if provided or if this is a regular user request
      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data: searches, error: searchesError } = await query;
      
      if (searchesError) {
        return NextResponse.json(
          { error: "Failed to retrieve searches" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ searches });
    }
  } catch (error) {
    console.error("Search history API error:", error);
    return NextResponse.json(
      {
        error: `Failed to retrieve search history: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
