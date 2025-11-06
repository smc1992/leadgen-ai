import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: 0 })
            }))
          }))
        })),
        count: jest.fn().mockResolvedValue({ count: 0 })
      }))
    })
  }
}))

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/analytics', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return overview analytics when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      
      // Mock leads data
      supabaseAdmin.from.mockImplementation((table: string) => {
        switch (table) {
          case 'leads':
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: [
                        { id: '1', score: 85, is_outreach_ready: true, email_status: 'valid', created_at: '2024-01-01' },
                        { id: '2', score: 45, is_outreach_ready: false, email_status: 'invalid', created_at: '2024-01-02' }
                      ],
                      error: null
                    })
                  })
                })
              })
            }
          case 'campaigns':
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    lte: jest.fn().mockResolvedValue({
                      data: [
                        { id: '1', status: 'active', sent_count: 100, opened_count: 50, clicked_count: 25, created_at: '2024-01-01' }
                      ],
                      error: null
                    })
                  })
                })
              })
            }
          case 'email_templates':
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  count: jest.fn().mockResolvedValue({ count: 5 })
                })
              })
            }
          case 'knowledge_bases':
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  count: jest.fn().mockResolvedValue({ count: 3 })
                })
              })
            }
          default:
            return {
              select: jest.fn(),
              count: jest.fn().mockResolvedValue({ count: 0 })
            }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/analytics?type=overview&timeRange=30d')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics).toBeDefined()
      expect(data.analytics.leads).toBeDefined()
      expect(data.analytics.campaigns).toBeDefined()
      expect(data.analytics.content).toBeDefined()
      expect(data.type).toBe('overview')
      expect(data.timeRange).toBe('30d')
    })

    it('should handle different time ranges', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        count: jest.fn().mockResolvedValue({ count: 0 })
      })

      const request = new NextRequest('http://localhost:3000/api/analytics?timeRange=7d')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.timeRange).toBe('7d')
    })

    it('should handle different analytics types', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        count: jest.fn().mockResolvedValue({ count: 0 })
      })

      const types = ['leads', 'campaigns', 'performance']
      
      for (const type of types) {
        const request = new NextRequest(`http://localhost:3000/api/analytics?type=${type}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.type).toBe(type)
      }
    })

    it('should default to overview type', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        count: jest.fn().mockResolvedValue({ count: 0 })
      })

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.type).toBe('overview')
    })

    it('should default to 30d time range', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        count: jest.fn().mockResolvedValue({ count: 0 })
      })

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.timeRange).toBe('30d')
    })

    it('should include period information', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        count: jest.fn().mockResolvedValue({ count: 0 })
      })

      const request = new NextRequest('http://localhost:3000/api/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period).toBeDefined()
      expect(data.period.start).toBeDefined()
      expect(data.period.end).toBeDefined()
    })
  })
})
