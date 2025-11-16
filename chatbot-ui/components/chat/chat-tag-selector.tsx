import { FC, useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Tag, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TagService } from "@/lib/supabase/tags"
import { CustomTag, SelectedTagWithParams } from "@/lib/types/tags"
import { getTagColor, getCustomTagStyle, isCustomColor } from "@/lib/utils/tag-utils"

interface TagWithParameters {
  name: string
  prompt: string
  parameters?: any[]
  hasParameters: boolean
}

type TagCategory = 'identity' | 'style' | 'level' | 'values' | 'task'

const tagCategories = {
  identity: {
    label: 'Identity',
    description: 'AI persona and role',
    color: 'bg-blue-100 text-blue-800'
  },
  style: {
    label: 'Style',
    description: 'Communication style',
    color: 'bg-green-100 text-green-800'
  },
  level: {
    label: 'Level',
    description: 'Knowledge complexity level',
    color: 'bg-purple-100 text-purple-800'
  },
  values: {
    label: 'Values',
    description: 'Perspective and approach',
    color: 'bg-orange-100 text-orange-800'
  },
  task: {
    label: 'Task',
    description: 'Specific task type',
    color: 'bg-pink-100 text-pink-800'
  }
}

// 预定义标签（从数据库获取的标签会合并到这里）
const predefinedTags: CustomTag[] = [
  // Identity tags
  { id: 'teacher', name: 'teacher', category: 'identity', description: 'AI acts as an educator', prompt: 'You are a knowledgeable teacher who explains concepts clearly and patiently.', color: '#3B82F6', has_parameters: false },
  { id: 'lawyer', name: 'lawyer', category: 'identity', description: 'AI acts as a legal expert', prompt: 'You are a professional lawyer with expertise in legal matters.', color: '#3B82F6', has_parameters: false },
  { id: 'friend', name: 'friend', category: 'identity', description: 'AI acts as a supportive friend', prompt: 'You are a supportive friend who provides encouragement and practical advice.', color: '#3B82F6', has_parameters: false },
  { id: 'scientist', name: 'scientist', category: 'identity', description: 'AI acts as a research scientist', prompt: 'You are a research scientist who approaches problems methodically and evidence-based.', color: '#3B82F6', has_parameters: false },
  
  // Style tags
  { id: 'concise', name: 'concise', category: 'style', description: 'Keep responses brief and to the point', prompt: 'Keep your responses concise and under 200 words. Focus on key points only.', color: '#10B981', has_parameters: false },
  { id: 'detailed', name: 'detailed', category: 'style', description: 'Provide comprehensive explanations', prompt: 'Provide detailed, comprehensive explanations with examples and context.', color: '#10B981', has_parameters: false },
  { id: 'humorous', name: 'humorous', category: 'style', description: 'Use humor and wit in responses', prompt: 'Use appropriate humor, wit, and light-heartedness in your responses.', color: '#10B981', has_parameters: false },
  { id: 'formal', name: 'formal', category: 'style', description: 'Use formal, professional language', prompt: 'Use formal, professional language and tone throughout your response.', color: '#10B981', has_parameters: false },
  
  // Level tags
  { id: 'middle-school', name: 'middle-school', category: 'level', description: 'Use middle school level vocabulary', prompt: 'Use vocabulary and concepts appropriate for middle school students (ages 11-14).', color: '#8B5CF6', has_parameters: false },
  { id: 'high-school', name: 'high-school', category: 'level', description: 'Use high school level vocabulary', prompt: 'Use vocabulary and concepts appropriate for high school students (ages 15-18).', color: '#8B5CF6', has_parameters: false },
  { id: 'expert', name: 'expert', category: 'level', description: 'Use expert-level terminology', prompt: 'Use advanced, expert-level terminology and assume deep domain knowledge.', color: '#8B5CF6', has_parameters: false },
  { id: 'beginner', name: 'beginner', category: 'level', description: 'Use beginner-friendly language', prompt: 'Use simple, beginner-friendly language with clear explanations.', color: '#8B5CF6', has_parameters: false },
  
  // Values tags
  { id: 'neutral', name: 'neutral', category: 'values', description: 'Maintain neutral perspective', prompt: 'Maintain a neutral, unbiased perspective in your response.', color: '#F59E0B', has_parameters: false },
  { id: 'critical', name: 'critical', category: 'values', description: 'Provide critical analysis', prompt: 'Provide critical analysis and question assumptions in your response.', color: '#F59E0B', has_parameters: false },
  { id: 'optimistic', name: 'optimistic', category: 'values', description: 'Maintain positive outlook', prompt: 'Maintain an optimistic, positive outlook in your response.', color: '#F59E0B', has_parameters: false },
  { id: 'practical', name: 'practical', category: 'values', description: 'Focus on practical applications', prompt: 'Focus on practical, actionable applications and real-world examples.', color: '#F59E0B', has_parameters: false },
  
  // Task tags
  { id: 'summarize', name: 'summarize', category: 'task', description: 'Summarize the main points', prompt: 'Summarize the main points and key takeaways.', color: '#EC4899', has_parameters: false },
  { id: 'translate', name: 'translate', category: 'task', description: 'Translate between languages', prompt: 'Provide accurate translation between languages.', color: '#EC4899', has_parameters: true }, // 添加translate tag并标记为有参数
  { id: 'debate', name: 'debate', category: 'task', description: 'Present multiple perspectives', prompt: 'Present multiple perspectives and arguments for debate.', color: '#EC4899', has_parameters: false },
  { id: 'brainstorm', name: 'brainstorm', category: 'task', description: 'Generate creative ideas', prompt: 'Generate creative ideas and brainstorm solutions.', color: '#EC4899', has_parameters: false }
]

