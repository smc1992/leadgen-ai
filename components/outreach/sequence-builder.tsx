"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Plus, 
  Trash2, 
  Mail,
  Clock,
  Sparkles,
  ArrowRight,
  GripVertical
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fetchWithCsrf } from '@/lib/client-fetch'

interface SequenceStep {
  id: string
  order: number
  template_id?: string
  subject: string
  content: string
  delay_days: number
}

interface SequenceBuilderProps {
  onSave?: (sequence: any) => void
  initialSequence?: any
}

export function SequenceBuilder({ onSave, initialSequence }: SequenceBuilderProps) {
  const [name, setName] = useState(initialSequence?.name || "")
  const [description, setDescription] = useState(initialSequence?.description || "")
  const [steps, setSteps] = useState<SequenceStep[]>(
    initialSequence?.steps || [
      { id: '1', order: 0, subject: '', content: '', delay_days: 0 }
    ]
  )
  const [templates, setTemplates] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/outreach/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleAIGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetchWithCsrf('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: name || 'Lead nurturing sequence',
          targetAudience: 'B2B decision makers',
          numberOfEmails: 3,
          duration: '2 weeks',
          useKnowledgeBase: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        const generatedSteps = data.emails.map((email: any, index: number) => ({
          id: String(index + 1),
          order: index,
          subject: email.subject,
          content: email.content,
          delay_days: email.delayDays || (index * 3)
        }))
        setSteps(generatedSteps)
        toast({
          title: "AI Generated!",
          description: `${generatedSteps.length} emails generated successfully.`
        })
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      toast({
        title: "Error",
        description: "Failed to generate sequence",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const addStep = () => {
    const newStep: SequenceStep = {
      id: String(Date.now()),
      order: steps.length,
      subject: '',
      content: '',
      delay_days: steps.length > 0 ? 3 : 0
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    if (steps.length === 1) {
      toast({
        title: "Cannot remove",
        description: "Sequence must have at least one step",
        variant: "destructive"
      })
      return
    }
    setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (id: string, field: keyof SequenceStep, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Please enter a sequence name",
        variant: "destructive"
      })
      return
    }

    if (steps.some(s => !s.subject || !s.content)) {
      toast({
        title: "Validation Error",
        description: "All steps must have subject and content",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const method = initialSequence?.id ? 'PUT' : 'POST'
      const body = {
        ...(initialSequence?.id && { id: initialSequence.id }),
        name,
        description,
        steps: steps.map(s => ({
          order: s.order,
          template_id: s.template_id,
          subject: s.subject,
          content: s.content,
          delay_days: s.delay_days
        }))
      }

      const response = await fetchWithCsrf('/api/outreach/sequences', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        onSave?.(data.sequence)
        toast({
          title: "Success!",
          description: "Sequence saved successfully"
        })
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "Error",
        description: "Failed to save sequence",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Email Sequence Builder</CardTitle>
                <CardDescription>
                  Create automated multi-step email sequences
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
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome Series"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Onboarding sequence for new leads"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id} className="border-2 relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Email {index + 1}</CardTitle>
                    <CardDescription>
                      {step.delay_days === 0 
                        ? 'Sent immediately' 
                        : `Sent ${step.delay_days} day${step.delay_days > 1 ? 's' : ''} after ${index === 0 ? 'signup' : 'previous email'}`
                      }
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeStep(step.id)}
                    disabled={steps.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delay */}
              <div className="space-y-2">
                <Label>Delay (days)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    value={step.delay_days}
                    onChange={(e) => updateStep(step.id, 'delay_days', parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    days after {index === 0 ? 'signup' : 'previous email'}
                  </span>
                </div>
              </div>

              {/* Template Selection (Optional) */}
              <div className="space-y-2">
                <Label>Use Template (Optional)</Label>
                <Select 
                  value={step.template_id || ''} 
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value)
                    if (template) {
                      updateStep(step.id, 'template_id', value)
                      updateStep(step.id, 'subject', template.subject)
                      updateStep(step.id, 'content', template.content || '')
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={step.subject}
                  onChange={(e) => updateStep(step.id, 'subject', e.target.value)}
                  placeholder="Welcome to {{company}}, {{firstName}}!"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Email Content</Label>
                <Textarea
                  value={step.content}
                  onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                  placeholder="Hi {{firstName}},&#10;&#10;Welcome to our platform!..."
                  rows={8}
                />
              </div>
            </CardContent>

            {/* Arrow to next step */}
            {index < steps.length - 1 && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-background border-2 rounded-full p-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Step Button */}
      <Button onClick={addStep} variant="outline" className="w-full" size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Add Email Step
      </Button>

      {/* Summary */}
      <Card className="border-2 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Sequence Summary</p>
              <p className="text-xs text-muted-foreground">
                {steps.length} email{steps.length > 1 ? 's' : ''} over {Math.max(...steps.map(s => s.delay_days))} days
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving || !name} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Sequence"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
