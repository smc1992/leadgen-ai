import { z } from 'zod'

export const PipedriveConfigSchema = z.object({
  api_token: z.string().min(10),
  company_domain: z.string().optional(),
  setup_webhooks: z.boolean().optional(),
})

export const PipedriveSyncSchema = z.object({
  dealId: z.string().min(1),
  syncDirection: z.enum(['to_pipedrive', 'from_pipedrive']).optional(),
})

export const ScrapeSchema = z.object({
  type: z.enum(['linkedin', 'maps', 'validator']),
  params: z.object({
    profileUrl: z.string().url().optional(),
    searchUrl: z.string().url().optional(),
    searchQuery: z.string().min(2).optional(),
    location: z.string().min(2).optional(),
    limit: z.number().int().positive().optional(),
    withWebsiteOnly: z.boolean().optional(),
    maxLeads: z.number().int().nonnegative().optional(),
    emails: z.array(z.string().email()).optional(),
    startPage: z.number().int().positive().optional(),
    endPage: z.number().int().positive().optional(),
  }),
}).refine(v => {
  if (v.type === 'linkedin') return !!v.params.profileUrl || !!v.params.searchUrl
  if (v.type === 'maps') return !!v.params.searchQuery && !!v.params.location
  if (v.type === 'validator') return Array.isArray(v.params.emails) && v.params.emails.length > 0
  return true
}, { message: 'Invalid params for selected scraper type' })

export const AiChatSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional(),
  conversationHistory: z.array(z.object({ role: z.enum(['system','user','assistant']), content: z.string() })).optional(),
})

export const EmailPostSchema = z.object({
  type: z.enum(['campaign','launch','add-leads','analytics','update-status']),
  data: z.any(),
})

