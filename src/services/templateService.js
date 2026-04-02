import { supabase } from './supabaseClient';

export const templateService = {
  async getTemplates(userId) {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTemplate(userId, name, templateData) {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({ user_id: userId, name, template_data: templateData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTemplate(id) {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
