import { useState, useEffect, useCallback } from 'react';
import { habitService } from '../services/habitService';

export function useHabits(userId) {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const h = await habitService.getHabits(userId);
      setHabits(h);
      if (h.length) {
        const ids = h.map(x => x.id);
        const logs = await habitService.getTodayLogs(ids);
        setTodayLogs(logs);
        // Load streaks
        const s = {};
        for (const habit of h) {
          s[habit.id] = await habitService.getStreak(habit.id);
        }
        setStreaks(s);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayCountFor = (habitId) => todayLogs.filter(l => l.habit_id === habitId).length;

  const toggleHabit = async (habitId, target) => {
    const current = todayCountFor(habitId);
    if (current < target) {
      const log = await habitService.logHabit(habitId);
      setTodayLogs(prev => [...prev, log]);
      setStreaks(prev => ({ ...prev, [habitId]: (prev[habitId] || 0) + (current === 0 ? 1 : 0) }));
    } else {
      await habitService.unlogHabit(habitId);
      setTodayLogs(prev => {
        const idx = prev.findLastIndex(l => l.habit_id === habitId);
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return prev;
      });
    }
  };

  const createHabit = async (habit) => {
    const h = await habitService.createHabit({ ...habit, user_id: userId });
    setHabits(prev => [...prev, h]);
    return h;
  };

  const deleteHabit = async (id) => {
    await habitService.deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return { habits, todayLogs, streaks, loading, todayCountFor, toggleHabit, createHabit, deleteHabit, refresh: loadData };
}
