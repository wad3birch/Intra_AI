import { FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Sparkles, 
  Settings,
  Brain,
  Download
} from "lucide-react"
import { KnowledgeCardGenerator } from "@/components/learning/knowledge-card-generator"
import { KnowledgeCard } from "@/types/learning"
import { Tables } from "@/supabase/types"

interface MessageLearningActionsProps {
  message: Tables<"messages">
  chatId: string
  onCardGenerated?: (card: KnowledgeCard) => void
}

export const MessageLearningActions: FC<MessageLearningActionsProps> = ({
  message,
  chatId,
  onCardGenerated
}) => {
  const [showCardGenerator, setShowCardGenerator] = useState(false)
  const [showLearningSettings, setShowLearningSettings] = useState(false)

  const isLearningContent = () => {
    // Simple heuristic to detect learning content
    const content = message.content.toLowerCase()
    const learningKeywords = [
      'explain', 'what is', 'how to', 'why', 'because', 'concept',
      'definition', 'example', 'learn', 'understand', 'teach',
      'principle', 'theory', 'method', 'process', 'steps'
    ]
    
    return learningKeywords.some(keyword => content.includes(keyword))
  }

  const handleGenerateCard = () => {
    setShowCardGenerator(true)
  }

  const handleCardGenerated = (card: KnowledgeCard) => {
    setShowCardGenerator(false)
    onCardGenerated?.(card)
  }

  if (message.role !== "assistant") {
    return null
  }

  return (
    <>
      <div className="flex items-center space-x-1 mt-2">
        {isLearningContent() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateCard}
            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Generate knowledge card"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Card
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLearningSettings(true)}
          className="h-8 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          title="Learning settings"
        >
          <Settings className="h-3 w-3 mr-1" />
          Learn
        </Button>
      </div>

      {showCardGenerator && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <KnowledgeCardGenerator
            messageContent={message.content}
            messageId={message.id}
            chatId={chatId}
            onCardGenerated={handleCardGenerated}
            onClose={() => setShowCardGenerator(false)}
          />
        </div>
      )}

      {showLearningSettings && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-gray-900">Learning Options</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLearningSettings(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCard}
              className="w-full justify-start text-xs"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Generate Knowledge Card
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement style adjustment */}}
              className="w-full justify-start text-xs"
            >
              <Brain className="h-3 w-3 mr-2" />
              Adjust Learning Style
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement export */}}
              className="w-full justify-start text-xs"
            >
              <Download className="h-3 w-3 mr-2" />
              Export as Study Notes
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
