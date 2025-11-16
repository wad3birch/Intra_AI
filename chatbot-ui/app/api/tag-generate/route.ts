import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { tagName, category } = await request.json()

    if (!tagName || !category) {
      return NextResponse.json(
        { message: "Tag name and category are required" },
        { status: 400 }
      )
    }

    // 检查用户是否已登录
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401 }
      )
    }

    // 检查是否已存在同名标签
    const { data: existingTags, error: fetchError } = await supabase
      .from('custom_tags')
      .select('name')
      .eq('user_id', user.id)
      .eq('name', tagName)

    if (fetchError) {
      console.error('Error checking existing tags:', fetchError)
      return NextResponse.json(
        { message: "Failed to check existing tags" },
        { status: 500 }
      )
    }
    
    if (existingTags && existingTags.length > 0) {
      return NextResponse.json(
        { message: "Tag with this name already exists" },
        { status: 400 }
      )
    }

    // 这里可以添加 AI 生成逻辑
    // 暂时返回示例数据
    const generatedData = {
      description: `AI acts as a ${tagName} specialist`,
      prompt: `You are a professional ${tagName} with expertise in ${category} matters.`
    }

    return NextResponse.json(generatedData)
  } catch (error) {
    console.error("Tag generation error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
