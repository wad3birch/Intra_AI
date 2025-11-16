// Learning preferences and knowledge card types

export interface LearningPreferences {
  user_id: string
  educational_level: 'elementary' | 'middle-school' | 'high-school' | 'undergraduate' | 'graduate' | 'expert'
  preferred_style: 'concise' | 'detailed' | 'example-driven' | 'step-by-step' | 'visual'
  created_at?: string
  updated_at?: string
}

// Legacy interface for backward compatibility
export interface LegacyLearningPreferences {
  id: string
  user_id: string
  preferred_style: 'concise' | 'detailed' | 'example-driven' | 'step-by-step' | 'visual'
  complexity_level: 'beginner' | 'intermediate' | 'advanced'
  learning_goals: string[]
  preferred_examples: 'real-world' | 'academic' | 'technical' | 'mixed'
  auto_generate_cards: boolean
  card_template_preference: 'basic' | 'detailed' | 'visual' | 'minimal'
  created_at: string
  updated_at: string
}

export interface KnowledgeCard {
  id: string
  user_id: string
  title: string
  content: {
    core_concept: string
    key_points: string[]
    examples: string[]
    related_concepts: string[]
    memory_tips: string[]
    practice_questions: string[]
  }
  source_message_id: string
  source_chat_id: string
  tags: string[]
  template: 'basic' | 'detailed' | 'visual' | 'minimal'
  created_at: string
  updated_at: string
}

export interface CardTemplate {
  id: string
  name: string
  layout: 'basic' | 'detailed' | 'visual' | 'minimal'
  sections: string[]
  styling: {
    colors: string[]
    fonts: string[]
    layout: string
  }
}

export interface StylePrompt {
  style: string
  prompt: string
  description: string
  icon: string
}

export interface CardGenerationRequest {
  message_content: string
  message_id: string
  chat_id: string
  template?: 'basic' | 'detailed' | 'visual' | 'minimal'
  custom_sections?: string[]
}

export interface PDFExportRequest {
  card_ids: string[]
  format: 'single' | 'collection' | 'notes'
  template: 'basic' | 'detailed' | 'visual' | 'minimal'
  include_sources: boolean
}

// Chat session and message types
export interface ChatSession {
  id: string
  user_id: string
  educational_level: string
  preferred_style: string
  started_at: string
  ended_at?: string
  message_count: number
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[]
  timestamp: string
}

export interface LearningEvent {
  id: string
  user_id: string
  event_type: string
  payload?: any
  session_id?: string
  timestamp: string
}

// Knowledge topic with mastery level
export interface KnowledgeTopic {
  topic: string // e.g., "Light-dependent reactions", "Calvin Cycle"
  mastery_level: 'strength' | 'gap' | 'developing' // strength = well understood, gap = knowledge gap, developing = in progress
  confidence: number // 0-1, confidence in the assessment
  evidence_count: number // number of times this topic appeared in conversations
  last_mentioned?: string // ISO timestamp of last mention
  related_topics?: string[] // related topics that were discussed together
}

export interface LearningPortrait {
  user_id: string
  summary?: string
  preferred_style?: string
  strengths?: string
  challenges?: string
  pacing?: string
  recommendations?: string
  next_questions?: string[]
  last_updated: string
  // Additional fields for enhanced data storage
  usage_metrics?: any
  learning_patterns?: any
  event_activity?: any
  recent_activity?: any
  // Knowledge topics extracted from conversations
  knowledge_topics?: KnowledgeTopic[]
}
