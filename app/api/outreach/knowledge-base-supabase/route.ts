import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadKnowledgeBaseFiles, deleteKnowledgeBaseFiles, createKnowledgeBaseBucket } from '@/lib/supabase-storage'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: knowledgeBases, error } = await supabaseAdmin
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ knowledgeBases })
  } catch (error) {
    console.error('Knowledge Base GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string

    if (!name || files.length === 0) {
      return NextResponse.json({ error: 'Name and files are required' }, { status: 400 })
    }

    // Create storage bucket if it doesn't exist
    await createKnowledgeBaseBucket()

    // Create knowledge base record first
    const { data: newKB, error: kbError } = await supabaseAdmin
      .from('knowledge_bases')
      .insert({
        user_id: session.user.id,
        name,
        description: description || '',
        type: type || 'documents',
        status: 'processing',
        document_count: files.length,
        size_bytes: files.reduce((acc, file) => acc + file.size, 0),
        file_urls: []
      })
      .select()
      .single()

    if (kbError) throw kbError

    // Upload files to storage
    const uploadedFiles = await uploadKnowledgeBaseFiles(
      files, 
      newKB.id, 
      session.user.id
    )

    // Update knowledge base with file URLs
    const { data: updatedKB, error: updateError } = await supabaseAdmin
      .from('knowledge_bases')
      .update({
        file_urls: uploadedFiles.map(f => f.path),
        status: 'ready'
      })
      .eq('id', newKB.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      knowledgeBase: updatedKB,
      message: "Knowledge base uploaded successfully."
    }, { status: 201 })
  } catch (error) {
    console.error('Knowledge Base POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
