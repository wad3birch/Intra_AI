-- Add knowledge_topics column to learning_portraits table
-- This column stores structured knowledge topics extracted from conversations
-- with mastery level assessment (strength, gap, developing)

-- Add knowledge_topics column to store extracted knowledge topics
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS knowledge_topics JSONB;

-- Add index for better query performance on knowledge_topics JSONB column
CREATE INDEX IF NOT EXISTS idx_learning_portraits_knowledge_topics 
ON learning_portraits USING GIN (knowledge_topics);

-- Add comment to document the structure
COMMENT ON COLUMN learning_portraits.knowledge_topics IS 
'Array of knowledge topics with structure: {topic: string, mastery_level: "strength"|"gap"|"developing", confidence: number, evidence_count: number, last_mentioned: string, related_topics: string[]}';

