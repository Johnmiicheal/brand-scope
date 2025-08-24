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

    // Make request to new webhook endpoint using GET with query parameters
    const webhookUrl = `https://automations.ideacharge.com/webhook/keywordresearchair?chatInput=${chatInputParam}`;
    
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
    console.log('Keyword Results:', JSON.stringify(keywordResults, null, 2));

    // Validate response structure - webhook returns array of keyword objects with results/keywords properties
    if (!keywordResults || !Array.isArray(keywordResults) || keywordResults.length === 0) {
      console.error('Invalid webhook response structure:', keywordResults);
      return NextResponse.json(
        { error: 'Invalid response structure from keyword analysis service' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Filter out metadata objects and get actual keyword data
    const keywordData = keywordResults.filter(item => item.keywords && item.results);
    const metadata = keywordResults.find(item => item.metadata);

    if (keywordData.length === 0) {
      console.error('Invalid webhook response - no keyword data found:', keywordResults);
      return NextResponse.json(
        { error: 'Invalid response from keyword analysis service - no keywords data found' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate analysis session ID
    const analysisId = crypto.randomUUID();

    // Define types for keyword processing
    interface MonthlySearchVolume {
      month: string;
      year: string;
      monthlySearches: string;
    }



    interface ProcessedKeyword {
      conversational_keyword: string;
      intent: string | null;
      google_seed_keyword: string | null;
      category: string | null;
      search_volume: number;
      competition_index: number;
      competition: string | null;
      low_cpc: string | null;
      high_cpc: string | null;
      low_cpc_usd: string | null;
      high_cpc_usd: string | null;
      trend_3m: string;
      trend_6m: string;
      trend_11m: string;
      relevance_score: number;
      monthly_search_volumes: MonthlySearchVolume[];
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
    
    // Process each keyword from the new structure
    keywordsArray = keywordData.map((item: Record<string, unknown>) => {
      const results = (item.results || {}) as Record<string, unknown>;
      const keywords = (item.keywords || {}) as Record<string, unknown>;
      const keywordMetrics = (results.keywordMetrics || {}) as Record<string, unknown>;
      
      // Extract search volume from avgMonthlySearches
      const avgMonthlySearches = parseInt(String(keywordMetrics.avgMonthlySearches || '0')) || 0;
      
      // Extract competition index
      const competitionIndex = parseFloat(String(keywordMetrics.competitionIndex || '0')) || 0;
      
      // Extract trends
      const trends = (keywordMetrics.trends || {}) as Record<string, unknown>;
      
      return {
        conversational_keyword: String(keywords.conversational_keyword || ''),
        intent: keywords.intent ? String(keywords.intent) : null,
        google_seed_keyword: String(keywords.google_seed_keyword || results.text || ''),
        category: keywords.category ? String(keywords.category) : null,
        search_volume: avgMonthlySearches,
        competition_index: competitionIndex,
        competition: keywordMetrics.competition ? String(keywordMetrics.competition) : null,
        low_cpc: keywordMetrics.lowTopOfPageBid ? String(keywordMetrics.lowTopOfPageBid) : null,
        high_cpc: keywordMetrics.highTopOfPageBid ? String(keywordMetrics.highTopOfPageBid) : null,
        low_cpc_usd: keywordMetrics.lowTopOfPageBidUSD ? String(keywordMetrics.lowTopOfPageBidUSD) : null,
        high_cpc_usd: keywordMetrics.highTopOfPageBidUSD ? String(keywordMetrics.highTopOfPageBidUSD) : null,
        trend_3m: String(trends['3m_trend'] || '0%'),
        trend_6m: String(trends['6m_trend'] || '0%'),
        trend_11m: String(trends['11m_trend'] || '0%'),
        relevance_score: parseFloat(String(keywords.relevance_score || 0)) || 0,
        monthly_search_volumes: (keywordMetrics.monthlySearchVolumes || []) as MonthlySearchVolume[],
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

    // Calculate additional metrics for new database columns
    const totalMonthlySearches = keywordsArray.reduce((sum, kw) => sum + kw.search_volume, 0);
    const avgSearchVolume = Math.round(totalMonthlySearches / totalKeywords) || 0;
    const highCompetitionCount = keywordsArray.filter(kw => kw.competition_index > 50).length;
    const avgCompetitionIndex = keywordsArray.reduce((sum, kw) => sum + kw.competition_index, 0) / totalKeywords;

    // Analyze competition distribution
    const competitionDistribution = keywordsArray.reduce((acc: Record<string, number>, kw) => {
      const competition = kw.competition || 'UNKNOWN';
      acc[competition] = (acc[competition] || 0) + 1;
      return acc;
    }, {});

    // Analyze CPC data
    const validCpcs = keywordsArray.filter(kw => kw.low_cpc && kw.low_cpc !== '$0.00');
    const validCpcsUsd = keywordsArray.filter(kw => kw.low_cpc_usd && kw.low_cpc_usd !== '$0.00');
    const cpcAnalysis = {
      has_cpc_data: validCpcs.length > 0 || validCpcsUsd.length > 0,
      keywords_with_cpc: validCpcs.length,
      keywords_with_cpc_usd: validCpcsUsd.length,
      avg_low_cpc: validCpcs.length > 0 ? 
        validCpcs.reduce((sum, kw) => sum + parseFloat(kw.low_cpc?.replace('$', '') || '0'), 0) / validCpcs.length : 0,
      avg_high_cpc: validCpcs.length > 0 ? 
        validCpcs.reduce((sum, kw) => sum + parseFloat(kw.high_cpc?.replace('$', '') || '0'), 0) / validCpcs.length : 0,
      avg_low_cpc_usd: validCpcsUsd.length > 0 ? 
        validCpcsUsd.reduce((sum, kw) => sum + parseFloat(kw.low_cpc_usd?.replace('$', '') || '0'), 0) / validCpcsUsd.length : 0,
      avg_high_cpc_usd: validCpcsUsd.length > 0 ? 
        validCpcsUsd.reduce((sum, kw) => sum + parseFloat(kw.high_cpc_usd?.replace('$', '') || '0'), 0) / validCpcsUsd.length : 0,
      max_cpc_usd: validCpcsUsd.length > 0 ? 
        Math.max(...validCpcsUsd.map(kw => parseFloat(kw.high_cpc_usd?.replace('$', '') || '0'))) : 0,
      min_cpc_usd: validCpcsUsd.length > 0 ? 
        Math.min(...validCpcsUsd.map(kw => parseFloat(kw.low_cpc_usd?.replace('$', '') || '0'))) : 0
    };

    // Analyze trends
    const trendAnalysis = {
      positive_3m_trends: keywordsArray.filter(kw => kw.trend_3m.includes('+')).length,
      negative_3m_trends: keywordsArray.filter(kw => kw.trend_3m.includes('-')).length,
      positive_6m_trends: keywordsArray.filter(kw => kw.trend_6m.includes('+')).length,
      negative_6m_trends: keywordsArray.filter(kw => kw.trend_6m.includes('-')).length,
      positive_11m_trends: keywordsArray.filter(kw => kw.trend_11m.includes('+')).length,
      negative_11m_trends: keywordsArray.filter(kw => kw.trend_11m.includes('-')).length,
    };

    // Calculate high-value keywords (>$5 USD CPC)
    const highValueKeywordsCount = keywordsArray.filter(kw => {
      const highCpcUsd = parseFloat(kw.high_cpc_usd?.replace('$', '') || '0');
      return highCpcUsd > 5;
    }).length;

    // Generate analysis summary based on the results
    const analysisSummary = `Analyzed ${totalKeywords} keywords with an average relevance score of ${stats.avg_relevance_score}. Found ${stats.high_volume_count} high-volume keywords (>1000 monthly searches). Average search volume: ${avgSearchVolume}/month. ${validCpcsUsd.length > 0 ? `Average CPC: $${cpcAnalysis.avg_low_cpc_usd.toFixed(2)}-$${cpcAnalysis.avg_high_cpc_usd.toFixed(2)} USD. ` : ''}Top intents: ${Object.keys(stats.intent_distribution).slice(0, 3).join(', ')}.`;

    // Save the analysis session with embedded keywords data and new metrics
    const { error: sessionError } = await supabase
      .from('keyword_analysis_sessions')
      .insert({
        id: analysisId,
        user_id: userId,
        business_brief: businessBrief,
        website: website,
        keyword_input: keyword,
        total_keywords: totalKeywords,
        analysis_summary: analysisSummary,
        keywords_data: keywordsArray,
        top_keywords: topKeywords,
        stats: stats,
        language: metadata?.language || language || 'en',
        location: metadata?.country || location || 'Global',
        // New calculated metrics
        avg_search_volume: avgSearchVolume,
        total_monthly_searches: totalMonthlySearches,
        high_competition_count: highCompetitionCount,
        avg_competition_index: Math.round(avgCompetitionIndex * 100) / 100,
        trend_analysis: trendAnalysis,
        response_metadata: metadata || { language: language || 'en', country: location || 'Global' },
        competition_distribution: competitionDistribution,
        cpc_analysis: cpcAnalysis,
        // Enhanced CPC metrics
        avg_low_cpc_usd: Math.round(cpcAnalysis.avg_low_cpc_usd * 100) / 100,
        avg_high_cpc_usd: Math.round(cpcAnalysis.avg_high_cpc_usd * 100) / 100,
        max_cpc_usd: Math.round(cpcAnalysis.max_cpc_usd * 100) / 100,
        min_cpc_usd: Math.round(cpcAnalysis.min_cpc_usd * 100) / 100,
        keywords_with_cpc_data: validCpcsUsd.length,
        high_value_keywords_count: highValueKeywordsCount,
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
      data: {
        keywords: keywordsArray,
        summary: analysisSummary,
        stats: stats,
        metadata: metadata || { language: language || 'en', country: location || 'Global' }
      },
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