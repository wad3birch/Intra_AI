import React, { FC, useState, useEffect, useContext } from "react"
import { Button } from "@/components/ui/button"
import { ChatbotUIContext } from "@/context/context"
import { IconX, IconLoader, IconBrain, IconSettings } from "@tabler/icons-react"
import { ModelSelect } from "../models/model-select"
import { MessageMarkdown } from "./message-markdown"
import { LLMID } from "@/types"

interface DeepDiveModalProps {
  selectedText: string
  originalContent: string
  originalQuestion?: string
  position: { x: number; y: number }
  onClose: () => void
}

interface SuggestedQuestion {
  id: string
  question: string
  category: string
}

export const DeepDiveModal: FC<DeepDiveModalProps> = ({
  selectedText,
  originalContent,
  originalQuestion,
  position,
  onClose
}) => {
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [answer, setAnswer] = useState("")
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [selectedModel, setSelectedModel] = useState<LLMID>()
  const { profile, chatSettings } = useContext(ChatbotUIContext)

  // Initialize selected model
  useEffect(() => {
    if (chatSettings?.deepDiveModel) {
      setSelectedModel(chatSettings.deepDiveModel)
    } else if (chatSettings?.model) {
      setSelectedModel(chatSettings.model)
    }
  }, [chatSettings])

  // Improved position calculation with better height management
  const getModalPosition = () => {
    const modalWidth = 420
    const maxModalHeight = Math.min(500, window.innerHeight * 0.7) // Limit height to 70% of viewport
    const margin = 20
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let left = position.x - modalWidth / 2
    let top = position.y - maxModalHeight - 15

    // Left/right boundary check
    if (left < margin) {
      left = margin
    } else if (left + modalWidth > viewportWidth - margin) {
      left = viewportWidth - modalWidth - margin
    }

    // Top/bottom boundary check - smarter positioning
    if (top < margin) {
      // If not enough space above, try below
      const spaceBelow = viewportHeight - position.y - 20
      if (spaceBelow >= maxModalHeight + margin) {
        top = position.y + 20
      } else {
        // If not enough space below either, center the modal
        top = Math.max(margin, (viewportHeight - maxModalHeight) / 2)
      }
    }

    // Ensure modal doesn't go beyond bottom
    if (top + maxModalHeight > viewportHeight - margin) {
      top = viewportHeight - maxModalHeight - margin
    }

    return { left, top, maxHeight: maxModalHeight }
  }

  const modalPosition = getModalPosition()

  // Enhanced context-aware question generation
  const generateSuggestedQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      // Analyze content type for better context awareness
      const isCode = /```[\s\S]*?```|`[^`]+`/.test(selectedText)
      const isData = /\d+%|\$\d+|\d+\.\d+/.test(selectedText)
      const isConcept = /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(selectedText.trim())
      
      const contextType = isCode ? 'code' : isData ? 'data' : isConcept ? 'concept' : 'general'
      
      const response = await fetch("/api/deep-dive/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedText,
          originalContent,
          originalQuestion,
          chatSettings,
          modelId: selectedModel,
          contextType // Add context type for better question generation
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestedQuestions(data.questions || [])
      }
    } catch (error) {
      console.error("Failed to generate suggested questions:", error)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // Enhanced question answering with better context
  const getQuestionAnswer = async (question: string) => {
    setIsLoadingAnswer(true)
    setAnswer("")
    try {
      const response = await fetch("/api/deep-dive/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedText,
          originalContent,
          originalQuestion,
          question,
          chatSettings,
          modelId: selectedModel
        })
      })

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          setAnswer(prev => prev + chunk)
        }
      }
    } catch (error) {
      console.error("Failed to get answer:", error)
      setAnswer("Sorry, an error occurred while getting the answer.")
    } finally {
      setIsLoadingAnswer(false)
    }
  }

  useEffect(() => {
    if (selectedModel) {
      generateSuggestedQuestions()
    }
  }, [selectedText, selectedModel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="bg-background border-border fixed rounded-lg border shadow-xl flex flex-col select-none"
        style={{
          left: modalPosition.left,
          top: modalPosition.top,
          width: "420px",
          maxHeight: `${modalPosition.maxHeight}px`
        }}
      >
        {/* Header - Fixed */}
        <div className="border-b p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconBrain size={20} className="text-primary" />
              <h3 className="font-semibold">Deep Dive</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModelSettings(!showModelSettings)}
              >
                <IconSettings size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <IconX size={16} />
              </Button>
            </div>
          </div>

          {/* Model Settings */}
          {showModelSettings && (
            <div className="mt-3 rounded border p-3">
              <div className="mb-2 text-sm font-medium">Deep Dive Model:</div>
              <ModelSelect
                selectedModelId={selectedModel!}
                onSelectModel={(model) => {
                  setSelectedModel(model)
                  setShowModelSettings(false)
                }}
              />
            </div>
          )}

          {/* Selected Text */}
          <div className="bg-secondary mt-3 rounded p-2">
            <p className="text-muted-foreground text-xs">Selected:</p>
            <p className="text-sm font-medium line-clamp-2">"{selectedText}"</p>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full overflow-y-auto">
            {!selectedQuestionId ? (
              /* Suggested Questions Phase */
              <div>
                <p className="mb-3 text-sm font-medium">Explore:</p>
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center py-8">
                    <IconLoader className="animate-spin" size={20} />
                    <span className="ml-2 text-sm">Generating questions...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestedQuestions.map((q) => (
                      <Button
                        key={q.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-3 px-3"
                        onClick={() => {
                          setSelectedQuestionId(q.id)
                          getQuestionAnswer(q.question)
                        }}
                      >
                        <div className="w-full">
                          <div className="text-xs text-muted-foreground mb-1">{q.category}</div>
                          <div className="text-sm whitespace-normal">{q.question}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Answer Display Phase */
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-sm font-medium flex-1 pr-2">
                    {suggestedQuestions.find(q => q.id === selectedQuestionId)?.question}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedQuestionId(null)
                      setAnswer("")
                    }}
                    className="shrink-0"
                  >
                    Back
                  </Button>
                </div>

                <div className="bg-secondary rounded p-4">
                  {isLoadingAnswer ? (
                    <div className="flex items-center py-4">
                      <IconLoader className="animate-spin" size={16} />
                      <span className="ml-2 text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none select-text">
                      <MessageMarkdown content={answer} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}