import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Mail, FileText, TrendingUp, Brain } from "lucide-react"
import Link from "next/link"
import { StreamingAIAssistant } from "@/components/ui/streaming-ai-assistant"
import { RealAnalytics } from "@/components/real-analytics"
import { AIAnalytics } from "@/components/ai-analytics"
import { SalesPipeline } from "@/components/sales/sales-pipeline"
import { SalesForecasting } from "@/components/sales/sales-forecasting"
import { CRMIntegrations } from "@/components/crm/crm-integrations"
import { WorkflowAutomation } from "@/components/automation/workflow-automation"
import { ContentPersonalizationEngine } from "@/components/content/personalization-engine"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Emex Express lead generation dashboard
        </p>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Lead Analytics</TabsTrigger>
          <TabsTrigger value="sales">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="crm">CRM Integration</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="content">Content Personalization</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real Analytics Section */}
          <RealAnalytics />

          {/* Quick Actions and AI Assistant */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and recent activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Link href="/dashboard/leads">
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                              <h3 className="font-semibold">Manage Leads</h3>
                              <p className="text-sm text-muted-foreground">View and edit your lead database</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    <Link href="/dashboard/outreach/campaigns">
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Mail className="h-8 w-8 text-green-500" />
                            <div>
                              <h3 className="font-semibold">Campaigns</h3>
                              <p className="text-sm text-muted-foreground">Create and manage email campaigns</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/dashboard/outreach/templates">
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-purple-500" />
                            <div>
                              <h3 className="font-semibold">Templates</h3>
                              <p className="text-sm text-muted-foreground">Email templates and sequences</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/dashboard/outreach/knowledge-base">
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-orange-500" />
                            <div>
                              <h3 className="font-semibold">Knowledge Base</h3>
                              <p className="text-sm text-muted-foreground">AI-powered content library</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-[600px]">
                <StreamingAIAssistant 
                  initialContext="general"
                  className="h-full"
                />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <SalesPipeline />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <SalesForecasting />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <CRMIntegrations />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <WorkflowAutomation />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentPersonalizationEngine />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AIAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