interface ChatTagSelectorProps {
  selectedTags: SelectedTagWithParams[]
  onTagsChange: (tags: SelectedTagWithParams[]) => void
  onClose: () => void
  onTagSelect: (tagName: string) => void
  loadingTag?: string | null
}

export const ChatTagSelector: FC<ChatTagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  onClose,
  onTagSelect,
  loadingTag
}) => {
  const [customTags, setCustomTags] = useState<CustomTag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  // Load custom tags from database
  useEffect(() => {
    const loadCustomTags = async () => {
      try {
        setLoading(true)
        const data = await TagService.getCustomTags()
        setCustomTags(data)
      } catch (error) {
        console.error('Error loading custom tags:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCustomTags()
  }, [])

  // Memoize allTags to prevent unnecessary recalculations
  const allTags = useMemo(() => {
    return [...predefinedTags, ...customTags]
  }, [customTags])

  // Memoize filtered tags based on search and category
  const filteredTags = useMemo(() => {
    let tags = allTags

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tags = tags.filter(tag => 
        tag.name.toLowerCase().includes(query) ||
        tag.description.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (activeTab !== 'all') {
      tags = tags.filter(tag => tag.category === activeTab)
    }

    return tags
  }, [allTags, searchQuery, activeTab])

  // Memoize toggleTag function to prevent unnecessary re-renders
  const toggleTag = useCallback((tagName: string) => {
    const isSelected = selectedTags.some(tag => tag.name === tagName)
    
    if (isSelected) {
      // Remove tag
      onTagsChange(selectedTags.filter(tag => tag.name !== tagName))
    } else {
      // Add tag - let parent component handle parameterized logic
      onTagSelect(tagName)
    }
  }, [selectedTags, onTagsChange, onTagSelect])

  // Memoize tag rendering function with loading state
  const renderTag = useCallback((tag: CustomTag) => {
    const isSelected = selectedTags.some(t => t.name === tag.name)
    const hasParams = tag.has_parameters
    const isLoading = loadingTag === tag.name
    const isCustom = isCustomColor(tag.color)
    
    return (
      <Badge
        key={tag.name}
        variant={isSelected ? "default" : "outline"}
        className={`cursor-pointer transition-all duration-200 ${isCustom ? 'custom-tag-color' : getTagColor(tag.name)} hover:opacity-80 hover:scale-105 ${
          hasParams ? 'border-dashed' : ''
        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
        style={isCustom ? getCustomTagStyle(tag.color!) : undefined}
        onClick={() => !isLoading && toggleTag(tag.name)}
      >
        #{tag.name}
        {hasParams && <span className="ml-1 text-xs">⚙️</span>}
        {isLoading && <span className="ml-1 text-xs animate-spin">⏳</span>}
      </Badge>
    )
  }, [selectedTags, toggleTag, loadingTag])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-tag-selector]')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (loading) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-50" data-tag-selector>
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading tags...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50" data-tag-selector>
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Tag size={16} />
              Select Tags
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X size={16} />
            </Button>
          </div>
          
          {/* Search input */}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 px-4 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-6 h-9 mb-3 bg-gray-50">
              <TabsTrigger value="all" className="text-xs py-1">All</TabsTrigger>
              {Object.entries(tagCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-xs py-1">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2 p-1">
                {filteredTags.length > 0 ? (
                  filteredTags.map(renderTag)
                ) : (
                  <div className="text-center text-gray-500 text-sm py-8 w-full">
                    {searchQuery ? 'No tags found matching your search' : 'No tags available'}
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}