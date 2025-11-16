import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { KnowledgeTopic } from "@/types/learning"

export async function POST() {
  try {
    const profile = await getServerProfile()
    const supabase = createClient(cookies())

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    // Fetch real user data
    const [chatMessagesResult, learningEventsResult, preferencesResult] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('content, role, timestamp, suggested_questions')
        .eq('user_id', profile.user_id)
        .order('timestamp', { ascending: false })
        .limit(50),
      supabase
        .from('learning_events')
        .select('event_type, payload, timestamp')
        .eq('user_id', profile.user_id)
        .order('timestamp', { ascending: false })
        .limit(30),
      supabase
        .from('learning_preferences')
        .select('*')
        .eq('user_id', profile.user_id)
        .single()
    ])

    const chatMessages = chatMessagesResult.data || []
    const learningEvents = learningEventsResult.data || []
    const preferences = preferencesResult.data

    // Analyze user patterns
    const analysis = analyzeUserPatterns(chatMessages, learningEvents, preferences)

    // Extract knowledge topics from chat messages using AI
    const knowledgeTopics = await extractKnowledgeTopics(
      openai,
      chatMessages,
      preferences?.educational_level || 'high-school'
    )

    const system = `You are a learning science advisor. Generate a comprehensive learning portrait based on real user data. 

Output JSON with these keys:
- summary: Brief overview of learning style and patterns
- preferred_style: Learning style preference (concise, detailed, example-driven, step-by-step, visual)
- strengths: Key learning strengths identified
- challenges: Areas for improvement
- pacing: Learning pace and intensity
- recommendations: Specific actionable recommendations
- next_questions: Array of 3-5 personalized follow-up questions

Base your analysis on the provided data patterns. Keep responses specific and actionable.`

    const user = `User Learning Data Analysis:
${JSON.stringify(analysis, null, 2)}

${knowledgeTopics.length > 0 ? `\nKnowledge Topics Identified:\n${JSON.stringify(knowledgeTopics.map(kt => ({ topic: kt.topic, mastery: kt.mastery_level })), null, 2)}` : ''}

Generate a personalized learning portrait based on this data.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.5,
      max_tokens: CHAT_SETTING_LIMITS['gpt-4o-mini']?.MAX_TOKEN_OUTPUT_LENGTH || 800
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let portrait
    try {
      portrait = JSON.parse(content)
    } catch {
      portrait = { summary: content }
    }

    // Save to database - include both AI-generated portrait and raw analysis data
    const { error: saveError } = await supabase
      .from('learning_portraits')
      .upsert({
        user_id: profile.user_id,
        ...portrait,
        // Include raw analysis data for UI display
        usage_metrics: analysis.usage_metrics,
        learning_patterns: analysis.learning_patterns,
        event_activity: analysis.event_activity,
        recent_activity: analysis.recent_activity,
        // Include knowledge topics for gap analysis
        knowledge_topics: knowledgeTopics,
        last_updated: new Date().toISOString()
      })

    if (saveError) {
      console.error('Error saving portrait:', saveError)
      console.error('Error details:', {
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint,
        code: saveError.code
      })
      return NextResponse.json({ 
        error: "Failed to save portrait",
        details: saveError.message || 'Unknown database error',
        hint: saveError.hint || 'Check if database migrations are up to date'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      portrait: { 
        ...portrait, 
        // Include raw analysis data in response
        usage_metrics: analysis.usage_metrics,
        learning_patterns: analysis.learning_patterns,
        event_activity: analysis.event_activity,
        recent_activity: analysis.recent_activity,
        // Include knowledge topics in response
        knowledge_topics: knowledgeTopics,
        last_updated: new Date().toISOString() 
      } 
    })
  } catch (e: any) {
    console.error('Failed to generate portrait', e)
    return NextResponse.json({ error: e?.message || 'Failed to generate portrait' }, { status: 500 })
  }
}

// Helper function to analyze user patterns
function analyzeUserPatterns(chatMessages: any[], learningEvents: any[], preferences: any) {
  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Filter recent messages
  const recentMessages = chatMessages.filter(msg => 
    new Date(msg.timestamp) >= last30Days
  )
  
  const recentEvents = learningEvents.filter(event => 
    new Date(event.timestamp) >= last30Days
  )

  // Calculate metrics
  const totalMessages = recentMessages.length
  const userMessages = recentMessages.filter(msg => msg.role === 'user')
  const assistantMessages = recentMessages.filter(msg => msg.role === 'assistant')
  
  // Analyze content patterns
  const questionPatterns = userMessages.map(msg => {
    const content = msg.content.toLowerCase()
    return {
      asksQuestions: content.includes('?'),
      requestsExamples: content.includes('example') || content.includes('show me'),
      requestsExplanation: content.includes('explain') || content.includes('how'),
      requestsCode: content.includes('code') || content.includes('function'),
      requestsComparison: content.includes('difference') || content.includes('compare')
    }
  })

  const patterns = {
    totalQuestions: questionPatterns.filter(p => p.asksQuestions).length,
    exampleRequests: questionPatterns.filter(p => p.requestsExamples).length,
    explanationRequests: questionPatterns.filter(p => p.requestsExplanation).length,
    codeRequests: questionPatterns.filter(p => p.requestsCode).length,
    comparisonRequests: questionPatterns.filter(p => p.requestsComparison).length
  }

  // Calculate session patterns
  const sessions = new Set(recentMessages.map(msg => msg.timestamp.split('T')[0])).size
  const avgMessagesPerSession = totalMessages / Math.max(sessions, 1)

  // Analyze learning events
  const eventTypes = recentEvents.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {})

  return {
    user_preferences: preferences,
    usage_metrics: {
      total_messages_30d: totalMessages,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      sessions_30d: sessions,
      avg_messages_per_session: Math.round(avgMessagesPerSession * 10) / 10
    },
    learning_patterns: patterns,
    event_activity: eventTypes,
    recent_activity: {
      last_7_days_messages: chatMessages.filter(msg => 
        new Date(msg.timestamp) >= last7Days
      ).length,
      most_active_day: getMostActiveDay(recentMessages),
      preferred_time: getPreferredTime(recentMessages)
    }
  }
}

function getMostActiveDay(messages: any[]) {
  if (messages.length === 0) {
    return 'No data available'
  }
  
  const dayCounts = messages.reduce((acc, msg) => {
    const day = new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'long' })
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})
  
  const entries = Object.entries(dayCounts)
  if (entries.length === 0) {
    return 'No data available'
  }
  
  return entries.reduce((a, b) => 
    dayCounts[a[0]] > dayCounts[b[0]] ? a : b
  )[0]
}

function getPreferredTime(messages: any[]) {
  if (messages.length === 0) {
    return 'No data available'
  }
  
  const hourCounts = messages.reduce((acc, msg) => {
    const hour = new Date(msg.timestamp).getHours()
    const timeSlot = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
    acc[timeSlot] = (acc[timeSlot] || 0) + 1
    return acc
  }, {})
  
  const entries = Object.entries(hourCounts)
  if (entries.length === 0) {
    return 'No data available'
  }
  
  return entries.reduce((a, b) => 
    hourCounts[a[0]] > hourCounts[b[0]] ? a : b
  )[0]
}

/**
 * Extract knowledge topics from chat messages and assess mastery level
 * Uses AI to identify specific topics and determine if they are strengths or gaps
 */
async function extractKnowledgeTopics(
  openai: OpenAI,
  chatMessages: any[],
  educationalLevel: string
): Promise<KnowledgeTopic[]> {
  if (chatMessages.length === 0) {
    return []
  }

  try {
    // Prepare conversation context for analysis
    const recentMessages = chatMessages.slice(0, 30) // Analyze last 30 messages
    const conversationText = recentMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    // Use AI to extract and analyze knowledge topics
    const systemPrompt = `You are an expert educational analyst. Analyze the conversation history to identify specific knowledge topics and assess the learner's mastery level for each topic.

