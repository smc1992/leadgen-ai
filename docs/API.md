# Emex Leadgen Tool - API Documentation

## Overview

The Emex Leadgen Tool is a comprehensive lead generation platform built with Next.js 14, TypeScript, and Supabase. This API documentation covers all available endpoints for managing leads, campaigns, analytics, and integrations.

## Base URL

```
http://localhost:3003/api
```

## Authentication

All API endpoints require authentication via NextAuth.js. The user must be logged in to access any API endpoint.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `500` - Internal Server Error

---

## Leads API

### Get Leads

Retrieve a paginated list of leads with filtering options.

**Endpoint:** `GET /api/leads`

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 50) - Number of leads per page
- `search` (string) - Search in name, email, or company
- `region` (string) - Filter by region (US, UK, DE, CA, etc.)
- `status` (string) - Filter by email status (valid, invalid, unknown)
- `scoreMin` (number) - Minimum lead score
- `scoreMax` (number) - Maximum lead score
- `outreachReady` (boolean) - Filter by outreach readiness

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "job_title": "CEO",
      "company": "Tech Corp",
      "email": "john@techcorp.com",
      "email_status": "valid",
      "score": 85,
      "region": "US",
      "channel": "linkedin",
      "source_url": "https://linkedin.com/in/johndoe",
      "is_outreach_ready": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Create Leads

Import new leads into the system.

**Endpoint:** `POST /api/leads`

**Request Body:**
```json
{
  "leads": [
    {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "company": "Tech Inc",
      "jobTitle": "CTO"
    }
  ]
}
```

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "company": "Tech Inc",
      "job_title": "CTO",
      "score": 75,
      "is_outreach_ready": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Lead by ID

Retrieve a specific lead by ID.

**Endpoint:** `GET /api/leads/{id}`

**Response:**
```json
{
  "lead": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@techcorp.com",
    "score": 85,
    "is_outreach_ready": true
  }
}
```

### Update Lead

Update an existing lead's information.

**Endpoint:** `PUT /api/leads/{id}`

**Request Body:**
```json
{
  "full_name": "John Updated",
  "email": "john.updated@example.com",
  "job_title": "Senior CEO"
}
```

**Response:**
```json
{
  "lead": {
    "id": "uuid",
    "full_name": "John Updated",
    "email": "john.updated@example.com",
    "job_title": "Senior CEO",
    "score": 90,
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Delete Lead

Delete a lead from the system.

**Endpoint:** `DELETE /api/leads/{id}`

**Response:**
```json
{
  "success": true
}
```

---

## Campaigns API

### Get Campaigns

List all email campaigns.

**Endpoint:** `GET /api/email`

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Q1 Lead Generation",
      "subject": "Introduction to Emex Solutions",
      "template": "Hi {{firstName}}...",
      "status": "active",
      "leads_count": 100,
      "sent_count": 75,
      "opened_count": 30,
      "clicked_count": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Campaign

Create a new email campaign.

**Endpoint:** `POST /api/email`

**Request Body:**
```json
{
  "type": "campaign",
  "data": {
    "name": "Q1 Lead Generation",
    "subject": "Introduction to Emex Solutions",
    "template": "Hi {{firstName}},\n\nI hope this email finds you well...",
    "fromEmail": "campaign@yourcompany.com",
    "replyTo": "support@yourcompany.com"
  }
}
```

**Response:**
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Q1 Lead Generation",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "instantlyCampaign": {
    "id": "instantly-campaign-id"
  }
}
```

### Launch Campaign

Launch an existing campaign.

**Endpoint:** `POST /api/email`

