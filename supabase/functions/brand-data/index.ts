/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      throw new Error(`User ID is required, provided ${userId}`)
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SB_BRAND_URL') ?? '',
      Deno.env.get('SB_BRAND_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the brand belongs to the user and has logo_url and website
    const { data: brand, error: brandError } = await supabaseClient
      .from('brands')
      .select('*')
      .eq('user_id', userId)
      .not('logo_url', 'is', null)
      .not('website', 'is', null)
      .single()

    if (brandError || !brand) {
      throw new Error(`Brand not found for user ${userId}`)
    }

    const brandId = brand.id

    // Fetch all data in parallel
    const [
      { data: metrics, error: metricsError },
      { data: competitors, error: competitorsError },
      { data: keywords, error: keywordsError }
    ] = await Promise.all([
      supabaseClient
        .from('brand_metrics')
        .select('*')
        .eq('brand_id', brandId)
        .order('analyzed_at', { ascending: false })
        .limit(1),
      supabaseClient
        .from('competitors')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('keywords')
        .select('*')
        .eq('entity_id', brandId)
        .eq('entity_type', 'brand')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ])

    if (metricsError || competitorsError || keywordsError) {
      throw new Error('Failed to fetch data')
    }

    return new Response(
      JSON.stringify({
        data: {
          brand,
          metrics: metrics?.[0],
          competitors,
          keywords,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 