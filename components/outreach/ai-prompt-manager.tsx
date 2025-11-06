"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Plus, Trash2, Edit, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  variables: string[]
}

export function AIPromptManager() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'email',
    variables: [] as string[]
  })

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/outreach/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  const handleSave = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...formData, id: editing } : formData

      const response = await fetch('/api/outreach/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        fetchPrompts()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return

    try {
      const response = await fetch(`/api/outreach/prompts?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPrompts()
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditing(prompt.id)
    setFormData({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      category: prompt.category,
      variables: prompt.variables
    })
    setCreating(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      category: 'email',
      variables: []
    })
    setEditing(null)
    setCreating(false)
  }

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? [...new Set(matches.map(m => m.replace(/[{}]/g, "")))] : []
  }

  useEffect(() => {
    const vars = extractVariables(formData.prompt)
    setFormData(prev => ({ ...prev, variables: vars }))
  }, [formData.prompt])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Prompt Library</h2>
          <p className="text-muted-foreground">
            Create and manage AI prompts for better email generation
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {creating && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {editing ? 'Edit Prompt' : 'Create New Prompt'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Prompt Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cold Outreach Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sequence">Sequence</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this prompt does..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Template</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Create a professional email for {{targetAudience}} about {{topic}}..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Use {`{{variableName}}`} for dynamic values
              </p>
            </div>

            {formData.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {editing ? 'Update' : 'Create'} Prompt
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts List */}
      <div className="grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    {prompt.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {prompt.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">{prompt.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm font-mono">
                {prompt.prompt.substring(0, 150)}
                {prompt.prompt.length > 150 && '...'}
              </div>

              {prompt.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {prompt.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(prompt)} className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(prompt.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prompts.length === 0 && !creating && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first AI prompt to improve email generation
            </p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
