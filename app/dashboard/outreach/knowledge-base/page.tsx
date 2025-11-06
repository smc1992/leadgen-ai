"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Eye,
  Download,
  File
} from "lucide-react"
import { toast } from "sonner"

interface KnowledgeBase {
  id: string
  name: string
  description: string
  type: "documents" | "faq" | "products" | "company"
  status: "processing" | "ready" | "error"
  documentCount: number
  size: number
  uploadedAt: string
  processedAt?: string
  errorMessage?: string
}

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([
    {
      id: "1",
      name: "Company Information",
      description: "General company information, history, and team details",
      type: "company",
      status: "ready",
      documentCount: 12,
      size: 2450000,
      uploadedAt: "2024-01-15",
      processedAt: "2024-01-15"
    },
    {
      id: "2", 
      name: "Product Documentation",
      description: "Technical specifications, user manuals, and product guides",
      type: "products",
      status: "ready",
      documentCount: 8,
      size: 1800000,
      uploadedAt: "2024-01-14",
      processedAt: "2024-01-14"
    }
  ])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [newKB, setNewKB] = useState({
    name: "",
    description: "",
    type: "documents" as const
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files)
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    if (!newKB.name) {
      toast.error("Please enter a name for the knowledge base")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Calculate total size
      const totalSize = Array.from(selectedFiles).reduce((acc, file) => acc + file.size, 0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create form data
      const formData = new FormData()
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file)
      })
      formData.append('name', newKB.name)
      formData.append('description', newKB.description)
      formData.append('type', newKB.type)

      // Upload to API
      const response = await fetch('/api/outreach/knowledge-base', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      
      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      
      // Add to local state
      const newKnowledgeBase: KnowledgeBase = {
        id: data.id,
        name: newKB.name,
        description: newKB.description,
        type: newKB.type,
        status: "processing",
        documentCount: selectedFiles.length,
        size: totalSize,
        uploadedAt: new Date().toISOString().split('T')[0]
      }

      setKnowledgeBases([newKnowledgeBase, ...knowledgeBases])
      
      // Simulate processing completion
      setTimeout(() => {
        setKnowledgeBases(prev => prev.map(kb => 
          kb.id === newKnowledgeBase.id 
            ? { ...kb, status: "ready" as const, processedAt: new Date().toISOString().split('T')[0] }
            : kb
        ))
        toast.success("Knowledge base uploaded and processed successfully!")
      }, 3000)

      setUploadProgress(100)
      setIsUploadDialogOpen(false)
      setSelectedFiles(null)
      setNewKB({ name: "", description: "", type: "documents" })
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload knowledge base")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteKB = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge base?")) return

    try {
      const response = await fetch(`/api/outreach/knowledge-base/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== id))
      toast.success("Knowledge base deleted successfully!")
    } catch (error) {
      console.error('Delete error:', error)
      toast.error("Failed to delete knowledge base")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800"
      case "processing": return "bg-yellow-100 text-yellow-800"
      case "error": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle className="h-3 w-3" />
      case "processing": return <Loader2 className="h-3 w-3 animate-spin" />
      case "error": return <AlertCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Upload and manage documents for AI-powered email personalization
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Knowledge Base</DialogTitle>
              <DialogDescription>
                Upload documents to create a knowledge base for AI personalization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kb-name">Knowledge Base Name</Label>
                  <Input
                    id="kb-name"
                    placeholder="e.g., Company Information"
                    value={newKB.name}
                    onChange={(e) => setNewKB({ ...newKB, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kb-type">Type</Label>
                  <Select value={newKB.type} onValueChange={(value: any) => setNewKB({ ...newKB, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documents">General Documents</SelectItem>
                      <SelectItem value="faq">FAQ & Support</SelectItem>
                      <SelectItem value="products">Product Information</SelectItem>
                      <SelectItem value="company">Company Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-description">Description</Label>
                <Textarea
                  id="kb-description"
                  placeholder="Describe what this knowledge base contains..."
                  rows={3}
                  value={newKB.description}
                  onChange={(e) => setNewKB({ ...newKB, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="files">Select Files</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Supports PDF, DOC, DOCX, TXT, MD files
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Selected Files:</p>
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{file.name}</span>
                        <span className="text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading || !selectedFiles || selectedFiles.length === 0}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Knowledge Base
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Knowledge Bases Grid */}
      <div className="grid gap-6">
        {knowledgeBases.map((kb) => (
          <Card key={kb.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{kb.name}</CardTitle>
                    <Badge className={getStatusColor(kb.status)}>
                      {getStatusIcon(kb.status)}
                      {kb.status}
                    </Badge>
                  </div>
                  <CardDescription>{kb.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteKB(kb.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div className="font-medium capitalize">{kb.type}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents:</span>
                  <div className="font-medium">{kb.documentCount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <div className="font-medium">{formatFileSize(kb.size)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Uploaded:</span>
                  <div className="font-medium">{kb.uploadedAt}</div>
                </div>
              </div>
              {kb.status === "processing" && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing documents for AI training...</span>
                  </div>
                </div>
              )}
              {kb.status === "ready" && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>Ready for AI-powered personalization</span>
                  </div>
                </div>
              )}
              {kb.status === "error" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>Processing failed: {kb.errorMessage}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {knowledgeBases.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No knowledge bases yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first knowledge base to enable AI-powered email personalization.
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Knowledge Base
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
