import { NextResponse } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const profile = await getServerProfile()
    const supabase = createClient(cookies())
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '7d'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }
    
    // Get chat sessions in the time range
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, started_at, ended_at, message_count, educational_level, preferred_style')
      .eq('user_id', profile.user_id)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .order('started_at', { ascending: true })
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }
    
    // Get messages for these sessions
    const sessionIds = sessions?.map(s => s.id) || []
    let messages: any[] = []
    
    if (sessionIds.length > 0) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, session_id, role, content, timestamp')
        .in('session_id', sessionIds)
        .eq('user_id', profile.user_id)
        .order('timestamp', { ascending: true })
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
      }
      
      messages = messagesData || []
    }
    
    // Process data into daily timeline
    const timelineData = []
    const currentDate = new Date(startDate)
    
    // Add debug logging
    console.log('Timeline API Debug:', {
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionsCount: sessions?.length || 0,
      messagesCount: messages.length,
      sessions: sessions?.slice(0, 3), // Log first 3 sessions for debugging
      messages: messages.slice(0, 3) // Log first 3 messages for debugging
    })
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // More robust date filtering - handle different timestamp formats
      const daySessions = sessions?.filter(s => {
        if (!s.started_at) return false
        const sessionDate = new Date(s.started_at).toISOString().split('T')[0]
        return sessionDate === dateStr
      }) || []
      
      const dayMessages = messages.filter(m => {
        if (!m.timestamp) return false
        const messageDate = new Date(m.timestamp).toISOString().split('T')[0]
        return messageDate === dateStr
      })
      
      // Analyze learning patterns from messages
      const userMessages = dayMessages.filter(m => m.role === 'user')
      const learningPatterns = {
        exampleRequests: 0,
        explanationRequests: 0,
        codeRequests: 0,
        comparisonRequests: 0
      }
      
      userMessages.forEach(msg => {
        const content = msg.content.toLowerCase()
        if (content.includes('example') || content.includes('show me')) {
          learningPatterns.exampleRequests++
        }
        if (content.includes('explain') || content.includes('why') || content.includes('how')) {
          learningPatterns.explanationRequests++
        }
        if (content.includes('code') || content.includes('function') || content.includes('implement')) {
          learningPatterns.codeRequests++
        }
        if (content.includes('compare') || content.includes('difference') || content.includes('vs')) {
          learningPatterns.comparisonRequests++
        }
      })
      
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      timelineData.push({
        date: dateStr,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        messages: dayMessages.length,
        sessions: daySessions.length,
        avgSessionLength: daySessions.length > 0 ? Math.round(dayMessages.length / daySessions.length) : 0,
        isWeekend,
        patterns: learningPatterns
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Calculate summary statistics
    const totalMessages = messages.length
    const totalSessions = sessions?.length || 0
    const avgDailyMessages = timelineData.length > 0 ? Math.round(totalMessages / timelineData.length) : 0
    const peakDay = timelineData.reduce((max, day) => 
      day.messages > max.messages ? day : max, 
      { messages: 0, date: '', dayName: '' }
    )
    
    return NextResponse.json({
      timeline: timelineData,
      summary: {
        totalMessages,
        totalSessions,
        avgDailyMessages,
        peakDay: {
          date: peakDay.date,
          dayName: peakDay.dayName,
          messages: peakDay.messages
        }
      }
    })
    
  } catch (e) {
    console.error('Error in learning timeline API:', e)
    return NextResponse.json({ error: "Failed to fetch timeline data" }, { status: 500 })
  }
}
