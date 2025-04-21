/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@11.0.0";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@latest";
import { generateObject } from "https://esm.sh/ai@latest";
import Exa from "https://esm.sh/exa-js@latest";

// Define schemas
const brandAnalysisSchema = z.object({
  visibility_score: z.number(),
  sentiment_analysis: z.object({
    positive: z.number(),
    negative: z.number(),
    neutral: z.number(),
  }),
  consumer_perception: z.string(),
  brand_mentions: z.number(),
  brand_citation: z.array(z.string()),
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
  ),
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

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow requests from any origin
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type", // Allowed headers
};

// Initialize Groq client
const groq = createGroq({
  apiKey: Deno.env.get("GROQ_API_KEY"), // Get API key from environment variables
  baseUrl: "https://api.groq.com/openai/v1", // Groq API endpoint
});

// Start the Deno server
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body to get brandId
    const { brandId } = await req.json();

    // Validate brandId
    if (!brandId) {
      throw new Error("Brand ID is required");
    }

    // Create a Supabase client instance specific to this request
    // Uses the Authorization header from the incoming request for RLS
    const supabaseClient = createClient(
      Deno.env.get("SB_BRAND_URL") ?? "", // Supabase project URL
      Deno.env.get("SB_BRAND_ANON_KEY") ?? "", // Supabase anon key
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! }, // Pass user's auth token
        },
      }
    );

    // Fetch brand details from the 'brands' table
    const { data: brand, error: brandError } = await supabaseClient
      .from("brands")
      .select("*") // Select all columns
      .eq("id", brandId) // Filter by brandId
      .single(); // Expect only one result

    // Handle error fetching brand or if brand not found
    if (brandError || !brand) {
      console.error("Brand fetch error:", brandError);
      throw new Error(brandError?.message || "Brand not found");
    }

    // Initialize the LLM model
    const model = groq("meta-llama/llama-4-scout-17b-16e-instruct"); // Specify the Groq model

    // Initialize Exa (Metaphor) client for web search
    const exa = new Exa(Deno.env.get("EXA_API_KEY") ?? ""); // Get Exa API key

    // --- Step 1: Analyze brand perception ---
    const brandAnalysisPrompt = `You are an expert brand analyst representing the collective opinion of 10,000 diverse consumers. Analyze the brand "${brand.name}" in the "${brand.industry}" industry with website "${brand.website}". Consider brand visibility (0-1 score), consumer sentiment, market positioning, unique selling propositions, and reputation. Provide a comprehensive analysis of consumer perception.`;

    // Perform web search for brand analysis context
    const searchResults = await exa.searchAndContents(
      `${brand.name} ${brand.industry} brand analysis reviews reputation`,
      {
        numResults: 3, // Limit to 3 results
        useAutoprompt: true, // Let Exa optimize the query
      }
    );

    // Perform web search for general brand mentions (news, blogs)
    const brandView = await exa.searchAndContents(
      `Search throughout the internet, include social media posts, blog posts or content about ${brand.name} in the ${brand.industry} industry`,
      {
        text: true, // Include full text
        summary: true, // Include summary
        type: "keyword",
        category: "news", // Focus on news category
        numResults: 10, // Limit to 10 results
      }
    );

    // Perform web search specifically for social media mentions (tweets)
    const brandSocials = await exa.searchAndContents(
      `Search throughout the internet, include social media posts, blog posts or content about ${brand.name} in the ${brand.industry} industry`, // Re-using similar query for consistency
      {
        text: true,
        summary: true,
        type: "keyword",
        category: "tweet", // Focus on tweet category
        numResults: 5, // Limit to 5 results
      }
    );

    // Combine results from general and social searches
    const brandPublicView = [...brandSocials.results, ...brandView.results];

    // Count mentions of the brand name in the combined search results
    const brandMentionCount = brandPublicView.reduce((total, item) => {
      const textMentions = (
        item.text?.match(new RegExp(brand.name, "gi")) || []
      ).length; // Count in full text
      const summaryMentions = (
        item.summary?.match(new RegExp(brand.name, "gi")) || []
      ).length; // Count in summary
      return total + textMentions + summaryMentions;
    }, 0);

    // Process initial search results for context generation
    const processedResults = searchResults.results.map((r) => ({
      url: r.url,
      // Truncate long text for brevity in the prompt
      text:
        r.text && r.text.length > 300
          ? r.text.substring(0, 300) + "..."
          : r.text ?? "",
    }));

    // Create context string from processed search results
    const searchContext = processedResults
      .map((r) => `Source (${r.url}): ${r.text}`)
      .join("\n\n");

    // Generate brand analysis object using the LLM
    const { object: brandAnalysis } = await generateObject({
      model,
      schema: brandAnalysisSchema, // Use the defined Zod schema
      prompt: `${brandAnalysisPrompt}\n\nHere is some brief context about the brand from the web:\n\n${searchContext}`,
      temperature: 0.3, // Lower temperature for more deterministic output
    });

    // --- Step 2: Find competitors and analyze them ---
    const competitorsPrompt = `You are a market research expert. Identify the top 10 competitors of "${brand.name}" in the "${brand.industry}" industry. For each competitor: provide name, website (optional), ranking difference vs ${brand.name}, strengths, and weaknesses. Focus on direct competitors.`;

    // Generate competitor analysis object using the LLM
    const { object: competitorAnalysis } = await generateObject({
      model,
      schema: competitorAnalysisSchema, // Use the defined Zod schema
      prompt: competitorsPrompt,
    });

    // --- Step 3: Generate relevant keywords ---
    const keywordPrompt = `You are an SEO specialist. Generate a list of 20 high-value keywords for "${brand.name}" in the "${brand.industry}" industry. For each keyword: estimate monthly search volume, rate difficulty (0.0-10.0), calculate opportunity score (0.0-10.0), and rate relevance (0.0-10.0). Include high-volume and long-tail keywords.`;

    // Generate keyword analysis object using the LLM
    const { object: keywordAnalysis } = await generateObject({
      model,
      schema: keywordAnalysisSchema, // Use the defined Zod schema
      prompt: keywordPrompt,
    });

    // --- Save results to Supabase ---

    // Save brand analysis metrics to 'brand_metrics' table
    const { error: metricsError } = await supabaseClient
      .from("brand_metrics")
      .insert([
        // Use insert as typically metrics are unique per analysis run (or use upsert if needed)
        {
          // id: uuidv4(), // Assuming 'id' is auto-generated by Supabase or has a default value
          brand_id: brandId,
          visibility_score: brandAnalysis.visibility_score,
          positive_sentiment: brandAnalysis.sentiment_analysis.positive,
          negative_sentiment: brandAnalysis.sentiment_analysis.negative,
          neutral_sentiment: brandAnalysis.sentiment_analysis.neutral,
          consumer_perception: brandAnalysis.consumer_perception,
          strengths: brandAnalysis.strengths,
          weaknesses: brandAnalysis.weaknesses,
          opportunities: brandAnalysis.opportunities,
          analyzed_at: new Date().toISOString(), // Record analysis timestamp
          brand_citations: brandPublicView.map((item) => item.url), // Store URLs of citations
          brand_mentions: brandMentionCount,
        },
      ]);

    // Handle error saving metrics
    if (metricsError) {
      console.error("Supabase metrics insert error:", metricsError);
      throw metricsError;
    }

    // Prepare competitor data for insertion/upsertion
    const competitorUpserts = competitorAnalysis.competitors.map(
      (competitor) => ({
        // id: uuidv4(), // Let Supabase handle ID or rely on conflict resolution
        user_id: brand.user_id,
        brand_id: brandId,
        name: competitor.name, // Part of potential conflict key
        website: competitor.website || null,
        industry: brand.industry,
        ranking_diff: competitor.ranking_diff,
        strength: competitor.strengths,
        weakness: competitor.weaknesses,
        // created_at: new Date().toISOString(), // Let DB handle timestamp or update on conflict
      })
    );

    // Save competitors using upsert to avoid duplicates if script is re-run
    // Assumes a unique constraint on (brand_id, name) or similar
    if (competitorUpserts.length > 0) {
      const { error: competitorError } = await supabaseClient
        .from("competitors")
        .upsert(competitorUpserts, {
          ignoreDuplicates: true, // Don't update if competitor already exists for this brand
        });

      if (competitorError) {
        console.error("Supabase competitor upsert error:", competitorError);
        throw competitorError;
      }
    }

    // Prepare keyword data for upsertion
    const keywordUpserts = keywordAnalysis.keywords.map((keyword) => ({
      // id: uuidv4(), // Let Supabase handle ID generation or rely on conflict resolution
      entity_id: brandId, // Part of the conflict key
      entity_name: brand.name,
      entity_type: "brand", // Part of the conflict key
      user_id: brand.user_id,
      keyword: keyword.keyword, // Part of the conflict key
      search_volume: keyword.search_volume,
      difficulty: keyword.difficulty,
      opportunity_score: keyword.opportunity_score,
      // created_at: new Date().toISOString(), // Let DB handle timestamp or update on conflict
    }));

    // Save keywords using upsert to avoid duplicates
    if (keywordUpserts.length > 0) {
      const { error: keywordError } = await supabaseClient
        .from("keywords")
        .upsert(keywordUpserts, {
          onConflict: "entity_id, entity_type, keyword", // Specify the columns in the unique constraint
          ignoreDuplicates: true, // <<< This prevents the error by skipping existing rows
        });

      // Handle error saving keywords
      if (keywordError) {
        console.error("Supabase keyword upsert error:", keywordError);
        throw keywordError;
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Brand analysis completed successfully",
        data: {
          brand_analysis: brandAnalysis,
          competitors: competitorAnalysis.competitors,
          keywords: keywordAnalysis.keywords,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // OK status
      }
    );
  } catch (error) {
    // Log the detailed error on the server
    console.error("Analysis Error:", error);
    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message, // Send error message to client
        // Optionally include stack trace in development, but avoid in production
        // details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500, // Use 500 for general server errors, or 400 for client errors
      }
    );
  }
});
