import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Calculate date range
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    // Fetch scheduled content from Supabase
    const { data: scheduledPosts, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('status', 'scheduled')
      .gte('schedule_at', now.toISOString())
      .lte('schedule_at', futureDate.toISOString())
      .order('schedule_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedPosts = scheduledPosts.map(post => ({
      id: post.id,
      title: post.data?.prompt || post.data?.topic || post.data?.text || 'Untitled Post',
      type: post.type,
      platform: post.platform || [],
      schedule_at: post.schedule_at || post.data?.scheduledTime,
      status: post.status,
      blotatoId: post.data?.blotatoId,
      data: post.data,
    }))

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayPosts = transformedPosts.filter(post => {
      const postDate = new Date(post.schedule_at)
      return postDate >= today && postDate < tomorrow
    })

    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() + 7)
    const weekPosts = transformedPosts.filter(post => {
      const postDate = new Date(post.schedule_at)
      return postDate >= today && postDate < thisWeek
    })

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      stats: {
        total: transformedPosts.length,
        today: todayPosts.length,
        thisWeek: weekPosts.length,
      },
    })
  } catch (error) {
    console.error('Scheduled posts error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch scheduled posts',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
