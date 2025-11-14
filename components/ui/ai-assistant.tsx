"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Sparkles,
  TrendingUp,
  Users,
  Mail,
  BarChart3,
  Brain
} from "lucide-react"
import { toast } from "sonner"
import { fetchWithCsrf } from '@/lib/client-fetch'

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  context?: string
}

interface AIAssistantProps {
  className?: string
  initialContext?: string
  leadData?: any
  campaignData?: any
}

export function AIAssistant({ 
  className, 
  initialContext = "general",
  leadData,
  campaignData 
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState(initialContext)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const contextOptions = [
    { value: "general", label: "General Assistant", icon: Bot, color: "bg-blue-500" },
    { value: "leads", label: "Lead Expert", icon: Users, color: "bg-green-500" },
    { value: "campaigns", label: "Campaign Specialist", icon: Mail, color: "bg-purple-500" },
    { value: "analytics", label: "Data Analyst", icon: BarChart3, color: "bg-orange-500" },
    { value: "technical", label: "Technical Support", icon: Brain, color: "bg-red-500" }
  ]

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      context
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetchWithCsrf("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          context,
          conversationHistory: messages.slice(-10),
          leadData,
          campaignData
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        context: data.context
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("Chat error:", error)
      toast.error("Failed to send message. Please try again.")
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again or contact support if the issue persists.",
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      toast.success("Message copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error("Failed to copy message")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getContextIcon = (contextValue: string) => {
    const option = contextOptions.find(opt => opt.value === contextValue)
    return option?.icon || Bot
  }

  const getContextColor = (contextValue: string) => {
    const option = contextOptions.find(opt => opt.value === contextValue)
    return option?.color || "bg-blue-500"
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getContextColor(context)}`}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Emex AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by GPT-4</p>
            </div>
          </div>
          <Select value={context} onValueChange={setContext}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contextOptions.map((option) => {
                const Icon = option.icon
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Context Badges */}
        {(leadData || campaignData) && (
          <div className="flex gap-2 mt-2">
            {leadData && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Lead Context
              </Badge>
            )}
            {campaignData && (
              <Badge variant="outline" className="text-xs">
                <Mail className="h-3 w-3 mr-1" />
                Campaign Context
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto px-6 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`p-4 rounded-full ${getContextColor(context)} mb-4`}>
                {(() => {
                  const Icon = getContextIcon(context)
                  return <Icon className="h-8 w-8 text-white" />
                })()}
              </div>
              <h3 className="font-semibold mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask me about lead generation, campaign optimization, analytics, or any other questions about the Emex platform.
              </p>
              
              {/* Suggested prompts */}
              <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-sm">
                {context === "leads" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("How can I improve my lead quality scores?")}
                    >
                      💡 How can I improve my lead quality scores?
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("What's the best strategy for LinkedIn outreach?")}
                    >
                      💡 What's the best strategy for LinkedIn outreach?
                    </Button>
                  </>
                )}
                {context === "campaigns" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("How can I improve my email open rates?")}
                    >
                      📧 How can I improve my email open rates?
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("What makes a good subject line?")}
                    >
                      📧 What makes a good subject line?
                    </Button>
                  </>
                )}
                {context === "analytics" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("What metrics should I track for campaign success?")}
                    >
                      📊 What metrics should I track for campaign success?
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("How do I calculate ROI for my campaigns?")}
                    >
                      📊 How do I calculate ROI for my campaigns?
                    </Button>
                  </>
                )}
                {context === "general" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("What are the best practices for lead generation?")}
                    >
                      🚀 What are the best practices for lead generation?
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setInput("How do I get started with email campaigns?")}
                    >
                      🚀 How do I get started with email campaigns?
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user"
                const ContextIcon = getContextIcon(message.context || context)
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className={`p-2 rounded-full ${getContextColor(message.context || context)} flex-shrink-0`}>
                        <ContextIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isUser
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 px-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        
                        {!isUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(message.id, message.content)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="p-2 rounded-full bg-primary flex-shrink-0 order-first">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className={`p-2 rounded-full ${getContextColor(context)} flex-shrink-0`}>
                    {(() => {
                      const Icon = getContextIcon(context)
                      return <Icon className="h-4 w-4 text-white" />
                    })()}
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything about lead generation..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          <Badge variant="outline" className="text-xs">
            GPT-4 Turbo
          </Badge>
        </div>
      </div>
    </div>
  )
}
