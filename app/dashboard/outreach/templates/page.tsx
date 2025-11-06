"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Plus, Edit, Trash2, Copy, Eye, Send, Search, Filter, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  subject: string
  content: string
  variables: string[]
  category: string
  usageCount: number
  createdAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    category: "Introduction"
  })

  // Load templates from API
  useEffect(() => {
    loadTemplates()
  }, [categoryFilter, searchTerm])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/outreach/templates?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load templates')
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Load templates error:', error)
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/outreach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      if (!response.ok) throw new Error('Failed to create template')

      const data = await response.json()
      setTemplates([data.template, ...templates])
      setNewTemplate({ name: "", subject: "", content: "", category: "Introduction" })
      setIsCreateDialogOpen(false)
      toast.success("Template created successfully!")
    } catch (error) {
      console.error('Create template error:', error)
      toast.error("Failed to create template")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/outreach/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate)
      })

      if (!response.ok) throw new Error('Failed to update template')

      const data = await response.json()
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? data.template : t))
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      toast.success("Template updated successfully!")
    } catch (error) {
      console.error('Update template error:', error)
      toast.error("Failed to update template")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/outreach/templates/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete template')

      setTemplates(templates.filter(t => t.id !== id))
      toast.success("Template deleted successfully!")
    } catch (error) {
      console.error('Delete template error:', error)
      toast.error("Failed to delete template")
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const duplicated = {
        ...template,
        name: `${template.name} (Copy)`,
        category: template.category
      }

      const response = await fetch('/api/outreach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated)
      })

      if (!response.ok) throw new Error('Failed to duplicate template')

      const data = await response.json()
      setTemplates([data.template, ...templates])
      toast.success("Template duplicated successfully!")
    } catch (error) {
      console.error('Duplicate template error:', error)
      toast.error("Failed to duplicate template")
    }
  }

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const handleUseInCampaign = (template: Template) => {
    // Navigate to campaigns page with template pre-selected
    window.location.href = `/dashboard/outreach?templateId=${template.id}`
    toast.success("Template selected for campaign!")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Introduction": return "bg-blue-100 text-blue-800"
      case "Follow-up": return "bg-green-100 text-green-800"
      case "Meeting": return "bg-purple-100 text-purple-800"
      case "Promotion": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email templates for your campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Design a new email template for your outreach campaigns
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Logistics Introduction"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Introduction">Introduction</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Optimizing Your Supply Chain Operations"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  placeholder="Hello {'{'}firstName{'}'},&#10;&#10;As the {'{'}jobTitle{'}'} at {'{'}company{'}'}..."
                  rows={8}
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{'}variableName{'}'} for personalization variables
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Introduction">Introduction</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
            <SelectItem value="Meeting">Meeting</SelectItem>
            <SelectItem value="Promotion">Promotion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email template to get started with personalized outreach.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription>
                      Subject: {template.subject}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDuplicateTemplate(template)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedTemplate(template)
                      setIsEditDialogOpen(true)
                    }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Content Preview</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                      {template.content.length > 200 
                        ? template.content.substring(0, 200) + "..."
                        : template.content
                      }
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Variables:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>
                      <div className="font-medium">{template.usageCount} times</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <div className="font-medium">{template.createdAt}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)}>
                      <Eye className="h-3 w-3 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => handleUseInCampaign(template)}>
                      <Send className="h-3 w-3 mr-2" />
                      Use in Campaign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update your email template
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={selectedTemplate.category} onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Introduction">Introduction</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject Line</Label>
                <Input
                  id="edit-subject"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Email Content</Label>
                <Textarea
                  id="edit-content"
                  rows={8}
                  value={selectedTemplate.content}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditTemplate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  Update Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="p-3 bg-gray-50 rounded-lg font-medium">
                  {previewTemplate.subject}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {previewTemplate.content}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => previewTemplate && handleUseInCampaign(previewTemplate)}>
                  <Send className="h-4 w-4 mr-2" />
                  Use in Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