For each topic identified, determine:
- strength: The learner demonstrates clear understanding, asks advanced questions, or shows confidence
- gap: The learner shows confusion, asks basic questions repeatedly, or struggles with the concept
- developing: The learner is actively learning but hasn't fully mastered it yet

Output a JSON object with a "topics" key containing an array with this exact structure:
{
  "topics": [
    {
      "topic": "Topic name (e.g., 'Light-dependent reactions', 'Calvin Cycle')",
      "mastery_level": "strength" | "gap" | "developing",
      "confidence": 0.0-1.0,
      "evidence_count": number of times mentioned,
      "last_mentioned": "ISO timestamp",
      "related_topics": ["related topic 1", "related topic 2"]
    }
  ]
}

Focus on:
- Specific, named concepts (not generic terms like "biology" or "science")
- Topics that appear multiple times or show clear learning patterns
- Topics where mastery level can be reasonably inferred from the conversation
- Educational level: ${educationalLevel}

Return only valid JSON, no additional text.`

    const userPrompt = `Analyze this conversation history and extract knowledge topics:

${conversationText}

Identify 5-15 specific knowledge topics and assess mastery level for each.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: CHAT_SETTING_LIMITS['gpt-4o-mini']?.MAX_TOKEN_OUTPUT_LENGTH || 2000,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return []
    }

    // Parse the response
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      // Try to extract JSON array from response
      const arrayMatch = content.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0])
      } else {
        // Try if it's wrapped in an object
        const objMatch = content.match(/\{[\s\S]*\}/)
        if (objMatch) {
          const obj = JSON.parse(objMatch[0])
          // Check if topics are in a key
          parsed = obj.topics || obj.knowledge_topics || obj.data || []
        } else {
          return []
        }
      }
    }

    // Normalize to array format
    let topics: any[] = []
    if (Array.isArray(parsed)) {
      topics = parsed
    } else if (parsed.topics && Array.isArray(parsed.topics)) {
      topics = parsed.topics
    } else if (parsed.knowledge_topics && Array.isArray(parsed.knowledge_topics)) {
      topics = parsed.knowledge_topics
    } else {
      return []
    }

    // Validate and enrich topics with actual message data
    const enrichedTopics: KnowledgeTopic[] = topics
      .filter((t: any) => t.topic && t.mastery_level)
      .map((t: any) => {
        // Count actual mentions in messages
        const topicLower = t.topic.toLowerCase()
        const mentions = chatMessages.filter(msg => 
          msg.content.toLowerCase().includes(topicLower)
        )
        
        // Find last mention timestamp
        const lastMention = mentions.length > 0
          ? mentions[mentions.length - 1].timestamp
          : undefined

        return {
          topic: t.topic,
          mastery_level: ['strength', 'gap', 'developing'].includes(t.mastery_level) 
            ? t.mastery_level as 'strength' | 'gap' | 'developing'
            : 'developing',
          confidence: typeof t.confidence === 'number' 
            ? Math.max(0, Math.min(1, t.confidence))
            : 0.5,
          evidence_count: mentions.length || t.evidence_count || 1,
          last_mentioned: lastMention || t.last_mentioned,
          related_topics: Array.isArray(t.related_topics) ? t.related_topics : []
        }
      })
      .filter((t: KnowledgeTopic) => t.topic.length > 0) // Remove empty topics
      .slice(0, 20) // Limit to top 20 topics

    return enrichedTopics
  } catch (error) {
    console.error('Error extracting knowledge topics:', error)
    // Return empty array on error to not break the portrait generation
    return []
  }
}


