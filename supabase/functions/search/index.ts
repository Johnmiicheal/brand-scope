/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.22.4'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@11.0.0'
import { createGroq } from 'https://esm.sh/@ai-sdk/groq@latest'
import { generateObject, generateText, extractReasoningMiddleware, experimental_wrapLanguageModel as wrapLanguageModel  } from 'https://esm.sh/ai@latest'
import Exa from 'https://esm.sh/exa-js@latest'




interface AIRanking {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  user_id: string
  llm_name: string
  query: string
  rank: number | null
  score: number
  reasoning: string
  mode: string
  mode_id: string
  analyzed_at: string
}

interface CompetitorComparison {
  competitor: string
  competitor_id: string
  ranking_diff: number
  analysis: string
}


interface SocialInsight {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  user_id: string
  search_id: string
  platform: string
  keyword: string
  mention_count: number
  sentiment: string
  data_fetched_at: string
  links?: Array<string>
}

interface Recommendations {
  id: string
  brand_id: string
  mode_id: string
  query: string
  type: string
  suggestion: string
  reasoning: string
  priority: number
  created_at: string
}

interface ChartData {
  keyword: string
  trend_points: { date: string; value: number }[]
}

interface SearchResults {
  search_id: string
  mode: string
  mode_id: string
  ai_rankings: AIRanking[]
  social_insights?: SocialInsight[]
  charts?: ChartData[]
  comparisons?: CompetitorComparison[]
  recommendations?: Recommendations
}

interface Brand {
  name: string
  description: string
}

// System prompt for competitor analysis
// const COMPETITOR_ANALYSIS_PROMPT = `You are a competitive analysis expert. 
// Compare the brand "{brand_name}" with its competitor "{competitor_name}" (if no competitor provider, find the top 10 competitors and continue the analysis) for the query: "{query}".
// Provide a numerical rank (1-10, with 1 being the best) for both the brand and the competitor.
// Also assign a confidence score (0-100) and provide a detailed analysis of how the brand can gain an edge over this competitor.
// Focus on actionable insights and specific advantages/disadvantages.`



// System prompt for brand analysis
const VOYAGER_RANKING_PROMPT = `You are an expert brand analyst. 
Analyze the following query: "{query}".
Generate a list of relevant brands and provide a numerical rank (1-10, with 1 being the best) and a confidence score (0-100) for each brand.
Also provide detailed reasoning for each ranking based on market analysis, consumer perception, and brand reputation.
Your reasoning should be comprehensive yet concise.

Return the results in the following format:
{
  "brands": [
    {
      "name": "Brand Name",
      "rank": number,
      "score": number,
      "reasoning": "Detailed analysis..."
    }
  ]
}`

const EXPLORER_RECOMMENDER_PROMPT = `
  You are an expert brand analyst and marketing expert.
  Analyze the query: "{query}".
  Generate a detailed recommendation on how to improve the brand: "{brand}" which is in the industry: "{industry}" based on the query provided.
  If the industry does not relate to the query, inform the user of this with a slight joke.
  Focus on actionable and detailed steps on insights, keyword recommendations, SEO and Generative Engine Optimization and AI Search Engine visibility improvements.
`


// System prompts
const BRAND_GENERATION_PROMPT = `You are a brand analysis expert. Generate a list of 10 leading brands in {industry} with a brief description of each. Format your response as a JSON array of objects, each with 'name' and 'description' fields.`

const BRAND_RANKING_PROMPT = `You are an expert brand analyst. 
Analyze the following query: "{query}".
Generate a list of relevant brands and provide a numerical rank (1-10, with 1 being the best) and a confidence score (0-100) for each brand.
Also provide detailed reasoning for each ranking based on market analysis, consumer perception, and brand reputation.
Your reasoning should be comprehensive yet concise.

Return the results in the following format:
{
  "brands": [
    {
      "name": "Brand Name",
      "rank": number,
      "score": number,
      "reasoning": "Detailed analysis..."
    }
  ]
}`

const groq = createGroq({
  apiKey: Deno.env.get('GROQ_API_KEY'),
  baseUrl: 'https://api.groq.com/openai/v1'
})



