"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Sparkles,
  Brain,
  Zap,
  Pause,
  Play,
  RotateCcw,
  Settings,
  MessageSquare,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface StreamingMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  isStreaming?: boolean
  context?: string
}

interface StreamingAIAssistantProps {
  className?: string
  initialContext?: string
  leadData?: any
  campaignData?: any
}

export function StreamingAIAssistant({ 
  className, 
  initialContext = "general",
  leadData,
  campaignData 
}: StreamingAIAssistantProps) {
  const [messages, setMessages] = useState<StreamingMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [context, setContext] = useState(initialContext)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [enableMemory, setEnableMemory] = useState(true)
  const [enablePersonalization, setEnablePersonalization] = useState(true)
  const [responseSpeed, setResponseSpeed] = useState<"fast" | "balanced" | "thoughtful">("balanced")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const contextOptions = [
    { value: "general", label: "General", icon: Bot, color: "bg-blue-500" },
    { value: "leads", label: "Lead Expert", icon: Brain, color: "bg-green-500" },
    { value: "campaigns", label: "Campaign Specialist", icon: MessageSquare, color: "bg-purple-500" },
    { value: "analytics", label: "Data Analyst", icon: Zap, color: "bg-orange-500" }
  ]

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: StreamingMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      context
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent("")

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: enableMemory ? [...messages.slice(-6), userMessage] : [userMessage],
          leadData: enablePersonalization ? leadData : null,
          campaignData: enablePersonalization ? campaignData : null
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error("Failed to start streaming")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              setIsStreaming(false)
              
              // Add the complete message to messages
              const assistantMessage: StreamingMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: accumulatedContent,
                timestamp: new Date().toISOString(),
                context,
                isStreaming: false
              }
              
              setMessages(prev => [...prev, assistantMessage])
              setStreamingContent("")
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedContent += parsed.content
                setStreamingContent(accumulatedContent)
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info("Response stopped by user")
      } else {
        console.error("Streaming error:", error)
        toast.error("Failed to get response. Please try again.")
        
        const errorMessage: StreamingMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent("")
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleClear = () => {
    setMessages([])
    setStreamingContent("")
    toast.success("Conversation cleared")
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
      {/* Header with Settings */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getContextColor(context)}`}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Emex AI Assistant
                {isStreaming && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Streaming
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">GPT-4 Turbo with Streaming</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger className="w-32">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="flex flex-wrap gap-4 mt-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch
              id="memory"
              checked={enableMemory}
              onCheckedChange={setEnableMemory}
              disabled={isLoading}
            />
            <Label htmlFor="memory" className="text-sm">Memory</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="personalization"
              checked={enablePersonalization}
              onCheckedChange={setEnablePersonalization}
              disabled={isLoading}
            />
            <Label htmlFor="personalization" className="text-sm">Personalization</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Label className="text-sm">Speed:</Label>
            <Select value={responseSpeed} onValueChange={(value: any) => setResponseSpeed(value)}>
              <SelectTrigger className="w-24 h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="thoughtful">Thoughtful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Context Indicators */}
        {(leadData || campaignData) && (
          <div className="flex gap-2 mt-2">
            {leadData && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                Lead Context
              </Badge>
            )}
            {campaignData && (
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Campaign Context
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto px-6 pb-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`p-4 rounded-full ${getContextColor(context)} mb-4`}>
                {(() => {
                  const Icon = getContextIcon(context)
                  return <Icon className="h-8 w-8 text-white" />
                })()}
              </div>
              <h3 className="font-semibold mb-2">
                Advanced AI Assistant
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Powered by GPT-4 Turbo with streaming responses, memory, and personalization.
              </p>
              
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start text-left h-auto p-3"
                  onClick={() => setInput("Analyze my recent lead generation performance and suggest improvements")}
                >
                  📊 Analyze my performance and suggest improvements
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start text-left h-auto p-3"
                  onClick={() => setInput("Help me create a personalized outreach strategy")}
                >
                  🎯 Create a personalized outreach strategy
                </Button>
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
              
              {/* Streaming Message */}
              {isStreaming && streamingContent && (
                <div className="flex gap-3 justify-start">
                  <div className={`p-2 rounded-full ${getContextColor(context)} flex-shrink-0`}>
                    {(() => {
                      const Icon = getContextIcon(context)
                      return <Icon className="h-4 w-4 text-white" />
                    })()}
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3 max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap">
                      {streamingContent}
                      <span className="inline-block w-2 h-4 bg-muted-foreground animate-pulse ml-1" />
                    </p>
                  </div>
                </div>
              )}
              
              {/* Streaming Indicator */}
              {isStreaming && !streamingContent && (
                <div className="flex gap-3 justify-start">
                  <div className={`p-2 rounded-full ${getContextColor(context)} flex-shrink-0`}>
                    {(() => {
                      const Icon = getContextIcon(context)
                      return <Icon className="h-4 w-4 text-white" />
                    })()}
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Input with Controls */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything about your lead generation strategy..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            {isStreaming ? (
              <Button
                onClick={handleStop}
                size="sm"
                variant="destructive"
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {isStreaming ? "Streaming response..." : "Press Enter to send, Shift+Enter for new line"}
          </p>
          <div className="flex items-center gap-2">
            {enableMemory && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Memory On
              </Badge>
            )}
            {enablePersonalization && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                Personalized
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
