import pg from 'pg';

const client = new pg.Client('postgresql://postgres:Nighcoder88!!@db.sbieymzvriyykyllngul.supabase.co:5432/postgres');

const sql = `
-- Add notes and is_pinned to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(50) NOT NULL,
  color varchar(7) NOT NULL DEFAULT '#6366F1',
  created_at timestamptz DEFAULT now()
);

-- Task-Tags junction
CREATE TABLE IF NOT EXISTS task_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(task_id, tag_id)
);

-- Task templates
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  emoji varchar(10) DEFAULT '✅',
  color varchar(7) DEFAULT '#22C55E',
  target_per_day int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habit logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now()
);

-- Pomodoro sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  duration int NOT NULL DEFAULT 1500,
  started_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false
);

-- RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own tags') THEN
    CREATE POLICY "Users manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own task_tags') THEN
    CREATE POLICY "Users manage own task_tags" ON task_tags FOR ALL USING (task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own templates') THEN
    CREATE POLICY "Users manage own templates" ON task_templates FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own habits') THEN
    CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own habit_logs') THEN
    CREATE POLICY "Users manage own habit_logs" ON habit_logs FOR ALL USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own pomodoro') THEN
    CREATE POLICY "Users manage own pomodoro" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
`;

async function run() {
  await client.connect();
  console.log('Connected. Running mega migration...');
  await client.query(sql);
  console.log('Migration complete!');
  await client.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
