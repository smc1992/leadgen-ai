"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  Plus,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface Template {
  id: string
  name: string
  subject: string
  content?: string
  html_content?: string
  category: string
  created_at: string
  updated_at: string
}

interface TemplateListProps {
  onEdit?: (template: Template) => void
  onSelect?: (template: Template) => void
}

export function TemplateList({ onEdit, onSelect }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const response = await fetch(`/api/outreach/templates?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id))
        toast({
          title: "Success",
          description: "Template deleted successfully"
        })
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch('/api/outreach/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          subject: template.subject,
          content: template.content,
          html_content: template.html_content,
          category: template.category
        })
      })

      if (response.ok) {
        fetchTemplates()
        toast({
          title: "Success",
          description: "Template duplicated successfully"
        })
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive"
      })
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first email template to get started
          </p>
          <Button onClick={() => onEdit?.(undefined as any)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => onEdit?.(undefined as any)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            onClick={() => onSelect?.(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {template.category}
                  </Badge>
                  <CardTitle className="text-lg line-clamp-1">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-1 mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(template)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(template)
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(template.id)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Content Preview */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm line-clamp-3">
                  {template.content?.substring(0, 150) || 
                   template.html_content?.replace(/<[^>]*>/g, '').substring(0, 150) || 
                   'No content'}
                  {(template.content?.length || 0) > 150 && '...'}
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(template.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>
                      {template.html_content ? 'HTML' : 'Text'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && searchQuery && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No templates found for "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
