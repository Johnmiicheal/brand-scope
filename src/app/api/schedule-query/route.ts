/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from 'next/server'; // Use NextResponse for App Router
import { groq } from '@ai-sdk/groq';

// --- Supabase and AI Clients ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY; // Assuming you have GROQ key

if (!supabaseUrl || !supabaseServiceKey || !openRouterApiKey || !groqApiKey) {
  console.error("Missing environment variables!");
  // Handle missing variables appropriately in production (e.g., throw error, exit)
  throw new Error("Missing required environment variables for Supabase/AI clients.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openrouter = createOpenRouter({ apiKey: openRouterApiKey });

// --- Zod Schemas ---

// Schema for a single brand analysis by one LLM
const BrandResultSchema = z.object({
  name: z.string().describe("The name of the brand analyzed."), // Changed from brand_name
  rank: z.number().min(1).max(10).describe("Numerical rank (1-10, 1 is best)."), // Made non-nullable
  score: z.number().min(0).max(100).describe("Confidence score (0-100)."),
  reasoning: z.string().describe("Detailed reasoning for the ranking."),
});

// Schema for the *direct output* expected from LLMs supporting generateObject
const LLMOutputSchema = z.object({
  brands: z.array(BrandResultSchema).describe("List of analyzed brands with rank, score, and reasoning."),
});

// Schema for a single analysis run (one object in the 'results' array)
const AnalysisRunSchema = z.object({
  analysis_date: z.string().datetime().describe("ISO 8601 timestamp of when the analysis was performed."),
  model_results: z.array(
    z.object({
      llm_name: z.string().describe("Name of the language model used."),
      status: z.enum(['fulfilled', 'rejected']).describe("Status of the API call for this model."),
      data: LLMOutputSchema.nullable().optional().describe("The structured brand analysis data if successful."), // Store successful data
      error: z.string().nullable().optional().describe("Error message if the API call failed."), // Store error message if rejected
    })
  ).describe("Results from each language model for this analysis run."),
});

// Schema for the entire 'results' column (a jsonb storing an array of runs)
const StoredResultsSchema = z.array(AnalysisRunSchema).describe("Historical array of analysis runs.");

// --- Prompt ---
// Updated prompt to be more explicit about the JSON structure and format.
const RANKING_PROMPT = `You are an expert brand analyst.
Analyze the following query: "{query}".
Generate a list of relevant brands based on the query. For each brand, provide:
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
          "reasoning": { "type": "string", "description": "Detailed reasoning for the ranking." }
        },
        "required": ["name", "rank", "score", "reasoning"]
      },
      "description": "List of analyzed brands with rank, score, and reasoning."
    }
  },
  "required": ["brands"]
}

Do NOT include any text outside of the JSON object. Do NOT use markdown code fences.
`;


// --- Helper Functions ---

/**
 * Safely parses and validates the existing results from Supabase.
 * Assumes 'results' is a single jsonb column storing an array adhering to StoredResultsSchema.
 * @param results - The raw data from the Supabase 'results' column.
 * @returns A validated array of analysis runs, or an empty array if invalid/null.
 */
function parseAndValidateExistingResults(results: any): z.infer<typeof StoredResultsSchema> {
  if (!results) {
    console.log("No existing results found, starting fresh.");
    return [];
  }

  // If it's already an array (Supabase might parse jsonb automatically), use it directly.
  // Otherwise, try parsing if it's a string.
  let parsed: any;
  if (Array.isArray(results)) {
    parsed = results;
  } else if (typeof results === 'string') {
    try {
      parsed = JSON.parse(results);
    } catch (e) {
      console.error("Error parsing existing results string:", e);
      return []; // Return empty array on parsing error
    }
  } else {
     console.warn("Existing results are not an array or string, type:", typeof results);
     return []; // Return empty array if format is unexpected
  }

  // Validate the parsed structure against the schema
  const validation = StoredResultsSchema.safeParse(parsed);
  if (validation.success) {
    console.log(`Successfully parsed and validated ${validation.data.length} existing analysis runs.`);
    return validation.data;
  } else {
    console.error("Existing results validation failed:", validation.error.errors);
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


// --- Core Logic ---

/**
 * Processes a single query by calling multiple LLMs, combining results,
 * and updating the database.
 * @param query - The query object from the database.
 * @param now - The current timestamp (ISO string) for this analysis run.
 */
async function processQuery(
  query: { id: string; query: string; frequency: string; mode?: string | null },
  now: string
): Promise<{ id: string; newAnalysisRun: z.infer<typeof AnalysisRunSchema> }> {
  console.log(`Processing query ID: ${query.id}, Text: "${query.query}", Mode: ${query.mode || 'Default'}`);

  // --- Define Models ---
  const modelsToQuery = [
    // Models supporting generateObject (preferred)
    { type: 'object' as const, model: openrouter('openai/gpt-4o'), name: 'GPT 4o'},
    { type: 'object' as const, model: openrouter('anthropic/claude-3.5-sonnet'), name: 'Claude 3.5 Sonnet'},
    { type: 'object' as const, model: openrouter('google/gemini-2.0-flash-001'), name: 'Gemini 2.0 Flash' }, // Swapped flash for pro
    { type: 'object' as const, model: groq('deepseek-r1-distill-llama-70b'), name: 'DeepSeek R1 (Groq)' }, // Example Groq model
    // Models requiring generateText + manual parsing
    { type: 'text' as const, model: openrouter('perplexity/sonar'), name: 'Perplexity Sonar' } // Using online version
  ];

  const formattedPrompt = RANKING_PROMPT.replace('{query}', query.query);

  // --- Fetch Existing Results ---
  const { data: existingData, error: fetchError } = await supabase
    .from('scheduled_queries')
    .select('results') // Select the single jsonb column
    .eq('id', query.id)
    .single();

  if (fetchError) {
    console.error(`Error fetching existing results for query ${query.id}:`, fetchError);
    // Decide if we should proceed or throw. Let's proceed with empty results for now.
  }

  // Parse and validate existing results
  const existingResultsArray = parseAndValidateExistingResults(existingData?.results);

  // --- Run LLM Queries in Parallel ---
  const modelPromises = modelsToQuery.map(async ({ type, model, name }) => {
    console.log(`  Querying ${name}...`);
    try {
      let resultObject: z.infer<typeof LLMOutputSchema>;

      if (type === 'object') {
        const { object } = await generateObject({
          model,
          schema: LLMOutputSchema, // Use the schema for direct LLM output
          prompt: formattedPrompt,
          maxRetries: 2, // Reduced retries
          temperature: 0.2, // Slightly higher temp might help structure adherence sometimes
        });
        // Validate the object received from generateObject again, just in case
        const validation = LLMOutputSchema.safeParse(object);
        if (!validation.success) {
            console.error(`  ${name} generateObject output failed Zod validation:`, validation.error.errors);
            console.error(`  ${name} raw output:`, JSON.stringify(object));
            throw new Error(`Schema validation failed for ${name}.`);
        }
        resultObject = validation.data;
        console.log(`  ${name} successful (generateObject).`);

      } else { // type === 'text'
        const { text } = await generateText({
          model,
          prompt: formattedPrompt, // Prompt already asks for JSON
          temperature: 0.1,
          maxRetries: 2,
        });

        console.log(`  ${name} raw text response:`, text); // Log raw response
        const jsonString = extractJsonFromString(text);

        if (!jsonString) {
          throw new Error(`Could not extract valid JSON from ${name} response.`);
        }

        try {
          const parsed = JSON.parse(jsonString);
          // Validate the parsed object
          const validation = LLMOutputSchema.safeParse(parsed);
           if (!validation.success) {
            console.error(`  ${name} parsed text output failed Zod validation:`, validation.error.errors);
            console.error(`  ${name} parsed object:`, JSON.stringify(parsed));
            throw new Error(`Schema validation failed for ${name} after parsing text.`);
          }
          resultObject = validation.data;
          console.log(`  ${name} successful (generateText + parse).`);
        } catch (parseError: any) {
          console.error(`  Error parsing JSON from ${name}:`, parseError);
          throw new Error(`JSON parsing failed for ${name}: ${parseError.message}`);
        }
      }
      // Return the result directly - don't wrap in a fulfilled/rejected structure
      return { 
          llm_name: name, 
          data: resultObject 
      };

    } catch (error: any) {
      console.error(`  Error querying ${name}:`, error.message);
       // Just throw the error instead of returning a rejection structure
      throw { llm_name: name, error: error.message || 'Unknown error' }; 
    }
  });

  // Wait for all models to finish (or fail)
  const settledResults = await Promise.allSettled(modelPromises);

  // --- Process Settled Results ---
  const newModelResults: z.infer<typeof AnalysisRunSchema>['model_results'] = settledResults.map(result => {
     if (result.status === 'fulfilled') {
        // result.value now directly contains { llm_name, data }
        return {
            llm_name: result.value.llm_name,
            status: 'fulfilled',
            data: result.value.data, 
            error: null
        };
     } else {
        // Handle rejected promise case
        // result.reason now contains the thrown object { llm_name, error }
        const reason = result.reason as any; // Use 'any' to access properties
        return {
            llm_name: reason?.llm_name || 'Unknown LLM', 
            status: 'rejected',
            data: null,
            error: reason?.error || 'Unknown error' 
        };
     }
  });

  // --- Prepare New Analysis Run Object ---
  const newAnalysisRun: z.infer<typeof AnalysisRunSchema> = {
    analysis_date: now,
    model_results: newModelResults,
  };

  // --- Update Database ---
  const updatedResultsArray = [...existingResultsArray, newAnalysisRun];

  const nextAnalysisDate = new Date(new Date(now).getTime() + (query.frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
  console.log(`  Updating Supabase for query ${query.id}. Next run: ${nextAnalysisDate.toISOString()}`);

  const { error: updateError } = await supabase
    .from('scheduled_queries')
    .update({
      results: updatedResultsArray, // Store the full array in the single jsonb column
      last_analysis_at: now,
      next_analysis_at: nextAnalysisDate.toISOString(),
    })
    .eq('id', query.id);

  if (updateError) {
     console.error(`  Failed to update query ${query.id} in Supabase:`, updateError);
     // Even if DB update fails, we might want to return the results gathered
     // Or throw to indicate the operation wasn't fully successful
     throw new Error(`Failed to update query results in DB: ${updateError.message}`);
  } else {
     const successfulModels = newModelResults.filter(r => r.status === 'fulfilled').length;
     console.log(`  Successfully updated query ${query.id}. ${successfulModels}/${modelsToQuery.length} models successful.`);
     return {
        id: query.id,
        newAnalysisRun: newAnalysisRun // Return the results of the current run
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
        frequency: z.enum(['daily', 'weekly']),
        mode: z.string().optional(), // Mode is optional
        user_id: z.string().uuid("Invalid user ID format."),
    });

    const validation = inputSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { query, frequency, mode, user_id } = validation.data;

     // --- Check for Duplicate Query ---
     const { data: existingQuery, error: checkError } = await supabase
        .from('scheduled_queries')
        .select('id')
        .eq('user_id', user_id)
        .eq('query', query)
        .maybeSingle();

      if (checkError) {
         console.error("Duplicate check error:", checkError);
         // Don't expose detailed DB errors to the client
         return NextResponse.json({ error: 'Failed to check for existing queries' }, { status: 500 });
      }

      if (existingQuery) {
        console.warn(`Attempt to add duplicate query "${query}" for user ${user_id}`);
        return NextResponse.json({ error: `Query "${query}" already exists for this user.` }, { status: 409 }); // 409 Conflict
      }

      const mode_id = uuidv4(); // Generate UUID for mode_id if needed

      // --- Insert New Query ---
      console.log(`Inserting new query "${query}" for user ${user_id}`);
      const { data: newQueryData, error: insertError } = await supabase
        .from('scheduled_queries')
        .insert({
          query,
          frequency,
          mode: mode || null,
          user_id: user_id,
          mode_id: mode_id, // Use the generated UUID
          next_analysis_at: now, // Schedule immediate analysis
          last_analysis_at: null,
          status: 'active',
          results: [], // Initialize with an empty array in the jsonb column
        })
        .select('id, query, frequency, mode') // Select necessary fields
        .single();

      if (insertError) {
         console.error("Insert error:", insertError);
         return NextResponse.json({ error: 'Failed to create scheduled query' }, { status: 500 });
      }

      if (!newQueryData) {
         console.error("Failed to retrieve data after insert for query:", query);
         return NextResponse.json({ error: 'Failed to confirm query creation' }, { status: 500 });
      }

      // --- Process New Query Immediately ---
      console.log(`Running initial analysis for new query ${newQueryData.id}...`);
      try {
        // Pass the essential parts of the new query data
        const { id, query: queryText, frequency: queryFreq, mode: queryMode } = newQueryData;
        const initialAnalysis = await processQuery({ id, query: queryText, frequency: queryFreq, mode: queryMode }, now);
        console.log(`Initial analysis complete for query ${newQueryData.id}`);

        // Return success with the initial analysis results
        return NextResponse.json({
          message: "Query scheduled and initial analysis performed.",
          query: newQueryData,
          initialAnalysis: initialAnalysis.newAnalysisRun // Return the structured run
        }, { status: 201 }); // 201 Created

      } catch (analysisError: any) {
        console.error(`Initial analysis failed for query ${newQueryData.id}:`, analysisError);
        // Query was created, but analysis failed. Return a success but with a warning.
        return NextResponse.json({
          message: "Query scheduled, but initial analysis failed.",
          query: newQueryData,
          warning: `Initial analysis failed: ${analysisError.message}`
        }, { status: 207 }); // 207 Multi-Status might be appropriate
      }

  } catch (error: any) {
    console.error('Error processing POST request:', error);
    // Handle JSON parsing errors or other unexpected issues
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
     }
    return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 });
  }
}

// Handler for GET requests (Intended for Cron Job trigger)
export async function GET(req: Request) {
  // --- Security Check (Highly Recommended for Cron) ---
  // Implement a check for a secret header or specific IP ranges
  // to ensure only your cron service can trigger this endpoint.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('Authorization');
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized GET request attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // --- End Security Check ---

  const now = new Date().toISOString();
  console.log(`GET /api/schedule-query (Cron Job) triggered at ${now}`);

  try {
    const { data: queries, error: fetchError } = await supabase
      .from('scheduled_queries')
      .select('id, query, frequency, mode') // Fetch necessary fields
      .lte('next_analysis_at', now)      // Due for analysis
      .not('next_analysis_at', 'is', null); // Ensure it has a scheduled time

    if (fetchError) {
      console.error("Error fetching due queries:", fetchError);
      return NextResponse.json({ error: 'Failed to fetch due queries' }, { status: 500 });
    }

    if (!queries || queries.length === 0) {
      console.log('No queries due for processing.');
      return NextResponse.json({ message: 'No queries due' }, { status: 200 });
    }

    console.log(`Processing ${queries.length} due queries...`);

    let processedCount = 0;
    let failedCount = 0;

    // Process queries sequentially to avoid overwhelming APIs/DB
    // Consider Promise.allSettled with concurrency limits for larger scale
    for (const query of queries) {
      try {
        await processQuery(query, now);
        processedCount++;
      } catch (error: any) {
        console.error(`Failed to process query ${query.id} during cron run:`, error);
        failedCount++;
        // Optional: Update the specific query record with an error status
        // or schedule a retry later? For now, just log and continue.
      }
    }

    console.log(`Search monitoring completed. Processed: ${processedCount}, Failed: ${failedCount}`);
    return NextResponse.json({
        message: `Search monitoring completed`,
        processed: processedCount,
        failed: failedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing GET request (cron):', error);
    return NextResponse.json({ error: 'Failed to process cron request', details: error.message }, { status: 500 });
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
