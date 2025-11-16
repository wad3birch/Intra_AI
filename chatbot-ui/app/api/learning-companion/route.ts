import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"

// User level classification based on US educational standards
type UserLevel = 'elementary' | 'middle-school' | 'high-school' | 'undergraduate' | 'graduate' | 'expert'

// Learning preferences selected in UI
type PreferredStyle = 'concise' | 'detailed' | 'example-driven' | 'step-by-step' | 'visual'
type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced'
type PreferredExamples = 'real-world' | 'academic' | 'technical' | 'mixed'
type Preferences = {
  preferred_style: PreferredStyle
  complexity_level: ComplexityLevel
  preferred_examples: PreferredExamples
}

// Level configuration based on Common Core State Standards and Bloom's Taxonomy
const userLevelPrompts = {
  elementary: {
    // K-5 Grade (Ages 5-11)
    prompt: 'Please explain using simple, concrete language with everyday examples. Use short sentences and familiar vocabulary. Focus on basic concepts and practical applications. Avoid abstract ideas and technical jargon. Use analogies from daily life.',
    knowledgeScope: 'Basic facts, simple concepts, concrete examples',
    languageComplexity: 'Simple sentences, familiar vocabulary, concrete terms',
    cognitiveLevel: 'Remember and Understand (Bloom\'s Taxonomy)',
    engagementStyle: 'Use fun analogies, simple questions, and encourage curiosity with "What do you think?" or "Can you guess why?"'
  },
  'middle-school': {
    // 6-8 Grade (Ages 11-14)
    prompt: 'Please provide clear explanations with some technical concepts but keep them accessible. Use moderate vocabulary and explain new terms. Include both theory and practical examples. Use analogies and visual descriptions when helpful.',
    knowledgeScope: 'Intermediate concepts, cause-and-effect relationships, basic principles',
    languageComplexity: 'Moderate vocabulary, compound sentences, some technical terms with explanations',
    cognitiveLevel: 'Understand and Apply (Bloom\'s Taxonomy)',
    engagementStyle: 'Ask "What if" questions, suggest simple experiments, and connect to their interests with "Have you ever wondered about...?"'
  },
  'high-school': {
    // 9-12 Grade (Ages 14-18)
    prompt: 'Please provide comprehensive explanations with technical concepts and terminology. Include both theoretical foundations and practical applications. Use professional vocabulary and complex sentence structures. Include analysis and evaluation.',
    knowledgeScope: 'Advanced concepts, systematic knowledge, critical thinking, problem-solving',
    languageComplexity: 'Professional vocabulary, complex sentences, technical terminology',
    cognitiveLevel: 'Apply, Analyze, and Evaluate (Bloom\'s Taxonomy)',
    engagementStyle: 'Pose analytical questions, suggest deeper exploration topics, and challenge with "How might this apply to..." or "What are the implications of..."'
  },
  undergraduate: {
    // College Level (Ages 18-22)
    prompt: 'Please provide detailed technical analysis with professional terminology and in-depth concepts. Include advanced techniques, best practices, and implementation details. Use academic language and complex reasoning.',
    knowledgeScope: 'Specialized knowledge, advanced theories, research methods, professional practices',
    languageComplexity: 'Academic vocabulary, complex sentence structures, specialized terminology',
    cognitiveLevel: 'Analyze, Evaluate, and Create (Bloom\'s Taxonomy)',
    engagementStyle: 'Suggest research directions, pose critical thinking questions, and recommend advanced topics with "Consider exploring..." or "A fascinating aspect to investigate..."'
  },
  graduate: {
    // Graduate Level (Ages 22+)
    prompt: 'Please provide comprehensive analysis with cutting-edge concepts, advanced methodologies, and research insights. Include latest developments, theoretical frameworks, and critical evaluation of current practices.',
    knowledgeScope: 'Advanced research, theoretical frameworks, cutting-edge developments, critical analysis',
    languageComplexity: 'Advanced academic vocabulary, complex theoretical language, specialized research terminology',
    cognitiveLevel: 'Evaluate and Create (Bloom\'s Taxonomy)',
    engagementStyle: 'Recommend cutting-edge research areas, pose methodological questions, and suggest interdisciplinary connections with "Current research suggests..." or "An emerging area of interest..."'
  },
  expert: {
    // Domain Expert Level
    prompt: 'Please provide the most in-depth analysis with state-of-the-art concepts, advanced technical details, and expert insights. Include latest research, methodologies, and innovative approaches. Assume deep domain knowledge.',
    knowledgeScope: 'Cutting-edge research, advanced theories, innovative methodologies, expert-level insights',
    languageComplexity: 'Expert-level terminology, complex theoretical language, specialized domain vocabulary',
    cognitiveLevel: 'Create and Innovate (Bloom\'s Taxonomy)',
    engagementStyle: 'Suggest innovative research directions, pose complex theoretical questions, and recommend interdisciplinary collaborations with "The frontier of this field..." or "An intriguing research direction..."'
  }
}

