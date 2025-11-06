const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY!
const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v1'

export interface CreateCampaignParams {
  name: string
  template: string
  domain: string
  followups: number
}

export interface AddLeadsParams {
  campaign_id: string
  leads: Array<{
    email: string
    name: string
    company?: string
  }>
}

export async function createCampaign(params: CreateCampaignParams) {
  const response = await fetch(`${INSTANTLY_BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Instantly API error: ${response.statusText}`)
  }

  return response.json()
}

export async function addLeadsToCampaign(params: AddLeadsParams) {
  const response = await fetch(`${INSTANTLY_BASE_URL}/campaigns/${params.campaign_id}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    },
    body: JSON.stringify({ leads: params.leads }),
  })

  if (!response.ok) {
    throw new Error(`Instantly API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getLeadStatus(leadId: string) {
  const response = await fetch(`${INSTANTLY_BASE_URL}/leads/${leadId}`, {
    headers: {
      'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Instantly API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getCampaignStats(campaignId: string) {
  const response = await fetch(`${INSTANTLY_BASE_URL}/campaigns/${campaignId}/stats`, {
    headers: {
      'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Instantly API error: ${response.statusText}`)
  }

  return response.json()
}
