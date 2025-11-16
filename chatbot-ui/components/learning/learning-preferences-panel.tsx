import { FC, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { LearningPreferences } from "@/types/learning"
import { toast } from "sonner"
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  Palette, 
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface LearningPreferencesPanelProps {
  onClose?: () => void
  preferences?: LearningPreferences
  onPreferencesChange?: (preferences: LearningPreferences) => void
  loading?: boolean
  onLoadingChange?: (loading: boolean) => void
}

const styleOptions = [
  {
    value: 'concise',
    label: 'Concise',
    description: 'Brief, to-the-point responses',
    icon: '⚡'
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive explanations with context',
    icon: '📚'
  },
  {
    value: 'example-driven',
    label: 'Example-Driven',
    description: 'Heavy use of examples and analogies',
    icon: '💡'
  },
  {
    value: 'step-by-step',
    label: 'Step-by-Step',
    description: 'Clear, sequential instructions',
    icon: '📋'
  },
  {
    value: 'visual',
    label: 'Visual',
    description: 'Emphasis on diagrams and structured content',
    icon: '🎨'
  }
]

const complexityLevels = [
  { value: 'beginner', label: 'Beginner', description: 'Simple concepts, basic vocabulary' },
  { value: 'intermediate', label: 'Intermediate', description: 'Moderate complexity, some technical terms' },
  { value: 'advanced', label: 'Advanced', description: 'Complex concepts, technical terminology' }
]

const exampleTypes = [
  { value: 'real-world', label: 'Real-World', description: 'Practical, everyday examples' },
  { value: 'academic', label: 'Academic', description: 'Theoretical, scholarly examples' },
  { value: 'technical', label: 'Technical', description: 'Industry-specific examples' },
  { value: 'mixed', label: 'Mixed', description: 'Combination of all types' }
]

const cardTemplates = [
  { value: 'basic', label: 'Basic', description: 'Simple, clean layout' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive information' },
  { value: 'visual', label: 'Visual', description: 'Rich with icons and formatting' },
  { value: 'minimal', label: 'Minimal', description: 'Essential information only' }
]

export const LearningPreferencesPanel: FC<LearningPreferencesPanelProps> = ({ 
  onClose,
  preferences: externalPreferences,
  onPreferencesChange,
  loading: externalLoading,
  onLoadingChange
}) => {
  const [preferences, setPreferences] = useState<LearningPreferences>(
    externalPreferences || {
      user_id: '',
      educational_level: 'high-school',
      preferred_style: 'detailed'
    }
  )
  
  const [loading, setLoading] = useState(externalLoading ?? true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (externalPreferences) {
      setPreferences(externalPreferences)
    } else {
      loadPreferences()
    }
  }, [externalPreferences])

  useEffect(() => {
    if (externalLoading !== undefined) {
      setLoading(externalLoading)
    }
  }, [externalLoading])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/learning-preferences')
      const data = await response.json()
      
      if (data.preferences) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load learning preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/learning-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      if (response.ok) {
        toast.success('Learning preferences saved successfully!')
        if (onPreferencesChange) {
          onPreferencesChange(preferences)
        }
        if (onClose) {
          onClose()
        }
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save learning preferences')
    } finally {
      setSaving(false)
    }
  }

  // Educational level options
  const educationalLevels = [
    { value: 'elementary', label: 'Elementary (K-5)', description: 'Ages 5-11, basic concepts' },
    { value: 'middle-school', label: 'Middle School (6-8)', description: 'Ages 11-14, intermediate concepts' },
    { value: 'high-school', label: 'High School (9-12)', description: 'Ages 14-18, advanced concepts' },
    { value: 'undergraduate', label: 'Undergraduate', description: 'College level, professional terminology' },
    { value: 'graduate', label: 'Graduate', description: 'Advanced academic level' },
    { value: 'expert', label: 'Expert', description: 'Professional/expert level' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading preferences...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Learning Preferences</h1>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Educational Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Educational Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="level">Your Educational Level</Label>
              <Select
                value={preferences.educational_level}
                onValueChange={(value: any) => 
                  setPreferences(prev => ({ ...prev, educational_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {educationalLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Learning Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Learning Style</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="style">Preferred Response Style</Label>
              <Select
                value={preferences.preferred_style}
                onValueChange={(value: any) => 
                  setPreferences(prev => ({ ...prev, preferred_style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <span>{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
