import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '../route'

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
          count: jest.fn().mockResolvedValue({ count: 0 }),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          data: [],
          error: null
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({ data: [], error: null })
            }))
          }))
        })),
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        update: jest.fn().mockResolvedValue({ data: {}, error: null }),
        delete: jest.fn().mockResolvedValue({ error: null })
      }))
    })
  }
}))

describe('/api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/leads', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leads')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return leads data when user is authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockLeads = [
        {
          id: '1',
          full_name: 'John Doe',
          email: 'john@example.com',
          score: 85,
          is_outreach_ready: true
        }
      ]

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockLeads,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/leads')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.leads).toEqual(mockLeads)
      expect(data.pagination).toBeDefined()
    })

    it('should handle search parameters', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const request = new NextRequest('http://localhost:3000/api/leads?search=john&region=US')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/leads', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({ leads: [] })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create leads when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const newLeads = [
        {
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Tech Corp'
        }
      ]

      const mockCreatedLeads = [
        {
          id: '2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Tech Corp',
          score: 75,
          is_outreach_ready: true,
          user_id: 'test-user-id'
        }
      ]

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: mockCreatedLeads,
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({ leads: newLeads })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.leads).toEqual(mockCreatedLeads)
    })

    it('should return 400 for invalid leads data', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({ leads: 'invalid' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid leads data')
    })
  })
})

describe('/api/leads/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/leads/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leads/123')
      const response = await GET(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return lead by id when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockLead = {
        id: '123',
        full_name: 'John Doe',
        email: 'john@example.com',
        score: 85
      }

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockLead,
                error: null
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/leads/123')
      const response = await GET(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lead).toEqual(mockLead)
    })
  })

  describe('PUT /api/leads/[id]', () => {
    it('should update lead when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const updatedLead = {
        id: '123',
        full_name: 'John Updated',
        email: 'john.updated@example.com',
        score: 90
      }

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: '123', full_name: 'John Doe' },
                error: null
              })
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedLead,
                  error: null
                })
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/leads/123', {
        method: 'PUT',
        body: JSON.stringify({ full_name: 'John Updated' })
      })
      const response = await PUT(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lead).toEqual(updatedLead)
    })
  })

  describe('DELETE /api/leads/[id]', () => {
    it('should delete lead when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const { supabaseAdmin } = require('@/lib/supabase')
      supabaseAdmin.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/leads/123', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
