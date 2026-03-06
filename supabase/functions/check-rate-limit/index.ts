import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMIT = 5        // max submissions
const WINDOW = 60      // minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'No action provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get IP from request headers
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const windowStart = new Date(Date.now() - WINDOW * 60 * 1000).toISOString()

    // Count submissions from this IP for this action in the last hour
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('action', action)
      .gte('created_at', windowStart)

    if (countError) throw countError

    if (count !== null && count >= LIMIT) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: `Too many submissions. Please try again in an hour.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Log this submission
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({ ip_address: ip, action })

    if (insertError) throw insertError

    // Clean up old entries while we're here
    await supabase.rpc('delete_old_rate_limits')

    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    console.error(err)
    // Fail open — do not block legitimate users on unexpected errors
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})