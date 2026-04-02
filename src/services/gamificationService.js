import { supabase } from './supabaseClient';

// Definizione livelli XP
const LEVELS = [
  { level: 1, xp: 0, title: 'Principiante', emoji: '🌱' },
  { level: 2, xp: 50, title: 'Apprendista', emoji: '🌿' },
  { level: 3, xp: 150, title: 'In Crescita', emoji: '🌳' },
  { level: 4, xp: 300, title: 'Intermedio', emoji: '⭐' },
  { level: 5, xp: 500, title: 'Esperto', emoji: '🔥' },
  { level: 6, xp: 800, title: 'Maestro', emoji: '💎' },
  { level: 7, xp: 1200, title: 'Leggenda', emoji: '👑' },
  { level: 8, xp: 1800, title: 'Campione', emoji: '🏆' },
  { level: 9, xp: 2500, title: 'Elite', emoji: '🚀' },
  { level: 10, xp: 3500, title: 'TaskFlow Master', emoji: '🌟' },
];

// XP per azione
const XP_REWARDS = {
  task_complete: 10,
  task_complete_high: 20,
  task_complete_ontime: 5,
  habit_complete: 5,
  habit_streak_7: 50,
  habit_streak_30: 200,
  focus_session: 15,
  daily_streak: 10,
  first_task: 20,
  first_project: 25,
  ten_tasks: 50,
  fifty_tasks: 150,
  hundred_tasks: 300,
};

// Badge definitions
const BADGES = {
  first_task: { name: 'Prima Conquista', emoji: '🎯', desc: 'Completa il tuo primo task' },
  ten_tasks: { name: 'Produttivo', emoji: '📋', desc: 'Completa 10 task' },
  fifty_tasks: { name: 'Instancabile', emoji: '💪', desc: 'Completa 50 task' },
  hundred_tasks: { name: 'Centurione', emoji: '🏛️', desc: 'Completa 100 task' },
  streak_7: { name: 'Settimana Perfetta', emoji: '🔥', desc: '7 giorni consecutivi di attività' },
  streak_30: { name: 'Mese d\'Oro', emoji: '🌟', desc: '30 giorni consecutivi di attività' },
  focus_master: { name: 'Focus Master', emoji: '🧘', desc: '10 sessioni focus completate' },
  early_bird: { name: 'Mattiniero', emoji: '🌅', desc: 'Completa un task prima delle 7:00' },
  night_owl: { name: 'Nottambulo', emoji: '🦉', desc: 'Completa un task dopo le 23:00' },
  all_done: { name: 'Clean Slate', emoji: '✨', desc: 'Completa tutti i task di una giornata' },
  first_project: { name: 'Project Manager', emoji: '📁', desc: 'Crea il tuo primo progetto' },
  habit_7: { name: 'Abitudine Solida', emoji: '🏋️', desc: '7 giorni streak di una abitudine' },
  habit_30: { name: 'Abitudine Incrollabile', emoji: '💎', desc: '30 giorni streak di una abitudine' },
  speed_demon: { name: 'Speed Demon', emoji: '⚡', desc: 'Completa 5 task in un giorno' },
  organizer: { name: 'Organizzatore', emoji: '🗂️', desc: 'Usa 3+ categorie diverse' },
};

export const gamificationService = {
  LEVELS,
  BADGES,
  XP_REWARDS,

  getLevelForXP(xp) {
    let current = LEVELS[0];
    for (const l of LEVELS) {
      if (xp >= l.xp) current = l;
      else break;
    }
    return current;
  },

  getNextLevel(xp) {
    for (const l of LEVELS) {
      if (xp < l.xp) return l;
    }
    return null; // max level
  },

  getProgressToNext(xp) {
    const current = this.getLevelForXP(xp);
    const next = this.getNextLevel(xp);
    if (!next) return 1;
    const range = next.xp - current.xp;
    const progress = xp - current.xp;
    return range > 0 ? progress / range : 1;
  },

  async getUserXP(userId) {
    const { data, error } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code === 'PGRST116') {
      // No row found, create one
      const { data: newData } = await supabase
        .from('user_xp')
        .insert({ user_id: userId, total_xp: 0, level: 1, streak_days: 0, best_streak: 0 })
        .select()
        .single();
      return newData || { total_xp: 0, level: 1, streak_days: 0, best_streak: 0 };
    }
    return data || { total_xp: 0, level: 1, streak_days: 0, best_streak: 0 };
  },

  async addXP(userId, amount, reason) {
    // Get current XP
    const current = await this.getUserXP(userId);
    const newXP = (current.total_xp || 0) + amount;
    const newLevel = this.getLevelForXP(newXP).level;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    let streakDays = current.streak_days || 0;
    let bestStreak = current.best_streak || 0;

    if (current.last_activity_date) {
      const lastDate = new Date(current.last_activity_date);
      const diff = Math.floor((new Date(today) - lastDate) / 86400000);
      if (diff === 1) {
        streakDays += 1;
      } else if (diff > 1) {
        streakDays = 1;
      }
      // diff === 0: same day, no streak change
    } else {
      streakDays = 1;
    }
    if (streakDays > bestStreak) bestStreak = streakDays;

    await supabase
      .from('user_xp')
      .update({
        total_xp: newXP,
        level: newLevel,
        streak_days: streakDays,
        best_streak: bestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Log XP
    await supabase.from('xp_log').insert({ user_id: userId, amount, reason });

    return {
      totalXP: newXP,
      level: newLevel,
      leveledUp: newLevel > (current.level || 1),
      streakDays,
      bestStreak,
    };
  },

  async getUserBadges(userId) {
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    return data || [];
  },

  async awardBadge(userId, badgeKey) {
    // Check if already earned
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_key', badgeKey)
      .single();
    if (existing) return null; // already has badge

    const { data } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_key: badgeKey })
      .select()
      .single();
    return data;
  },

  async checkAndAwardBadges(userId, context = {}) {
    const awarded = [];
    const { completedCount, streakDays, focusSessions, todayCompleted, categoriesUsed, hasProject, habitStreak } = context;

    const tryAward = async (key, condition) => {
      if (condition) {
        const result = await this.awardBadge(userId, key);
        if (result) awarded.push({ key, ...BADGES[key] });
      }
    };

    await tryAward('first_task', completedCount >= 1);
    await tryAward('ten_tasks', completedCount >= 10);
    await tryAward('fifty_tasks', completedCount >= 50);
    await tryAward('hundred_tasks', completedCount >= 100);
    await tryAward('streak_7', streakDays >= 7);
    await tryAward('streak_30', streakDays >= 30);
    await tryAward('focus_master', focusSessions >= 10);
    await tryAward('speed_demon', todayCompleted >= 5);
    await tryAward('organizer', categoriesUsed >= 3);
    await tryAward('first_project', hasProject);
    await tryAward('habit_7', habitStreak >= 7);
    await tryAward('habit_30', habitStreak >= 30);

    // Time-based badges
    const hour = new Date().getHours();
    await tryAward('early_bird', todayCompleted > 0 && hour < 7);
    await tryAward('night_owl', todayCompleted > 0 && hour >= 23);

    return awarded;
  },

  async getXPLog(userId, limit = 20) {
    const { data } = await supabase
      .from('xp_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },
};
