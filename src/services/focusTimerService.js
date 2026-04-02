import { supabase } from './supabaseClient';

export const focusTimerService = {
  async startSession(userId, taskId, duration = 1500) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({ user_id: userId, task_id: taskId || null, duration })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async completeSession(sessionId) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update({ completed: true })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTodaySessions(userId) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*, tasks(title)')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('started_at', `${today}T00:00:00`)
      .order('started_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getStats(userId) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration, started_at')
      .eq('user_id', userId)
      .eq('completed', true);
    if (error) throw error;

    const total = data?.length || 0;
    const totalMinutes = Math.round((data || []).reduce((sum, s) => sum + s.duration, 0) / 60);
    const today = new Date().toISOString().split('T')[0];
    const todayCount = (data || []).filter(s => s.started_at.startsWith(today)).length;

    return { total, totalMinutes, todayCount };
  },
};
