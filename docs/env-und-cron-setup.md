Zweck
- Übersicht der benötigten Umgebungsvariablen und Einrichtung des Cron Schedulers.

App ENV (.env.local)
- NEXT_PUBLIC_APP_URL: Basis-URL der App (z. B. http://localhost:3000)
- NEXT_PUBLIC_SUPABASE_URL: https://ldehgluuoouisrhrsyzh.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY: sb_anon_...
- SUPABASE_SERVICE_ROLE_KEY: sb_service_role_...
- NEXTAUTH_URL: http://localhost:3000 (in Produktion deine Domain)
- NEXTAUTH_SECRET: starkes Secret (≥32 Zeichen)
- EMAIL_FROM: z. B. hello@deine-domain.de
- RESEND_API_KEY: re_...
- APIFY_TOKEN: apify_...
- APIFY_ACTOR_ID_GMAPS: compass/crawler-google-places
- APIFY_ACTOR_ID_LINKEDIN: apimaestro/linkedin-profile-batch-scraper-no-cookies-required
- APIFY_ACTOR_ID_LINKEDIN_SEARCH: curious_coder/linkedin-people-search-scraper
- APIFY_ACTOR_ID_VALIDATOR: anchor/email-check-verify-validate
- APIFY_LINKEDIN_COOKIE: optional, LinkedIn Session Cookies für People/Company Search
- OPENAI_API_KEY: sk-...
- OPENAI_MODEL: gpt-4o
- SENTRY_DSN: optional
- PIPEDRIVE_API_TOKEN: ...
- PIPEDRIVE_COMPANY_DOMAIN: ...
- PIPEDRIVE_WEBHOOK_SECRET: ...
- CRON_SECRET: Secret für geschützte Function-Aufrufe

Supabase Edge Functions ENV (Dashboard → Edge Functions → Settings)
- SUPABASE_URL: https://ldehgluuoouisrhrsyzh.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: sb_service_role_...
- NEXT_PUBLIC_APP_URL: Basis-URL der App
- RESEND_API_KEY: re_...
- EMAIL_FROM: hello@deine-domain.de
- CRON_SECRET: optional

Cron Scheduler Einrichtung (Supabase)
- Function: cron-executor
- Intervall: z. B. */15 * * * * (alle 15 Minuten)
- Header: x-cron-secret: <CRON_SECRET> (falls gesetzt)
- Query: ?limit=50 zur Begrenzung der verarbeiteten Queue-Einträge

Direkte Aufrufe
- Function URL: POST https://ldehgluuoouisrhrsyzh.functions.supabase.co/cron-executor?limit=50
- Header: x-cron-secret: <CRON_SECRET>
- App-Proxy: POST /api/admin/run-cron?limit=50

Automation Trigger (Edge Function)
- Function: automation-trigger
- Body: { "trigger_type": "lead_created"|"deal_stage_changed"|"deal_status_changed", "user_id": "<uuid>", "context": { ... } }
- Header: x-cron-secret: <CRON_SECRET>
- App-Proxy: POST /api/admin/trigger-automation

Sicherheit & Validierung
- CSRF: mutierende API-Requests senden Header x-csrf-token (Wert aus Cookie csrfToken)
- CSP: in next.config auf unsafe-eval verzichten; frame-src/object-src none; upgrade-insecure-requests
- Auth: NEXTAUTH_URL und NEXTAUTH_SECRET setzen, sonst CLIENT_FETCH_ERROR

Empfohlene Entwicklungswerte
- NEXT_PUBLIC_APP_URL=http://localhost:3000
- NEXT_PUBLIC_SUPABASE_URL=https://ldehgluuoouisrhrsyzh.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_anon_...
- SUPABASE_SERVICE_ROLE_KEY=sb_service_role_...
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=dev_super_secret_32_chars_minimum_1234567890abcd
- EMAIL_FROM=hello@localhost.test
- RESEND_API_KEY=re_...
- APIFY_TOKEN=apify_...
- OPENAI_API_KEY=sk-...
- OPENAI_MODEL=gpt-4o
- CRON_SECRET=dev_cron_secret_very_strong

