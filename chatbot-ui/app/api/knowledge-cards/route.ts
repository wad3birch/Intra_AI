import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { KnowledgeCard, CardGenerationRequest } from "@/types/learning"
import { NextResponse } from "next/server"

// Mock data storage (replace with database in production)
let knowledgeCards: KnowledgeCard[] = []

export async function GET(request: Request) {
  try {
    const profile = await getServerProfile()
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chat_id')
    
    let userCards = knowledgeCards.filter(card => card.user_id === profile.user_id)
    
    if (chatId) {
      userCards = userCards.filter(card => card.source_chat_id === chatId)
    }
    
    return NextResponse.json({ cards: userCards })
  } catch (error) {
    console.error("Error fetching knowledge cards:", error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge cards" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body: CardGenerationRequest = await request.json()
    
    // Generate knowledge card using AI
    const cardContent = await generateKnowledgeCardContent(
      body.message_content,
      body.template || 'basic'
    )
    
    const knowledgeCard: KnowledgeCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: profile.user_id,
      title: cardContent.title,
      content: cardContent.content,
      source_message_id: body.message_id,
      source_chat_id: body.chat_id,
      tags: cardContent.tags,
      template: body.template || 'basic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    knowledgeCards.push(knowledgeCard)
    
    return NextResponse.json({ card: knowledgeCard })
  } catch (error) {
    console.error("Error generating knowledge card:", error)
    return NextResponse.json(
      { error: "Failed to generate knowledge card" },
      { status: 500 }
    )
  }
}

async function generateKnowledgeCardContent(
  messageContent: string,
  template: string
): Promise<{
  title: string
  content: {
    core_concept: string
    key_points: string[]
    examples: string[]
    related_concepts: string[]
    memory_tips: string[]
    practice_questions: string[]
  }
  tags: string[]
}> {
  // This is a simplified version - in production, you'd call an AI service
  // For now, we'll extract basic information from the message content
  
  const lines = messageContent.split('\n').filter(line => line.trim())
  const title = lines[0]?.substring(0, 50) + (lines[0]?.length > 50 ? '...' : '') || 'Knowledge Card'
  
  // Extract key points (look for bullet points, numbered lists, etc.)
  const keyPoints = lines
    .filter(line => line.match(/^[\-\*\•]\s/) || line.match(/^\d+\.\s/))
    .map(line => line.replace(/^[\-\*\•\d\.]\s/, '').trim())
    .slice(0, 5)
  
  // Extract examples (look for "for example", "such as", etc.)
  const examples = lines
    .filter(line => 
      line.toLowerCase().includes('for example') ||
      line.toLowerCase().includes('such as') ||
      line.toLowerCase().includes('like')
    )
    .map(line => line.trim())
    .slice(0, 3)
  
  // Generate related concepts (simplified)
  const relatedConcepts = [
    'Related Topic 1',
    'Related Topic 2',
    'Related Topic 3'
  ]
  
  // Generate memory tips
  const memoryTips = [
    'Create a mental image of the concept',
    'Connect to something you already know',
    'Practice explaining it to someone else'
  ]
  
  // Generate practice questions
  const practiceQuestions = [
    'How would you explain this concept to a beginner?',
    'What are the practical applications of this concept?',
    'How does this relate to other concepts you know?'
  ]
  
  return {
    title,
    content: {
      core_concept: lines[0] || 'Core concept not identified',
      key_points: keyPoints.length > 0 ? keyPoints : ['Key point 1', 'Key point 2'],
      examples: examples.length > 0 ? examples : ['Example 1', 'Example 2'],
      related_concepts: relatedConcepts,
      memory_tips: memoryTips,
      practice_questions: practiceQuestions
    },
    tags: ['learning', 'knowledge']
  }
}
