import { FC } from "react"
import { Badge } from "@/components/ui/badge"
import { LearningPreferences } from "@/types/learning"
import { 
  Zap, 
  BookOpen, 
  Lightbulb, 
  List, 
  Palette,
  Brain,
  Target
} from "lucide-react"

interface StyleIndicatorProps {
  preferences: LearningPreferences | null
  appliedStyle?: string
  complexityLevel?: string
  className?: string
}

const styleIcons = {
  concise: Zap,
  detailed: BookOpen,
  'example-driven': Lightbulb,
  'step-by-step': List,
  visual: Palette
}

const styleColors = {
  concise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  detailed: 'bg-blue-100 text-blue-800 border-blue-200',
  'example-driven': 'bg-green-100 text-green-800 border-green-200',
  'step-by-step': 'bg-purple-100 text-purple-800 border-purple-200',
  visual: 'bg-pink-100 text-pink-800 border-pink-200'
}

const complexityIcons = {
  beginner: Brain,
  intermediate: Target,
  advanced: BookOpen
}

const complexityColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-red-100 text-red-800'
}

export const StyleIndicator: FC<StyleIndicatorProps> = ({
  preferences,
  appliedStyle,
  complexityLevel,
  className = ""
}) => {
  if (!preferences && !appliedStyle) {
    return null
  }

  const currentStyle = appliedStyle || preferences?.preferred_style || 'detailed'
  const currentComplexity = complexityLevel || preferences?.complexity_level || 'intermediate'
  
  const StyleIcon = styleIcons[currentStyle as keyof typeof styleIcons] || BookOpen
  const ComplexityIcon = complexityIcons[currentComplexity as keyof typeof complexityIcons] || Target

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge 
        className={`${styleColors[currentStyle as keyof typeof styleColors] || styleColors.detailed} flex items-center space-x-1`}
      >
        <StyleIcon className="h-3 w-3" />
        <span className="text-xs font-medium capitalize">{currentStyle.replace('-', ' ')}</span>
      </Badge>
      
      <Badge 
        className={`${complexityColors[currentComplexity as keyof typeof complexityColors] || complexityColors.intermediate} flex items-center space-x-1`}
      >
        <ComplexityIcon className="h-3 w-3" />
        <span className="text-xs font-medium capitalize">{currentComplexity}</span>
      </Badge>
    </div>
  )
}
