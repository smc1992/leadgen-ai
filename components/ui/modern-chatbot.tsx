"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  status?: "sending" | "sent" | "error"
}

interface ChatbotUIProps {
  title?: string
  placeholder?: string
  className?: string
}

export function ModernChatbotUI({ 
  title = "Emex AI Assistant", 
  placeholder = "Ask me anything about lead generation...",
  className 
}: ChatbotUIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your Emex AI assistant. I can help you with lead generation, email outreach, content creation, and analytics. What would you like to know?",
      role: "assistant",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
      status: "sent"
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${userMessage.content}". Let me help you with that. Based on your current leads and campaigns, I can provide insights and suggestions.`,
        role: "assistant",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className={cn("flex flex-col h-[600px] w-full max-w-4xl mx-auto", className)}>
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/bot-avatar.png" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                Online
              </Badge>
              <span className="text-xs text-muted-foreground">
                AI-Powered Assistant
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 px-4"
        >
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={cn(
                    "text-xs",
                    message.role === "user" 
                      ? "bg-gradient-to-br from-green-500 to-blue-600" 
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                  )}>
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  "flex flex-col gap-1",
                  message.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-full",
                    message.role === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm" 
                      : "bg-muted text-foreground rounded-bl-sm border"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content, message.id)}
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
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 items-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-muted border">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    Typing...
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="flex-1 resize-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={!input.trim() || isLoading}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                GPT-4
              </Badge>
              <Badge variant="outline" className="text-xs">
                Context-aware
              </Badge>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
