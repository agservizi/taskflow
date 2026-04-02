import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (updates) => {
    if (!userId) return;

    if (profile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id: userId, ...updates })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const displayName = profile?.display_name || null;
  const avatarEmoji = profile?.avatar_emoji || '😊';
  const bio = profile?.bio || '';

  return {
    profile,
    displayName,
    avatarEmoji,
    bio,
    loading,
    updateProfile,
    refresh: loadProfile,
  };
}
