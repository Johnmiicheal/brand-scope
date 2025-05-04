import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  // Make sure engine is properly set, including support for "google" engine type
  const searchData: SearchRecordData = {
    query,
    engine: engine || "google", // Default to 'google' if no engine is specified
  };

  // IMPORTANT: Preserve the 'google' engine value when it's explicitly passed
  // This ensures that scheduled queries with engine='google' maintain their value
  if (engine === "google") {
    console.log(
      'Preserving "google" engine type for proper subfilter functionality'
    );
  }

  // Add additional fields if provided
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
      throw searchError;
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
    throw new Error(
      `Failed to create search record: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Perform the actual Google search using SerpAPI
async function performGoogleSearch(
  query: string,
  apiKey: string,
  engine: string = "google",
  includeAiOverview: boolean = true,
  location?: string
): Promise<SerpAPIResponse> {
  // Validate inputs
  if (!query) throw new Error("Search query is required");
  if (!apiKey) throw new Error("SerpAPI key is required");

  // Prepare search parameters for SerpAPI
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google", // Always use 'google' for SerpAPI
    q: query,
    google_domain: "google.com",
    gl: "us",
    hl: "en",
  });

  // Add custom location if provided, otherwise use default
  if (location) {
    params.set("location", location);
  } else {
    params.set("location", "United States");
  }

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
    const supabaseServiceKey =
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables!");
      // Handle missing variables appropriately in production (e.g., throw error, exit)
      throw new Error(
        "Missing required environment variables for Supabase/AI clients."
      );
    }

    // Get user session from cookies
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
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
      session.user.id
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

    // Store search results in database
    const { error: resultsError } = await supabase
      .from("search_results")
      .insert([
        {
          search_id: searchId,
          engine: engine,
          results: searchData,
          ai_overview: aiOverviewText,
        },
      ]);

    if (resultsError) {
      console.error("Error storing search results:", resultsError);
      // Continue despite the error to return search results to user
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
    // Get user session from cookies
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get search ID from query params if provided
    const searchId = request.nextUrl.searchParams.get("id");

    if (searchId) {
      // Retrieve specific search and its results
      const { data: search, error: searchError } = await supabase
        .from("searches")
        .select(
          `
          *,
          search_results:search_results(*)
        `
        )
        .eq("id", searchId)
        .eq("user_id", session.user.id)
        .single();

      if (searchError) {
        return NextResponse.json(
          { error: "Search not found or access denied" },
          { status: 404 }
        );
      }

      return NextResponse.json({ search });
    } else {
      // List user's recent searches
      const { data: searches, error: searchesError } = await supabase
        .from("searches")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

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
