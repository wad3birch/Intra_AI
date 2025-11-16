"use client"

import { FC, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageMarkdown } from "@/components/messages/message-markdown"
import { LearningPreferences } from "@/types/learning"
import { ArrowLeft, Send, User, Bot, MessageCircle, AlertCircle, GraduationCap, Info, Sparkles, BookOpen, Brain, Target, Sprout, BookOpenText, Award, Zap, Star, Square } from "lucide-react"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedQuestions?: string[]
}

// 定义用户级别类型
type UserLevel = 'elementary' | 'middle-school' | 'high-school' | 'undergraduate' | 'graduate' | 'expert'

// 基于Common Core State Standards和Bloom's Taxonomy的层级配置 - 使用 Lucide 图标
const userLevelConfig = {
  elementary: {
    label: 'Elementary (K-5)',
    description: 'Ages 5-11, basic concepts with simple language',
    ageRange: 'Ages 5-11',
    gradeLevel: 'Kindergarten - 5th Grade',
    knowledgeScope: 'Basic facts, simple concepts, concrete examples',
    languageComplexity: 'Simple sentences, familiar vocabulary, concrete terms',
    cognitiveLevel: 'Remember and Understand',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: Sprout
  },
  'middle-school': {
    label: 'Middle School (6-8)',
    description: 'Ages 11-14, intermediate concepts with moderate complexity',
    ageRange: 'Ages 11-14',
    gradeLevel: '6th - 8th Grade',
    knowledgeScope: 'Intermediate concepts, cause-and-effect relationships, basic principles',
    languageComplexity: 'Moderate vocabulary, compound sentences, some technical terms with explanations',
    cognitiveLevel: 'Understand and Apply',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: BookOpenText
  },
  'high-school': {
    label: 'High School (9-12)',
    description: 'Ages 14-18, advanced concepts with professional terminology',
    ageRange: 'Ages 14-18',
    gradeLevel: '9th - 12th Grade',
    knowledgeScope: 'Advanced concepts, systematic knowledge, critical thinking, problem-solving',
    languageComplexity: 'Professional vocabulary, complex sentences, technical terminology',
    cognitiveLevel: 'Apply, Analyze, and Evaluate',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: BookOpen
  },
  undergraduate: {
    label: 'Undergraduate',
    description: 'College level, specialized knowledge with academic rigor',
    ageRange: 'Ages 18-22',
    gradeLevel: 'College Level',
    knowledgeScope: 'Specialized knowledge, advanced theories, research methods, professional practices',
    languageComplexity: 'Academic vocabulary, complex sentence structures, specialized terminology',
    cognitiveLevel: 'Analyze, Evaluate, and Create',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: GraduationCap
  },
  graduate: {
    label: 'Graduate',
    description: 'Graduate level, cutting-edge research and advanced methodologies',
    ageRange: 'Ages 22+',
    gradeLevel: 'Graduate Level',
    knowledgeScope: 'Advanced research, theoretical frameworks, cutting-edge developments, critical analysis',
    languageComplexity: 'Advanced academic vocabulary, complex theoretical language, specialized research terminology',
    cognitiveLevel: 'Evaluate and Create',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Award
  },
  expert: {
    label: 'Expert',
    description: 'Domain expert level, state-of-the-art concepts and methodologies',
    ageRange: 'Professional',
    gradeLevel: 'Expert Level',
    knowledgeScope: 'Cutting-edge research, advanced theories, innovative methodologies, expert-level insights',
    languageComplexity: 'Expert-level terminology, complex theoretical language, specialized domain vocabulary',
    cognitiveLevel: 'Create and Innovate',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: Zap
  }
}

