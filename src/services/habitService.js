import { supabase } from './supabaseClient';

export const habitService = {
  async getHabits(userId) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async createHabit(habit) {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateHabit(id, updates) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteHabit(id) {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async getTodayLogs(habitIds) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', habitIds)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);
    if (error) throw error;
    return data || [];
  },

  async logHabit(habitId) {
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habitId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unlogHabit(habitId) {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habitId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)
      .order('completed_at', { ascending: false })
      .limit(1);
    if (data?.length) {
      await supabase.from('habit_logs').delete().eq('id', data[0].id);
    }
  },

  async getStreak(habitId) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false });
    if (error) return 0;

    const dates = new Set(data.map(l => l.completed_at.split('T')[0]));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  async getWeekLogs(habitIds) {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', habitIds)
      .gte('completed_at', weekAgo.toISOString());
    if (error) throw error;
    return data || [];
  },
};
