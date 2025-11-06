"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Eye } from "lucide-react"

interface TemplateEditorProps {
  onSave?: (template: any) => void
  initialTemplate?: any
}

export function TemplateEditor({ onSave, initialTemplate }: TemplateEditorProps) {
  const [name, setName] = useState(initialTemplate?.name || "")
  const [subject, setSubject] = useState(initialTemplate?.subject || "")
  const [content, setContent] = useState(initialTemplate?.content || "")
  const [category, setCategory] = useState(initialTemplate?.category || "Introduction")
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  // Extract variables from content
  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? [...new Set(matches.map(m => m.replace(/[{}]/g, "")))] : []
  }

  const variables = [...new Set([
    ...extractVariables(subject),
    ...extractVariables(content)
  ])]

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = initialTemplate?.id ? 'PUT' : 'POST'
      const body = initialTemplate?.id 
        ? { id: initialTemplate.id, name, subject, content, category }
        : { name, subject, content, category }

      const response = await fetch('/api/outreach/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        onSave?.(data.template)
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderPreview = (text: string) => {
    let preview = text
    const sampleData: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      company: "Acme Corp",
      jobTitle: "CEO",
      email: "john@acme.com"
    }

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })

    return preview
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Save className="h-5 w-5 text-primary" />
            </div>
            Template Details
          </CardTitle>
          <CardDescription>
            Create reusable email templates with dynamic variables for personalized outreach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Introduction Email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Introduction, Follow-up, etc."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Let's connect, {{firstName}}"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hi {{firstName}},&#10;&#10;I noticed your role as {{jobTitle}} at {{company}}...&#10;&#10;Best regards"
              rows={12}
            />
            <p className="text-sm text-muted-foreground">
              Use double curly braces for variables: {`{{firstName}}, {{company}}, {{jobTitle}}`}
            </p>
          </div>

          {variables.length > 0 && (
            <div className="grid gap-3">
              <Label className="text-base font-semibold">Detected Variables</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                {variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-sm px-3 py-1">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These variables will be automatically replaced with lead data when sending emails
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving || !name || !subject || !content}
              size="lg"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Template"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              Email Preview
            </CardTitle>
            <CardDescription>
              How your email will look with sample data (John Doe from Acme Corp)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">SUBJECT LINE</Label>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-lg">{renderPreview(subject)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">EMAIL CONTENT</Label>
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg border-2 shadow-sm">
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {renderPreview(content)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
