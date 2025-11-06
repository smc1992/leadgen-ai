"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Send, CheckCircle, Target, Users, BarChart3, Plus } from "lucide-react"
import { CampaignList } from "@/components/outreach/campaign-list"
import { CreateCampaignDialog } from "@/components/outreach/create-campaign-dialog"
import { TemplateEditor } from "@/components/outreach/template-editor"
import { TemplateList } from "@/components/outreach/template-list"
import { SendEmailDialog } from "@/components/outreach/send-email-dialog"
import { ProfessionalEmailBuilder } from "@/components/outreach/professional-email-builder"
import { AIPromptManager } from "@/components/outreach/ai-prompt-manager"
import { SequenceBuilder } from "@/components/outreach/sequence-builder"
import { KnowledgeBaseManager } from "@/components/outreach/knowledge-base-manager"

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showSendEmail, setShowSendEmail] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showEmailBuilder, setShowEmailBuilder] = useState(false)
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false)
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalConverted: 0,
    activeCampaigns: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/outreach/analytics?timeRange=30d')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalSent: data.analytics.summary.totalSent || 0,
          totalDelivered: data.analytics.summary.totalDelivered || 0,
          totalOpened: data.analytics.summary.totalOpened || 0,
          totalClicked: data.analytics.summary.totalClicked || 0,
          totalConverted: data.analytics.summary.totalConverted || 0,
          activeCampaigns: data.analytics.topCampaigns?.filter((c: any) => c.status === 'active').length || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0.0'
    return ((numerator / denominator) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outreach Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your email marketing campaigns and outreach sequences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateCampaign(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Sent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalSent}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Total emails sent
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Delivered</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.totalDelivered}</div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {calculateRate(stats.totalDelivered, stats.totalSent)}% delivery rate
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Opened</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalOpened}</div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              {calculateRate(stats.totalOpened, stats.totalDelivered)}% open rate
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Clicked</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.totalClicked}</div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {calculateRate(stats.totalClicked, stats.totalOpened)}% click rate
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-100">Converted</CardTitle>
            <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">{stats.totalConverted}</div>
            <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
              {calculateRate(stats.totalConverted, stats.totalClicked)}% conversion
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Active</CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.activeCampaigns}</div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
              Running campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="email-builder">Email Builder</TabsTrigger>
          <TabsTrigger value="ai-prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignList />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {showTemplateEditor ? (
            <TemplateEditor 
              initialTemplate={selectedTemplate}
              onSave={() => {
                setShowTemplateEditor(false)
                setSelectedTemplate(null)
              }} 
            />
          ) : (
            <TemplateList 
              onEdit={(template) => {
                setSelectedTemplate(template)
                setShowTemplateEditor(true)
              }}
              onSelect={(template) => {
                setSelectedTemplate(template)
                setShowTemplateEditor(true)
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="email-builder" className="space-y-6">
          <ProfessionalEmailBuilder onSave={(template) => {
            console.log('Template saved:', template)
            // Handle save
          }} />
        </TabsContent>

        <TabsContent value="ai-prompts" className="space-y-6">
          <AIPromptManager />
        </TabsContent>

        <TabsContent value="sequences" className="space-y-6">
          <SequenceBuilder onSave={(sequence) => {
            console.log('Sequence saved:', sequence)
            setShowSequenceBuilder(false)
          }} />
        </TabsContent>

        <TabsContent value="knowledge-base" className="space-y-6">
          <KnowledgeBaseManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateCampaignDialog
        open={showCreateCampaign}
        onOpenChange={setShowCreateCampaign}
        onSuccess={() => {
          fetchStats()
          // Refresh campaign list
        }}
      />

      {selectedCampaign && (
        <SendEmailDialog
          open={showSendEmail}
          onOpenChange={setShowSendEmail}
          campaignId={selectedCampaign.id}
          templateId={selectedCampaign.template_id}
          onSuccess={() => {
            fetchStats()
            // Refresh campaign list
          }}
        />
      )}
    </div>
  )
}
