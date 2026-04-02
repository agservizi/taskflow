import { supabase } from './supabaseClient';

export const taskService = {
  async getTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, categories(name, color), task_tags(tags(id, name, color))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTaskById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, categories(name, color), task_tags(tags(id, name, color))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createTask(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(id, updates) {
    // If completing a task, set completed_at
    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Create next occurrence of a recurring task
  async createNextRecurrence(task) {
    if (!task.recurrence || task.recurrence === 'none' || !task.due_date) return null;

    const dueDate = new Date(task.due_date);
    switch (task.recurrence) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + 1);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      default:
        return null;
    }

    const newTask = {
      user_id: task.user_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0],
      category_id: task.category_id,
      recurrence: task.recurrence,
    };

    return this.createTask(newTask);
  },

  async deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async getCustomCategories(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_custom', true)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createCustomCategory(userId, name, color) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, user_id: userId, is_custom: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCustomCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('is_custom', true);
    if (error) throw error;
  },

  // --- Subtasks ---
  async getSubtasks(taskId) {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addSubtask(taskId, title) {
    const { data: existing } = await supabase
      .from('subtasks')
      .select('sort_order')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, sort_order: nextOrder })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleSubtask(id, completed) {
    const { data, error } = await supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSubtask(id) {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTaskStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: allTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;

    const todayTasks = allTasks.filter(t => 
      t.due_date && t.due_date.startsWith(today)
    );
    const completed = allTasks.filter(t => t.status === 'completed');
    const overdue = allTasks.filter(t => 
      t.status !== 'completed' && t.due_date && t.due_date < today
    );

    return {
      total: allTasks.length,
      today: todayTasks.length,
      completed: completed.length,
      overdue: overdue.length,
    };
  },

  async getWeeklyStats(userId) {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    if (error) throw error;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('it-IT', { weekday: 'short' });
      
      const dayTasks = data.filter(t => t.created_at.startsWith(dateStr));
      const dayCompleted = data.filter(t => 
        t.status === 'completed' && t.created_at.startsWith(dateStr)
      );

      days.push({
        name: dayName,
        creati: dayTasks.length,
        completati: dayCompleted.length,
      });
    }

    return days;
  },

  // --- Tags ---
  async getTags(userId) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createTag(userId, name, color) {
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: userId, name, color })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTag(id) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTaskTags(taskId) {
    const { data, error } = await supabase
      .from('task_tags')
      .select('*, tags(*)')
      .eq('task_id', taskId);
    if (error) throw error;
    return data?.map(tt => tt.tags) || [];
  },

  async setTaskTags(taskId, tagIds) {
    // Remove existing
    await supabase.from('task_tags').delete().eq('task_id', taskId);
    if (!tagIds.length) return;
    // Insert new
    const rows = tagIds.map(tag_id => ({ task_id: taskId, tag_id }));
    const { error } = await supabase.from('task_tags').insert(rows);
    if (error) throw error;
  },
};
