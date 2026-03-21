import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS = {
  shortlisted: 'You have been shortlisted — OkeOgunJobs',
  accepted:    'Congratulations! Your application was accepted — OkeOgunJobs',
  rejected:    'Update on your application — OkeOgunJobs',
}

const EMAIL_BODIES = {
  shortlisted: (name: string, jobTitle: string, orgName: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">

  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
  </div>

  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>

    <p style="font-size: 15px;">
      Good news. Your application for <strong>${jobTitle}</strong> at <strong>${orgName}</strong> has been shortlisted.
    </p>

    <p style="font-size: 15px;">
      The employer may contact you soon to discuss next steps. Make sure your phone is reachable.
    </p>

    <div style="background-color: #e0f2fe; border-left: 4px solid #0369a1; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #0369a1; font-weight: 600;">
        📋 Status: Shortlisted
      </p>
    </div>

    <p style="font-size: 13px; color: #888;">
      Log in to your OkeOgunJobs profile to see all your application updates.
    </p>

    <a href="https://okeogunjobs.vercel.app/profile"
       style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View My Applications
    </a>

    <p style="font-size: 12px; color: #aaa; margin-top: 28px;">
      This message was sent by OkeOgunJobs on behalf of ${orgName}.
      You are receiving this because you applied for a job on OkeOgunJobs.
    </p>
  </div>

</body>
</html>
  `.trim(),

  accepted: (name: string, jobTitle: string, orgName: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">

  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
  </div>

  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>

    <p style="font-size: 15px;">
      Congratulations. Your application for <strong>${jobTitle}</strong> at <strong>${orgName}</strong> has been accepted.
    </p>

    <p style="font-size: 15px;">
      Expect a call or message from the employer soon. Keep your phone available.
    </p>

    <div style="background-color: #e8f5ee; border-left: 4px solid #1a6b3c; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #1a6b3c; font-weight: 600;">
        ✅ Status: Accepted
      </p>
    </div>

    <p style="font-size: 13px; color: #888;">
      Log in to your OkeOgunJobs profile to see all your application updates.
    </p>

    <a href="https://okeogunjobs.vercel.app/profile"
       style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View My Applications
    </a>

    <p style="font-size: 12px; color: #aaa; margin-top: 28px;">
      This message was sent by OkeOgunJobs on behalf of ${orgName}.
      You are receiving this because you applied for a job on OkeOgunJobs.
    </p>
  </div>

</body>
</html>
  `.trim(),

  rejected: (name: string, jobTitle: string, orgName: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">

  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
  </div>

  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>

    <p style="font-size: 15px;">
      Thank you for applying for <strong>${jobTitle}</strong> at <strong>${orgName}</strong>.
      Unfortunately, your application was not successful this time.
    </p>

    <p style="font-size: 15px;">
      Do not be discouraged. New jobs are added regularly on OkeOgunJobs — keep checking and applying.
    </p>

    <div style="background-color: #fff8e1; border-left: 4px solid #b45309; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #b45309; font-weight: 600;">
        ℹ️ Status: Not successful
      </p>
    </div>

    <a href="https://okeogunjobs.vercel.app/jobs"
       style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Browse More Jobs
    </a>

    <p style="font-size: 12px; color: #aaa; margin-top: 28px;">
      This message was sent by OkeOgunJobs on behalf of ${orgName}.
      You are receiving this because you applied for a job on OkeOgunJobs.
    </p>
  </div>

</body>
</html>
  `.trim(),
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { seekerEmail, seekerName, jobTitle, orgName, newStatus } = await req.json()

    // Validate required fields
    if (!seekerEmail || !seekerName || !jobTitle || !orgName || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['shortlisted', 'accepted', 'rejected'].includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const subject = EMAIL_SUBJECTS[newStatus]
    const html = EMAIL_BODIES[newStatus](seekerName, jobTitle, orgName)

    // Send email via Supabase Auth admin
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: seekerEmail,
    })

    // Use Supabase's internal SMTP directly via fetch to the Auth API
    const emailResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`,
        },
        body: JSON.stringify({
          to: seekerEmail,
          subject,
          html,
        }),
      }
    )

    if (!emailResponse.ok) {
      // Supabase Auth admin email endpoint may not be available on free tier
      // Fall back: log and return success anyway so the UI is not blocked
      console.error('Email send failed:', await emailResponse.text())
      return new Response(
        JSON.stringify({ success: false, reason: 'email_unavailable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
