import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

// Mock fetch for Apify API
global.fetch = jest.fn()

describe('/api/scrape', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/scrape', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          type: 'linkedin',
          params: { profileUrl: 'https://linkedin.com/in/test' }
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should start LinkedIn scraper when authenticated', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockApifyResponse = {
        data: {
          id: 'run-123',
          status: 'READY',
          actId: 'test-actor-id'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApifyResponse)
      })

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          type: 'linkedin',
          params: { 
            profileUrl: 'https://linkedin.com/in/test',
            limit: 50
          }
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.runId).toBe('run-123')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/acts/supreme_coder/linkedin-profile-scraper/runs'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer undefined' // APIFY_TOKEN is undefined in test
          })
        })
      )
    })

    it('should start Google Maps scraper', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockApifyResponse = {
        data: {
          id: 'run-456',
          status: 'READY',
          actId: 'compass/crawler-google-places'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApifyResponse)
      })

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          type: 'maps',
          params: { 
            searchQuery: 'restaurants in New York',
            limit: 100
          }
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.runId).toBe('run-456')
    })

    it('should start email validator', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockApifyResponse = {
        data: {
          id: 'run-789',
          status: 'READY',
          actId: 'anchor/email-check-verify-validate'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApifyResponse)
      })

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          type: 'validator',
          params: { 
            emails: ['test@example.com', 'test2@example.com']
          }
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.runId).toBe('run-789')
    })

    it('should return 400 for invalid scraper type', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid',
          params: {}
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid scraper type')
    })

    it('should return 400 when missing type or params', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Type and params are required')
    })
  })

  describe('GET /api/scrape', () => {
    it('should check run status', async () => {
      const mockStatusResponse = {
        data: {
          status: 'SUCCEEDED',
          actId: 'test-actor-id'
        }
      }

      const mockResultsResponse = [
        {
          firstName: 'John',
          lastName: 'Doe',
          jobTitle: 'CEO',
          companyName: 'Tech Corp',
          email: 'john@techcorp.com',
          locationCountry: 'US',
          url: 'https://linkedin.com/in/johndoe'
        }
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultsResponse)
        })

      const request = new NextRequest('http://localhost:3000/api/scrape?runId=run-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('succeeded')
      expect(data.results).toHaveLength(1)
      expect(data.results[0]).toMatchObject({
        fullName: 'John Doe',
        jobTitle: 'CEO',
        company: 'Tech Corp',
        email: 'john@techcorp.com',
        region: 'US',
        channel: 'linkedin'
      })
    })

    it('should return 400 when runId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/scrape')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Run ID is required')
    })

    it('should handle running status', async () => {
      const mockStatusResponse = {
        data: {
          status: 'RUNNING',
          actId: 'test-actor-id'
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse)
      })

      const request = new NextRequest('http://localhost:3000/api/scrape?runId=run-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('running')
      expect(data.results).toEqual([])
    })
  })
})
