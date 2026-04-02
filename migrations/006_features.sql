-- ═══════════════════════════════════════════════════════════
-- TaskFlow Migration 006 — Projects, Gamification, Advanced Recurrence, Reminders
-- ═══════════════════════════════════════════════════════════

-- ── Progetti ──
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  emoji TEXT DEFAULT '📁',
  status TEXT CHECK (status IN ('active','archived','completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- Aggiungi project_id ai task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER[];

-- ── Ricorrenze avanzate ──
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
-- recurrence_rule: { type: 'custom', interval: 2, unit: 'week', days: [1,3,5] }

-- ── Gamification ──
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own xp" ON user_xp FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own badges" ON user_badges FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own xp_log" ON xp_log FOR ALL USING (auth.uid() = user_id);

-- ── Task collaborativi ──
CREATE TABLE IF NOT EXISTS task_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view','edit')) DEFAULT 'view',
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages shares" ON task_shares FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Shared user can view" ON task_shares FOR SELECT USING (auth.uid() = shared_with_id);

-- ── Dashboard widget preferences ──
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dashboard_widgets JSONB DEFAULT '["hero","quickActions","charts","habits","focusTimer","overdue","pinned","today","productivity"]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reminder_settings JSONB DEFAULT '{"taskReminder": true, "habitReminder": true, "reminderTime": "09:00"}';
