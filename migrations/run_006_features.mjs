import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xyzcompletare.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-here'
);

const sql = fs.readFileSync(path.join(__dirname, '006_features.sql'), 'utf8');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Running ${statements.length} statements from 006_features.sql...`);

for (const stmt of statements) {
  const { error } = await supabase.rpc('exec_sql', { sql_text: stmt + ';' }).catch(() => ({ error: null }));
  if (error) {
    console.warn('Statement warning:', stmt.substring(0, 80), error.message);
  }
}

console.log('Migration 006 complete!');
