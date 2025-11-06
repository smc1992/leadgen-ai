# Emex Leadgen Tool - Setup Guide

## Overview

The Emex Leadgen Tool is a comprehensive lead generation platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. This guide will help you set up the development environment and configure all necessary services.

## Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**
- **Supabase** account
- **Apify** account (for scraping)
- **Instantly.ai** account (for email campaigns)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd emex-dashboard
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

### 4. Configure Environment Variables

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apify Configuration
APIFY_TOKEN=your-apify-token
APIFY_ACTOR_ID_LINKEDIN=supreme_coder/linkedin-profile-scraper
APIFY_ACTOR_ID_VALIDATOR=anchor/email-check-verify-validate
APIFY_ACTOR_ID_GMAPS=compass/crawler-google-places

# Instantly.ai Configuration
INSTANTLY_API_KEY=your-instantly-api-key

# Additional Services (Optional)
BLOTATO_API_KEY=your-blotato-key
KIE_API_KEY=your-kie-key
OPENAI_API_KEY=your-openai-key
```

### 5. Supabase Database Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and keys

2. **Run the database schema**
   - Open the SQL Editor in your Supabase dashboard
   - Copy and paste the entire contents of `supabase-schema.sql`
   - Execute the SQL script

3. **Verify setup**
   - The schema will create:
     - Database tables: `leads`, `campaigns`, `email_templates`, `email_sequences`, `knowledge_bases`
     - Storage buckets: `knowledge-bases`, `media`
     - Row Level Security policies
     - Functions and triggers

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3003`

## Detailed Configuration

### Supabase Setup

#### 1. Project Creation

1. Sign in to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: "Emex Leadgen Tool"
5. Set a strong database password
6. Choose a region close to your users
7. Click "Create new project"

#### 2. Get API Keys

1. Go to Project Settings → API
2. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Database Schema

Run the complete schema from `supabase-schema.sql`:

```sql
-- This will create:
-- ✅ Tables: leads, campaigns, email_templates, email_sequences, knowledge_bases
-- ✅ Storage buckets: knowledge-bases, media
-- ✅ RLS policies for user isolation
-- ✅ Functions for scoring and timestamps
-- ✅ Triggers for updated_at columns
```

#### 4. Authentication Setup

1. Go to Authentication → Settings
2. Configure your site URL: `http://localhost:3003`
3. Enable email/password authentication
4. Optionally enable Google OAuth:
   - Add your Google Client ID and Secret
   - Add redirect URL: `http://localhost:3003/api/auth/callback/google`

### External Services Setup

#### Apify (Lead Scraping)

1. Sign up at [apify.com](https://apify.com)
2. Go to Account → Integrations → API
3. Copy your API token → `APIFY_TOKEN`
4. Recommended actors (already configured):
   - LinkedIn: `supreme_coder/linkedin-profile-scraper`
   - Google Maps: `compass/crawler-google-places`
   - Email Validator: `anchor/email-check-verify-validate`

#### Instantly.ai (Email Campaigns)

1. Sign up at [instantly.ai](https://instantly.ai)
2. Go to Settings → API Keys
3. Generate API key → `INSTANTLY_API_KEY`
4. Configure your sending domain and email accounts

#### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3003/api/auth/callback/google`
5. Copy Client ID and Client Secret

### NextAuth.js Configuration

The authentication is already configured in `lib/auth.ts`. It includes:

- Email/password authentication
- Google OAuth (optional)
- Session management
- User database sync with Supabase

## Development Workflow

### 1. Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run db:push      # Push schema changes (if using Prisma)
npm run db:studio    # Open database studio (if using Prisma)
```

### 2. Project Structure

```
emex-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── leads/         # Leads management
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── scrape/        # Apify integration
│   │   ├── email/         # Instantly integration
│   │   └── outreach/      # Templates & knowledge base
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── leads-management.tsx
│   ├── campaign-management.tsx
│   ├── real-analytics.tsx
│   └── modern-chatbot.tsx
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── auth.ts           # NextAuth configuration
│   └── supabase-storage.ts
├── docs/                  # Documentation
├── public/               # Static assets
└── supabase-schema.sql   # Database schema
```

### 3. Component Development

All components use:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for base components
- **Lucide React** for icons

Example component structure:

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyComponent() {
  const [data, setData] = useState([])

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Component</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  )
}
```

### 4. API Development

API routes follow Next.js 13+ app directory structure:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // API logic here
  return NextResponse.json({ data: 'success' })
}
```

## Testing

### 1. Unit Tests

Tests are written with Jest and located in `__tests__` directories:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only API tests
npm run test:api
```

### 2. Test Structure

```typescript
// app/api/leads/__tests__/route.test.ts
import { describe, it, expect } from '@jest/globals'
import { GET, POST } from '../route'

describe('/api/leads', () => {
  it('should return leads data', async () => {
    // Test implementation
  })
})
```

### 3. Mock Configuration

Tests use Jest mocks for external dependencies:
- NextAuth session mocking
- Supabase client mocking
- External API mocking

## Deployment

### 1. Environment Setup

Create production environment variables:

```env
# Production URLs
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Production keys (use secret management)
SUPABASE_SERVICE_ROLE_KEY=production-service-key
NEXTAUTH_SECRET=production-secret

# External service keys
APIFY_TOKEN=production-apify-token
INSTANTLY_API_KEY=production-instantly-key
```

### 2. Build Process

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### 3. Deployment Platforms

#### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Self-hosted

```bash
# Build and run
npm run build
npm run start

# Or with PM2
pm2 start npm --name "emex-dashboard" -- start
```

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors

**Error:** `supabaseKey is required`
**Solution:** Check environment variables in `.env.local`

```bash
# Verify variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 2. Authentication Issues

**Error:** `Unauthorized` responses
**Solution:** 
- Verify NextAuth configuration
- Check session cookies
- Ensure `NEXTAUTH_SECRET` is set

#### 3. Database Schema Issues

**Error:** `Table does not exist`
**Solution:**
- Run the complete `supabase-schema.sql`
- Verify all tables are created
- Check RLS policies

#### 4. External API Issues

**Error:** `External API error`
**Solution:**
- Verify API tokens are valid
- Check service account permissions
- Review rate limits

### Debug Mode

Enable debug logging:

```typescript
// In development, add to API routes
console.log('Debug info:', { session, params, body })
```

### Health Checks

Test your setup:

```bash
# Test Supabase connection
curl http://localhost:3003/api/test-supabase

# Test authentication
curl http://localhost:3003/api/auth/session

# Test API endpoints
curl http://localhost:3003/api/analytics
```

## Best Practices

### 1. Security

- Never expose service role keys in client code
- Use environment variables for all secrets
- Implement proper RLS policies in Supabase
- Validate all user inputs
- Use HTTPS in production

### 2. Performance

- Implement pagination for large datasets
- Use React.memo for component optimization
- Leverage Supabase indexing
- Optimize images and assets
- Use caching strategies

### 3. Code Quality

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document API endpoints
- Use meaningful variable names

### 4. Database

- Use proper indexing for query optimization
- Implement backup strategies
- Monitor database performance
- Use connection pooling
- Regular maintenance

## Support

For additional help:

1. **Documentation:** Check the [API Documentation](./API.md)
2. **Issues:** Create GitHub issues for bugs
3. **Community:** Join our Discord/Slack community
4. **Email:** Contact support@emex.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
