import { CustomTag, SelectedTagWithParams } from '@/lib/types/tags'

// 预定义标签颜色映射
const tagColors: { [key: string]: string } = {
  // Identity tags
  'teacher': 'bg-blue-100 text-blue-800 border-blue-200',
  'lawyer': 'bg-blue-100 text-blue-800 border-blue-200',
  'friend': 'bg-blue-100 text-blue-800 border-blue-200',
  'scientist': 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Style tags
  'concise': 'bg-green-100 text-green-800 border-green-200',
  'detailed': 'bg-green-100 text-green-800 border-green-200',
  'humorous': 'bg-green-100 text-green-800 border-green-200',
  'formal': 'bg-green-100 text-green-800 border-green-200',
  
  // Level tags
  'middle-school': 'bg-purple-100 text-purple-800 border-purple-200',
  'high-school': 'bg-purple-100 text-purple-800 border-purple-200',
  'expert': 'bg-purple-100 text-purple-800 border-purple-200',
  'beginner': 'bg-purple-100 text-purple-800 border-purple-200',
  
  // Values tags
  'neutral': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-orange-100 text-orange-800 border-orange-200',
  'optimistic': 'bg-orange-100 text-orange-800 border-orange-200',
  'practical': 'bg-orange-100 text-orange-800 border-orange-200',
  
  // Task tags
  'summarize': 'bg-pink-100 text-pink-800 border-pink-200',
  'translate': 'bg-pink-100 text-pink-800 border-pink-200',
  'code-generator': 'bg-pink-100 text-pink-800 border-pink-200',
  'debate': 'bg-pink-100 text-pink-800 border-pink-200',
  'brainstorm': 'bg-pink-100 text-pink-800 border-pink-200'
}

// 获取标签颜色类名
export const getTagColor = (tagName: string, customColor?: string): string => {
  if (customColor) {
    return 'custom-tag-color'
  }
  return tagColors[tagName] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// 获取自定义颜色的内联样式
export const getCustomTagStyle = (customColor: string) => {
  return {
    backgroundColor: `${customColor}20`, // 20% opacity
    color: customColor,
    borderColor: `${customColor}40` // 40% opacity
  }
}

// 检查是否为自定义颜色
export const isCustomColor = (color?: string): boolean => {
  if (!color) return false
  const defaultColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899']
  return !defaultColors.includes(color)
}

// 从标签对象创建选中标签
export const createSelectedTag = (tag: CustomTag, parameters: { [key: string]: any } = {}): SelectedTagWithParams => {
  return {
    name: tag.name,
    parameters,
    color: tag.color,
    category: tag.category
  }
}

// 从标签名称创建选中标签（用于预定义标签）
export const createSelectedTagFromName = (tagName: string, parameters: { [key: string]: any } = {}): SelectedTagWithParams => {
  return {
    name: tagName,
    parameters,
    color: undefined,
    category: undefined
  }
}
