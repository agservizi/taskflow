import { Capacitor } from '@capacitor/core';

/**
 * Servizio notifiche avanzate per TaskFlow
 * Gestisce reminder task (1h prima, 1 giorno prima) e reminder abitudini giornalieri
 */
export const notificationService = {
  _plugin: null,

  async _getPlugin() {
    if (!Capacitor.isNativePlatform()) return null;
    if (!this._plugin) {
      const mod = await import('@capacitor/local-notifications');
      this._plugin = mod.LocalNotifications;
      const perm = await this._plugin.requestPermissions?.();
      if (perm?.display !== 'granted') return null;
    }
    return this._plugin;
  },

  /**
   * Pianifica i reminder per un task con scadenza
   * - 1 giorno prima (ore 9:00)
   * - 1 ora prima
   * - Alla scadenza
   * - Custom minutes (da task.reminder_minutes[])
   */
  async scheduleTaskReminders(tasks) {
    const plugin = await this._getPlugin();
    if (!plugin) return;

    try {
      // Cancella reminder task esistenti (IDs 1000-4999)
      const pending = await plugin.getPending();
      const ids = pending.notifications
        .filter(n => n.id >= 1000 && n.id < 5000)
        .map(n => ({ id: n.id }));
      if (ids.length) await plugin.cancel({ notifications: ids });

      const now = new Date();
      const notifications = [];
      let idCounter = 1000;

      const dueTasks = tasks.filter(
        t => t.status !== 'completed' && t.due_date
      );

      for (const task of dueTasks.slice(0, 50)) {
        const dueDate = new Date(task.due_date + 'T23:59:00');
        if (dueDate <= now) continue;

        const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';

        // 1 giorno prima alle 9:00
        const dayBefore = new Date(dueDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(9, 0, 0, 0);
        if (dayBefore > now) {
          notifications.push({
            id: idCounter++,
            title: `📋 Task in scadenza domani`,
            body: `${priorityEmoji} ${task.title}`,
            schedule: { at: dayBefore },
            smallIcon: 'ic_launcher',
            extra: { taskId: task.id, type: 'task_reminder' },
          });
        }

        // 1 ora prima
        const hourBefore = new Date(dueDate);
        hourBefore.setHours(hourBefore.getHours() - 1);
        if (hourBefore > now) {
          notifications.push({
            id: idCounter++,
            title: `⏰ Task in scadenza tra 1 ora!`,
            body: `${priorityEmoji} ${task.title}`,
            schedule: { at: hourBefore },
            smallIcon: 'ic_launcher',
            extra: { taskId: task.id, type: 'task_reminder' },
          });
        }

        // Custom reminder_minutes
        if (Array.isArray(task.reminder_minutes)) {
          for (const mins of task.reminder_minutes) {
            const customTime = new Date(dueDate.getTime() - mins * 60000);
            if (customTime > now) {
              notifications.push({
                id: idCounter++,
                title: `🔔 Promemoria: ${mins}min alla scadenza`,
                body: `${priorityEmoji} ${task.title}`,
                schedule: { at: customTime },
                smallIcon: 'ic_launcher',
                extra: { taskId: task.id, type: 'task_reminder' },
              });
            }
          }
        }
      }

      if (notifications.length > 0) {
        await plugin.schedule({ notifications: notifications.slice(0, 64) });
      }
    } catch {
      // Notifications not available
    }
  },

  /**
   * Pianifica reminder giornaliero per le abitudini
   * Ogni giorno alle ore configurate (default 9:00)
   */
  async scheduleHabitReminder(habits, reminderTime = '09:00') {
    const plugin = await this._getPlugin();
    if (!plugin) return;

    try {
      // Cancella reminder abitudini (IDs 5000-5999)
      const pending = await plugin.getPending();
      const ids = pending.notifications
        .filter(n => n.id >= 5000 && n.id < 6000)
        .map(n => ({ id: n.id }));
      if (ids.length) await plugin.cancel({ notifications: ids });

      if (!habits.length) return;

      const [hours, minutes] = reminderTime.split(':').map(Number);
      const now = new Date();
      const scheduleDate = new Date();
      scheduleDate.setHours(hours, minutes, 0, 0);
      if (scheduleDate <= now) {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      }

      const habitNames = habits.slice(0, 3).map(h => `${h.emoji} ${h.name}`).join(', ');
      const extra = habits.length > 3 ? ` +${habits.length - 3} altre` : '';

      await plugin.schedule({
        notifications: [{
          id: 5000,
          title: '🌟 Buongiorno! Le tue abitudini ti aspettano',
          body: `${habitNames}${extra}`,
          schedule: {
            at: scheduleDate,
            every: 'day',
          },
          smallIcon: 'ic_launcher',
          extra: { type: 'habit_reminder' },
        }],
      });
    } catch {
      // Notifications not available
    }
  },

  /** Cancella tutte le notifiche programmate */
  async cancelAll() {
    const plugin = await this._getPlugin();
    if (!plugin) return;
    const pending = await plugin.getPending();
    if (pending.notifications.length) {
      await plugin.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  },
};
