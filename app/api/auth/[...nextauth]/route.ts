import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Use the shared NextAuth configuration from lib/auth to ensure consistent session IDs (UUID)
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }