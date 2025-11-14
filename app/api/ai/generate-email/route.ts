import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateEmailContent, generateEmailVariants } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { purpose, targetAudience, companyInfo, keyPoints, tone, length, useKnowledgeBase, constraints, variants } = body

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

    // Generate email content
    let result: any
    if (variants && Number(variants) > 1) {
      result = await generateEmailVariants({ purpose, targetAudience, companyInfo, keyPoints, tone, length, constraints }, Number(variants), knowledgeBase)
    } else {
      result = await generateEmailContent({ purpose, targetAudience, companyInfo, keyPoints, tone, length, constraints }, knowledgeBase)
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Generate email error:', error)
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    )
  }
}
