/* eslint-disable @typescript-eslint/no-explicit-any */
// api/process-next-batch.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);
export const maxDuration = 60;

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouter = createOpenRouter({ apiKey: openRouterApiKey });


// Maximum number of concurrent requests
const CONCURRENCY_LIMIT = 3;


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
});

// Schema for the entire 'results' column (a jsonb storing an array of runs)
const StoredResultsSchema = z
  .array(AnalysisRunSchema)
  .describe("Historical array of analysis runs.");


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
      const apiUrl = `https://brandscope.vercel.app/api/search-google`;
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
  

export async function POST(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { batchSize = 10, offset = 0 } = body;

    // Fetch the next batch of queries
    const { data: queries, error } = await supabase
      .from("scheduled_queries")
      .select("id, query, frequency, mode, user_id")
      .lte("next_analysis_at::date", new Date().toISOString().split('T')[0])
      .eq("status", "active")
      .order("next_analysis_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("Error fetching next batch of queries:", error);
      return NextResponse.json(
        { error: "Failed to fetch queries" },
        { status: 500 }
      );
    }

    console.log(`Processing next batch of ${queries.length} queries`);

    // Process queries with concurrency control
    const results = [];
    
    // Process in chunks with limited concurrency
    for (let i = 0; i < queries.length; i += CONCURRENCY_LIMIT) {
      const chunk = queries.slice(i, i + CONCURRENCY_LIMIT);
      const chunkResults = await Promise.all(
        chunk.map(async (query) => {
          try {
            console.log(`Processing query ID: ${query.id}`);
            
            // Process the query directly
            const result = await processQueryDirectly(query);
            
            return { queryId: query.id, status: "success", result };
          } catch (error: any) {
            console.error(`Error processing query ${query.id}:`, error);
            return { 
              queryId: query.id, 
              status: "error", 
              error: error.message 
            };
          }
        })
      );
      
      results.push(...chunkResults);
    }

    // Check if there are more queries to process
    const { count, error: countError } = await supabase
      .from("scheduled_queries")
      .select("id", { count: "exact", head: true })
      .lte("next_analysis_at::date", new Date().toISOString().split('T')[0])
      .eq("status", "active");

    if (!countError && count && count > offset + batchSize) {
      console.log(`Scheduling next batch. ${count - (offset + batchSize)} queries remaining.`);
      
      // Trigger the next batch asynchronously
      fetch(`${process.env.BASE_SYSTEM_URL}/api/process-next-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ 
          batchSize,
          offset: offset + batchSize 
        }),
      }).catch(error => {
        console.error("Failed to schedule next batch:", error);
      });
    }

    return NextResponse.json({
      message: `Processed ${queries.length} queries`,
      processed: queries.length,
      results,
    });
  } catch (error: any) {
    console.error("Error processing next batch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// This function processes a query directly
async function processQueryDirectly(query: any) {
  const now = new Date().toISOString();
  
  try {
    // Your query processing logic here
    // This should be the same as in your main cron job file
    
     console.log(
      `Processing query ID: ${query.id}, Text: "${query.query}", Mode: ${
        query.mode || "Default"
      }`
    );
  
    // Generate a unique ID for this specific run (like mode_id)
    const analysisRunId = uuidv4();
    console.log(`  Generated Analysis Run ID: ${analysisRunId}`);
    
    // Call the search-google endpoint to get Google search results
    // This helps enrich our analysis with current web data
    await callSearchGoogleEndpoint(query.query, analysisRunId, query.user_id, query.location);
  
    // --- Define Models ---
    const textModels = [
      { modelId: "openai/gpt-4o-search-preview", name: "GPT 4o" },
      { modelId: "openai/gpt-4.1", name: "GPT 4.1"},
      {
        modelId: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
      },
      // {
      //   modelId: "deepseek/deepseek-r1:free",
      //   name: "DeepSeek R1",
      // },
      {
        modelId: "google/gemini-2.0-flash-001",
        name: "Gemini 2.0 Flash",
      },
      // { modelId: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
      { modelId: "perplexity/sonar", name: "Perplexity Sonar" }, // Keep Perplexity here
    ];
  
    const objectModels = [
      { model: openrouter("openai/gpt-4o"), name: "GPT 4o" },
      { model: openrouter("openai/gpt-4.1"), name: "GPT 4.1"},
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
        const modelConfig = objectModels.find((m) => m.name === name);
        if (!modelConfig) {
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
  
  
    // --- Prepare New Analysis Run Object (Matches existing DB Schema) ---
    const newAnalysisRun: z.infer<typeof AnalysisRunSchema> = {
      analysis_date: now,
      model_results: finalModelResultsForDB, // Contains results conforming to the schema
      model_summary: ai_summary,
    };
  
    // --- Update Database ---
    const updatedResultsArray: z.infer<typeof AnalysisRunSchema>[] = [
      ...existingResultsArray,
      newAnalysisRun,
    ];
    const nextAnalysisDate = new Date(
      new Date(now).getTime() +
        (query.frequency === "daily"
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000)
    );
    console.log(
      `  Updating Supabase for query ${
        query.id
      }. Next run: ${nextAnalysisDate.toISOString()}`
    );
    
    // Update the query record
    const { error: updateError } = await supabase
      .from("scheduled_queries")
      .update({ 
        last_analysis_at: now,
        next_analysis_at: nextAnalysisDate,
        results: updatedResultsArray as any,
      })
      .eq("id", query.id);
      
    if (updateError) {
      throw new Error(`Failed to update query record: ${updateError.message}`);
    }
    
    return { 
      success: true, 
      queryId: query.id,
      nextScheduled: nextAnalysisDate,
      newAnalysisRun,
    };
  } catch (error: any) {
    console.error(`Error in processQueryDirectly for query ${query.id}:`, error);
    throw error;
  }
}


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