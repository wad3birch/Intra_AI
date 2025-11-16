import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Save a chat message
export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    const messageData = {
      session_id: body.session_id,
      user_id: profile.user_id,
      role: body.role, // 'user' or 'assistant'
      content: body.content,
      suggested_questions: body.suggested_questions || null,
      timestamp: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single()
    
    if (error) {
      console.error("Error saving chat message:", error)
      return NextResponse.json(
        { error: "Failed to save chat message" },
        { status: 500 }
      )
    }
    
    // Update session message count
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('message_count')
      .eq('id', body.session_id)
      .eq('user_id', profile.user_id)
      .single()
    
    if (sessionData) {
      await supabase
        .from('chat_sessions')
        .update({ message_count: (sessionData.message_count || 0) + 1 })
        .eq('id', body.session_id)
        .eq('user_id', profile.user_id)
    }
    
    return NextResponse.json({ message: data })
  } catch (error) {
    console.error("Error saving chat message:", error)
    return NextResponse.json(
      { error: "Failed to save chat message" },
      { status: 500 }
    )
  }
}

// Get messages for a specific session
export async function GET(request: Request) {
  try {
    const profile = await getServerProfile()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const supabase = createClient(cookies())
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', profile.user_id)
      .order('timestamp', { ascending: true })
    
    if (error) {
      console.error("Error fetching chat messages:", error)
      return NextResponse.json(
        { error: "Failed to fetch chat messages" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ messages: data || [] })
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    )
  }
}

// Batch save multiple messages
export async function PUT(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const supabase = createClient(cookies())
    
    const { session_id, messages } = body
    
    if (!session_id || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Session ID and messages array are required" },
        { status: 400 }
      )
    }
    
    // Prepare messages for batch insert
    const messageData = messages.map((msg: any) => ({
      session_id,
      user_id: profile.user_id,
      role: msg.role,
      content: msg.content,
      suggested_questions: msg.suggested_questions || null,
      timestamp: msg.timestamp || new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
    
    if (error) {
      console.error("Error batch saving chat messages:", error)
      return NextResponse.json(
        { error: "Failed to save chat messages" },
        { status: 500 }
      )
    }
    
    // Update session message count
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('message_count')
      .eq('id', session_id)
      .eq('user_id', profile.user_id)
      .single()
    
    if (sessionData) {
      await supabase
        .from('chat_sessions')
        .update({ message_count: (sessionData.message_count || 0) + messages.length })
        .eq('id', session_id)
        .eq('user_id', profile.user_id)
    }
    
    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error("Error batch saving chat messages:", error)
    return NextResponse.json(
      { error: "Failed to save chat messages" },
      { status: 500 }
    )
  }
}
