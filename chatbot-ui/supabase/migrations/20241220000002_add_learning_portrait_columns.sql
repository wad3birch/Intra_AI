-- Add missing columns to learning_portraits table for enhanced data storage
-- These columns store the raw analysis data alongside the AI-generated portrait

-- Add usage_metrics column to store detailed usage statistics
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS usage_metrics JSONB;

-- Add learning_patterns column to store pattern analysis
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS learning_patterns JSONB;

-- Add event_activity column to store activity analysis
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS event_activity JSONB;

-- Add recent_activity column to store recent activity insights
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS recent_activity JSONB;

-- Add indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_learning_portraits_usage_metrics 
ON learning_portraits USING GIN (usage_metrics);

CREATE INDEX IF NOT EXISTS idx_learning_portraits_learning_patterns 
ON learning_portraits USING GIN (learning_patterns);

CREATE INDEX IF NOT EXISTS idx_learning_portraits_event_activity 
ON learning_portraits USING GIN (event_activity);

CREATE INDEX IF NOT EXISTS idx_learning_portraits_recent_activity 
ON learning_portraits USING GIN (recent_activity);
