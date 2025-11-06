import { NextRequest, NextResponse } from 'next/server'

// Mock database - in production replace with real database
let knowledgeBases = [
  {
    id: "1",
    name: "Company Information",
    description: "General company information, history, and team details",
    type: "company",
    status: "ready",
    documentCount: 12,
    size: 2450000,
    uploadedAt: "2024-01-15",
    processedAt: "2024-01-15"
  }
]

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id

    if (!id) {
      return NextResponse.json({ error: 'Knowledge Base ID is required' }, { status: 400 })
    }

    const kbIndex = knowledgeBases.findIndex(kb => kb.id === id && kb.userId === session.user.id)
    if (kbIndex === -1) {
      return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 })
    }

    // In production, you would:
    // 1. Delete files from cloud storage
    // 2. Remove from AI index
    // 3. Delete from database

    knowledgeBases.splice(kbIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Knowledge Base DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