**Request Body:**
```json
{
  "type": "launch",
  "data": {
    "campaignId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

### Add Leads to Campaign

Add leads to an existing campaign.

**Endpoint:** `POST /api/email`

**Request Body:**
```json
{
  "type": "add-leads",
  "data": {
    "campaignId": "uuid",
    "leads": [
      {
        "email": "lead@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "company": "Tech Corp"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "addedCount": 1
}
```

---

## Analytics API

### Get Analytics

Retrieve analytics data for different metrics and time ranges.

**Endpoint:** `GET /api/analytics`

**Query Parameters:**
- `type` (string, default: "overview") - Analytics type (overview, leads, campaigns, performance)
- `timeRange` (string, default: "30d") - Time range (7d, 30d, 90d)

**Response (Overview):**
```json
{
  "analytics": {
    "leads": {
      "total": 150,
      "outreachReady": 100,
      "validEmails": 120,
      "avgScore": 75,
      "growth": "+12.5%"
    },
    "campaigns": {
      "total": 5,
      "active": 3,
      "sent": 500,
      "opened": 200,
      "openRate": 40
    },
    "content": {
      "templates": 10,
      "knowledgeBases": 5
    }
  },
  "timeRange": "30d",
  "type": "overview",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

**Response (Leads):**
```json
{
  "analytics": {
    "scoreDistribution": {
      "high": 50,
      "medium": 75,
      "low": 25
    },
    "emailDistribution": {
      "valid": 120,
      "invalid": 20,
      "unknown": 10
    },
    "regionDistribution": {
      "US": 80,
      "UK": 40,
      "DE": 30
    },
    "channelDistribution": {
      "linkedin": 100,
      "maps": 50
    },
    "dailyTrends": {
      "2024-01-01": 10,
      "2024-01-02": 15
    }
  }
}
```

---

## Scraping API

### Start Scraper

Start a new scraping job with Apify.

**Endpoint:** `POST /api/scrape`

**Request Body:**
```json
{
  "type": "linkedin",
  "params": {
    "profileUrl": "https://linkedin.com/in/johndoe",
    "limit": 50
  }
}
```

**Scraper Types:**
- `linkedin` - LinkedIn profile scraper
- `maps` - Google Maps business scraper
- `validator` - Email validation scraper

**Response:**
```json
{
  "success": true,
  "runId": "run-123",
  "status": "ready",
  "scrapeRun": {
    "id": "run-123",
    "type": "linkedin",
    "status": "running",
    "resultCount": 0,
    "triggeredBy": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Check Scraper Status

Check the status of a scraping job and retrieve results.

**Endpoint:** `GET /api/scrape?runId={runId}`

**Response:**
```json
{
  "runId": "run-123",
  "status": "succeeded",
  "results": [
    {
      "fullName": "John Doe",
      "jobTitle": "CEO",
      "company": "Tech Corp",
      "email": "john@techcorp.com",
      "region": "US",
      "channel": "linkedin",
      "sourceUrl": "https://linkedin.com/in/johndoe"
    }
  ],
  "resultCount": 1
}
```

---

## Templates API

### Get Templates

List all email templates.

**Endpoint:** `GET /api/outreach/templates-supabase`

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Introduction Template",
      "subject": "Introduction to {{company}}",
      "content": "Hi {{firstName}}...",
      "category": "Introduction",
      "variables": ["firstName", "company"],
      "usage_count": 25,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Template

Create a new email template.

**Endpoint:** `POST /api/outreach/templates-supabase`

**Request Body:**
```json
{
  "name": "Follow-up Template",
  "subject": "Following up on our conversation",
  "content": "Hi {{firstName}},\n\nFollowing up on our previous discussion...",
  "category": "Follow-up",
  "variables": ["firstName"]
}
```

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "name": "Follow-up Template",
    "subject": "Following up on our conversation",
    "content": "Hi {{firstName}}...",
    "category": "Follow-up",
    "variables": ["firstName"],
    "usage_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Knowledge Base API

### Get Knowledge Bases

List all knowledge bases.

**Endpoint:** `GET /api/outreach/knowledge-base-supabase`

**Response:**
```json
{
  "knowledgeBases": [
    {
      "id": "uuid",
      "name": "Industry Insights",
      "description": "Latest trends in technology",
      "type": "documents",
      "status": "ready",
      "document_count": 15,
      "size_bytes": 5242880,
      "file_urls": ["https://storage.url/file1.pdf"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Knowledge Base

Create a new knowledge base with file uploads.

**Endpoint:** `POST /api/outreach/knowledge-base-supabase`

**Request Body (multipart/form-data):**
- `name` - Knowledge base name
- `description` - Description
- `files` - File uploads (PDF, DOC, TXT)

**Response:**
```json
{
  "knowledgeBase": {
    "id": "uuid",
    "name": "New Knowledge Base",
    "status": "processing",
    "document_count": 2,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Testing API

### Test Supabase Connection

Test the Supabase connection and verify tables/buckets exist.

**Endpoint:** `GET /api/test-supabase`

**Response:**
```json
{
  "success": true,
  "tables": {
    "email_templates": { "exists": true },
    "email_sequences": { "exists": true },
    "email_campaigns": { "exists": true },
    "knowledge_bases": { "exists": true }
  },
  "storage": {
    "exists": true,
    "buckets": ["knowledge-bases", "media"]
  }
}
```

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider implementing rate limiting for production use.

## SDK Examples

### JavaScript/TypeScript

```typescript
// Get leads with filtering
const response = await fetch('/api/leads?search=john&region=US&limit=20', {
  headers: {
    'Content-Type': 'application/json'
  }
})
const data = await response.json()

// Create new leads
const createResponse = await fetch('/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    leads: [
      {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Tech Inc'
      }
    ]
  })
})

// Get analytics
const analyticsResponse = await fetch('/api/analytics?type=overview&timeRange=30d')
const analytics = await analyticsResponse.json()
```

### cURL Examples

```bash
# Get leads
curl -X GET "http://localhost:3003/api/leads?search=john&limit=10"

# Create leads
curl -X POST "http://localhost:3003/api/leads" \
  -H "Content-Type: application/json" \
  -d '{"leads":[{"fullName":"John Doe","email":"john@example.com"}]}'

# Get analytics
curl -X GET "http://localhost:3003/api/analytics?type=overview"

# Start scraper
curl -X POST "http://localhost:3003/api/scrape" \
  -H "Content-Type: application/json" \
  -d '{"type":"linkedin","params":{"profileUrl":"https://linkedin.com/in/test"}}'
```

---

## Error Codes

| Error Code | Description |
|------------|-------------|
| `UNAUTHORIZED` | User is not authenticated |
| `INVALID_LEADS_DATA` | Leads data is malformed |
| `INVALID_SCRAPER_TYPE` | Scraper type is not supported |
| `CAMPAIGN_NOT_FOUND` | Campaign does not exist |
| `LEAD_NOT_FOUND` | Lead does not exist |
| `STORAGE_ERROR` | File upload/download failed |
| `EXTERNAL_API_ERROR` | External service (Apify/Instantly) error |

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Leads CRUD operations
- Campaign management
- Analytics endpoints
- External API integrations
- Knowledge base management
- Email templates

---

## Support

For API support and questions:
- Check the error messages for detailed information
- Review the authentication requirements
- Verify environment variables are properly set
- Check Supabase connection status using `/api/test-supabase`