export default function LearningCompanionPage() {
  const router = useRouter()
  const [userLevel, setUserLevel] = useState<UserLevel>('high-school')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLevelInfo, setShowLevelInfo] = useState(false)
  
  // Learning preferences (integrated into companion)
  const [preferences, setPreferences] = useState<LearningPreferences>({
    user_id: '',
    preferred_style: 'detailed',
    educational_level: 'high-school'
  })
  const [prefsLoading, setPrefsLoading] = useState<boolean>(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // 获取当前选中级别的图标组件
  const CurrentLevelIcon = userLevelConfig[userLevel].icon

  // Load saved preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        setPrefsLoading(true)
        const res = await fetch('/api/learning-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data?.preferences) {
            setPreferences({
              user_id: data.preferences.user_id ?? '',
              preferred_style: data.preferences.preferred_style ?? 'detailed',
              educational_level: data.preferences.educational_level ?? 'high-school'
            })
            // Sync userLevel with saved educational_level
            setUserLevel(data.preferences.educational_level ?? 'high-school')
          }
        }
      } catch (e) {
        // non-blocking
        console.error('Failed to load learning preferences', e)
      } finally {
        setPrefsLoading(false)
      }
    }
    loadPrefs()
  }, [])

  // Auto-save preferences when changed
  const handleStyleChange = async (value: 'concise' | 'detailed' | 'example-driven' | 'step-by-step' | 'visual') => {
    const newPrefs: LearningPreferences = { 
      user_id: preferences.user_id,
      preferred_style: value,
      educational_level: userLevel
    }
    setPreferences(newPrefs)
    
    try {
      await fetch('/api/learning-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      })
    } catch (e) {
      console.error('Failed to save learning preferences', e)
    }
  }

  // Handle educational level change
  const handleLevelChange = async (value: UserLevel) => {
    setUserLevel(value)
    const newPrefs: LearningPreferences = { 
      user_id: preferences.user_id,
      preferred_style: preferences.preferred_style,
      educational_level: value
    }
    setPreferences(newPrefs)
    
    try {
      await fetch('/api/learning-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      })
    } catch (e) {
      console.error('Failed to save learning preferences', e)
    }
  }

  // Create new chat session
  const createChatSession = async () => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educational_level: userLevel,
          preferred_style: preferences.preferred_style
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(data.session.id)
        return data.session.id
      }
    } catch (error) {
      console.error('Failed to create chat session:', error)
    }
    return null
  }

  // Save chat message to database
  const saveChatMessage = async (message: ChatMessage, sessionId: string) => {
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          suggested_questions: message.suggestedQuestions
        })
      })
    } catch (error) {
      console.error('Failed to save chat message:', error)
    }
  }

  const sendChatMessage = async (question?: string) => {
    const questionToSend = question || currentQuestion
    if (!questionToSend.trim()) return

    // Create new session if needed
    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = await createChatSession()
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: questionToSend,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentQuestion("")
    setChatLoading(true)
    setError(null)

    // Save user message to database
    if (sessionId) {
      await saveChatMessage(userMessage, sessionId)
    }

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, assistantMessage])

    try {
      // Prepare chat history for context
      const chatHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const controller = new AbortController()
      setAbortController(controller)

      const response = await fetch('/api/learning-companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionToSend,
          userLevel: userLevel,
          preferences: preferences,
          chatHistory: chatHistory
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk

        // Update the assistant message with streaming content
        setChatMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullText }
              : msg
          )
        )
      }

      // Try to extract suggested questions JSON at the end of the stream
      let suggestedQuestions: string[] = []
      try {
        const jsonBlockMatch = fullText.match(/```json[\s\S]*?```/)
        if (jsonBlockMatch) {
          const jsonRaw = jsonBlockMatch[0]
          const jsonContent = jsonRaw.replace(/^```json\n?/, '').replace(/```\s*$/, '')
          const parsed = JSON.parse(jsonContent)
          if (Array.isArray(parsed?.suggested_questions)) {
            suggestedQuestions = parsed.suggested_questions.filter((q: any) => typeof q === 'string')
          }
          // Remove JSON block from rendered assistant content
          const cleaned = fullText.replace(jsonRaw, '').trim()
          fullText = cleaned
        }
      } catch (e) {
        // ignore JSON parse errors; just render the text
      }

      // Update the final assistant message with cleaned content and suggestions
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { 
                ...msg, 
                content: fullText,
                suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined
              }
            : msg
        )
      )

      // Save assistant message to database
      if (sessionId) {
        const finalAssistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullText,
          timestamp: new Date(),
          suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined
        }
        await saveChatMessage(finalAssistantMessage, sessionId)
      }
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError'
        || (error instanceof Error && (error.name === 'AbortError' || /aborted|abort/i.test(error.message)))

      if (isAbort) {
        // Graceful stop: remove the placeholder assistant message and do not show error
        setChatMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      } else {
        console.error("Chat failed:", error)
        setError(error instanceof Error ? error.message : "Failed to get response. Please try again.")
        // Remove the empty assistant message on error
        setChatMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      }
    } finally {
      setChatLoading(false)
      setAbortController(null)
    }
  }

  const stopStreaming = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const clearChat = () => {
    setChatMessages([])
    setError(null)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 优化的Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Learning Companion
                </h1>
                <p className="text-sm text-gray-500">AI-powered educational assistant</p>
              </div>
            </div>
          </div>
          
          {/* 优化的User Level Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">Educational Level</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${userLevelConfig[userLevel].color} text-xs px-2 py-1`}>
                    <CurrentLevelIcon size={16} className="mr-1" />
                    {userLevelConfig[userLevel].label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLevelInfo(!showLevelInfo)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <Info size={14} />
                  </Button>
                </div>
              </div>
              <Select value={userLevel} onValueChange={handleLevelChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(userLevelConfig).map(([key, config]) => {
                    const IconComponent = config.icon
                    return (
                      <SelectItem key={key} value={key} className="flex items-center gap-2">
                        <IconComponent size={16} />
                        {config.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Style preference selector */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-xs font-medium text-gray-600">Style</span>
              </div>
              <Select
                value={preferences.preferred_style}
                onValueChange={handleStyleChange}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="example-driven">Example-Driven</SelectItem>
                  <SelectItem value="step-by-step">Step-by-Step</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chatMessages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        
        {/* 紧凑的Level Info */}
        {showLevelInfo && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-blue-600" />
                <span className="font-medium text-blue-900 text-sm">{userLevelConfig[userLevel].label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} className="text-indigo-600" />
                <span className="font-medium text-indigo-900 text-sm capitalize">{preferences.preferred_style.replace('-', ' ')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Target size={10} className="text-blue-500" />
                <span className="text-blue-600 font-medium">Age:</span>
                <span className="text-blue-700">{userLevelConfig[userLevel].ageRange}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={10} className="text-blue-500" />
                <span className="text-blue-600 font-medium">Grade:</span>
                <span className="text-blue-700">{userLevelConfig[userLevel].gradeLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain size={10} className="text-blue-500" />
                <span className="text-blue-600 font-medium">Level:</span>
                <span className="text-blue-700">{userLevelConfig[userLevel].cognitiveLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-indigo-500" />
                <span className="text-indigo-600 font-medium">Style:</span>
                <span className="text-indigo-700">
                  {preferences.preferred_style === 'concise' && 'Brief & direct'}
                  {preferences.preferred_style === 'detailed' && 'Comprehensive'}
                  {preferences.preferred_style === 'example-driven' && 'Example-focused'}
                  {preferences.preferred_style === 'step-by-step' && 'Sequential'}
                  {preferences.preferred_style === 'visual' && 'Visual emphasis'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        
        {/* 聊天区域 */}
        <Card className="flex-1 border border-gray-200 shadow-sm mb-4 flex flex-col min-h-0">
          <CardContent className="p-0 flex flex-col h-full">
            {/* 消息容器 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Bot size={32} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Start asking questions!</h3>
                  <p className="text-base text-gray-600 mb-4">I'll adjust my responses based on your educational level.</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm">
                    <span className="text-gray-500">Current level:</span>
                    <Badge className={`${userLevelConfig[userLevel].color} text-xs`}>
                      <CurrentLevelIcon size={16} className="mr-1" />
                      {userLevelConfig[userLevel].label}
                    </Badge>
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="space-y-4">
                          <div className="text-base break-words leading-relaxed">
                            <MessageMarkdown content={message.content} />
                          </div>
                          {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-600">you might want to ask:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.suggestedQuestions.map((question, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs px-3 py-1 h-7 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      // fire learning event for suggestion click
                                      try {
                                        fetch('/api/learning-events', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            type: 'suggestion_clicked',
                                            payload: {
                                              question_text: question,
                                              assistant_message_id: message.id
                                            }
                                          })
                                        })
                                      } catch {}
                                      sendChatMessage(question)
                                    }}
                                  >
                                    {question}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-base break-words leading-relaxed">{message.content}</p>
                      )}
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              

              {/* 错误消息 */}
              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle size={16} className="text-red-600" />
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl max-w-[75%]">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 输入区域 */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex gap-3">
                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                />
                {chatLoading ? (
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      stopStreaming()
                    }}
                    variant="outline"
                    className="px-4 text-red-600 border-red-300 hover:text-white hover:bg-red-600 hover:border-red-600 rounded-xl"
                  >
                    <Square size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      sendChatMessage()
                    }}
                    disabled={!currentQuestion.trim()}
                    className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
                  >
                    <Send size={16} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
