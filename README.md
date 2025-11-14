# Emex Leadgen Tool - Complete Lead Generation Platform

A comprehensive lead generation platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **Lead Management**: Complete CRUD operations with advanced filtering and scoring
- **Email Campaigns**: Create, launch, and track email campaigns with real-time analytics
- **AI-Powered Chatbot**: Modern chat interface for assistance and insights
- **Real Analytics**: Live dashboard with actual data from Supabase
- **Knowledge Base**: Document management with AI-powered content generation

### Integrations
- **Supabase**: Database, authentication, and file storage
- **Apify**: LinkedIn, Google Maps, and email validation scraping
- **Instantly.ai**: Professional email campaign delivery
- **NextAuth.js**: Secure authentication with multiple providers

### Technical Features
- **TypeScript**: Full type safety across the application
- **Responsive Design**: Mobile-first with Tailwind CSS
- **API Testing**: Comprehensive test suite with Jest
- **Documentation**: Complete API and setup documentation
- **Modern UI**: Beautiful, responsive design with shadcn-ui components

## 📦 Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: TailwindCSS v4 + shadcn-ui
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State**: Zustand
- **APIs**: Apify, Instantly, Blotato

## 🛠️ Setup

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp env.example .env.local
```

Edit `.env.local` with your API keys:
- Supabase URL and Anon Key
- Apify Token
- Instantly API Key
 - Blotato API Key

### Blotato Setup

- Add `BLOTATO_API_KEY` to `.env.local` (local) and Hosting (Netlify/Vercel) environment.
- Upload media first via Blotato CDN (`/v2/media`), then use returned `https://database.blotato.com/...` URLs in posts (`/v2/posts`).
- See detailed guide: `BLOTATO-API-COMPLETE.md` (Publishing, Upload Media, Create/Find/Delete Video, Rate Limits).

3. **Set up Supabase database**:

Create the following tables in your Supabase project:
- `leads`
- `emails`
- `campaigns`
- `scrape_runs`
- `content_items`

Refer to `supabase.md` for detailed schema.

4. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📁 Project Structure

```
emex-dashboard/
├── app/
│   ├── (dashboard)/          # Dashboard routes
│   │   ├── page.tsx          # Overview
│   │   ├── leads/            # Lead management
│   │   ├── outreach/         # Email campaigns
│   │   ├── content/          # Content library
│   │   ├── analytics/        # Analytics & charts
│   │   └── calendar/         # Content calendar
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn-ui components
│   └── app-sidebar.tsx       # Main navigation
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── apify.ts              # Apify integration
│   ├── instantly.ts          # Instantly API
│   ├── blotato-api.ts        # Blotato API v2 client (production)
│   ├── blotato.ts            # Deprecated mock (use blotato-api.ts)
│   └── scoring.ts            # Lead scoring logic
└── env.example               # Environment template
```

## 🔑 Key Features

### Lead Management
- Import leads from LinkedIn and Google Maps via Apify
- Automatic email validation
- Smart scoring algorithm (0-100)
- Filter by region, status, and score
- Export/import CSV

### Email Outreach
- Create multi-step campaigns
- Domain rotation
- Track opens, clicks, replies
- Bounce management
- Integration with Instantly

### Content Automation
- AI text generation with Blotato
- Video content creation
- Multi-platform scheduling (LinkedIn, Facebook, Instagram, TikTok)
- Engagement tracking

### Analytics
- Lead acquisition trends
- Campaign performance metrics
- Content engagement rates
- Regional distribution

## 🚢 Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure to add all environment variables in Vercel dashboard.

## 📚 Documentation

- [setup.md](../setup.md) - Project initialization
- [leads.md](../leads.md) - Lead data model
- [emails.md](../emails.md) - Email outreach
- [content.md](../content.md) - Content automation
- [analytics.md](../analytics.md) - KPIs & tracking
- [supabase.md](../supabase.md) - Database structure

## 👥 Maintainer

Emex Express Growth Team • October 2025
