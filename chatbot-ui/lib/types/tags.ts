export interface TagParameter {
  id?: string
  name: string
  label: string
  type: 'text' | 'select' | 'textarea' | 'number' | 'boolean'
  options?: Array<{ value: string; label: string }>
  required?: boolean
  default_value?: string
  order_index?: number
}

export interface CustomTag {
  id?: string
  user_id?: string
  name: string
  category: string
  description: string
  prompt: string
  color: string
  has_parameters: boolean
  parameters?: TagParameter[]
  created_at?: string
  updated_at?: string
}

export interface TagWithParameters extends CustomTag {
  parameters: TagParameter[]
}

// 添加选中的标签类型，包含颜色信息
export interface SelectedTagWithParams {
  name: string
  parameters: { [key: string]: any }
  color?: string
  category?: string
}