// Define analysis modes
const analysisModes = ['DeepFocus', 'Voyager', 'Explorer'] as const
type AnalysisMode = typeof analysisModes[number]

// Request validation schema
const searchRequestSchema = z.object({
  mode: z.enum(analysisModes),
  user_id: z.string().uuid(),
  query: z.string(),
  brand_name: z.string(),
  brand_industry: z.string(),
  brand_id: z.string().uuid(),
  competitors: z.array(z.string()).optional(),
})


serve(async (req) => {
  try {
    // Set CORS headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': req.headers.get('Origin') || 'https://brandscope.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Credentials': 'true',
    })

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }

    // Only allow POST and GET
    if (!['POST', 'GET'].includes(req.method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers,
        status: 405
      })
    }

    // Handle GET request
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode_id = url.searchParams.get('mode_id')
      const user_id = url.searchParams.get('user_id')
      
      if (!mode_id && !user_id) {
        return new Response(
          JSON.stringify({ error: 'Missing mode_id or user_id parameter' }), 
          { headers, status: 400 }
        )
      }
      
      // Initialize Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SB_BRAND_URL') ?? '',
        Deno.env.get('SB_BRAND_ANON_KEY') ?? '',
        { 
          global: { 
            headers: { 
              Authorization: req.headers.get('Authorization')! 
            } 
          } 
        }
      )

      let results
      if (mode_id) {
        const { data, error } = await supabaseClient
          .from('ai_rankings')
          .select('*')
          .eq('mode_id', mode_id)
        
        if (error) throw error
        results = data
      } else if (user_id) {
        const { data, error } = await supabaseClient
          .from('ai_rankings')
          .select('*')
          .eq('user_id', user_id)
          .order('analyzed_at', { ascending: false })
        
        if (error) throw error
        results = data
      }
      
      if (!results) {
        return new Response(
          JSON.stringify({ error: 'No results found' }), 
          { headers, status: 404 }
        )
      }
      
      return new Response(JSON.stringify(results), { headers })
    }

    // Handle POST request
    const body = await req.json()
    
    // Validate request body
    const { mode, user_id, query, brand_name, brand_industry, brand_id } = searchRequestSchema.parse(body)

    // Generate shared IDs for this search session
    const mode_id = uuidv4()
    const search_id = uuidv4()

    // Run mode-specific analysis
    let results
    try {
      if (mode === 'DeepFocus') {
        results = await deepFocusAnalysis(user_id, query, mode_id, search_id)
      } else if (mode === 'Voyager') {
        results = await voyagerAnalysis(user_id, query, mode_id, search_id)
      } else if (mode === 'Explorer') {
        results = await explorerAnalysis(user_id, query, mode_id, search_id, brand_name, brand_industry, brand_id)
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid analysis mode' }),
          { headers, status: 400 }
        )
      }
    } catch (analysisError) {
      console.error('Error in analysis:', analysisError)
      return new Response(
        JSON.stringify({ 
          error: 'Analysis failed', 
          details: analysisError instanceof Error ? analysisError.message : 'Unknown analysis error'
        }), 
        { headers, status: 500 }
      )
    }

    // Ensure results exist
    if (!results) {
      return new Response(
        JSON.stringify({ error: 'Analysis returned no results' }),
        { headers, status: 500 }
      )
    }

    // Save results to Supabase
    try {
      await saveToSupabase(results, user_id)
    } catch (saveError) {
      console.error('Error saving to Supabase:', saveError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save results', 
          details: saveError instanceof Error ? saveError.message : 'Unknown save error'
        }), 
        { headers, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analysis complete for mode ${mode}. Results have been stored with search ID: ${mode_id}`,
        mode_id
      }),
      { headers }
    )
  } catch (error) {
    console.error('Error in search endpoint:', error)
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data', 
          details: error.errors 
        }), 
        { headers, status: 400 }
      )
    }
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { headers, status: 500 }
    )
  }
})


// Explorer: Competitor comparison and analysis - Optimized
export async function explorerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string = uuidv4(),
  search_id: string = uuidv4(),
  brand_name: string,
  brand_industry: string,
  brand_id: string
): Promise<SearchResults> {
  const models = [
    { model: groq('meta-llama/llama-4-maverick-17b-128e-instruct'), name: 'Llama 4 Maverick'},
    { model: groq('llama3-70b-8192'), name: 'Llama 3'},
    { model: groq('mistral-saba-24b'), name: 'Mistral Saba' },
    { model: groq('gemma2-9b-it'), name: 'Gemma 2 Instruct' },
    { model: groq('deepseek-r1-distill-llama-70b'), name: 'DeepSeek R1' }
  ]
  
  const rankings: AIRanking[] = []
  const socialInsights: SocialInsight[] = []
  const charts: ChartData[] = []
  let recommendations: Recommendations = {
    id: uuidv4(),
    brand_id: brand_id,
    mode_id: mode_id,
    query: query,
    type: `Recommendation for ${brand_name}`,
    suggestion: '',
    reasoning: '',
    priority: 1,
    created_at: new Date().toISOString(),
  }

  // Initialize Exa client
  const exa = new Exa(Deno.env.get('EXA_API_KEY') || '')

  // Start recommendation generation in parallel with other processing
  const formattedRecommenderPrompt = EXPLORER_RECOMMENDER_PROMPT
    .replace('{query}', query)
    .replace('{brand}', brand_name)
    .replace('{industry}', brand_industry)
  
  const enhancedModel = wrapLanguageModel({
    model: groq('qwen-qwq-32b'),
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  })

  // Start recommendation generation asynchronously
  const recommendationPromise = generateText({
    model: enhancedModel,
    prompt: formattedRecommenderPrompt,
  })

  // Prepare for multi-model ranking
  const formattedPrompt = VOYAGER_RANKING_PROMPT.replace('{query}', query)
  const responseSchema = z.object({ 
    brands: z.array(z.object({
      name: z.string(),
      rank: z.number().nullable(),
      score: z.number(),
      reasoning: z.string()
    }))
  })

  // Run all model queries in parallel
  const modelPromises = models.map(({ model, name }) => 
    generateObject({
      model,
      schema: responseSchema,
      prompt: formattedPrompt,
      max_retries: 3,
      temperature: 0.1,
    }).then(response => ({ response, name }))
  )

  // Wait for all model responses
  const modelResults = await Promise.all(modelPromises)
  
  // Process all model results and build a set of unique brands
  const uniqueBrands = new Set()
  for (const { response, name } of modelResults) {
    for (const brand of response.object.brands) {
      rankings.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: brand.name,
        entity_type: 'brand',
        user_id,
        llm_name: name,
        query,
        rank: brand.rank,
        score: brand.score,
        reasoning: brand.reasoning,
        mode: 'Explorer',
        mode_id,
        analyzed_at: new Date().toISOString(),
      })
      
      uniqueBrands.add(brand.name)
    }
  }

  // Process social data for each unique brand in parallel
  const socialPromises: Promise<{
    brandName: string,
    sentiment?: string,
    mentions?: number,
    sources?: any,
    xResults?: any,
    error?: Error
  }>[] = []

  for (const brandName of uniqueBrands) {
    socialPromises.push(
      (async () => {
        try {
          // Run both Exa API calls in parallel for each brand
          const searchQuery = `${brandName} ${query}`
          const [xResults, sources] = await Promise.all([
            exa.searchAndContents(searchQuery, {
              type: 'keyword',
              numResults: 5,
              includeDomains: ['x.com', 'reddit.com'],
              text: true,
            }),
            exa.searchAndContents(`social insights on ${query}, brand: ${brandName}`, {
              text: true,
              type: "keyword",
              summary: true,
              numResults: 5
            })
          ])

          // Calculate brand mentions
          const brandMentions = sources.results.reduce((count, result) => {
            const text = result.text || '';
            const summary = result.summary || '';
            return count + (text.includes(brandName) ? 1 : 0) + (summary.includes(brandName) ? 1 : 0);
          }, 0);

          // Extract post text for sentiment analysis
          const posts = xResults.results.map(r => r.text).join('\n')
          
          // Analyze sentiment
          const sentiment = await analyzeSentiment(posts)
          
          return {
            brandName,
            sentiment,
            mentions: brandMentions,
            sources: sources.results,
            xResults
          }
        } catch (error) {
          console.error(`Error processing social data for ${brandName}:`, error)
          return {
            brandName,
            error
          }
        }
      })()
    )
  }

  // Process all social data results
  const socialResults = await Promise.all(socialPromises)
  
  // Create final data structures from results
  for (const result of socialResults) {
    if (result.error) {
      // Handle error case
      socialInsights.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: result.brandName,
        entity_type: 'brand',
        user_id,
        search_id: mode_id,
        platform: 'X',
        keyword: query,
        mention_count: 0,
        sentiment: 'neutral',
        data_fetched_at: new Date().toISOString(),
        links: [""]
      })
    } else {
      // Add social insights
      socialInsights.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: result.brandName,
        entity_type: 'brand',
        user_id,
        search_id: mode_id,
        platform: 'X', 
        keyword: query,
        mention_count: result.mentions || 0,
        sentiment: result.sentiment || 'neutral',
        data_fetched_at: new Date().toISOString(),
        links: result.sources || [""]
      })

      // Generate trend data
      if (result.xResults) {
        charts.push({
          keyword: result.brandName,
          trend_points: generateTrendPoints(result.xResults.results),
        })
      }
    }
  }

  // Collect recommendation results
  try {
    const {text, reasoning} = await recommendationPromise
    if (text) {
      recommendations = {
        id: uuidv4(),
        brand_id: brand_id,
        mode_id: mode_id,
        query: query,
        type: `Recommendation for ${brand_name}`,
        reasoning: reasoning || '',
        suggestion: text,
        priority: 1,
        created_at: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error("Error generating recommendation:", error)
  }

  return {
    search_id,
    mode: 'Explorer',
    mode_id,
    ai_rankings: rankings,
    social_insights: socialInsights,
    recommendations,
    charts
  }
}

// Function to identify potential competitors
export async function findCompetitors(
  brand: string,
  industry: string
): Promise<string[]> {
  const exa = new Exa(Deno.env.get('EXA_API_KEY') || '')
  const query = `top competitors of ${brand} in ${industry}`
  
  try {
    const searchResults = await exa.search(query, {
      type: 'keyword',
      numResults: 5,
    })
    
    // Extract competitor names using LLM
    const model = groq('gemma2-9b-it')
    const prompt = `Based on the following search results about competitors of ${brand} in the ${industry} industry, 
    identify the top 3-5 competitor brands. Return ONLY the list of competitor brand names as a JSON array of strings.
    
    Search results:
    ${searchResults.results.map(r => r.title + ': ' + r.text).join('\n\n')}
    
    The response should be formatted as a JSON array, for example: ["Competitor 1", "Competitor 2", "Competitor 3"]`
    
    const { object } = await generateObject({
      model,
      schema: z.array(z.string()),
      prompt,
      max_retries: 3,
    })
    
    return object
  } catch (error) {
    console.error('Error finding competitors:', error)
    return []
  }
}

// Edge Function handler if you want to expose this as a standalone function
serve(async (req) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  })

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const { user_id, query, mode_id, search_id, brand_name, brand_industry, brand_id } = await req.json()
    
    if (!user_id || !query || !brand_name) {
      return new Response(
        JSON.stringify({ error: 'Query and Brand Name are required to perform this search analysis' }),
        { status: 400, headers }
      )
    }

    const results = await explorerAnalysis(user_id, query, mode_id, search_id, brand_name, brand_industry, brand_id)
    
    return new Response(
      JSON.stringify(results),
      { headers }
    )
  } catch (error) {
    console.error('Error in explorerAnalysis edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
})



// Voyager: Multi-model analysis with social sentiment - Optimized
export async function voyagerAnalysis(
  user_id: string, 
  query: string,
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const models = [
    { model: groq('meta-llama/llama-4-scout-17b-16e-instruct'), name: 'Llama 4 Scout'},
    { model: groq('deepseek-r1-distill-llama-70b'), name: 'DeepSeek R1' },
    { model: groq('qwen-qwq-32b'), name: 'Qwen QwQ 32B' }
  ]
  
  const rankings: AIRanking[] = []
  const socialInsights: SocialInsight[] = []
  const charts: ChartData[] = []
  const recommendations: Recommendations = {
    id: uuidv4(),
    brand_id: "",
    mode_id: mode_id,
    query: query,
    type: `Recommendation for Brand`,
    suggestion: '',
    reasoning: '',
    priority: 0,
    created_at: new Date().toISOString(),
  }

  // Initialize Exa client
  const exa = new Exa(Deno.env.get('EXA_API_KEY') || '')
  const formattedPrompt = VOYAGER_RANKING_PROMPT.replace('{query}', query)
  const responseSchema = z.object({ 
    brands: z.array(z.object({
      name: z.string(),
      rank: z.number().nullable(),
      score: z.number(),
      reasoning: z.string()
    }))
  })

  // Run model requests in parallel
  const modelPromises = models.map(({ model, name }) => 
    generateObject({
      model,
      schema: responseSchema,
      prompt: formattedPrompt,
      max_retries: 3,
      temperature: 0.1,
    }).then(response => ({ response, name }))
  )

  // Execute all model calls concurrently
  const modelResults = await Promise.all(modelPromises)
  
  // Process all model results and build rankings
  // Also collect unique brands for sentiment analysis
  const uniqueBrands = new Set<string>()
  
  for (const { response, name } of modelResults) {
    for (const brand of response.object.brands) {
      rankings.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: brand.name,
        entity_type: 'brand',
        user_id,
        llm_name: name,
        query,
        rank: brand.rank,
        score: brand.score,
        reasoning: brand.reasoning,
        mode: 'Voyager',
        mode_id,
        analyzed_at: new Date().toISOString(),
      })
      
      // Add to unique brands set
      uniqueBrands.add(brand.name)
    }
  }

  // Process social data for each unique brand in parallel
  const socialPromises: Promise<{
    brandName: string,
    sentiment?: string,
    mentions?: number,
    sources?: any,
    xResults?: any,
    error?: Error
  }>[] = []

  for (const brandName of uniqueBrands) {
    socialPromises.push(
      (async () => {
        try {
          // Run both Exa API calls in parallel for each brand
          const searchQuery = `${brandName} ${query}`
          const [xResults, sources] = await Promise.all([
            exa.searchAndContents(searchQuery, {
              type: 'keyword',
              numResults: 5,
              includeDomains: ['x.com', 'reddit.com'],
              text: true,
            }),
            exa.searchAndContents(`social insights on ${query}, brand: ${brandName}`, {
              text: true,
              type: "keyword",
              summary: true,
              numResults: 5
            })
          ])

          // Calculate brand mentions
          const brandMentions = sources.results.reduce((count, result) => {
            const text = result.text || '';
            const summary = result.summary || '';
            return count + (text.includes(brandName) ? 1 : 0) + (summary.includes(brandName) ? 1 : 0);
          }, 0);

          // Extract post text for sentiment analysis
          const posts = xResults.results.map(r => r.text).join('\n')
          
          // Analyze sentiment
          const sentiment = await analyzeSentiment(posts)
          
          return {
            brandName,
            sentiment,
            mentions: brandMentions,
            sources: sources.results,
            xResults
          }
        } catch (error) {
          console.error(`Error processing social data for ${brandName}:`, error)
          return {
            brandName,
            error
          }
        }
      })()
    )
  }

  // Wait for all social data processing to complete
  const socialResults = await Promise.all(socialPromises)
  
  // Create final data structures from results
  for (const result of socialResults) {
    if (result.error) {
      // Handle error case
      socialInsights.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: result.brandName,
        entity_type: 'brand',
        user_id,
        search_id: mode_id,
        platform: 'X',
        keyword: query,
        mention_count: 0,
        sentiment: 'neutral',
        data_fetched_at: new Date().toISOString(),
        links: [""]
      })
    } else {
      // Add social insights
      socialInsights.push({
        id: uuidv4(),
        entity_id: uuidv4(),
        entity_name: result.brandName,
        entity_type: 'brand',
        user_id,
        search_id: mode_id,
        platform: 'X', 
        keyword: query,
        mention_count: result.mentions || 0,
        sentiment: result.sentiment || 'neutral',
        data_fetched_at: new Date().toISOString(),
        links: result.sources || [""]
      })

      // Generate trend data
      if (result.xResults) {
        charts.push({
          keyword: result.brandName,
          trend_points: generateTrendPoints(result.xResults.results),
        })
      }
    }
  }

  return {
    search_id,
    mode: 'Voyager',
    mode_id,
    ai_rankings: rankings,
    social_insights: socialInsights,
    charts,
    recommendations
  }
}

// Helper function to analyze sentiment
async function analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
  // Truncate text to approximately 2000 tokens (about 1500 words)
  const MAX_CHARS = 2000
  const truncatedText = text.length > MAX_CHARS 
    ? text.substring(0, MAX_CHARS) + "..." 
    : text
  
  try {
    const { object } = await generateObject({
      model: groq('llama3-70b-8192'),
      schema: z.object({ sentiment: z.enum(['positive', 'negative', 'neutral']) }),
      prompt: `Analyze the sentiment of the following text and respond with ONLY one of these exact words: "positive", "negative", or "neutral".      
        Text to analyze: "${truncatedText}"

        Your response should follow this format exactly:
        {"sentiment": "positive"} or {"sentiment": "negative"} or {"sentiment": "neutral"}`,
      temperature: 0.1,
      max_retries: 3,
    })
    
    return object.sentiment
  } catch (error) {
    console.error("Error analyzing sentiment:", error)
    // Default to neutral if analysis fails
    return 'neutral'
  }
}

// Helper function to generate trend points from search results
function generateTrendPoints(xResults: any[]): { date: string; value: number }[] {
  // For now, generate mock trend data
  // In a real implementation, you'd extract actual dates from the posts
  return Array.from({ length: Math.min(xResults.length, 7) }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 30 + Math.floor(Math.random() * 70), // Random value between 30-100
  })).reverse() // Reverse to show oldest to newest
}

// Edge Function handler for direct invocation

serve(async (req) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  })

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const { user_id, query } = await req.json()
    
    if (!user_id || !query) {
      return new Response(
        JSON.stringify({ error: 'user_id and query are required' }),
        { status: 400, headers }
      )
    }

    const results = await voyagerAnalysis(user_id, query)
    
    return new Response(
      JSON.stringify(results),
      { headers }
    )
  } catch (error) {
    console.error('Error in voyagerAnalysis edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
})



// DeepFocus: Analysis with gemma2 and llama-3.3 - Optimized
export async function deepFocusAnalysis(
  user_id: string, 
  query: string, 
  mode_id: string = uuidv4(),
  search_id: string = uuidv4()
): Promise<SearchResults> {
  const models = [
    { model: groq('gemma2-9b-it'), name: 'Gemma 2 9B' },
    { model: groq('llama-3.3-70b-versatile'), name: 'Llama 3.3 70B' }
  ]
  
  const rankings: AIRanking[] = []
  const recommendations: Recommendations = {
    id: uuidv4(),
    brand_id: "",
    mode_id: mode_id,
    query: query,
    type: `Recommendation for Brand`,
    suggestion: '',
    reasoning: '',
    priority: 1,
    created_at: new Date().toISOString(),
  }

  try {
    const formattedPrompt = BRAND_RANKING_PROMPT.replace('{query}', query)
    const responseSchema = z.object({ 
      brands: z.array(z.object({
        name: z.string(),
        rank: z.number().nullable(),
        score: z.number(),
        reasoning: z.string()
      }))
    })

    // Run all model queries in parallel
    const modelPromises = models.map(({ model, name }) => 
      generateObject({
        model,
        schema: responseSchema,
        prompt: formattedPrompt,
      }).then(response => ({ response, name }))
    )

    // Wait for all model responses
    const modelResults = await Promise.all(modelPromises)
    
    // Process results
    for (const { response, name } of modelResults) {
      for (const brand of response.object.brands) {
        rankings.push({
          id: uuidv4(),
          entity_id: uuidv4(),
          entity_name: brand.name,
          entity_type: 'brand',
          user_id,
          llm_name: name,
          query,
          rank: brand.rank,
          score: brand.score,
          reasoning: brand.reasoning,
          mode: 'DeepFocus',
          mode_id,
          analyzed_at: new Date().toISOString(),
        })
      }
    }

    
    return {
      search_id,
      mode: 'DeepFocus',
      mode_id,
      ai_rankings: rankings,
      recommendations
    }
  } catch (error) {
    console.error("Error in deepFocusAnalysis:", error)
    throw error
  }
}

// Function to generate top brands in an industry
export async function generateTopBrands(industry: string): Promise<Brand[]> {
  try {
    const model = groq('llama-3.3-70b-versatile')
    const prompt = BRAND_GENERATION_PROMPT.replace('{industry}', industry) + 
      "\n\nThe response should be a valid JSON array of objects, with each object having 'name' and 'description' fields."
    
    const { object } = await generateObject({
      model,
      schema: z.array(z.object({
        name: z.string(),
        description: z.string()
      })),
      prompt,
      max_retries: 3,
      temperature: 0.1,
    })
    
    return object
  } catch (error) {
    console.error("Error in generateTopBrands:", error)
    throw error
  }
}

// Edge Function handler for direct invocation

serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  })

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const { pathname } = new URL(req.url)
    
    // Handle generateTopBrands endpoint
    if (pathname.endsWith('/generate-brands')) {
      const { industry } = await req.json()
      if (!industry) {
        return new Response(
          JSON.stringify({ error: 'Industry parameter is required' }),
          { status: 400, headers }
        )
      }
      
      const brands = await generateTopBrands(industry)
      return new Response(JSON.stringify(brands), { headers })
}

    // Handle deepFocusAnalysis endpoint
    const { user_id, query } = await req.json()
    
    if (!user_id || !query) {
      return new Response(
        JSON.stringify({ error: 'user_id and query are required' }),
        { status: 400, headers }
      )
    }

    const results = await deepFocusAnalysis(user_id, query)
    
    return new Response(
      JSON.stringify(results),
      { headers }
    )
  } catch (error) {
    console.error('Error in deepFocusAnalysis edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
})




// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SB_BRAND_URL') ?? '',
  Deno.env.get('SB_BRAND_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false
    }
  }
)

// Save search results to Supabase
export async function saveToSupabase(results: SearchResults, user_id: string): Promise<void> {
  try {
    // First, create brand records for each brand in the rankings
    const brandPromises = results.ai_rankings.map(async (ranking) => {
      const brandName = ranking.entity_name
      
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: brandName,
          industry: 'Technology', // Default industry
          user_id: user_id,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (brandError) {
        console.error('Brand creation error:', brandError)
        throw new Error(`Failed to create brand: ${brandError.message}`)
      }
      return brand.id
    })

    const brandIds = await Promise.all(brandPromises)

    // Transform AI rankings to match the table schema
    const aiRankingsToSave = results.ai_rankings.map((ranking, index) => ({
      id: ranking.id,
      entity_id: brandIds[index].toString(),
      entity_name: ranking.entity_name,
      entity_type: ranking.entity_type || 'brand',
      user_id: ranking.user_id.toString(),
      llm_name: ranking.llm_name || 'groq-llama-3.3-70b-versatile',
      query: ranking.query,
      rank: ranking.rank,
      score: ranking.score,
      mode: results.mode,
      mode_id: results.mode_id.toString(),
      analyzed_at: new Date().toISOString(),
      reasoning: ranking.reasoning,
    }))

    console.log("Saving AI rankings:", aiRankingsToSave.length)

    // Save AI rankings
    const { error: rankingsError } = await supabase
      .from('ai_rankings')
      .insert(aiRankingsToSave)

    if (rankingsError) {
      console.error('AI Rankings save failed:', rankingsError)
      throw new Error(`AI Rankings save failed: ${rankingsError.message}`)
    }

    if (results.recommendations && results.recommendations.suggestion) {
      const { error: recommendationsError } = await supabase
        .from('recommendations')
        .insert(results.recommendations)

      if (recommendationsError) {
        console.error('Recommendations save failed:', recommendationsError)
        throw new Error(`Recommendations save failed: ${recommendationsError.message}`)
      }
    }

    // Save social insights if available
    if (results.social_insights && results.social_insights.length > 0) {
      const socialInsightsToSave = results.social_insights.map((insights, index) => ({
        id: insights.id,
        entity_id: brandIds[index].toString(),
        entity_name: insights.entity_name,
        entity_type: insights.entity_type || 'brand',
        user_id: insights.user_id.toString(),
        search_id: results.mode_id.toString(),
        platform: insights.platform || 'X',
        keyword: insights.keyword || '',
        mention_count: insights.mention_count || 0,
        sentiment: insights.sentiment || 'neutral',
        data_fetched_at: new Date().toISOString(),
        links: insights.links
      }))

      const { error: socialError } = await supabase
        .from('social_insights')
        .insert(socialInsightsToSave)
      
      if (socialError) {
        throw new Error(`Social Insights save failed: ${socialError.message}`)
      }
    }
  } catch (error) {
    console.error('Error in saveToSupabase:', error)
    throw error
  }
}

// Fetch search results by search ID
export async function getSearchResultsBySearchId(search_id: string): Promise<SearchResults | null> {
  try {
    // Get AI rankings
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('ai_rankings')
      .select('*')
      .eq('id', search_id)
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return null
    }
    
    // Get social insights if any
    const { data: insightsData, error: insightsError } = await supabase
      .from('social_insights')
      .select('*')
      .eq('search_id', search_id)
    
    if (insightsError) {
      throw new Error(`Failed to fetch social insights: ${insightsError.message}`)
    }
    
    return {
      search_id,
      mode: rankingsData[0].mode,
      mode_id: rankingsData[0].mode_id,
      ai_rankings: rankingsData as AIRanking[],
      social_insights: insightsData as SocialInsight[],
    }
  } catch (error) {
    console.error('Error in getSearchResultsBySearchId:', error)
    throw error
  }
}

// Fetch results by mode ID
export async function getSearchResultsByModeId(mode_id: string): Promise<SearchResults | null> {
  try {
    // Get all AI rankings with this mode_id
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('ai_rankings')
      .select('*')
      .eq('mode_id', mode_id)
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return null
    }
    
    // Get social insights if any
    const { data: insightsData } = await supabase
      .from('social_insights')
      .select('*')
      .eq('search_id', rankingsData[0].id)
    
    return {
      search_id: rankingsData[0].id,
      mode: rankingsData[0].mode,
      mode_id,
      ai_rankings: rankingsData as AIRanking[],
      social_insights: insightsData as SocialInsight[] || [],
    }
  } catch (error) {
    console.error('Error in getSearchResultsByModeId:', error)
    throw error
  }
}

// Fetch all search results for a user
export async function getUserSearchResults(user_id: string): Promise<SearchResults[]> {
  try {
    // Get all AI rankings for this user
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('ai_rankings')
      .select('*')
      .eq('user_id', user_id)
      .order('analyzed_at', { ascending: false })
    
    if (rankingsError || !rankingsData || rankingsData.length === 0) {
      return []
    }
    
    // Group rankings by mode_id
    const modeGroups = rankingsData.reduce((acc, ranking) => {
      if (!acc[ranking.mode_id]) {
        acc[ranking.mode_id] = []
      }
      acc[ranking.mode_id].push(ranking)
      return acc
    }, {} as Record<string, AIRanking[]>)
    
    // Create SearchResults for each mode group
    return Object.entries(modeGroups).map(([mode_id, rankings]): SearchResults => {
      const firstRanking = rankings[0] as AIRanking
      return {
        search_id: firstRanking.id,
        mode: firstRanking.mode as AnalysisMode,
        mode_id,
        ai_rankings: rankings as AIRanking[],
        social_insights: [], // Would need to fetch separately if needed
      }
    })
  } catch (error) {
    console.error('Error in getUserSearchResults:', error)
    throw error
  }
}

// Edge Function handler for direct invocation if needed

serve(async (req) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })

  const { searchParams } = new URL(req.url);
  const mode_id = searchParams.get('mode_id');
  const user_id = searchParams.get('user_id');

  try {

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

     let results;
    if (mode_id) {
      results = await getSearchResultsByModeId(mode_id);
    } else if (user_id) {
      results = await getUserSearchResults(user_id);
    }

    if (!results) {
      return new Response(JSON.stringify({ error: 'Not found' }), { headers })
    }

    return new Response(JSON.stringify(results || { error: 'Not found' }), { headers })
  } catch (error) {
    console.error('Error in supabaseUtils edge function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    )
  }
})


