import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  shortlisted: 'You have been shortlisted — OkeOgunJobs',
  accepted:    'Congratulations! Your application was accepted — OkeOgunJobs',
  rejected:    'Update on your application — OkeOgunJobs',
}

const EMAIL_BODIES: Record<string, (name: string, jobTitle: string, orgName: string) => string> = {
  shortlisted: (name, jobTitle, orgName) => `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">
  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
    <p style="color: rgba(255,255,255,0.75); margin: 4px 0 0 0; font-size: 13px;">Oke-Ogun Job Bank</p>
  </div>
  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 15px;">Good news. Your application for <strong>${jobTitle}</strong> at <strong>${orgName}</strong> has been shortlisted.</p>
    <p style="font-size: 15px;">The employer may contact you soon to discuss next steps. Make sure your phone is reachable.</p>
    <div style="background-color: #e0f2fe; border-left: 4px solid #0369a1; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #0369a1; font-weight: 600;">📋 Status: Shortlisted</p>
    </div>
    <p style="font-size: 13px; color: #888;">Log in to your OkeOgunJobs profile to see all your application updates.</p>
    <a href="https://okeogunjobs.com/profile" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View My Applications</a>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 28px 0 16px 0;" />
    <p style="font-size: 12px; color: #aaa; margin: 0;">This message was sent by OkeOgunJobs on behalf of ${orgName}. You are receiving this because you applied for a job on OkeOgunJobs.</p>
  </div>
</body>
</html>`,

  accepted: (name, jobTitle, orgName) => `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">
  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
    <p style="color: rgba(255,255,255,0.75); margin: 4px 0 0 0; font-size: 13px;">Oke-Ogun Job Bank</p>
  </div>
  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 15px;">Congratulations. Your application for <strong>${jobTitle}</strong> at <strong>${orgName}</strong> has been accepted.</p>
    <p style="font-size: 15px;">Expect a call or message from the employer soon. Keep your phone available.</p>
    <div style="background-color: #e8f5ee; border-left: 4px solid #1a6b3c; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #1a6b3c; font-weight: 600;">✅ Status: Accepted</p>
    </div>
    <p style="font-size: 13px; color: #888;">Log in to your OkeOgunJobs profile to see all your application updates.</p>
    <a href="https://okeogunjobs.com/profile" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View My Applications</a>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 28px 0 16px 0;" />
    <p style="font-size: 12px; color: #aaa; margin: 0;">This message was sent by OkeOgunJobs on behalf of ${orgName}. You are receiving this because you applied for a job on OkeOgunJobs.</p>
  </div>
</body>
</html>`,

  rejected: (name, jobTitle, orgName) => `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222;">
  <div style="background-color: #1a6b3c; padding: 20px 24px; border-radius: 10px 10px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">OkeOgunJobs</h2>
    <p style="color: rgba(255,255,255,0.75); margin: 4px 0 0 0; font-size: 13px;">Oke-Ogun Job Bank</p>
  </div>
  <div style="background-color: #f5f7f5; padding: 28px 24px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 15px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 15px;">Thank you for applying for <strong>${jobTitle}</strong> at <strong>${orgName}</strong>. Unfortunately, your application was not successful this time.</p>
    <p style="font-size: 15px;">Do not be discouraged. New jobs are added regularly on OkeOgunJobs — keep checking and applying.</p>
    <div style="background-color: #fff8e1; border-left: 4px solid #b45309; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #b45309; font-weight: 600;">ℹ️ Status: Not successful</p>
    </div>
    <a href="https://okeogunjobs.com/jobs" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background-color: #1a6b3c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Browse More Jobs</a>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 28px 0 16px 0;" />
    <p style="font-size: 12px; color: #aaa; margin: 0;">This message was sent by OkeOgunJobs on behalf of ${orgName}. You are receiving this because you applied for a job on OkeOgunJobs.</p>
  </div>
</body>
</html>`,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { seekerEmail, seekerName, jobTitle, orgName, newStatus } = await req.json()

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

    const subject = EMAIL_SUBJECTS[newStatus]
    const html = EMAIL_BODIES[newStatus](seekerName, jobTitle, orgName)
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'OkeOgunJobs <hello@okeogunjobs.com>',
        to: [seekerEmail],
        subject,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend send failed:', errorText)
      return new Response(
        JSON.stringify({ success: false, reason: 'email_send_failed', detail: errorText }),
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