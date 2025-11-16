import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Create a new chat session
export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    const sessionData = {
      user_id: profile.user_id,
      educational_level: body.educational_level || 'high-school',
      preferred_style: body.preferred_style || 'detailed',
      started_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single()
    
    if (error) {
      console.error("Error creating chat session:", error)
      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("Error creating chat session:", error)
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    )
  }
}

// Get user's chat sessions
export async function GET() {
  try {
    const profile = await getServerProfile()
    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('started_at', { ascending: false })
      .limit(50) // Limit to recent 50 sessions
    
    if (error) {
      console.error("Error fetching chat sessions:", error)
      return NextResponse.json(
        { error: "Failed to fetch chat sessions" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    )
  }
}

// Update chat session (e.g., end session)
export async function PUT(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    const { session_id, ...updateData } = body
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', session_id)
      .eq('user_id', profile.user_id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating chat session:", error)
      return NextResponse.json(
        { error: "Failed to update chat session" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("Error updating chat session:", error)
    return NextResponse.json(
      { error: "Failed to update chat session" },
      { status: 500 }
    )
  }
}
