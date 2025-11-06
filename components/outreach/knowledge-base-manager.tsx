"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Plus,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useDropzone } from 'react-dropzone'

interface KnowledgeBase {
  id: string
  name: string
  description: string
  file_path?: string
  file_type?: string
  file_size?: number
  status: 'processing' | 'ready' | 'error'
  created_at: string
}

export function KnowledgeBaseManager() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  const fetchKnowledgeBases = async () => {
    try {
      const response = await fetch('/api/outreach/knowledge-base')
      if (response.ok) {
        const data = await response.json()
        setKnowledgeBases(data.knowledgeBases || [])
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({ ...prev, file: acceptedFiles[0] }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleUpload = async () => {
    if (!formData.name || !formData.file) {
      toast({
        title: "Validation Error",
        description: "Please provide a name and file",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('name', formData.name)
      uploadFormData.append('description', formData.description)

      const response = await fetch('/api/outreach/knowledge-base', {
        method: 'POST',
        body: uploadFormData
      })

      if (response.ok) {
        fetchKnowledgeBases()
        setShowCreateForm(false)
        setFormData({ name: '', description: '', file: null })
        toast({
          title: "Success!",
          description: "Knowledge base uploaded successfully"
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Error",
        description: "Failed to upload knowledge base",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge base?')) return

    try {
      const response = await fetch(`/api/outreach/knowledge-base?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== id))
        toast({
          title: "Success",
          description: "Knowledge base deleted successfully"
        })
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      toast({
        title: "Error",
        description: "Failed to delete knowledge base",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return ''
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`
  }

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Upload documents to help AI generate better emails
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showCreateForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle>Upload Knowledge Base</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowCreateForm(false)
                setFormData({ name: '', description: '', file: null })
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Upload documents (PDF, DOC, TXT, MD) to enhance AI email generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company Overview"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key information about our company, products, and values..."
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Document</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {formData.file ? (
                  <div>
                    <p className="font-medium">{formData.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(formData.file.size)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, TXT, MD (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !formData.name || !formData.file}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', description: '', file: null })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {knowledgeBases.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Knowledge Bases Grid */}
      {knowledgeBases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No knowledge bases yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload documents to help AI generate more personalized emails
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredKnowledgeBases.map((kb) => (
            <Card key={kb.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Badge className={getStatusColor(kb.status)}>
                        {getStatusIcon(kb.status)}
                        <span className="ml-1">{kb.status}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{kb.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {kb.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(kb.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{kb.file_type?.toUpperCase() || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(kb.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium">
                      {new Date(kb.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredKnowledgeBases.length === 0 && searchQuery && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No knowledge bases found for "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
