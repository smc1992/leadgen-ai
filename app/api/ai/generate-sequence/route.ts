import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateEmailSequence } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goal, targetAudience, companyInfo, numberOfEmails, duration, useKnowledgeBase, tone, intentHints } = body

    let knowledgeBase = ''

    // Fetch knowledge base if requested
    if (useKnowledgeBase) {
      const { data: kbData } = await supabaseAdmin
        .from('knowledge_bases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(3)

      if (kbData && kbData.length > 0) {
        knowledgeBase = kbData
          .map(kb => `${kb.name}: ${kb.description}`)
          .join('\n\n')
      }
    }

    // Generate email sequence
    const emails = await generateEmailSequence({ goal, targetAudience, companyInfo, numberOfEmails, duration, tone, intentHints }, knowledgeBase)

    return NextResponse.json({
      success: true,
      emails
    })
  } catch (error) {
    console.error('Generate sequence error:', error)
    return NextResponse.json(
      { error: 'Failed to generate sequence' },
      { status: 500 }
    )
  }
}
