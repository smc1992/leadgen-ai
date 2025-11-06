"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, TrendingUp, Mail, FileText, Settings, RefreshCw, CheckCircle } from "lucide-react"
import { getAIService, initializeAIService } from "@/lib/ai-service"
import { toast } from "sonner"

export default function AIDashboardPage() {
  const [apiKey, setApiKey] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)
  const [isScoring, setIsScoring] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scoringResult, setScoringResult] = useState<any>(null)
  const [personalizedEmail, setPersonalizedEmail] = useState<any>(null)
  const [generatedContent, setGeneratedContent] = useState("")

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key")
      return
    }

    try {
      initializeAIService(apiKey)
      setIsConfigured(true)
      toast.success("OpenAI API key configured successfully!")
    } catch (error) {
      toast.error("Failed to configure API key")
    }
  }

  const handleScoreLead = async () => {
    setIsScoring(true)
    
    try {
      const aiService = getAIService()
      const mockLead = {
        id: "1",
        full_name: "John Smith",
        job_title: "Director of Operations",
        company: "Global Logistics Inc",
        email: "john.smith@globallogistics.com",
        region: "USA",
        channel: "linkedin",
        industry: "logistics"
      }

      const result = await aiService.scoreLead(mockLead)
      setScoringResult(result)
      toast.success("Lead scored successfully!")
    } catch (error) {
      toast.error("Failed to score lead")
    } finally {
      setIsScoring(false)
    }
  }

  const handleGenerateEmail = async () => {
    setIsGenerating(true)
    
    try {
      const aiService = getAIService()
      const mockLead = {
        id: "1",
        full_name: "John Smith",
        job_title: "Director of Operations",
        company: "Global Logistics Inc",
        email: "john.smith@globallogistics.com",
        region: "USA",
        channel: "linkedin",
        industry: "logistics"
      }

      const emailTemplate = {
        subject: "Optimizing your supply chain operations",
        content: "Hello {{firstName}},\n\nI noticed you're the {{jobTitle}} at {{company}}. I'd love to discuss how we can help with {{topic}}.\n\nBest regards,\nYour Name",
        variables: ["firstName", "jobTitle", "company", "topic"]
      }

      const result = await aiService.generatePersonalizedEmail(mockLead, emailTemplate, "professional")
      setPersonalizedEmail(result)
      toast.success("Email personalized successfully!")
    } catch (error) {
      toast.error("Failed to generate email")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    
    try {
      const aiService = getAIService()
      const contentRequest = {
        topic: "Supply Chain Optimization",
        platform: "linkedin" as const,
        tone: "professional" as const,
        length: "medium" as const,
        target_audience: "logistics professionals"
      }

      const result = await aiService.generateContent(contentRequest)
      setGeneratedContent(result)
      toast.success("Content generated successfully!")
    } catch (error) {
      toast.error("Failed to generate content")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Dashboard</h1>
          <p className="text-muted-foreground">
            Configure and use AI-powered features for lead generation and content creation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsConfigured(false)}>
            <Settings className="h-4 w-4 mr-2" />
            Reset Configuration
          </Button>
        </div>
      </div>

      {!isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Configure OpenAI API
            </CardTitle>
            <CardDescription>
              Enter your OpenAI API key to enable AI features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveApiKey} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save API Key
            </Button>
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Your API key is stored locally and never sent to our servers. 
                You can get an API key from the OpenAI dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="scoring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scoring">
              <TrendingUp className="h-4 w-4 mr-2" />
              Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email Personalization
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Content Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Lead Scoring</CardTitle>
                <CardDescription>
                  AI-powered lead scoring based on job title, company, industry, and other factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleScoreLead} disabled={isScoring}>
                  {isScoring ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Score Sample Lead
                </Button>

                {scoringResult && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Overall Score</Label>
                        <div className="text-2xl font-bold text-green-600">
                          {scoringResult.score}/100
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {scoringResult.confidence * 100}% confidence
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Factors</Label>
                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Job Title Match</span>
                            <span>{(scoringResult.factors.job_title_match * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Company Size</span>
                            <span>{(scoringResult.factors.company_size * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Industry Relevance</span>
                            <span>{(scoringResult.factors.industry_relevance * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recommendations</Label>
                      <ul className="mt-2 space-y-1 text-sm">
                        {scoringResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Email Personalization</CardTitle>
                <CardDescription>
                  Generate personalized emails based on lead data and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGenerateEmail} disabled={isGenerating}>
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Generate Personalized Email
                </Button>

                {personalizedEmail && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {personalizedEmail.subject}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Content</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                        {personalizedEmail.content}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Generation</CardTitle>
                <CardDescription>
                  Generate social media content and marketing copy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGenerateContent} disabled={isGenerating}>
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate LinkedIn Post
                </Button>

                {generatedContent && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Generated Content</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                        {generatedContent}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
