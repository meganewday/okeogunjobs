import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
}

function buildDigestEmail(jobs: any[], unsubscribeUrl: string): string {
  const jobRows = jobs.map(job => `
    <div style="background:#fff;border:1px solid #e0ede6;border-radius:8px;padding:16px 18px;margin-bottom:12px;">
      <p style="font-size:15px;font-weight:700;color:#1a6b3c;margin:0 0 4px 0;">${job.job_title}</p>
      <p style="font-size:13px;color:#555;margin:0 0 8px 0;">
        ${job.employers?.organization_name || 'Employer'} &mdash; ${job.lga || job.location || 'Oke-Ogun'}
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${job.job_type ? `<span style="font-size:11px;padding:3px 10px;background:#e8f5ee;color:#1a6b3c;border-radius:10px;font-weight:600;">${JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>` : ''}
        ${job.labour_type ? `<span style="font-size:11px;padding:3px 10px;background:#f3f4f6;color:#555;border-radius:10px;">${job.labour_type.charAt(0).toUpperCase() + job.labour_type.slice(1)}</span>` : ''}
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;background:#f5f7f5;">

  <div style="background:#1a6b3c;padding:20px 24px;border-radius:10px 10px 0 0;">
    <h2 style="color:#fff;margin:0;font-size:20px;">OkeOgunJobs</h2>
    <p style="color:rgba(255,255,255,0.75);margin:4px 0 0 0;font-size:13px;">Your Daily Job Alert</p>
  </div>

  <div style="background:#fff;padding:28px 24px;border-radius:0 0 10px 10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

    <p style="font-size:15px;margin:0 0 6px 0;">
      <strong>${jobs.length} new ${jobs.length === 1 ? 'job' : 'jobs'}</strong> posted in Oke-Ogun today.
    </p>
    <p style="font-size:13px;color:#888;margin:0 0 24px 0;">
      Here's what's available right now:
    </p>

    ${jobRows}

    <div style="margin-top:24px;text-align:center;">
      <a href="https://okeogunjobs.com/jobs"
         style="display:inline-block;padding:13px 28px;background:#1a6b3c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Browse All Jobs
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px 0;"/>

    <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
      You are receiving this because you subscribed to job alerts on OkeOgunJobs.<br/>
      <a href="${unsubscribeUrl}" style="color:#aaa;">Unsubscribe</a>
    </p>

  </div>

</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const appUrl = 'https://okeogunjobs.com'

    // Get jobs approved in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('job_listings')
      .select('id, job_title, job_type, labour_type, location, lga, employers(organization_name)')
      .eq('status', 'approved')
      .gte('approved_at', since)
      .order('approved_at', { ascending: false })

    if (jobsError) throw jobsError

    if (!jobs || jobs.length === 0) {
      console.log('No new jobs in last 24 hours — skipping digest')
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'no_new_jobs' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('job_alert_subscribers')
      .select('email, unsubscribe_token')
      .eq('is_active', true)

    if (subError) throw subError

    if (!subscribers || subscribers.length === 0) {
      console.log('No active subscribers')
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'no_subscribers' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send digest to each subscriber
    let sent = 0
    let failed = 0

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${appUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`
      const html = buildDigestEmail(jobs, unsubscribeUrl)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'OkeOgunJobs <hello@okeogunjobs.com>',
          to: [subscriber.email],
          subject: `${jobs.length} new ${jobs.length === 1 ? 'job' : 'jobs'} in Oke-Ogun today`,
          html,
        }),
      })

      if (res.ok) {
        sent++
      } else {
        failed++
        console.error(`Failed to send to ${subscriber.email}:`, await res.text())
      }
    }

    console.log(`Digest sent: ${sent} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({ success: true, sent, failed, jobs: jobs.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Digest function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
