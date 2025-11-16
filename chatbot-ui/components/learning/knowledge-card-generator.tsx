import { FC, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { KnowledgeCard, CardGenerationRequest } from "@/types/learning"
import { 
  BookOpen, 
  Sparkles, 
  Download,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface KnowledgeCardGeneratorProps {
  messageContent: string
  messageId: string
  chatId: string
  onCardGenerated?: (card: KnowledgeCard) => void
  onClose?: () => void
}

const cardTemplates = [
  { 
    value: 'basic', 
    label: 'Basic', 
    description: 'Simple, clean layout with essential information',
    icon: '📄'
  },
  { 
    value: 'detailed', 
    label: 'Detailed', 
    description: 'Comprehensive information with all sections',
    icon: '📚'
  },
  { 
    value: 'visual', 
    label: 'Visual', 
    description: 'Rich formatting with icons and visual elements',
    icon: '🎨'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Essential information only, concise format',
    icon: '📝'
  }
]

export const KnowledgeCardGenerator: FC<KnowledgeCardGeneratorProps> = ({
  messageContent,
  messageId,
  chatId,
  onCardGenerated,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'basic' | 'detailed' | 'visual' | 'minimal'>('basic')
  const [customSections, setCustomSections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCard, setGeneratedCard] = useState<KnowledgeCard | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const request: CardGenerationRequest = {
        message_content: messageContent,
        message_id: messageId,
        chat_id: chatId,
        template: selectedTemplate,
        custom_sections: customSections.length > 0 ? customSections : undefined
      }

      const response = await fetch('/api/knowledge-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCard(data.card)
        setPreviewMode(true)
        toast.success('Knowledge card generated successfully!')
        onCardGenerated?.(data.card)
      } else {
        throw new Error('Failed to generate card')
      }
    } catch (error) {
      console.error('Error generating knowledge card:', error)
      toast.error('Failed to generate knowledge card')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async () => {
    if (!generatedCard) return

    try {
      const response = await fetch('/api/knowledge-cards/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_ids: [generatedCard.id],
          format: 'single',
          template: selectedTemplate,
          include_sources: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        // In a real implementation, you would trigger a download
        toast.success('Card exported successfully!')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting card:', error)
      toast.error('Failed to export card')
    }
  }

  const handleRegenerate = () => {
    setGeneratedCard(null)
    setPreviewMode(false)
  }

  if (previewMode && generatedCard) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Generated Knowledge Card</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleRegenerate}>
                Regenerate
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{generatedCard.title}</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Core Concept:</h4>
                <p className="text-sm">{generatedCard.content.core_concept}</p>
              </div>
              
              {generatedCard.content.key_points.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Key Points:</h4>
                  <ul className="text-sm space-y-1">
                    {generatedCard.content.key_points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {generatedCard.content.examples.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Examples:</h4>
                  <ul className="text-sm space-y-1">
                    {generatedCard.content.examples.map((example, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">→</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span>Generate Knowledge Card</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="template">Card Template</Label>
          <Select
            value={selectedTemplate}
            onValueChange={(value: any) => setSelectedTemplate(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cardTemplates.map(template => (
                <SelectItem key={template.value} value={template.value}>
                  <div className="flex items-center space-x-2">
                    <span>{template.icon}</span>
                    <div>
                      <div className="font-medium">{template.label}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="content">Source Content</Label>
          <Textarea
            id="content"
            value={messageContent}
            readOnly
            className="min-h-[100px] bg-gray-50"
            placeholder="Message content will appear here..."
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            This will create a structured knowledge card from the message content.
          </div>
          <div className="flex items-center space-x-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Card
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
