import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { updateCreditUsage } from '@/lib/creditUsage';
import { constraints } from '@/lib/constraints';

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
    const { businessBrief, keyword, website, user, language, location } = await req.json();
    console.log("Request Body Parsed:", { businessBrief, keyword, website, user: user?.id, language, location });

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

    // Check and deduct credits for keyword analysis
    const keywordCreditCost = constraints.keyword_analysis.credit_cost;
    
    try {
      const creditResult = await updateCreditUsage(userId, keywordCreditCost, 'query');
      
      if (!creditResult.success) {
        return NextResponse.json(
          { error: creditResult.error || 'Insufficient credits for keyword analysis' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      console.log(`Successfully deducted ${keywordCreditCost} credits for keyword analysis`);
    } catch (error) {
      console.error('Error processing credit deduction:', error);
      return NextResponse.json(
        { error: 'Failed to process credit usage' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Prepare webhook payload as query parameters
    const chatInputData = {
      url: website || "",
      "business_brief or main keyword": businessBrief || keyword || "",
      language: language || "en",
      location: location || "Global"
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

    // Define types for keyword processing
    interface ProcessedKeyword {
      conversational_keyword: string;
      intent: string | null;
      google_seed_keyword: string | null;
      category: string | null;
      search_volume: number;
      competition_index: number;
      low_cpc: string;
      trend_6m: string;
      relevance_score: number;
    }

    interface KeywordStats {
      total_keywords: number;
      avg_relevance_score: number;
      high_volume_count: number;
      intent_distribution: Record<string, number>;
      category_distribution: Record<string, number>;
    }

    // Process keywords data for optimized storage
    let keywordsArray: ProcessedKeyword[] = [];
    let topKeywords: ProcessedKeyword[] = [];
    let stats: KeywordStats = {
      total_keywords: 0,
      avg_relevance_score: 0,
      high_volume_count: 0,
      intent_distribution: {},
      category_distribution: {}
    };
    
    if (outputData.keywords && typeof outputData.keywords === 'object') {
      // Convert object with numbered keys to array
      keywordsArray = Object.values(outputData.keywords).map((keywordData) => {
        const data = keywordData as Record<string, unknown>;
        return {
          conversational_keyword: String(data.conversational_keyword || ''),
          intent: data.intent ? String(data.intent) : null,
          google_seed_keyword: data.google_seed_keyword ? String(data.google_seed_keyword) : null,
          category: data.category ? String(data.category) : null,
          search_volume: parseInt(String(data.search_volume || 0)) || 0,
          competition_index: parseFloat(String(data.competition_index || 0)) || 0,
          low_cpc: String(data.low_cpc || '$0.00'),
          trend_6m: String(data.trend_6m || '0%'),
          relevance_score: parseFloat(String(data.relevance_score || 0)) || 0,
        };
      });

      // Get top 10 keywords by relevance score for quick dashboard access
      topKeywords = keywordsArray
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 10);

      // Calculate quick stats
      const totalKeywords = keywordsArray.length;
      const avgRelevance = keywordsArray.reduce((sum, kw) => sum + kw.relevance_score, 0) / totalKeywords;
      const highVolumeCount = keywordsArray.filter(kw => kw.search_volume > 1000).length;
      const intentCounts = keywordsArray.reduce((acc: Record<string, number>, kw) => {
        const intent = kw.intent || 'unknown';
        acc[intent] = (acc[intent] || 0) + 1;
        return acc;
      }, {});
      const categoryCounts = keywordsArray.reduce((acc: Record<string, number>, kw) => {
        const category = kw.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      stats = {
        total_keywords: totalKeywords,
        avg_relevance_score: Math.round(avgRelevance * 10) / 10,
        high_volume_count: highVolumeCount,
        intent_distribution: intentCounts,
        category_distribution: categoryCounts
      };
    }

    const totalKeywords = keywordsArray.length;

    // Save the analysis session with embedded keywords data
    const { error: sessionError } = await supabase
      .from('keyword_analysis_sessions')
      .insert({
        id: analysisId,
        user_id: userId,
        business_brief: businessBrief,
        website: website,
        keyword_input: keyword,
        total_keywords: totalKeywords,
        analysis_summary: outputData.summary || '',
        keywords_data: keywordsArray,
        top_keywords: topKeywords,
        stats: stats,
        language: language,
        location: location,
      });

    if (sessionError) {
      console.error('Error saving analysis session:', sessionError);
    } else {
      console.log('Successfully saved analysis session with', totalKeywords, 'keywords');
      
      // Update user summary stats asynchronously
      supabase.rpc('update_keyword_analysis_summary', { p_user_id: userId })
        .then(({ error: summaryError }) => {
          if (summaryError) {
            console.error('Error updating summary stats:', summaryError);
          }
        });
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
      keyword_id: analysisId // Include the analysis ID for redirect
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Keyword analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 