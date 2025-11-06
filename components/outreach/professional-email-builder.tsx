"use client"

import { useRef, useState } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, Sparkles, Eye, Code, Wand2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Dynamic import to avoid SSR issues
const EmailEditor = dynamic(
  () => import('react-email-editor').then((mod) => mod.default),
  { ssr: false }
)

interface ProfessionalEmailBuilderProps {
  onSave?: (template: any) => void
  initialTemplate?: any
}

export function ProfessionalEmailBuilder({ onSave, initialTemplate }: ProfessionalEmailBuilderProps) {
  const emailEditorRef = useRef<any>(null)
  const [name, setName] = useState(initialTemplate?.name || "")
  const [subject, setSubject] = useState(initialTemplate?.subject || "")
  const [category, setCategory] = useState(initialTemplate?.category || "Marketing")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? [...new Set(matches.map(m => m.replace(/[{}]/g, "")))] : []
  }

  const variables = extractVariables(subject)

  const handleAIGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'professional outreach',
          targetAudience: 'B2B decision makers',
          tone: 'professional',
          length: 'medium',
          useKnowledgeBase: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSubject(data.subject)
        
        // Load AI-generated content into editor
        const unlayer = emailEditorRef.current?.editor
        if (unlayer) {
          // Create a beautiful email design from AI content
          const design = createDesignFromContent(data.content)
          unlayer.loadDesign(design)
        }

        toast({
          title: "AI Generated!",
          description: "Email content has been generated successfully.",
        })
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      toast({
        title: "Error",
        description: "Failed to generate email content.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const createDesignFromContent = (content: string) => {
    // Convert plain text to Unlayer design JSON
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    
    return {
      body: {
        rows: [
          // Header
          {
            cells: [1],
            columns: [{
              contents: [{
                type: 'text',
                values: {
                  containerPadding: '20px',
                  _meta: { htmlID: 'u_content_text_1' },
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: { inherit: true, linkColor: '#0000ee', linkHoverColor: '#0000ee', linkUnderline: true, linkHoverUnderline: true },
                  hideDesktop: false,
                  displayCondition: null,
                  _override: { mobile: { hideMobile: false, textAlign: 'center' } },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  text: '<h1 style="margin: 0; font-size: 28px; font-weight: 700;">{{company}}</h1>'
                }
              }]
            }],
            values: {
              backgroundColor: '#667eea',
              backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
              padding: '30px 0px',
              _meta: { htmlID: 'u_row_1' }
            }
          },
          // Content
          ...paragraphs.map((para, index) => ({
            cells: [1],
            columns: [{
              contents: [{
                type: 'text',
                values: {
                  containerPadding: '20px',
                  _meta: { htmlID: `u_content_text_${index + 2}` },
                  color: '#333333',
                  textAlign: 'left',
                  lineHeight: '160%',
                  linkStyle: { inherit: true, linkColor: '#667eea', linkHoverColor: '#764ba2', linkUnderline: true, linkHoverUnderline: true },
                  hideDesktop: false,
                  displayCondition: null,
                  _override: { mobile: { hideMobile: false } },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  text: `<p style="margin: 0; font-size: 16px;">${para}</p>`
                }
              }]
            }],
            values: {
              backgroundColor: '#ffffff',
              padding: '10px 0px',
              _meta: { htmlID: `u_row_${index + 2}` }
            }
          })),
          // CTA Button
          {
            cells: [1],
            columns: [{
              contents: [{
                type: 'button',
                values: {
                  containerPadding: '20px',
                  _meta: { htmlID: 'u_content_button_1' },
                  href: { name: 'web', values: { href: '{{ctaLink}}', target: '_blank' } },
                  buttonColors: { color: '#ffffff', backgroundColor: '#667eea', hoverColor: '#ffffff', hoverBackgroundColor: '#764ba2' },
                  size: { autoWidth: false, width: '100%' },
                  textAlign: 'center',
                  lineHeight: '120%',
                  padding: '15px 40px',
                  border: {},
                  borderRadius: '8px',
                  hideDesktop: false,
                  displayCondition: null,
                  _override: { mobile: { hideMobile: false } },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  text: '<span style="font-size: 16px; font-weight: 700;">Get Started</span>'
                }
              }]
            }],
            values: {
              backgroundColor: '#ffffff',
              padding: '20px 0px',
              _meta: { htmlID: 'u_row_button' }
            }
          },
          // Footer
          {
            cells: [1],
            columns: [{
              contents: [{
                type: 'text',
                values: {
                  containerPadding: '20px',
                  _meta: { htmlID: 'u_content_text_footer' },
                  color: '#666666',
                  textAlign: 'center',
                  lineHeight: '140%',
                  linkStyle: { inherit: true, linkColor: '#667eea', linkHoverColor: '#764ba2', linkUnderline: true, linkHoverUnderline: true },
                  hideDesktop: false,
                  displayCondition: null,
                  _override: { mobile: { hideMobile: false, textAlign: 'center' } },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  text: '<p style="margin: 0; font-size: 12px;">&copy; 2024 {{company}}. All rights reserved.</p><p style="margin: 5px 0 0 0; font-size: 12px;"><a href="{{unsubscribeLink}}" style="color: #667eea;">Unsubscribe</a></p>'
                }
              }]
            }],
            values: {
              backgroundColor: '#f5f5f5',
              padding: '20px 0px',
              _meta: { htmlID: 'u_row_footer' }
            }
          }
        ],
        values: {
          backgroundColor: '#f5f5f5',
          backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
          contentWidth: '600px',
          contentAlign: 'center',
          fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' },
          preheaderText: '',
          linkStyle: { body: true, linkColor: '#0000ee', linkHoverColor: '#0000ee', linkUnderline: true, linkHoverUnderline: true },
          _meta: { htmlID: 'u_body' }
        }
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const unlayer = emailEditorRef.current?.editor

      if (!unlayer) {
        toast({
          title: "Error",
          description: "Editor not ready",
          variant: "destructive"
        })
        return
      }

      unlayer.exportHtml((data: any) => {
        const { design, html } = data

        const template = {
          name,
          subject,
          category,
          html_content: html,
          design_json: design,
          variables
        }

        onSave?.(template)

        toast({
          title: "Success!",
          description: "Email template saved successfully.",
        })
      })
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const onReady = (unlayer: any) => {
    // Editor is ready
    if (initialTemplate?.design_json) {
      unlayer.loadDesign(initialTemplate.design_json)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Professional Email Builder</CardTitle>
                <CardDescription>
                  Drag & drop email editor with AI assistance - powered by Unlayer
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAIGenerate} disabled={generating} variant="outline" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "AI Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Template Info */}
          <div className="grid md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Marketing"
              />
            </div>
          </div>

          {/* Variables */}
          {variables.length > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Variables:</Label>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !name || !subject} size="lg" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Editor */}
      <Card className="border-2">
        <CardContent className="p-0">
          <div style={{ height: '800px' }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={onReady}
              options={{
                displayMode: 'email',
                locale: 'de-DE',
                appearance: {
                  theme: 'modern_light',
                  panels: {
                    tools: {
                      dock: 'left'
                    }
                  }
                },
                features: {
                  textEditor: {
                    tables: true,
                    emojis: true
                  }
                },
                tools: {
                  form: {
                    enabled: true
                  }
                },
                mergeTags: {
                  firstName: {
                    name: 'First Name',
                    value: '{{firstName}}'
                  },
                  lastName: {
                    name: 'Last Name',
                    value: '{{lastName}}'
                  },
                  company: {
                    name: 'Company',
                    value: '{{company}}'
                  },
                  jobTitle: {
                    name: 'Job Title',
                    value: '{{jobTitle}}'
                  },
                  email: {
                    name: 'Email',
                    value: '{{email}}'
                  },
                  ctaLink: {
                    name: 'CTA Link',
                    value: '{{ctaLink}}'
                  },
                  unsubscribeLink: {
                    name: 'Unsubscribe Link',
                    value: '{{unsubscribeLink}}'
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
