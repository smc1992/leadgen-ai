"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Eye, 
  Code, 
  Type, 
  Sparkles, 
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  Bold,
  Italic,
  List
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmailBuilderProps {
  onSave?: (template: any) => void
  initialTemplate?: any
}

export function EmailBuilder({ onSave, initialTemplate }: EmailBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name || "")
  const [subject, setSubject] = useState(initialTemplate?.subject || "")
  const [htmlContent, setHtmlContent] = useState(initialTemplate?.html_content || "")
  const [textContent, setTextContent] = useState(initialTemplate?.text_content || "")
  const [mode, setMode] = useState<'visual' | 'html' | 'text'>('visual')
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Visual builder state
  const [blocks, setBlocks] = useState<any[]>([
    { type: 'text', content: 'Hello {{firstName}},' },
    { type: 'text', content: 'Welcome to our platform!' },
  ])

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? [...new Set(matches.map(m => m.replace(/[{}]/g, "")))] : []
  }

  const variables = [...new Set([
    ...extractVariables(subject),
    ...extractVariables(textContent),
    ...extractVariables(htmlContent)
  ])]

  const handleAIGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'introduction',
          targetAudience: 'B2B decision makers',
          tone: 'professional',
          length: 'medium',
          useKnowledgeBase: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSubject(data.subject)
        setTextContent(data.content)
        setHtmlContent(convertTextToHTML(data.content))
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const convertTextToHTML = (text: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    p { margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{company}}</h1>
  </div>
  <div class="content">
    ${text.split('\n').map(line => `<p>${line}</p>`).join('\n    ')}
    <a href="{{ctaLink}}" class="button">Get Started</a>
  </div>
  <div class="footer">
    <p>&copy; 2024 {{company}}. All rights reserved.</p>
    <p><a href="{{unsubscribeLink}}">Unsubscribe</a></p>
  </div>
</body>
</html>`
  }

  const handleSave = async () => {
    const template = {
      name,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      variables
    }
    onSave?.(template)
  }

  const addBlock = (type: string) => {
    setBlocks([...blocks, { type, content: '' }])
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Email Builder</CardTitle>
                <CardDescription>
                  Create beautiful HTML or text emails with AI assistance
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAIGenerate} disabled={generating} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "AI Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Template Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Welcome to {{company}}, {{firstName}}!"
              />
            </div>
          </div>

          {/* Editor Tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visual">
                <AlignLeft className="h-4 w-4 mr-2" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html">
                <Code className="h-4 w-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="h-4 w-4 mr-2" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex gap-2 p-3 bg-white dark:bg-gray-950 rounded-lg border shadow-sm">
                    <Button size="sm" variant="outline" onClick={() => addBlock('heading')}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock('text')}>
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock('button')}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock('image')}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock('list')}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content Blocks */}
                  <div className="space-y-3">
                    {blocks.map((block, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-gray-950 rounded-lg border-2 hover:border-primary transition-colors">
                        <Input
                          value={block.content}
                          onChange={(e) => {
                            const newBlocks = [...blocks]
                            newBlocks[index].content = e.target.value
                            setBlocks(newBlocks)
                          }}
                          placeholder={`Enter ${block.type} content...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter HTML content..."
                rows={20}
                className="font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter plain text content..."
                rows={20}
              />
            </TabsContent>
          </Tabs>

          {/* Variables */}
          {variables.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Variables</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                {variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-sm px-3 py-1">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} size="lg" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-950">
              <div className="mb-4 pb-4 border-b">
                <strong>Subject:</strong> {subject}
              </div>
              {mode === 'html' && htmlContent ? (
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                />
              ) : (
                <div className="whitespace-pre-wrap">{textContent}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
