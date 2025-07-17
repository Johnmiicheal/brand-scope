import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Zod schema for request validation
const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  country: z.string().min(1, "Country is required"),
  citations: z.array(z.string()).min(1, "At least one citation is required"),
  monitoringId: z.string().uuid("Valid monitoring ID is required"),
  userId: z.string().uuid("Valid user ID is required"),
});

// Zod schema for webhook response (expecting array format)
const webhookResponseSchema = z.union([
  // Handle array format
  z.array(z.object({
    output: z.object({
      topic: z.string(),
      search_config: z.object({
        location: z.string(),
        language_code: z.string(),
        google_domain: z.string(),
        brand: z.string(),
      }),
      categories: z.array(z.object({
        header: z.string(),
        subsearches: z.array(z.string()),
      })),
      keywords: z.record(z.object({
        conversational_keyword: z.string(),
        intent: z.string(),
        search_intent: z.string(),
        google_seed_keyword: z.string(),
        category: z.string(),
        search_volume: z.number(),
        competition_index: z.number(),
        low_cpc: z.string(),
        trend_6m: z.string(),
        relevance_score: z.number(),
      })),
    }),
  })),
  // Handle object format (existing format)
  z.object({
    output: z.object({
      topic: z.string(),
      search_config: z.object({
        location: z.string(),
        language_code: z.string(),
        google_domain: z.string(),
        brand: z.string(),
      }),
      categories: z.array(z.object({
        header: z.string(),
        subsearches: z.array(z.string()),
      })),
      keywords: z.record(z.object({
        conversational_keyword: z.string(),
        intent: z.string(),
        search_intent: z.string(),
        google_seed_keyword: z.string(),
        category: z.string(),
        search_volume: z.number(),
        competition_index: z.number(),
        low_cpc: z.string(),
        trend_6m: z.string(),
        relevance_score: z.number(),
      })),
    }),
  }),
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Log the request for debugging
    console.log('Generate steps request body:', JSON.stringify(body, null, 2));

    // Validate request body
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.flatten());
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validation.error.flatten().fieldErrors,
          receivedData: {
            prompt: body.prompt ? 'provided' : 'missing',
            country: body.country ? 'provided' : 'missing',
            citations: Array.isArray(body.citations) ? `${body.citations.length} items` : 'not an array',
            monitoringId: body.monitoringId ? 'provided' : 'missing',
            userId: body.userId ? 'provided' : 'missing'
          }
        },
        { status: 400 }
      );
    }

    const { prompt, country, citations, monitoringId, userId } = validation.data;

    // Check if steps already exist for this monitoring ID
    const { data: existingSteps, error: checkError } = await supabase
      .from("monitoring_steps")
      .select("id, steps_data, citations_processed")
      .eq("monitoring_id", monitoringId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing steps:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing steps" },
        { status: 500 }
      );
    }

    // If steps already exist, return them
    if (existingSteps) {
      return NextResponse.json({
        message: "Steps already exist for this monitoring query",
        stepsData: existingSteps.steps_data,
        cached: true,
      });
    }


    // Prepare webhook parameters
    const webhookParams = {
      chatInput: prompt,
      country: country,
      url: citations,
    };

    const webhookUrl = "https://primary-production-20a3.up.railway.app/webhook/e4f4a7fc-56c9-4667-ac08-bcc8f044a746";
    
    // Build query string
    const queryString = new URLSearchParams({
      parameters: JSON.stringify(webhookParams)
    }).toString();

    const fullWebhookUrl = `${webhookUrl}?${queryString}`;

    console.log(`Making webhook request for monitoring ID: ${monitoringId}`);
    console.log(`Using citations: ${citations}`);
    console.log(`Total citations provided: ${citations.length}`);

    // Make webhook request with timeout
    const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let webhookResponse;
    try {
      const response = await fetch(fullWebhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BrandScope-Monitor/1.0',
        },
        signal: controller.signal,
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook request failed: ${response.status} - ${errorText}`);
        throw new Error(`Webhook returned ${response.status}: ${errorText}`);
      }

      webhookResponse = await response.json();
      console.log("Webhook response received successfully");

    } catch (fetchError: unknown) {

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Webhook request timed out after 30 seconds');
        return NextResponse.json(
          { error: "Webhook request timed out" },
          { status: 504 }
        );
      }
      console.error('Webhook request failed:', fetchError);
      return NextResponse.json(
        { error: "Failed to call webhook", details: fetchError instanceof Error ? fetchError.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Validate webhook response
    const responseValidation = webhookResponseSchema.safeParse(webhookResponse);
    if (!responseValidation.success) {
      console.error("Invalid webhook response format:", responseValidation.error);
      // Store the raw response anyway but mark it as potentially invalid
    }

    // Transform array response to expected object format
    let transformedResponse = webhookResponse;
    if (Array.isArray(webhookResponse)) {
      console.log("Transforming array response to object format");
      // Take the first item from the array if it's an array
      transformedResponse = webhookResponse[0] || webhookResponse;
    }

    // Store the steps data in database
    const { error: insertError } = await supabase
      .from("monitoring_steps")
      .insert({
        monitoring_id: monitoringId,
        user_id: userId,
        citations_processed: citations,
        primary_citation_url: citations[0],
        prompt: prompt,
        country: country,
        steps_data: transformedResponse,
        created_at: new Date().toISOString(),
        status: 'completed',
      });

    if (insertError) {
      console.error("Failed to store steps data:", insertError);
      return NextResponse.json(
        { error: "Failed to store steps data", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Steps generated successfully",
      stepsData: transformedResponse,
      citationsProcessed: citations.length,
      cached: false,
    });

  } catch (error: unknown) {
    console.error("Error in generate-steps API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing steps
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monitoringId = searchParams.get('monitoringId');

    if (!monitoringId) {
      return NextResponse.json(
        { error: "Monitoring ID is required" },
        { status: 400 }
      );
    }

    const { data: steps, error } = await supabase
      .from("monitoring_steps")
      .select("*")
      .eq("monitoring_id", monitoringId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching steps:", error);
      return NextResponse.json(
        { error: "Failed to fetch steps" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      steps: steps || [],
    });

  } catch (error: unknown) {
    console.error("Error in GET generate-steps API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 