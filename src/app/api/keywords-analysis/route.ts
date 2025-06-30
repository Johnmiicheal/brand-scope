import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables!");
    throw new Error("Missing required environment variables for Supabase clients.");
  }
  
  try {
    // Initialize service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract request data (including user from request body)
    const { businessBrief, keyword, website, user } = await req.json();
    console.log("Request Body Parsed:", { businessBrief, keyword, website, user: user?.id });

    // Validate user authentication
    if (!user || !user.id) {
      console.error("Authentication Failed: No user found in request body.");
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;

    // Validate input - at least one field is required
    if (!businessBrief && !keyword && !website) {
      return NextResponse.json(
        { error: 'At least one field (business brief, keyword, or website) is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check daily usage limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: usageData, error: usageError } = await supabase
      .from('keyword_analysis_usage')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check usage limit' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if user has exceeded daily limit
    if (usageData && usageData.usage_count >= 3) {
      return NextResponse.json(
        { error: 'Daily keyword analysis limit reached. You can perform 1 analysis per day.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Prepare webhook payload as query parameters
    const chatInputData = {
      url: website || "",
      "business_brief or main keyword": businessBrief || keyword || ""
    };
    
    const chatInputParam = encodeURIComponent(JSON.stringify(chatInputData));
    
    console.log('Sending webhook request with query params:', chatInputData);

    // Make request to Railway webhook using GET with query parameters
    const webhookUrl = `https://primary-production-20a3.up.railway.app/webhook/dc520c2d-e515-4e54-b838-fc728c2a24ea?chatInput=${chatInputParam}`;
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze keywords. Please try again later.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const keywordResults = await webhookResponse.json();
    console.log('Keyword Results:', webhookResponse);

    // Validate response structure - webhook returns array with output object
    if (!keywordResults || !Array.isArray(keywordResults) || keywordResults.length === 0) {
      console.error('Invalid webhook response structure:', keywordResults);
      return NextResponse.json(
        { error: 'Invalid response structure from keyword analysis service' },
        { status: 500, headers: corsHeaders }
      );
    }

    const outputData = keywordResults[0]?.output;
    if (!outputData || !outputData.keywords) {
      console.error('Invalid webhook response - missing output.keywords:', keywordResults);
      return NextResponse.json(
        { error: 'Invalid response from keyword analysis service - missing keywords data' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate analysis session ID
    const analysisId = crypto.randomUUID();

    // Save the analysis session
    const { error: sessionError } = await supabase
      .from('keyword_analysis_sessions')
      .insert({
        id: analysisId,
        user_id: userId,
        business_brief: businessBrief,
        website: website,
        keyword_input: keyword,
        total_keywords: outputData.keywords?.length || 0,
        analysis_summary: outputData.summary || '',
      });

    if (sessionError) {
      console.error('Error saving analysis session:', sessionError);
    }

    // Save individual keyword recommendations
    if (outputData.keywords && Array.isArray(outputData.keywords)) {
      const keywordInserts = outputData.keywords.map((keywordData: {
        conversational_keyword?: string;
        intent?: string;
        google_seed_keyword?: string;
        category?: string;
        search_volume?: number | string;
        competition_index?: number | string;
        low_cpc?: string;
        trend_6m?: string;
        relevance_score?: number | string;
      }) => ({
        user_id: userId,
        analysis_id: analysisId,
        business_brief: businessBrief,
        website: website,
        keyword_input: keyword,
        conversational_keyword: keywordData.conversational_keyword || '',
        intent: keywordData.intent || null,
        google_seed_keyword: keywordData.google_seed_keyword || null,
        category: keywordData.category || null,
        search_volume: parseInt(String(keywordData.search_volume || 0)) || 0,
        competition_index: parseFloat(String(keywordData.competition_index || 0)) || 0,
        low_cpc: keywordData.low_cpc || '$0.00',
        trend_6m: keywordData.trend_6m || '0%',
        relevance_score: parseFloat(String(keywordData.relevance_score || 0)) || 0,
      }));

      const { error: keywordError } = await supabase
        .from('keyword_recommendations')
        .insert(keywordInserts);

      if (keywordError) {
        console.error('Error saving keyword recommendations:', keywordError);
      }
    }

    // Update or insert usage tracking
    const { error: upsertError } = await supabase
      .from('keyword_analysis_usage')
      .upsert({
        user_id: userId,
        usage_date: today,
        usage_count: (usageData?.usage_count || 0) + 1,
      }, {
        onConflict: 'user_id,usage_date'
      });

    if (upsertError) {
      console.error('Error updating usage count:', upsertError);
      // Don't fail the request if usage tracking fails, just log it
    }

    return NextResponse.json({
      success: true,
      data: outputData,
      remainingAnalyses: 0 // Since limit is 1 per day
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Keyword analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 