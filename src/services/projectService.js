import { supabase } from './supabaseClient';

export const projectService = {
  async getProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getProjectWithTasks(projectId) {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (pErr) throw pErr;

    const { data: tasks, error: tErr } = await supabase
      .from('tasks')
      .select('*, categories(name, color), task_tags(tags(id, name, color))')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (tErr) throw tErr;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    return { ...project, tasks, progress: total > 0 ? Math.round((completed / total) * 100) : 0, total, completed };
  },

  async createProject(userId, project) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    // Unlink tasks first (set project_id to null)
    await supabase.from('tasks').update({ project_id: null }).eq('project_id', id);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  async assignTaskToProject(taskId, projectId) {
    const { error } = await supabase
      .from('tasks')
      .update({ project_id: projectId })
      .eq('id', taskId);
    if (error) throw error;
  },

  async removeTaskFromProject(taskId) {
    const { error } = await supabase
      .from('tasks')
      .update({ project_id: null })
      .eq('id', taskId);
    if (error) throw error;
  },
};
