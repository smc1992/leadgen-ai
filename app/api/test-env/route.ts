// Test environment variables
export async function GET() {
  const env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ? 'SET' : 'MISSING',
    APIFY_TOKEN: process.env.APIFY_TOKEN ? 'SET' : 'MISSING',
    BLOTATO_API_KEY: process.env.BLOTATO_API_KEY ? 'SET' : 'MISSING',
    ALL_ENV: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('NEXTAUTH'))
  }
  
  return Response.json(env)
}
