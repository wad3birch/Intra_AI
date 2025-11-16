import { createClient } from './client'
import { CustomTag, TagParameter, TagWithParameters } from '../types/tags'

const supabase = createClient()

export class TagService {
  // 获取用户的所有自定义标签
  static async getCustomTags(): Promise<CustomTag[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('custom_tags')
      .select(`
        *,
        parameters:tag_parameters(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching custom tags:', error)
      throw error
    }

    // 转换数据格式以匹配TypeScript类型
    const transformedData = (data || []).map(tag => ({
      ...tag,
      parameters: tag.parameters?.map((param: any) => ({
        id: param.id,
        name: param.name,
        label: param.label,
        type: param.type,
        options: param.options,
        required: param.required || false,
        default_value: param.default_value,
        order_index: param.order_index || 0
      })) || []
    }))

    return transformedData
  }

  // 获取单个标签及其参数
  static async getTagWithParameters(tagId: string): Promise<TagWithParameters | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('custom_tags')
      .select(`
        *,
        parameters:tag_parameters(*)
      `)
      .eq('id', tagId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching tag with parameters:', error)
      return null
    }

    // 转换数据格式
    const transformedData = {
      ...data,
      parameters: data.parameters?.map((param: any) => ({
        id: param.id,
        name: param.name,
        label: param.label,
        type: param.type,
        options: param.options,
        required: param.required || false,
        default_value: param.default_value,
        order_index: param.order_index || 0
      })) || []
    }

    return transformedData
  }

  // 创建新标签
  static async createTag(tag: Omit<CustomTag, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<CustomTag> {
    console.log('TagService.createTag called with:', tag)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      console.error('No user found')
      throw new Error('User not authenticated')
    }

    console.log('User authenticated:', user.id)

    const insertData = { ...tag, user_id: user.id }
    console.log('Inserting data:', insertData)

    const { data, error } = await supabase
      .from('custom_tags')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Database error creating tag:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('Tag created successfully:', data)
    return data
  }

  // 更新标签
  static async updateTag(tagId: string, updates: Partial<CustomTag>): Promise<CustomTag> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('custom_tags')
      .update(updates)
      .eq('id', tagId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag:', error)
      throw error
    }

    return data
  }

  // 删除标签
  static async deleteTag(tagId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('custom_tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  // 创建标签参数
  static async createTagParameters(tagId: string, parameters: Omit<TagParameter, 'id' | 'tag_id' | 'created_at' | 'updated_at'>[]): Promise<TagParameter[]> {
    const parametersWithTagId = parameters.map(param => ({
      ...param,
      tag_id: tagId
    }))

    const { data, error } = await supabase
      .from('tag_parameters')
      .insert(parametersWithTagId)
      .select()

    if (error) {
      console.error('Error creating tag parameters:', error)
      throw error
    }

    return data || []
  }

  // 更新标签参数
  static async updateTagParameters(tagId: string, parameters: TagParameter[]): Promise<TagParameter[]> {
    // 先删除现有参数
    const { error: deleteError } = await supabase
      .from('tag_parameters')
      .delete()
      .eq('tag_id', tagId)

    if (deleteError) {
      console.error('Error deleting existing parameters:', deleteError)
      throw deleteError
    }

    // 如果没有参数，直接返回空数组
    if (parameters.length === 0) {
      return []
    }

    // 插入新参数 - 移除id字段，让数据库自动生成
    const parametersWithTagId = parameters.map(param => {
      const { id, ...paramWithoutId } = param
      return {
        ...paramWithoutId,
        tag_id: tagId,
        // 确保必需字段有默认值
        required: param.required || false,
        order_index: param.order_index || 0
      }
    })

    const { data, error } = await supabase
      .from('tag_parameters')
      .insert(parametersWithTagId)
      .select()

    if (error) {
      console.error('Error updating tag parameters:', error)
      throw error
    }

    return data || []
  }

  // 根据标签名称获取参数（用于代码生成器标签）
  static async getTagParametersByName(tagName: string): Promise<TagParameter[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('custom_tags')
      .select(`
        parameters:tag_parameters(*)
      `)
      .eq('name', tagName)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching tag parameters by name:', error)
      return []
    }

    // 转换数据格式
    const transformedParameters = data?.parameters?.map((param: any) => ({
      id: param.id,
      name: param.name,
      label: param.label,
      type: param.type,
      options: param.options,
      required: param.required || false,
      default_value: param.default_value,
      order_index: param.order_index || 0
    })) || []

    return transformedParameters
  }
}
