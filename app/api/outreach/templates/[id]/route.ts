import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock database - in production replace with real database
let templates = [
  {
    id: "1",
    name: "Logistics Introduction",
    subject: "Optimizing Your Supply Chain Operations",
    content: "Hello {{firstName}},\n\nAs the {{jobTitle}} at {{company}}, I understand the challenges of managing complex logistics operations. Our solutions have helped companies like yours reduce costs by up to 25% while improving delivery times.\n\nI'd love to schedule a brief call to discuss how we can help {{company}} achieve similar results.\n\nBest regards,\n{{senderName}}",
    variables: ["firstName", "jobTitle", "company", "senderName"],
    category: "Introduction",
    usageCount: 45,
    createdAt: "2024-01-10",
    userId: "user1"
  }
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, subject, content, category } = body

    if (!id || !name || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const templateIndex = templates.findIndex(t => t.id === id && t.userId === session.user.id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Extract variables from content
    const variableMatches = content.match(/\{\{(\w+)\}\}/g)
    const variables = variableMatches ? variableMatches.map(match => match.replace(/[{}]/g, "")) : []

    const updatedTemplate = {
      ...templates[templateIndex],
      name,
      subject,
      content,
      category: category || 'Introduction',
      variables
    }

    templates[templateIndex] = updatedTemplate

    return NextResponse.json({ template: updatedTemplate })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const templateIndex = templates.findIndex(t => t.id === id && t.userId === session.user.id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    templates.splice(templateIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
