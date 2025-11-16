-- Fix learning_portraits table missing updated_at field issue
-- This migration adds the missing updated_at column and fixes the trigger

-- Add updated_at field to learning_portraits table
ALTER TABLE learning_portraits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to set updated_at to last_updated value
UPDATE learning_portraits 
SET updated_at = last_updated 
WHERE updated_at IS NULL OR updated_at = last_updated;

-- Drop the problematic trigger if it exists
DROP TRIGGER IF EXISTS update_learning_portraits_updated_at ON learning_portraits;

-- Recreate the correct trigger
CREATE TRIGGER update_learning_portraits_updated_at 
  BEFORE UPDATE ON learning_portraits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
