import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteKnowledgeBaseFiles } from '@/lib/supabase-storage'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Knowledge Base ID is required' }, { status: 400 })
    }

    // Get knowledge base info first
    const { data: kb, error: fetchError } = await supabaseAdmin
      .from('knowledge_bases')
      .select('file_urls')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !kb) {
      return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 })
    }

    // Delete files from storage
    if (kb.file_urls && kb.file_urls.length > 0) {
      await deleteKnowledgeBaseFiles(kb.file_urls)
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('knowledge_bases')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Knowledge Base DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
