import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const block_type = searchParams.get('block_type')
    const lead_id = searchParams.get('lead_id')

    if (lead_id && block_type) {
      // Get personalized content block for specific lead
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', lead_id)
        .single()

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      // Find applicable dynamic content blocks
      const { data: blocks } = await supabaseAdmin
        .from('dynamic_content_blocks')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('block_type', block_type)
        .eq('is_active', true)

      // Find the best matching variant for this lead
      const personalizedBlocks = []
      for (const block of blocks || []) {
        const bestVariant = findBestVariant(block, lead)
        if (bestVariant) {
          personalizedBlocks.push({
            block_id: block.id,
            block_name: block.name,
            variant: bestVariant
          })
        }
      }

      return NextResponse.json({ personalized_blocks: personalizedBlocks })
    } else {
      // Get all dynamic content blocks
      const { data: blocks, error } = await supabaseAdmin
        .from('dynamic_content_blocks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ blocks: blocks || [] })
    }
  } catch (error) {
    console.error('Dynamic content blocks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, block_type, content_variants, targeting_rules, ai_generated } = body

    if (!name || !block_type || !content_variants || content_variants.length === 0) {
      return NextResponse.json({
        error: 'Name, block type, and content variants are required'
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('dynamic_content_blocks')
      .insert({
        user_id: session.user.id,
        name,
        block_type,
        content_variants,
        targeting_rules: targeting_rules || {},
        ai_generated: ai_generated || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ block: data }, { status: 201 })
  } catch (error) {
    console.error('Dynamic content blocks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function findBestVariant(block: any, lead: any) {
  const variants = block.content_variants || []
  const rules = block.targeting_rules || {}

  // Score each variant based on how well it matches the lead
  const scoredVariants = variants.map((variant: any) => {
    let score = 0

    // Check targeting rules
    for (const [ruleKey, ruleValue] of Object.entries(rules)) {
      if (ruleKey === 'company_size' && lead.company_size === ruleValue) score += 10
      if (ruleKey === 'industry' && lead.industry?.toLowerCase().includes((ruleValue as string).toLowerCase())) score += 10
      if (ruleKey === 'lead_score') {
        const leadScore = lead.score || 0
        if (ruleValue.min && leadScore >= ruleValue.min) score += 5
        if (ruleValue.max && leadScore <= ruleValue.max) score += 5
      }
    }

    // Add performance-based scoring
    const performance = block.performance_data?.[variant.id] || {}
    score += (performance.engagement_score || 0) * 2

    return { ...variant, score }
  })

  // Return the highest scoring variant
  return scoredVariants.sort((a, b) => b.score - a.score)[0]
}
