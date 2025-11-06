import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, replaceTemplateVariables, addTrackingToLinks } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, templateId, leadIds, sendNow = false } = body

    if (!campaignId || !templateId || !leadIds || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Campaign ID, template ID, and lead IDs are required' },
        { status: 400 }
      )
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get template details
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', session.user.id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get leads
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .in('id', leadIds)

    if (leadsError || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 404 })
    }

    const results = []
    let sentCount = 0
    let failedCount = 0

    // Send emails to each lead
    for (const lead of leads) {
      try {
        // Prepare variables for template
        const variables = {
          firstName: lead.full_name?.split(' ')[0] || 'there',
          lastName: lead.full_name?.split(' ').slice(1).join(' ') || '',
          fullName: lead.full_name || 'there',
          company: lead.company || '',
          jobTitle: lead.job_title || '',
          email: lead.email || '',
        }

        // Replace variables in subject and content
        const subject = replaceTemplateVariables(template.subject, variables)
        let html = replaceTemplateVariables(template.content, variables)

        // Add tracking to links
        html = addTrackingToLinks(html, campaignId, lead.id)

        // Convert newlines to <br> tags
        html = html.replace(/\n/g, '<br>')

        // Send email
        const result = await sendEmail(
          {
            to: lead.email,
            subject,
            html,
            from: process.env.EMAIL_FROM,
          },
          {
            campaignId,
            leadId: lead.id,
            templateId,
            userId: session.user.id,
          }
        )

        if (result.success) {
          sentCount++

          // Log email in database (use outreach_emails table)
          await supabaseAdmin.from('outreach_emails').insert({
            user_id: session.user.id,
            campaign_id: campaignId,
            lead_id: lead.id,
            lead_email: lead.email,
            lead_name: lead.full_name,
            template_id: templateId,
            subject,
            content: html,
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_api_id: result.messageId,
          })

          results.push({
            leadId: lead.id,
            email: lead.email,
            status: 'sent',
            messageId: result.messageId,
          })
        } else {
          failedCount++
          results.push({
            leadId: lead.id,
            email: lead.email,
            status: 'failed',
            error: result.error,
          })
        }
      } catch (error) {
        failedCount++
        results.push({
          leadId: lead.id,
          email: lead.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Update campaign statistics
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        sent_count: campaign.sent_count + sentCount,
        status: sendNow ? 'active' : campaign.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: leads.length,
      results,
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
