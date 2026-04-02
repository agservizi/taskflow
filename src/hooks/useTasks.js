import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { supabase } from '../services/supabaseClient';
import { Capacitor } from '@capacitor/core';

// Schedule local notifications for tasks due today/tomorrow
const scheduleTaskReminders = async (tasks) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions?.();
    if (perm?.display !== 'granted') return;
    
    // Cancel existing reminder notifications (IDs 1000-1999)
    const pending = await LocalNotifications.getPending();
    const reminderIds = pending.notifications
      .filter((n) => n.id >= 1000 && n.id < 2000)
      .map((n) => ({ id: n.id }));
    if (reminderIds.length > 0) {
      await LocalNotifications.cancel({ notifications: reminderIds });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    
    const dueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.due_date && 
      (t.due_date.startsWith(today) || t.due_date.startsWith(tomorrow))
    );

    if (dueTasks.length === 0) return;

    const notifications = dueTasks.slice(0, 20).map((t, i) => {
      const isToday = t.due_date.startsWith(today);
      const scheduleTime = isToday
        ? new Date(now.getTime() + 5000) // 5 seconds from now for today
        : new Date(new Date(tomorrow + 'T09:00:00').getTime()); // 9 AM tomorrow
      
      return {
        id: 1000 + i,
        title: isToday ? '⏰ Task in scadenza oggi!' : '📋 Task in scadenza domani',
        body: t.title,
        schedule: { at: scheduleTime },
        smallIcon: 'ic_launcher',
      };
    });

    await LocalNotifications.schedule({ notifications });
  } catch {
    // Notifications not available
  }
};

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, completed: 0, overdue: 0 });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [tasksData, statsData, weeklyData, catsData] = await Promise.all([
        taskService.getTasks(userId),
        taskService.getTaskStats(userId),
        taskService.getWeeklyStats(userId),
        taskService.getCategories(),
      ]);
      setTasks(tasksData);
      setStats(statsData);
      setWeeklyStats(weeklyData);
      setCategories(catsData);
      // Schedule reminders for due tasks
      scheduleTaskReminders(tasksData);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channelName = `tasks-realtime-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadTasks]);

  const createTask = async (task) => {
    const result = await taskService.createTask({ ...task, user_id: userId });
    await loadTasks();
    return result;
  };

  const updateTask = async (id, updates) => {
    const result = await taskService.updateTask(id, updates);
    await loadTasks();
    return result;
  };

  const deleteTask = async (id) => {
    await taskService.deleteTask(id);
    await loadTasks();
  };

  const completeTask = async (id) => {
    const result = await updateTask(id, { status: 'completed' });
    // Handle recurring: create next occurrence
    const task = tasks.find((t) => t.id === id);
    if (task && task.recurrence && task.recurrence !== 'none') {
      await taskService.createNextRecurrence(task);
    }
    return result;
  };

  return {
    tasks,
    stats,
    weeklyStats,
    categories,
    loading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refresh: loadTasks,
  };
}
