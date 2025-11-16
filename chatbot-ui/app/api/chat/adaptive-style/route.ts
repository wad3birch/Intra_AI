import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { LearningPreferences } from "@/types/learning"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const { message, chatHistory = [] } = await request.json()
    
    // Get user's learning preferences
    const preferencesResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/learning-preferences`, {
      headers: {
        'Authorization': `Bearer ${profile.user_id}` // In production, use proper auth
      }
    })
    
    let preferences: LearningPreferences | null = null
    if (preferencesResponse.ok) {
      const data = await preferencesResponse.json()
      preferences = data.preferences
    }
    
    // Generate adaptive style prompt based on preferences
    const stylePrompt = generateStylePrompt(preferences, message, chatHistory)
    
    return NextResponse.json({ 
      stylePrompt,
      appliedStyle: preferences?.preferred_style || 'detailed',
      complexityLevel: preferences?.complexity_level || 'intermediate'
    })
  } catch (error) {
    console.error("Error generating adaptive style:", error)
    return NextResponse.json(
      { error: "Failed to generate adaptive style" },
      { status: 500 }
    )
  }
}

function generateStylePrompt(
  preferences: LearningPreferences | null,
  message: string,
  chatHistory: any[]
): string {
  if (!preferences) {
    return "Provide a helpful and informative response."
  }

  const stylePrompts = {
    concise: "Keep your response brief and to the point. Focus on key information only. Avoid unnecessary details or explanations.",
    detailed: "Provide a comprehensive explanation with background context, examples, and thorough coverage of the topic.",
    'example-driven': "Use plenty of examples, analogies, and real-world applications to illustrate concepts. Make abstract ideas concrete.",
    'step-by-step': "Break down complex topics into clear, sequential steps. Use numbered lists and logical progression.",
    visual: "Structure your response with clear headings, bullet points, and visual formatting. Use diagrams, tables, or structured layouts when helpful."
  }

  const complexityPrompts = {
    beginner: "Use simple language and explain technical terms. Start with basic concepts before moving to advanced topics.",
    intermediate: "Use moderate complexity language with some technical terms, but explain them when needed.",
    advanced: "Use technical terminology and assume the user has background knowledge. Focus on advanced concepts and applications."
  }

  const examplePrompts = {
    'real-world': "Use practical, everyday examples that the user can relate to and apply immediately.",
    academic: "Use theoretical examples and scholarly references to support your explanations.",
    technical: "Use industry-specific examples and technical case studies relevant to the field.",
    mixed: "Use a combination of real-world, academic, and technical examples as appropriate."
  }

  let prompt = stylePrompts[preferences.preferred_style] || stylePrompts.detailed
  prompt += " " + (complexityPrompts[preferences.complexity_level] || complexityPrompts.intermediate)
  prompt += " " + (examplePrompts[preferences.preferred_examples] || examplePrompts.mixed)

  // Add learning goals context if available
  if (preferences.learning_goals.length > 0) {
    prompt += ` Keep in mind the user's learning goals: ${preferences.learning_goals.join(', ')}.`
  }

  // Add context from chat history
  if (chatHistory.length > 0) {
    const recentTopics = extractTopics(chatHistory.slice(-3)) // Last 3 messages
    if (recentTopics.length > 0) {
      prompt += ` Build upon these recent topics: ${recentTopics.join(', ')}.`
    }
  }

  return prompt
}

function extractTopics(chatHistory: any[]): string[] {
  const topics: string[] = []
  
  for (const message of chatHistory) {
    if (message.role === 'user') {
      // Extract key topics from user messages
      const content = message.content.toLowerCase()
      const topicKeywords = [
        'machine learning', 'artificial intelligence', 'programming', 'data science',
        'web development', 'mobile development', 'database', 'algorithm',
        'design pattern', 'architecture', 'security', 'testing'
      ]
      
      for (const keyword of topicKeywords) {
        if (content.includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword)
        }
      }
    }
  }
  
  return topics.slice(0, 3) // Limit to 3 topics
}
