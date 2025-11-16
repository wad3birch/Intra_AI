import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { LearningPreferences } from "@/types/learning"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  // Always provide a safe default for unauthenticated users
  const defaultPreferences = {
    preferred_style: 'detailed',
    educational_level: 'high-school'
  }

  try {
    // If the user is not authenticated, fall back to defaults instead of 500
    let profile: { user_id: string } | null = null
    try {
      profile = await getServerProfile()
    } catch {
      // Not signed in; return defaults
      return NextResponse.json({ preferences: defaultPreferences })
    }

    const supabase = createClient(cookies())

    const { data: userPreferences, error } = await supabase
      .from('learning_preferences')
      .select('*')
      .eq('user_id', profile.user_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching learning preferences:", error)
      return NextResponse.json({ preferences: defaultPreferences })
    }

    if (!userPreferences) {
      return NextResponse.json({ preferences: defaultPreferences })
    }

    return NextResponse.json({ preferences: userPreferences })
  } catch (error) {
    console.error("Error fetching learning preferences:", error)
    return NextResponse.json({ preferences: defaultPreferences })
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    const preferences = {
      user_id: profile.user_id,
      preferred_style: body.preferred_style || 'detailed',
      educational_level: body.educational_level || 'high-school'
    }
    
    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from('learning_preferences')
      .upsert(preferences, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error saving learning preferences:", error)
      return NextResponse.json(
        { error: "Failed to save learning preferences" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Error saving learning preferences:", error)
    return NextResponse.json(
      { error: "Failed to save learning preferences" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    // Update existing preferences
    const { data, error } = await supabase
      .from('learning_preferences')
      .update({
        preferred_style: body.preferred_style,
        educational_level: body.educational_level
      })
      .eq('user_id', profile.user_id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating learning preferences:", error)
      return NextResponse.json(
        { error: "Failed to update learning preferences" },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Learning preferences not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Error updating learning preferences:", error)
    return NextResponse.json(
      { error: "Failed to update learning preferences" },
      { status: 500 }
    )
  }
}
