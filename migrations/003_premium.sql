-- ============================================================
-- TaskFlow Premium Migration v3.0.0
-- ============================================================

-- 1. User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'trial')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Add recurrence column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly'));

-- 3. Add user_id and is_custom to categories for custom user categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Update RLS on categories to allow users to see preset + own custom categories
DROP POLICY IF EXISTS "categories_read_policy" ON categories;
CREATE POLICY "categories_read_policy"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
CREATE POLICY "categories_insert_policy"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

DROP POLICY IF EXISTS "categories_delete_policy" ON categories;
CREATE POLICY "categories_delete_policy"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_custom = TRUE);

-- Make sure RLS is enabled on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Add completed_at to tasks for analytics  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
