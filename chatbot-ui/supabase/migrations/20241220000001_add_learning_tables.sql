-- Phase 1: Learning preferences and events tables
-- Create learning_preferences table
CREATE TABLE IF NOT EXISTS learning_preferences (
  user_id TEXT PRIMARY KEY,
  educational_level TEXT NOT NULL DEFAULT 'high-school',
  preferred_style TEXT NOT NULL DEFAULT 'detailed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_events table
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  session_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_portraits table
CREATE TABLE IF NOT EXISTS learning_portraits (
  user_id TEXT PRIMARY KEY,
  summary TEXT,
  preferred_style TEXT,
  strengths TEXT,
  challenges TEXT,
  pacing TEXT,
  recommendations TEXT,
  next_questions JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Chat sessions and messages tables
-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  educational_level TEXT,
  preferred_style TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  suggested_questions JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_timestamp ON learning_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_learning_events_session_id ON learning_events(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started_at ON chat_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Add constraints for data validation
ALTER TABLE learning_preferences 
ADD CONSTRAINT check_educational_level 
CHECK (educational_level IN ('elementary', 'middle-school', 'high-school', 'undergraduate', 'graduate', 'expert'));

ALTER TABLE learning_preferences 
ADD CONSTRAINT check_preferred_style 
CHECK (preferred_style IN ('concise', 'detailed', 'example-driven', 'step-by-step', 'visual'));

ALTER TABLE chat_messages 
ADD CONSTRAINT check_role 
CHECK (role IN ('user', 'assistant'));

-- Enable Row Level Security (RLS)
ALTER TABLE learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_portraits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Learning preferences policies
CREATE POLICY "Users can view their own learning preferences" ON learning_preferences
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own learning preferences" ON learning_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own learning preferences" ON learning_preferences
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Learning events policies
CREATE POLICY "Users can view their own learning events" ON learning_events
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own learning events" ON learning_events
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Learning portraits policies
CREATE POLICY "Users can view their own learning portraits" ON learning_portraits
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own learning portraits" ON learning_portraits
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own learning portraits" ON learning_portraits
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for learning_preferences
CREATE TRIGGER update_learning_preferences_updated_at 
  BEFORE UPDATE ON learning_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for learning_portraits
CREATE TRIGGER update_learning_portraits_updated_at 
  BEFORE UPDATE ON learning_portraits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
