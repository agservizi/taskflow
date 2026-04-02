import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Nighcoder88!!@db.sbieymzvriyykyllngul.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const migration = `
-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_emoji TEXT DEFAULT '😊',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select' AND tablename = 'user_profiles') THEN
    CREATE POLICY profiles_select ON user_profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_insert' AND tablename = 'user_profiles') THEN
    CREATE POLICY profiles_insert ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update' AND tablename = 'user_profiles') THEN
    CREATE POLICY profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected...');
    await client.query(migration);
    console.log('User profiles migration completed!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
