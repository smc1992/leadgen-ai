// Jest setup file
import { TextEncoder, TextDecoder } from 'util'

// Mock TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock Next.js environment
global.Headers = Headers as any
global.Request = Request as any
global.Response = Response as any

// Suppress console warnings during tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('experimental')
    ) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})
