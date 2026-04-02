import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';

export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await projectService.getProjects(userId);
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const createProject = async (project) => {
    const result = await projectService.createProject(userId, project);
    await loadProjects();
    return result;
  };

  const updateProject = async (id, updates) => {
    const result = await projectService.updateProject(id, updates);
    await loadProjects();
    return result;
  };

  const deleteProject = async (id) => {
    await projectService.deleteProject(id);
    await loadProjects();
  };

  return { projects, loading, createProject, updateProject, deleteProject, refresh: loadProjects };
}
