import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Nighcoder88!!@db.sbieymzvriyykyllngul.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const migration = `
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sub_select_policy' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY sub_select_policy ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sub_insert_policy' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY sub_insert_policy ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sub_update_policy' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY sub_update_policy ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Add recurrence column to tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='recurrence') THEN
    ALTER TABLE tasks ADD COLUMN recurrence TEXT DEFAULT 'none';
  END IF;
END $$;

-- 3. Add user_id and is_custom to categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='user_id') THEN
    ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='is_custom') THEN
    ALTER TABLE categories ADD COLUMN is_custom BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_policy" ON categories;
CREATE POLICY categories_read_policy ON categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
CREATE POLICY categories_insert_policy ON categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

DROP POLICY IF EXISTS "categories_delete_policy" ON categories;
CREATE POLICY categories_delete_policy ON categories FOR DELETE USING (auth.uid() = user_id AND is_custom = TRUE);

-- 4. Add completed_at to tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completed_at') THEN
    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase...');
    await client.query(migration);
    console.log('Premium migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