// Map preferences to prompt guidance
const styleGuidance: Record<PreferredStyle, string> = {
  concise: 'Be brief and to the point. Use short sentences and minimal fluff. Prefer bullet lists for clarity.',
  detailed: 'Be comprehensive with context and rationale. Provide thorough explanations and background as needed.',
  'example-driven': 'Prioritize illustrative examples and analogies. For each concept, include at least one clear example.',
  'step-by-step': 'Break explanations into clear, sequential steps. Avoid big jumps and call out decision points.',
  visual: 'Structure content with headings, lists, and simple schemas. Describe visuals (diagrams/flows) in text.'
}

const complexityGuidance: Record<ComplexityLevel, string> = {
  beginner: 'Assume minimal prior knowledge. Define jargon and keep concepts concrete and simple.',
  intermediate: 'Assume some familiarity. Use moderate technical terms and connect concepts to prior knowledge.',
  advanced: 'Assume strong background. Dive into nuances, edge cases, and trade-offs with technical terminology.'
}

const examplesGuidance: Record<PreferredExamples, string> = {
  'real-world': 'Favor practical, everyday examples and applications.',
  academic: 'Favor theoretical, scholarly examples and references to principles or literature where relevant.',
  technical: 'Favor industry-oriented, implementation-focused examples, including code or system sketches when appropriate.',
  mixed: 'Use a balanced mix of practical, academic, and technical examples as fits the topic.'
}

export async function POST(request: Request) {
  const json = await request.json()
  const { 
    question, 
    userLevel = 'high-school', 
    preferences = {
      preferred_style: 'detailed',
      complexity_level: 'intermediate',
      preferred_examples: 'mixed'
    },
    chatHistory = [] 
  } = json as {
    question: string
    userLevel?: UserLevel
    preferences?: Preferences
    chatHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    // Build system prompt using level and user-selected learning preferences
    const levelConfig = userLevelPrompts[userLevel]
    const pref = preferences as Preferences
    
    const systemPrompt = `You are an intelligent Learning Companion that adapts your responses to the user's educational level and learning preferences. Your role is to not only answer questions but to inspire continued learning and curiosity.

User Educational Level: ${userLevel}
Knowledge Scope: ${levelConfig.knowledgeScope}
Language Complexity: ${levelConfig.languageComplexity}
Cognitive Level: ${levelConfig.cognitiveLevel}

Response Style Preference: ${pref.preferred_style}
Style Guidelines: ${styleGuidance[pref.preferred_style]}

Educational Guidelines: ${levelConfig.prompt}

Engagement Style: ${levelConfig.engagementStyle}

Format your response as:
[Main Answer Content - tailored to the user's learning style and educational level]

Then append a JSON code block with EXACTLY this shape and nothing else:
\`\`\`json
{"suggested_questions": ["question 1", "question 2", "question 3"]}
\`\`\`

Guidelines for suggested questions:
- Provide exactly 3 questions.
- Be concise (≤ 16 words), specific, and diverse.
- Strongly relevant to the user's question and educational level.
- No numbering, no extra keys, only the JSON block above.

Be conversational, engaging, and always encourage the student to continue exploring. Make learning feel like an exciting journey of discovery!`

    // Build message array including chat history
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      ...chatHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      {
        role: "user" as const,
        content: question
      }
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: CHAT_SETTING_LIMITS["gpt-4-turbo-preview"].MAX_TOKEN_OUTPUT_LENGTH,
      stream: true
    })

    const stream = OpenAIStream(response as any)
    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error("Learning companion generation failed:", error)
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorCode,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
