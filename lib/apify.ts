const APIFY_TOKEN = process.env.APIFY_TOKEN!

export interface ApifyRunOptions {
  actorId: string
  input: Record<string, any>
}

export async function runApifyActor({ actorId, input }: ApifyRunOptions) {
  const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getApifyRunStatus(runId: string) {
  const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
  
  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getApifyDataset(datasetId: string) {
  const response = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`)
  
  if (!response.ok) {
    throw new Error(`Apify API error: ${response.statusText}`)
  }

  return response.json()
}

// LinkedIn Scraper
export async function scrapeLinkedInProfiles(searchUrl: string) {
  return runApifyActor({
    actorId: process.env.APIFY_ACTOR_ID_LINKEDIN!,
    input: {
      searchUrl,
      maxResults: 100,
    },
  })
}

// Email Validator
export async function validateEmails(emails: string[]) {
  return runApifyActor({
    actorId: process.env.APIFY_ACTOR_ID_VALIDATOR!,
    input: {
      emails,
    },
  })
}

// Google Maps Scraper
export async function scrapeGoogleMaps(query: string, location: string) {
  return runApifyActor({
    actorId: process.env.APIFY_ACTOR_ID_GMAPS!,
    input: {
      searchString: query,
      locationQuery: location,
      maxCrawledPlaces: 100,
    },
  })
}
