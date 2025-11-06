import { Resend } from 'resend'

// Lazily initialize Resend client to avoid build-time errors when key is missing
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Do not throw at import time; return null and handle gracefully in sendEmail
    return null
  }
  return new Resend(apiKey)
}

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  tags?: { name: string; value: string }[]
}

export interface EmailTrackingData {
  campaignId: string
  leadId: string
  templateId?: string
  userId: string
}

/**
 * Send an email with tracking capabilities
 */
export async function sendEmail(options: EmailOptions, trackingData?: EmailTrackingData) {
  try {
    const from = options.from || process.env.EMAIL_FROM || 'onboarding@resend.dev'
    
    // Add tracking headers if tracking data is provided
    const headers = {
      ...options.headers,
      ...(trackingData && {
        'X-Campaign-ID': trackingData.campaignId,
        'X-Lead-ID': trackingData.leadId,
        'X-User-ID': trackingData.userId,
      })
    }

    // Add tracking pixel to HTML
    let html = options.html
    if (trackingData) {
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/outreach/track/open?campaignId=${trackingData.campaignId}&leadId=${trackingData.leadId}" width="1" height="1" style="display:none" />`
      html = html + trackingPixel
    }

    // Send email via Resend
    const resend = getResendClient()
    if (!resend) {
      throw new Error('Resend API key missing. Set RESEND_API_KEY to enable email sending.')
    }
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      headers,
      tags: options.tags,
    })

    if (error) {
      console.error('Email send error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return {
      success: true,
      messageId: data?.id,
      data
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send bulk emails with rate limiting
 */
export async function sendBulkEmails(
  emails: EmailOptions[],
  trackingData?: EmailTrackingData[],
  options?: {
    batchSize?: number
    delayMs?: number
  }
) {
  const batchSize = options?.batchSize || 10
  const delayMs = options?.delayMs || 1000
  
  const results = []
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const batchTracking = trackingData?.slice(i, i + batchSize)
    
    const batchPromises = batch.map((email, index) =>
      sendEmail(email, batchTracking?.[index])
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults)
    
    // Delay between batches to avoid rate limiting
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

/**
 * Replace template variables in email content
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  })
  
  return result
}

/**
 * Generate tracking links for email content
 */
export function addTrackingToLinks(
  html: string,
  campaignId: string,
  leadId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  
  // Replace all href attributes with tracking URLs
  return html.replace(
    /href="([^"]+)"/g,
    (match, url) => {
      if (url.startsWith('http') || url.startsWith('https')) {
        const trackingUrl = `${baseUrl}/api/outreach/track/click?campaignId=${campaignId}&leadId=${leadId}&url=${encodeURIComponent(url)}`
        return `href="${trackingUrl}"`
      }
      return match
    }
  )
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Extract email from string (e.g., "John Doe <john@example.com>")
 */
export function extractEmail(emailString: string): string {
  const match = emailString.match(/<([^>]+)>/)
  return match ? match[1] : emailString
}
