import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { tagName, category } = await request.json()

    if (!tagName) {
      return NextResponse.json(
        { message: "Tag name is required" },
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

    // 根据标签名称生成参数
    let parameters = []
    
    if (tagName === 'translate') {
      parameters = [
        {
          name: 'targetLanguage',
          label: 'Target Language',
          type: 'select',
          required: true,
          options: [
            { value: 'Chinese', label: 'Chinese (中文)' },
            { value: 'English', label: 'English' },
            { value: 'Spanish', label: 'Spanish (Español)' },
            { value: 'French', label: 'French (Français)' },
            { value: 'German', label: 'German (Deutsch)' },
            { value: 'Japanese', label: 'Japanese (日本語)' },
            { value: 'Korean', label: 'Korean (한국어)' }
          ],
          order_index: 0
        }
      ]
    } else if (tagName === 'code-generator') {
      parameters = [
        {
          name: 'programmingLanguage',
          label: 'Programming Language',
          type: 'select',
          required: true,
          options: [
            { value: 'JavaScript', label: 'JavaScript' },
            { value: 'TypeScript', label: 'TypeScript' },
            { value: 'Python', label: 'Python' },
            { value: 'Java', label: 'Java' },
            { value: 'C++', label: 'C++' },
            { value: 'C#', label: 'C#' },
            { value: 'Go', label: 'Go' },
            { value: 'Rust', label: 'Rust' }
          ],
          order_index: 0
        }
      ]
    }

    return NextResponse.json({ parameters })
  } catch (error) {
    console.error("Parameter generation error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
