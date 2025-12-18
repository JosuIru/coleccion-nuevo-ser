// ═══════════════════════════════════════════════════════════════════════════════
// AI PROXY - Supabase Edge Function
// Permite a usuarios Premium/Pro usar Claude API sin su propia key
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Costos por modelo (créditos)
const MODEL_COSTS: Record<string, number> = {
  'claude-sonnet-4-20250514': 1,
  'claude-3-5-sonnet-20241022': 1,
  'claude-3-5-haiku-20241022': 1,
  'claude-3-opus-20240229': 3, // Más caro
  'default': 1
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from environment
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, ai_credits_remaining, ai_credits_total')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check subscription tier
    const allowedTiers = ['premium', 'pro']
    if (!allowedTiers.includes(profile.subscription_tier)) {
      return new Response(
        JSON.stringify({
          error: 'Premium or Pro subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
          currentTier: profile.subscription_tier
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const model = body.model || 'claude-3-5-sonnet-20241022'

    // Calculate credit cost
    const creditCost = MODEL_COSTS[model] || MODEL_COSTS['default']

    // Check credits
    if (profile.ai_credits_remaining < creditCost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          code: 'NO_CREDITS',
          creditsRemaining: profile.ai_credits_remaining,
          creditCost: creditCost
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: body.max_tokens || 1024,
        messages: body.messages,
        system: body.system || undefined,
        temperature: body.temperature || 0.7
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: claudeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeResponse.json()

    // Deduct credits
    const newCredits = profile.ai_credits_remaining - creditCost
    await supabase
      .from('profiles')
      .update({ ai_credits_remaining: newCredits })
      .eq('id', user.id)

    // Log activity
    await supabase
      .from('ai_activity_log')
      .insert({
        user_id: user.id,
        feature: 'ai_chat',
        model: model,
        credits_used: creditCost,
        metadata: {
          input_tokens: claudeData.usage?.input_tokens || 0,
          output_tokens: claudeData.usage?.output_tokens || 0
        }
      })

    // Return response with credit info
    return new Response(
      JSON.stringify({
        ...claudeData,
        _credits: {
          used: creditCost,
          remaining: newCredits,
          total: profile.ai_credits_total
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
