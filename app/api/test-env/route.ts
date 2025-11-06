// Test environment variables
export async function GET() {
  const env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    ALL_ENV: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('NEXTAUTH'))
  }
  
  return Response.json(env)
}
