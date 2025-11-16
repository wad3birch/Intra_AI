import { NextResponse } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const profile = await getServerProfile()
    const supabase = createClient(cookies())
    
    const { data: portrait, error } = await supabase
      .from('learning_portraits')
      .select('*')
      .eq('user_id', profile.user_id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching portrait:', error)
      return NextResponse.json({ error: "Failed to fetch portrait" }, { status: 500 })
    }
    
    return NextResponse.json({ portrait: portrait || null })
  } catch (e) {
    console.error('Error in GET portrait:', e)
    return NextResponse.json({ error: "Failed to fetch portrait" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const profile = await getServerProfile()
    const supabase = createClient(cookies())
    
    const { error } = await supabase
      .from('learning_portraits')
      .delete()
      .eq('user_id', profile.user_id)
    
    if (error) {
      console.error('Error deleting portrait:', error)
      return NextResponse.json({ error: "Failed to delete portrait" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in DELETE portrait:', e)
    return NextResponse.json({ error: "Failed to delete portrait" }, { status: 500 })
  }
}


