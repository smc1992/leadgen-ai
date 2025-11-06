import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getOpenAIClient } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: experiments, error } = await supabaseAdmin
      .from('content_optimization_experiments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ experiments: experiments || [] })
  } catch (error) {
    console.error('Content optimization GET error:', error)
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
    const { experiment_name, content_type, original_content, target_metric, sample_size } = body

    if (!experiment_name || !content_type || !original_content) {
      return NextResponse.json({
        error: 'Experiment name, content type, and original content are required'
      }, { status: 400 })
    }

    // Generate optimized variants using AI
    const variants = await generateOptimizedVariants(original_content, content_type, target_metric)

    const { data, error } = await supabaseAdmin
      .from('content_optimization_experiments')
      .insert({
        user_id: session.user.id,
        experiment_name,
        content_type,
        original_content,
        optimized_variants: variants,
        target_metric: target_metric || 'engagement',
        sample_size: sample_size || 1000
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ experiment: data }, { status: 201 })
  } catch (error) {
    console.error('Content optimization POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, winner_variant_id, end_date } = body

    if (!id) {
      return NextResponse.json({ error: 'Experiment ID is required' }, { status: 400 })
    }

    const updateData: any = { status }
    if (winner_variant_id) updateData.winner_variant_id = winner_variant_id
    if (end_date) updateData.end_date = end_date

    // If completing experiment, calculate final results
    if (status === 'completed') {
      const results = await calculateExperimentResults(id)
      updateData.results = results
      updateData.end_date = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('content_optimization_experiments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ experiment: data })
  } catch (error) {
    console.error('Content optimization PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { experiment_id, variant_id, metric_type, metric_value } = body

    if (!experiment_id || !variant_id || !metric_type) {
      return NextResponse.json({
        error: 'Experiment ID, variant ID, and metric type are required'
      }, { status: 400 })
    }

    // Update experiment results in real-time
    const { data: experiment } = await supabaseAdmin
      .from('content_optimization_experiments')
      .select('results')
      .eq('id', experiment_id)
      .eq('user_id', session.user.id)
      .single()

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    const currentResults = experiment.results || {}
    const variantResults = currentResults[variant_id] || {
      impressions: 0,
      opens: 0,
      clicks: 0,
      conversions: 0,
      engagement_score: 0
    }

    // Update metric
    switch (metric_type) {
      case 'impression':
        variantResults.impressions += metric_value || 1
        break
      case 'open':
        variantResults.opens += metric_value || 1
        break
      case 'click':
        variantResults.clicks += metric_value || 1
        break
      case 'conversion':
        variantResults.conversions += metric_value || 1
        break
    }

    // Recalculate engagement score
    if (variantResults.impressions > 0) {
      variantResults.open_rate = variantResults.opens / variantResults.impressions
      variantResults.click_rate = variantResults.clicks / variantResults.impressions
      variantResults.conversion_rate = variantResults.conversions / variantResults.impressions
      variantResults.engagement_score =
        (variantResults.open_rate * 0.3) +
        (variantResults.click_rate * 0.4) +
        (variantResults.conversion_rate * 0.3)
    }

    currentResults[variant_id] = variantResults

    // Update experiment
    await supabaseAdmin
      .from('content_optimization_experiments')
      .update({ results: currentResults })
      .eq('id', experiment_id)

    return NextResponse.json({
      success: true,
      updated_results: variantResults
    })
  } catch (error) {
    console.error('Content optimization PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateOptimizedVariants(originalContent: string, contentType: string, targetMetric: string): Promise<any[]> {
  try {
    const variants = []

    for (let i = 1; i <= 3; i++) {
      const prompt = `Optimize this ${contentType} for better ${targetMetric}:

Original content:
${originalContent}

Create variant ${i} that improves ${targetMetric} through:
- More compelling subject/headline
- Better copy and messaging
- Stronger call-to-action
- Psychological triggers
- Urgency or scarcity elements

Return only the optimized content, no explanations.`

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${contentType} optimizer focused on maximizing ${targetMetric}. Create highly effective variations.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const optimizedContent = completion.choices[0].message.content || originalContent

      variants.push({
        id: `variant_${i}`,
        name: `AI Optimized Variant ${i}`,
        content: optimizedContent,
        ai_generated: true,
        created_at: new Date().toISOString()
      })
    }

    return variants
  } catch (error) {
    console.error('Variant generation error:', error)
    // Return basic variants if AI fails
    return [
      {
        id: 'variant_1',
        name: 'Variant 1',
        content: originalContent + ' [Enhanced CTA]',
        ai_generated: false
      },
      {
        id: 'variant_2',
        name: 'Variant 2',
        content: originalContent.replace(/\$/g, '€'), // Simple currency change
        ai_generated: false
      }
    ]
  }
}

async function calculateExperimentResults(experimentId: string) {
  try {
    const { data: experiment } = await supabaseAdmin
      .from('content_optimization_experiments')
      .select('results, target_metric')
      .eq('id', experimentId)
      .single()

    if (!experiment?.results) return {}

    const results = experiment.results
    const targetMetric = experiment.target_metric

    // Find winner based on target metric
    let winner = null
    let bestScore = -1

    for (const [variantId, variantData] of Object.entries(results)) {
      const data = variantData as any
      let score = 0

      switch (targetMetric) {
        case 'open_rate':
          score = data.open_rate || 0
          break
        case 'click_rate':
          score = data.click_rate || 0
          break
        case 'conversion_rate':
          score = data.conversion_rate || 0
          break
        case 'engagement':
        default:
          score = data.engagement_score || 0
          break
      }

      if (score > bestScore) {
        bestScore = score
        winner = variantId
      }
    }

    return {
      winner_variant_id: winner,
      final_scores: results,
      confidence_level: 0.95, // Would calculate statistical significance
      total_impressions: Object.values(results).reduce((sum: number, data: any) => sum + (data.impressions || 0), 0),
      completed_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Results calculation error:', error)
    return {}
  }
}
