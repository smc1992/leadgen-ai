import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOW_DEV_CREDENTIALS: z.string().optional(),
  PIPEDRIVE_API_TOKEN: z.string().optional(),
  PIPEDRIVE_COMPANY_DOMAIN: z.string().optional(),
  PIPEDRIVE_WEBHOOK_SECRET: z.string().optional(),
  INSTANTLY_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

function isLikelyJwt(v: string | undefined) {
  return !!v && v.includes('.') && v.length > 20
}

let env: z.infer<typeof EnvSchema>
{
  const initial = EnvSchema.safeParse(process.env)
  if (initial.success) {
    env = initial.data
  } else {
    const isDev = (process.env.NODE_ENV || 'development') !== 'production'
    if (!isDev) {
      const issues = initial.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      throw new Error(`Ungültige Umgebungsvariablen: ${issues}`)
    }
    const merged = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      ALLOW_DEV_CREDENTIALS: process.env.ALLOW_DEV_CREDENTIALS,
      PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN,
      PIPEDRIVE_COMPANY_DOMAIN: process.env.PIPEDRIVE_COMPANY_DOMAIN,
      PIPEDRIVE_WEBHOOK_SECRET: process.env.PIPEDRIVE_WEBHOOK_SECRET,
      INSTANTLY_API_KEY: process.env.INSTANTLY_API_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      GOOGLE_MODEL: process.env.GOOGLE_MODEL,
    }
    const reparse = EnvSchema.safeParse({ NODE_ENV: 'development', ...merged })
    if (!reparse.success) {
      const issues = reparse.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      throw new Error(`Ungültige Umgebungsvariablen: ${issues}`)
    }
    env = reparse.data
  }
}

if (env.NODE_ENV === 'production') {
  const supabaseEnabled = Boolean(env.NEXT_PUBLIC_SUPABASE_URL)
  if (supabaseEnabled) {
    const anonValid = isLikelyJwt(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const serviceValid = isLikelyJwt(env.SUPABASE_SERVICE_ROLE_KEY)
    if (!anonValid || !serviceValid) {
      
    }
  }
}

export const config = {
  nodeEnv: env.NODE_ENV,
  appUrl: env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  allowDevCredentials: env.ALLOW_DEV_CREDENTIALS === 'true',
  pipedriveApiToken: env.PIPEDRIVE_API_TOKEN,
  pipedriveCompanyDomain: env.PIPEDRIVE_COMPANY_DOMAIN,
  pipedriveWebhookSecret: env.PIPEDRIVE_WEBHOOK_SECRET,
  instantlyApiKey: env.INSTANTLY_API_KEY,
  sentryDsn: env.SENTRY_DSN,
  openaiApiKey: env.OPENAI_API_KEY,
  openaiModel: env.OPENAI_MODEL || 'gpt-4o',
  googleApiKey: env.GOOGLE_API_KEY,
  googleModel: env.GOOGLE_MODEL,
  cronSecret: env.CRON_SECRET,
}

export type AppConfig = typeof config
