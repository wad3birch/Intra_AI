import { FC, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KnowledgeCard } from "@/types/learning"
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  Brain, 
  HelpCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Share
} from "lucide-react"
import { toast } from "sonner"

interface KnowledgeCardDisplayProps {
  card: KnowledgeCard
  onEdit?: (card: KnowledgeCard) => void
  onDelete?: (cardId: string) => void
  onExport?: (cardId: string) => void
  showActions?: boolean
}

export const KnowledgeCardDisplay: FC<KnowledgeCardDisplayProps> = ({
  card,
  onEdit,
  onDelete,
  onExport,
  showActions = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExport = async () => {
    try {
      const response = await fetch('/api/knowledge-cards/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_ids: [card.id],
          format: 'single',
          template: card.template,
          include_sources: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        // In a real implementation, you would trigger a download
        toast.success('Card exported successfully!')
        onExport?.(card.id)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting card:', error)
      toast.error('Failed to export card')
    }
  }

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'basic': return <BookOpen className="h-4 w-4" />
      case 'detailed': return <Target className="h-4 w-4" />
      case 'visual': return <Eye className="h-4 w-4" />
      case 'minimal': return <Brain className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getTemplateColor = (template: string) => {
    switch (template) {
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'detailed': return 'bg-green-100 text-green-800'
      case 'visual': return 'bg-purple-100 text-purple-800'
      case 'minimal': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {card.title}
            </CardTitle>
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getTemplateColor(card.template)}>
                {getTemplateIcon(card.template)}
                <span className="ml-1 capitalize">{card.template}</span>
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(card.created_at).toLocaleDateString()}
              </span>
            </div>
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? '−' : '+'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-8 w-8 p-0"
                title="Export to PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(card)}
                  className="h-8 w-8 p-0"
                  title="Edit card"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(card.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Core Concept - Always visible */}
        <div className="mb-4">
          <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <BookOpen className="h-4 w-4 mr-2" />
            Core Concept
          </h3>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
            {card.content.core_concept}
          </p>
        </div>

        {/* Expandable sections */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Key Points */}
            {card.content.key_points.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Target className="h-4 w-4 mr-2" />
                  Key Points
                </h3>
                <ul className="space-y-1">
                  {card.content.key_points.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span className="text-gray-900">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            {card.content.examples.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Examples
                </h3>
                <ul className="space-y-1">
                  {card.content.examples.map((example, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">→</span>
                      <span className="text-gray-900">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Concepts */}
            {card.content.related_concepts.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Brain className="h-4 w-4 mr-2" />
                  Related Concepts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {card.content.related_concepts.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Tips */}
            {card.content.memory_tips.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Brain className="h-4 w-4 mr-2" />
                  Memory Tips
                </h3>
                <ul className="space-y-1">
                  {card.content.memory_tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 mr-2 mt-1">💡</span>
                      <span className="text-gray-900">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practice Questions */}
            {card.content.practice_questions.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Practice Questions
                </h3>
                <ul className="space-y-2">
                  {card.content.practice_questions.map((question, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-1 font-bold">
                        Q{index + 1}:
                      </span>
                      <span className="text-gray-900">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
