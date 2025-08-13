-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL DEFAULT 'monthly',
  monthly_price DECIMAL(10,2) NOT NULL,
  calls_per_month INTEGER NOT NULL DEFAULT 2,
  call_duration_minutes INTEGER NOT NULL DEFAULT 60,
  start_date DATE NOT NULL,
  subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  remaining_calls INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique active subscription per mentee-mentor pair
  UNIQUE(mentee_id, mentor_id, status)
);

-- Add subscription_id to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_mentee_id ON user_subscriptions(mentee_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_mentor_id ON user_subscriptions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_subscription_id ON sessions(user_subscription_id);

-- Add RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON user_subscriptions;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions" ON user_subscriptions
  FOR DELETE USING (auth.uid() = mentee_id);

-- Function to update remaining_calls when a session is completed
CREATE OR REPLACE FUNCTION update_user_subscription_calls()
RETURNS TRIGGER AS $$
BEGIN
  -- If session is completed and has a user_subscription_id, decrease remaining_calls
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_subscription_id IS NOT NULL THEN
    UPDATE user_subscriptions 
    SET remaining_calls = GREATEST(0, remaining_calls - 1),
        updated_at = NOW()
    WHERE id = NEW.user_subscription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update subscription calls
DROP TRIGGER IF EXISTS update_user_subscription_calls_trigger ON sessions;
CREATE TRIGGER update_user_subscription_calls_trigger
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscription_calls();
