"use client"

import { FC, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, X, Save, Tag, Edit, Trash2, Copy, Check, Sparkles, RefreshCw, Loader2, Wand2, Search, Filter, FileText, Settings, Palette, Code, Database } from "lucide-react"
import { TagService } from "@/lib/supabase/tags"
import { CustomTag, TagParameter as CustomTagParameter } from "@/lib/types/tags"

interface TagDefinition {
  id: string
  name: string
  category: TagCategory
  description: string
  prompt: string
  color: string
  parameters?: TagParameter[]
  hasParameters?: boolean
}

interface TagTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  prompt: string
}

interface TagParameter {
  name: string
  type: 'text' | 'select' | 'number' | 'boolean'
  label: string
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
  defaultValue?: any
}

interface SelectedTagWithParams {
  name: string
  parameters: { [key: string]: any }
}

type TagCategory = 'identity' | 'style' | 'level' | 'values' | 'task'

const tagCategories = {
  identity: {
    label: 'Identity',
    description: 'AI persona and role',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  style: {
    label: 'Style',
    description: 'Communication style',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  level: {
    label: 'Level',
    description: 'Knowledge complexity level',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  values: {
    label: 'Values',
    description: 'Perspective and approach',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  task: {
    label: 'Task',
    description: 'Specific task type',
    color: 'bg-pink-50 text-pink-700 border-pink-200'
  }
}

const predefinedTags: TagDefinition[] = [
  // Identity tags
  { id: 'teacher', name: 'teacher', category: 'identity', description: 'AI acts as an educator', prompt: 'You are a knowledgeable teacher who explains concepts clearly and patiently.', color: 'bg-blue-100 text-blue-800' },
  { id: 'lawyer', name: 'lawyer', category: 'identity', description: 'AI acts as a legal expert', prompt: 'You are a professional lawyer with expertise in legal matters.', color: 'bg-blue-100 text-blue-800' },
  { id: 'friend', name: 'friend', category: 'identity', description: 'AI acts as a supportive friend', prompt: 'You are a supportive friend who provides encouragement and practical advice.', color: 'bg-blue-100 text-blue-800' },
  { id: 'scientist', name: 'scientist', category: 'identity', description: 'AI acts as a research scientist', prompt: 'You are a research scientist who approaches problems methodically and evidence-based.', color: 'bg-blue-100 text-blue-800' },
  
  // Style tags
  { id: 'concise', name: 'concise', category: 'style', description: 'Keep responses brief and to the point', prompt: 'Keep your responses concise and under 200 words. Focus on key points only.', color: 'bg-green-100 text-green-800' },
  { id: 'detailed', name: 'detailed', category: 'style', description: 'Provide comprehensive explanations', prompt: 'Provide detailed, comprehensive explanations with examples and context.', color: 'bg-green-100 text-green-800' },
  { id: 'humorous', name: 'humorous', category: 'style', description: 'Use humor and wit in responses', prompt: 'Use appropriate humor, wit, and light-heartedness in your responses.', color: 'bg-green-100 text-green-800' },
  { id: 'formal', name: 'formal', category: 'style', description: 'Use formal, professional language', prompt: 'Use formal, professional language and tone throughout your response.', color: 'bg-green-100 text-green-800' },
  
  // Level tags
  { id: 'middle-school', name: 'middle-school', category: 'level', description: 'Use middle school level vocabulary', prompt: 'Use vocabulary and concepts appropriate for middle school students (ages 11-14).', color: 'bg-purple-100 text-purple-800' },
  { id: 'high-school', name: 'high-school', category: 'level', description: 'Use high school level vocabulary', prompt: 'Use vocabulary and concepts appropriate for high school students (ages 15-18).', color: 'bg-purple-100 text-purple-800' },
  { id: 'expert', name: 'expert', category: 'level', description: 'Use expert-level terminology', prompt: 'Use advanced, expert-level terminology and assume deep domain knowledge.', color: 'bg-purple-100 text-purple-800' },
  { id: 'beginner', name: 'beginner', category: 'level', description: 'Use beginner-friendly language', prompt: 'Use simple, beginner-friendly language with clear explanations.', color: 'bg-purple-100 text-purple-800' },
  
  // Values tags
  { id: 'neutral', name: 'neutral', category: 'values', description: 'Maintain neutral perspective', prompt: 'Maintain a neutral, unbiased perspective in your response.', color: 'bg-orange-100 text-orange-800' },
  { id: 'critical', name: 'critical', category: 'values', description: 'Provide critical analysis', prompt: 'Provide critical analysis and question assumptions in your response.', color: 'bg-orange-100 text-orange-800' },
  { id: 'optimistic', name: 'optimistic', category: 'values', description: 'Maintain positive outlook', prompt: 'Maintain an optimistic, positive outlook in your response.', color: 'bg-orange-100 text-orange-800' },
  { id: 'practical', name: 'practical', category: 'values', description: 'Focus on practical applications', prompt: 'Focus on practical, actionable applications and real-world examples.', color: 'bg-orange-100 text-orange-800' },
  
  // Task tags
  { id: 'summarize', name: 'summarize', category: 'task', description: 'Summarize the main points', prompt: 'Summarize the main points and key takeaways.', color: 'bg-pink-100 text-pink-800' },
  { id: 'translate', name: 'translate', category: 'task', description: 'Translate between languages', prompt: 'Provide accurate translation between languages.', color: 'bg-pink-100 text-pink-800' },
  { id: 'debate', name: 'debate', category: 'task', description: 'Present multiple perspectives', prompt: 'Present multiple perspectives and arguments for debate.', color: 'bg-pink-100 text-pink-800' },
  { id: 'brainstorm', name: 'brainstorm', category: 'task', description: 'Generate creative ideas', prompt: 'Generate creative ideas and brainstorm solutions.', color: 'bg-pink-100 text-pink-800' }
]

const predefinedTemplates: TagTemplate[] = [
  {
    id: 'learning-mode',
    name: 'Learning Mode',
    description: 'Perfect for educational content',
    tags: ['teacher', 'detailed', 'beginner'],
    prompt: 'You are a knowledgeable teacher who explains concepts clearly and patiently. Provide detailed, comprehensive explanations with examples and context. Use simple, beginner-friendly language with clear explanations.'
  },
  {
    id: 'writing-mode',
    name: 'Writing Mode',
    description: 'Helpful for creative writing',
    tags: ['friend', 'humorous', 'brainstorm'],
    prompt: 'You are a supportive friend who provides encouragement and practical advice. Use appropriate humor, wit, and light-heartedness in your responses. Generate creative ideas and brainstorm solutions.'
  },
  {
    id: 'professional-mode',
    name: 'Professional Mode',
    description: 'For business and formal contexts',
    tags: ['lawyer', 'formal', 'expert', 'neutral'],
    prompt: 'You are a professional lawyer with expertise in legal matters. Use formal, professional language and tone throughout your response. Use advanced, expert-level terminology and assume deep domain knowledge. Maintain a neutral, unbiased perspective in your response.'
  }
]

// 简化的TagForm组件
const TagForm: FC<{
  formData: {
    name: string
    category: TagCategory
    description: string
    prompt: string
    color: string
  }
  setFormData: (data: any) => void
  parameters: CustomTagParameter[]
  setParameters: (params: CustomTagParameter[]) => void
  generating: boolean
  generatingParams: boolean
  onGenerateContent: () => void
  onGenerateParameters: () => void
  onAddParameter: () => void
  onUpdateParameter: (index: number, field: keyof CustomTagParameter, value: any) => void
  onRemoveParameter: (index: number) => void
  onSubmit: () => void
  onCancel: () => void
}> = ({
  formData,
  setFormData,
  parameters,
  setParameters,
  generating,
  generatingParams,
  onGenerateContent,
  onGenerateParameters,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tag Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., code-generator"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(tagCategories).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateContent}
              disabled={generating || !formData.name}
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Sparkles size={14} className="mr-1" />
              )}
              AI Generate
            </Button>
          </div>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this tag does"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateContent}
              disabled={generating || !formData.name}
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Sparkles size={14} className="mr-1" />
              )}
              AI Generate
            </Button>
          </div>
          <Textarea
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="The prompt that will be used when this tag is active"
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Parameters (Optional)</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateParameters}
              disabled={generatingParams || !formData.name}
            >
              {generatingParams ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Wand2 size={14} className="mr-1" />
              )}
              AI Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddParameter}
            >
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {parameters.map((param, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Parameter name"
                  value={param.name}
                  onChange={(e) => onUpdateParameter(index, 'name', e.target.value)}
                />
                <Select
                  value={param.type}
                  onValueChange={(value) => onUpdateParameter(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Label"
                  value={param.label}
                  onChange={(e) => onUpdateParameter(index, 'label', e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveParameter(index)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button 
          onClick={onSubmit} 
          disabled={!formData.name || !formData.description || !formData.prompt}
          className="flex-1"
        >
          <Save size={16} className="mr-2" />
          Save Tag
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function TagCustomizationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('explore')
  const [customTags, setCustomTags] = useState<TagDefinition[]>([])
  const [customTemplates, setCustomTemplates] = useState<TagTemplate[]>(predefinedTemplates)
  const [selectedTags, setSelectedTags] = useState<SelectedTagWithParams[]>([])
  const [testInput, setTestInput] = useState("")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Custom tag form state
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>('identity')
  const [newTagDescription, setNewTagDescription] = useState("")
  const [newTagPrompt, setNewTagPrompt] = useState("")
  const [generatingTag, setGeneratingTag] = useState(false)

  // 新增：参数相关状态
  const [newTagParameters, setNewTagParameters] = useState<TagParameter[]>([])
  const [editTagParameters, setEditTagParameters] = useState<TagParameter[]>([])
  const [generatingParameters, setGeneratingParameters] = useState(false)

  // Edit tag state
  const [editingTag, setEditingTag] = useState<TagDefinition | null>(null)
  const [editTagName, setEditTagName] = useState("")
  const [editTagCategory, setEditTagCategory] = useState<TagCategory>('identity')
  const [editTagDescription, setEditTagDescription] = useState("")
  const [editTagPrompt, setEditTagPrompt] = useState("")
  const [generatingEditTag, setGeneratingEditTag] = useState(false)

  // Custom template form state
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [newTemplateTags, setNewTemplateTags] = useState<string[]>([])

  // 添加tag management相关状态
  const [dbCustomTags, setDbCustomTags] = useState<CustomTag[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDbTag, setEditingDbTag] = useState<CustomTag | null>(null)

  // Form states for tag management
  const [formData, setFormData] = useState({
    name: "",
    category: "identity" as TagCategory,
    description: "",
    prompt: "",
    color: "#3B82F6"
  })
  const [parameters, setParameters] = useState<CustomTagParameter[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatingParams, setGeneratingParams] = useState(false)

  // Load saved data from localStorage
  useEffect(() => {
    const savedTags = localStorage.getItem('custom-tags')
    const savedTemplates = localStorage.getItem('custom-templates')
    
    if (savedTags) {
      setCustomTags(JSON.parse(savedTags))
    }
    if (savedTemplates) {
      setCustomTemplates(JSON.parse(savedTemplates))
    }
  }, [])

  // Save data to localStorage
  const saveToStorage = (tags: TagDefinition[], templates: TagTemplate[]) => {
    localStorage.setItem('custom-tags', JSON.stringify(tags))
    localStorage.setItem('custom-templates', JSON.stringify(templates))
  }

  // 删除toggleTag函数，因为explore tags不再需要选择功能
  // const toggleTag = (tagName: string) => {
  //   setSelectedTags(prev => 
  //     prev.includes(tagName) 
  //       ? prev.filter(t => t !== tagName)
  //       : [...prev, tagName]
  //   )
  // }

  const generatePrompt = () => {
    const allTags = [...predefinedTags, ...customTags]
    const selectedTagObjects = allTags.filter(tag => selectedTags.some(st => st.name === tag.name))
    
    const prompt = selectedTagObjects.map(tag => {
      const tagWithParams = allTags.find(t => t.name === tag.name);
      if (tagWithParams && tagWithParams.hasParameters) {
        const params = selectedTags.find(st => st.name === tag.name)?.parameters || {};
        return `${tag.prompt} ${Object.entries(params).map(([name, value]) => `${name}: ${value}`).join(' ')}`;
      }
      return tag.prompt;
    }).join(' ')
    setGeneratedPrompt(prompt)
  }

  const parseTagsFromInput = (input: string) => {
    const tagMatches = input.match(/#\w+/g)
    if (tagMatches) {
      const tagNames = tagMatches.map(tag => tag.substring(1))
      setSelectedTags(prev => prev.filter(st => tagNames.includes(st.name)))
    }
  }

  // 在 generateTagContent 函数中添加更详细的错误处理和调试信息
  const generateTagContent = async (isEdit = false) => {
    const tagName = isEdit ? editTagName : newTagName
    const category = isEdit ? editTagCategory : newTagCategory
    
    console.log('Generating tag content:', { tagName, category, isEdit })
    
    if (!tagName.trim()) {
      console.log('No tag name provided')
      alert('请先输入标签名称')
      return
    }

    if (isEdit) {
      setGeneratingEditTag(true)
    } else {
      setGeneratingTag(true)
    }

    try {
      const requestBody = {
        tagName: tagName.trim(),
        category: category
      }
      
      console.log('Sending request to /api/tag-generate:', requestBody)
      
      const response = await fetch('/api/tag-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        // 提供更具体的错误信息
        if (errorData.message?.includes('API Key not found') || errorData.message?.includes('API key not found')) {
          alert('请先配置OpenAI API密钥！\n\n请前往：设置 → 个人资料设置 → API密钥配置')
          return
        } else if (errorData.message?.includes('User not found') || errorData.message?.includes('Profile not found')) {
          alert('用户认证失败，请重新登录！')
          return
        } else if (errorData.message?.includes('incorrect api key')) {
          alert('OpenAI API密钥配置错误，请检查密钥是否正确！')
          return
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response data:', data)
      
      if (isEdit) {
        setEditTagDescription(data.description)
        setEditTagPrompt(data.prompt)
      } else {
        setNewTagDescription(data.description)
        setNewTagPrompt(data.prompt)
      }
      
      // 显示成功消息
      console.log('Tag content generated successfully!')
    } catch (error) {
      console.error("Tag generation failed:", error)
      // 显示更友好的错误信息
      const errorMessage = error.message || "生成标签内容失败"
      alert(`生成标签内容失败: ${errorMessage}`)
    } finally {
      if (isEdit) {
        setGeneratingEditTag(false)
      } else {
        setGeneratingTag(false)
      }
    }
  }

  // 新增：参数相关函数
  const addParameter = (isEdit: boolean) => {
    const newParam: TagParameter = {
      name: '',
      type: 'text',
      label: '',
      required: false
    }
    
    if (isEdit) {
      setEditTagParameters(prev => [...prev, newParam])
    } else {
      setNewTagParameters(prev => [...prev, newParam])
    }
  }

  const removeParameter = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditTagParameters(prev => prev.filter((_, i) => i !== index))
    } else {
      setNewTagParameters(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateParameter = (index: number, field: keyof TagParameter, value: any, isEdit: boolean) => {
    if (isEdit) {
      setEditTagParameters(prev => prev.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      ))
    } else {
      setNewTagParameters(prev => prev.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      ))
    }
  }

  const generateTagParameters = async (tagName: string, isEdit: boolean) => {
    if (!tagName.trim()) return

    if (isEdit) {
      setGeneratingParameters(true)
    } else {
      setGeneratingParameters(true)
    }

    try {
      const response = await fetch('/api/tag-parameters-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagName: tagName.trim(),
          category: isEdit ? editTagCategory : newTagCategory
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (isEdit) {
        setEditTagParameters(data.parameters || [])
      } else {
        setNewTagParameters(data.parameters || [])
      }
    } catch (error) {
      console.error("Parameter generation failed:", error)
      // You could add a toast notification here
    } finally {
      setGeneratingParameters(false)
    }
  }

  const addCustomTag = () => {
    if (!newTagName || !newTagDescription || !newTagPrompt) return

    const newTag: TagDefinition = {
      id: Date.now().toString(),
      name: newTagName,
      category: newTagCategory,
      description: newTagDescription,
      prompt: newTagPrompt,
      color: tagCategories[newTagCategory].color,
      parameters: newTagParameters.length > 0 ? newTagParameters : undefined,
      hasParameters: newTagParameters.length > 0
    }
    
    const updatedTags = [...customTags, newTag]
    setCustomTags(updatedTags)
    saveToStorage(updatedTags, customTemplates)
    
    // Reset form
    setNewTagName("")
    setNewTagDescription("")
    setNewTagPrompt("")
    setNewTagCategory('identity')
    setNewTagParameters([])
  }

  const startEditTag = (tag: TagDefinition) => {
    setEditingTag(tag)
    setEditTagName(tag.name)
    setEditTagCategory(tag.category)
    setEditTagDescription(tag.description)
    setEditTagPrompt(tag.prompt)
    setEditTagParameters(tag.parameters || [])
  }

  const saveEditTag = () => {
    if (!editingTag || !editTagName || !editTagDescription || !editTagPrompt) return

    const updatedTag: TagDefinition = {
      ...editingTag,
      name: editTagName,
      category: editTagCategory,
      description: editTagDescription,
      prompt: editTagPrompt,
      color: tagCategories[editTagCategory].color,
      parameters: editTagParameters.length > 0 ? editTagParameters : undefined,
      hasParameters: editTagParameters.length > 0
    }
    
    const updatedTags = customTags.map(tag => 
      tag.id === editingTag.id ? updatedTag : tag
    )
    setCustomTags(updatedTags)
    saveToStorage(updatedTags, customTemplates)
    
    // Reset edit state
    setEditingTag(null)
    setEditTagName("")
    setEditTagDescription("")
    setEditTagPrompt("")
    setEditTagCategory('identity')
    setEditTagParameters([])
  }

  const cancelEditTag = () => {
    setEditingTag(null)
    setEditTagName("")
    setEditTagDescription("")
    setEditTagPrompt("")
    setEditTagCategory('identity')
    setEditTagParameters([])
  }

  const deleteCustomTag = (tagId: string) => {
    const updatedTags = customTags.filter(tag => tag.id !== tagId)
    setCustomTags(updatedTags)
    saveToStorage(updatedTags, customTemplates)
    
    // Remove from selected tags if it was selected
    const tagToDelete = customTags.find(tag => tag.id === tagId)
    if (tagToDelete) {
      setSelectedTags(prev => prev.filter(st => st.name !== tagToDelete.name))
    }
  }

  const addCustomTemplate = () => {
    if (!newTemplateName || !newTemplateDescription || newTemplateTags.length === 0) return

    const allTags = [...predefinedTags, ...customTags]
    const selectedTagObjects = allTags.filter(tag => newTemplateTags.includes(tag.name))
    const combinedPrompt = selectedTagObjects.map(tag => {
      const tagWithParams = allTags.find(t => t.name === tag.name);
      if (tagWithParams && tagWithParams.hasParameters) {
        const params = selectedTags.find(st => st.name === tag.name)?.parameters || {};
        return `${tag.prompt} ${Object.entries(params).map(([name, value]) => `${name}: ${value}`).join(' ')}`;
      }
      return tag.prompt;
    }).join(' ')

    const newTemplate: TagTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      description: newTemplateDescription,
      tags: newTemplateTags,
      prompt: combinedPrompt
    }
    
    const updatedTemplates = [...customTemplates, newTemplate]
    setCustomTemplates(updatedTemplates)
    saveToStorage(customTags, updatedTemplates)
    
    // Reset form
    setNewTemplateName("")
    setNewTemplateDescription("")
    setNewTemplateTags([])
  }

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId)
    setCustomTemplates(updatedTemplates)
    saveToStorage(customTags, updatedTemplates)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const allTags = [...predefinedTags, ...customTags]
  const selectedTagObjects = allTags.filter(tag => selectedTags.some(st => st.name === tag.name))

  // 在 generateTagContent 函数之前添加调试信息
  const debugButtonState = () => {
    console.log('Button state debug:', {
      generatingTag,
      generatingEditTag,
      editingTag: !!editingTag,
      tagName: editingTag ? editTagName : newTagName,
      isDisabled: generatingTag || generatingEditTag || !(editingTag ? editTagName : newTagName)
    })
  }

  // 添加tag management相关函数
  const loadCustomTags = async () => {
    console.log('Loading custom tags...')
    try {
      setLoadingTags(true)
      const data = await TagService.getCustomTags()
      console.log('Loaded custom tags:', data)
      setDbCustomTags(data)
    } catch (error) {
      console.error('Error loading custom tags:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    } finally {
      setLoadingTags(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "identity",
      description: "",
      prompt: "",
      color: "#3B82F6"
    })
    setParameters([])
  }

  const generateContent = async () => {
    if (!formData.name.trim()) {
      alert('请先输入标签名称')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/tag-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagName: formData.name.trim(),
          category: formData.category
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        description: data.description,
        prompt: data.prompt
      }))
    } catch (error) {
      console.error("Tag generation failed:", error)
      alert("生成标签内容失败")
    } finally {
      setGenerating(false)
    }
  }

  const generateParameters = async () => {
    if (!formData.name.trim()) {
      alert('请先输入标签名称')
      return
    }

    setGeneratingParams(true)
    try {
      const response = await fetch('/api/tag-parameters-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagName: formData.name.trim(),
          category: formData.category
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data = await response.json()
      setParameters(data.parameters || [])
    } catch (error) {
      console.error("Parameter generation failed:", error)
      alert("生成标签参数失败")
    } finally {
      setGeneratingParams(false)
    }
  }

  // 重命名数据库相关的函数以避免冲突
  const addDbParameter = () => {
    setParameters(prev => [...prev, {
      name: '',
      label: '',
      type: 'text',
      required: false
    }])
  }

  const updateDbParameter = (index: number, field: keyof CustomTagParameter, value: any) => {
    setParameters(prev => prev.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    ))
  }

  const removeDbParameter = (index: number) => {
    setParameters(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateTag = async () => {
    console.log('Starting to create tag with data:', {
      formData,
      parameters,
      parametersLength: parameters.length
    })

    try {
      console.log('Calling TagService.createTag...')
      const newTag = await TagService.createTag({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        prompt: formData.prompt,
        color: formData.color,
        has_parameters: parameters.length > 0
      })

      console.log('Tag created successfully:', newTag)

      if (parameters.length > 0) {
        console.log('Creating tag parameters...')
        await TagService.createTagParameters(newTag.id!, parameters)
        console.log('Tag parameters created successfully')
      }

      console.log('Reloading custom tags...')
      await loadCustomTags()
      console.log('Custom tags reloaded')
      
      resetForm()
      setIsCreateDialogOpen(false)
      console.log('Tag creation completed successfully')
    } catch (error) {
      console.error('Error creating tag:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData,
        parameters
      })
      // 添加用户友好的错误提示
      alert(`创建标签失败: ${error.message || '请检查网络连接或重试'}`)
    }
  }

  const startEdit = async (tag: CustomTag) => {
    setEditingDbTag(tag)
    setFormData({
      name: tag.name,
      category: tag.category as TagCategory,
      description: tag.description,
      prompt: tag.prompt,
      color: tag.color
    })
    
    // 确保参数正确加载
    const parameters = tag.parameters || []
    console.log('Loading parameters for edit:', parameters)
    setParameters(parameters)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTag = async () => {
    if (!editingDbTag) return

    try {
      await TagService.updateTag(editingDbTag.id!, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        prompt: formData.prompt,
        color: formData.color,
        has_parameters: parameters.length > 0
      })

      if (parameters.length > 0) {
        await TagService.updateTagParameters(editingDbTag.id!, parameters)
      }

      await loadCustomTags()
      resetForm()
      setEditingDbTag(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating tag:', error)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？')) return

    try {
      await TagService.deleteTag(tagId)
      await loadCustomTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  const filteredCustomTags = dbCustomTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || tag.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 在useEffect中加载自定义标签
  useEffect(() => {
    loadCustomTags()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 简化的Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Tag size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Tag Customization
                </h1>
                <p className="text-sm text-gray-500">Customize and manage your content tags</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* 简化的Tab导航 */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="explore">Explore Tags</TabsTrigger>
              <TabsTrigger value="combine">Combine Tags</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom Tags</TabsTrigger>
            </TabsList>
          </div>

          {/* Explore Tags Tab */}
          <TabsContent value="explore" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Explore Available Tags</h2>
                <p className="text-gray-600 text-sm">Discover predefined tags to enhance your AI interactions</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(tagCategories).map(([categoryKey, category]) => (
                  <Card key={categoryKey} className="h-fit">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className={`px-3 py-1 rounded-md text-sm font-medium border ${category.color}`}>
                          {category.label}
                        </div>
                        <span className="text-sm text-gray-600">{category.description}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {allTags
                          .filter(tag => tag.category === categoryKey)
                          .map(tag => (
                            <div
                              key={tag.id}
                              className="group flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Badge className={`${tag.color} text-xs`}>
                                  #{tag.name}
                                </Badge>
                                <span className="text-sm text-gray-600 truncate">
                                  {tag.description}
                                </span>
                              </div>
                              {customTags.some(ct => ct.id === tag.id) && (
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      startEditTag(tag)
                                      setActiveTab('custom')
                                    }}
                                    className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCustomTag(tag.id)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Combine Tags Tab */}
          <TabsContent value="combine" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Combine Tags</h2>
                <p className="text-gray-600 text-sm">Test and combine multiple tags to create powerful AI prompts</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Selected Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        {selectedTags.length === 0 ? (
                          <span className="text-gray-400 text-sm">No tags selected</span>
                        ) : (
                          selectedTags.map(st => (
                            <Badge
                              key={st.name}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              #{st.name}
                              {st.parameters && Object.keys(st.parameters).length > 0 && (
                                <span className="ml-1 text-xs">⚙️</span>
                              )}
                              <X
                                size={14}
                                className="cursor-pointer hover:text-red-500 ml-1"
                                onClick={() => {
                                  setSelectedTags(prev => prev.filter(t => t.name !== st.name))
                                }}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Test Input (with #tags)</label>
                        <Textarea
                          value={testInput}
                          onChange={(e) => {
                            setTestInput(e.target.value)
                            parseTagsFromInput(e.target.value)
                          }}
                          placeholder="Type your question with #tags like: #teacher #concise #middle-school How does photosynthesis work?"
                          className="resize-none"
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={generatePrompt} 
                        className="w-full"
                      >
                        Generate Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Generated Prompt</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {selectedTagObjects.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 text-sm text-gray-700">Tag Explanations:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedTagObjects.map(tag => {
                              const tagWithParams = allTags.find(t => t.name === tag.name);
                              if (tagWithParams && tagWithParams.hasParameters) {
                                const params = selectedTags.find(st => st.name === tag.name)?.parameters || {};
                                return (
                                  <div key={tag.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <Badge className={`${tag.color} text-xs`}>#{tag.name}</Badge>
                                    <span className="text-sm text-gray-600">{tag.description}</span>
                                    <span className="text-xs text-gray-500">
                                      {Object.entries(params).map(([name, value]) => `${name}: ${value}`).join(' ')}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div key={tag.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Badge className={`${tag.color} text-xs`}>#{tag.name}</Badge>
                                  <span className="text-sm text-gray-600">{tag.description}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {generatedPrompt && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-700">Combined Prompt:</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(generatedPrompt)}
                            >
                              {copiedText === generatedPrompt ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </Button>
                          </div>
                          <div className="p-3 bg-gray-100 rounded text-sm max-h-48 overflow-y-auto">
                            {generatedPrompt}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Tag Templates</h2>
                <p className="text-gray-600 text-sm">Create and manage tag combinations for different use cases</p>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Create New Template</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Template Name</label>
                          <Input 
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="e.g., Creative Writing Mode" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Description</label>
                          <Input 
                            value={newTemplateDescription}
                            onChange={(e) => setNewTemplateDescription(e.target.value)}
                            placeholder="Brief description of this template" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Select Tags</label>
                        <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                          {allTags.map(tag => (
                            <Badge
                              key={tag.id}
                              variant={newTemplateTags.includes(tag.name) ? "default" : "outline"}
                              className={`cursor-pointer ${tag.color} text-xs`}
                              onClick={() => {
                                setNewTemplateTags(prev => 
                                  prev.includes(tag.name)
                                    ? prev.filter(t => t !== tag.name)
                                    : [...prev, tag.name]
                                )
                              }}
                            >
                              #{tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={addCustomTemplate} 
                        className="w-full"
                      >
                        <Plus size={16} className="mr-2" />
                        Create Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customTemplates.map(template => (
                    <Card key={template.id} className="h-fit">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="truncate">{template.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </CardTitle>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTags(template.tags.map(name => ({ name, parameters: {} })))
                              setActiveTab('combine')
                            }}
                            className="w-full"
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Custom Tags Tab */}
          <TabsContent value="custom" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">My Custom Tags</h2>
                    <p className="text-gray-600 text-sm">Create and manage your personalized AI tags</p>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus size={16} className="mr-2" />
                        Create Tag
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Create New Tag</DialogTitle>
                      </DialogHeader>
                      <TagForm
                        formData={formData}
                        setFormData={setFormData}
                        parameters={parameters}
                        setParameters={setParameters}
                        generating={generating}
                        generatingParams={generatingParams}
                        onGenerateContent={generateContent}
                        onGenerateParameters={generateParameters}
                        onAddParameter={addDbParameter}
                        onUpdateParameter={updateDbParameter}
                        onRemoveParameter={removeDbParameter}
                        onSubmit={handleCreateTag}
                        onCancel={() => setIsCreateDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search tags..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {Object.entries(tagCategories).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        onClick={loadCustomTags}
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Tags ({filteredCustomTags.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loadingTags ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Parameters</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomTags.map((tag) => (
                              <TableRow key={tag.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${tag.color} text-xs`}>
                                      #{tag.name}
                                    </Badge>
                                    {tag.has_parameters && (
                                      <span className="text-xs text-gray-500">⚙️</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`${tagCategories[tag.category as TagCategory]?.color} text-xs`}>
                                    {tagCategories[tag.category as TagCategory]?.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-gray-600">
                                  {tag.description}
                                </TableCell>
                                <TableCell className="text-gray-600">
                                  {tag.parameters?.length || 0} parameters
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEdit(tag)}
                                      className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTag(tag.id!)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Edit Tag: {editingDbTag?.name}</DialogTitle>
                    </DialogHeader>
                    <TagForm
                      formData={formData}
                      setFormData={setFormData}
                      parameters={parameters}
                      setParameters={setParameters}
                      generating={generating}
                      generatingParams={generatingParams}
                      onGenerateContent={generateContent}
                      onGenerateParameters={generateParameters}
                      onAddParameter={addDbParameter}
                      onUpdateParameter={updateDbParameter}
                      onRemoveParameter={removeDbParameter}
                      onSubmit={handleUpdateTag}
                      onCancel={() => {
                        setEditingDbTag(null)
                        setIsEditDialogOpen(false)
                        resetForm()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
