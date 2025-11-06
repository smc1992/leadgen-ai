"use client"

import { useState } from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Eye,
  Save,
  Send,
  Mail,
  FileText,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import { toast } from "sonner"

interface EmailTemplateBuilderProps {
  onSave?: (template: EmailTemplate) => void
  onSend?: (template: EmailTemplate) => void
}

interface EmailTemplate {
  id?: string
  name: string
  subject: string
  content: string
  variables: string[]
}

const defaultContent = `
<h2>Hi {{firstName}},</h2>

<p>I hope this email finds you well. I wanted to reach out about our supply chain optimization solutions that could benefit {{company}}.</p>

<p>Based on my research, I noticed that {{company}} might be facing challenges with:</p>

<ul>
  <li>Logistics efficiency</li>
  <li>Cost optimization</li>
  <li>Delivery time improvements</li>
</ul>

<p>Would you be available for a quick 15-minute call next week to discuss how we can help streamline your operations?</p>

<p>Best regards,<br/>
{{senderName}}<br/>
{{senderTitle}}<br/>
{{senderCompany}}<br/>
{{senderEmail}}</p>
`

export function EmailTemplateBuilder({ onSave, onSend }: EmailTemplateBuilderProps) {
  const [templateName, setTemplateName] = useState("")
  const [subject, setSubject] = useState("")
  const [previewMode, setPreviewMode] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: defaultContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  const availableVariables = [
    '{{firstName}}',
    '{{lastName}}',
    '{{company}}',
    '{{jobTitle}}',
    '{{email}}',
    '{{senderName}}',
    '{{senderTitle}}',
    '{{senderCompany}}',
    '{{senderEmail}}',
  ]

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run()
    }
  }

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    const template: EmailTemplate = {
      name: templateName,
      subject: subject,
      content: editor?.getHTML() || "",
      variables: extractVariables(editor?.getHTML() || ""),
    }

    onSave?.(template)
    toast.success("Template saved successfully!")
  }

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line")
      return
    }

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'test@example.com', // In production, this would be a lead's email
          subject: subject,
          html: editor?.getHTML() || "",
          text: editor?.getText() || "",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Test email sent successfully!")
      } else {
        toast.error(result.error || "Failed to send test email")
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      toast.error("Failed to send test email")
    }
  }

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = content.match(variableRegex) || []
    return [...new Set(matches)]
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="space-y-6">
      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Builder
          </CardTitle>
          <CardDescription>
            Create personalized email templates with dynamic variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Initial Outreach"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="e.g., Optimizing {{company}}'s Supply Chain"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-muted' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-muted' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-muted' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-muted' : ''}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Variables */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Variables:</Label>
              {availableVariables.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                </Button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg">
            {!previewMode ? (
              <EditorContent editor={editor} className="min-h-[400px]" />
            ) : (
              <div className="min-h-[400px] p-6 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variables Used */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Variables Used in Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {extractVariables(editor.getHTML()).map((variable) => (
              <Badge key={variable} variant="secondary">
                {variable}
              </Badge>
            ))}
            {extractVariables(editor.getHTML()).length === 0 && (
              <p className="text-sm text-muted-foreground">No variables used</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
        <Button onClick={handleSend}>
          <Send className="h-4 w-4 mr-2" />
          Send Test Email
        </Button>
      </div>
    </div>
  )
}
