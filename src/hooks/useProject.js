import { useState, useEffect } from 'react';
import projectService from '../services/project.service';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Custom hook for project operations
 */
export const useProject = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load project from localStorage on mount
   */
  useEffect(() => {
    const savedProject = localStorage.getItem(STORAGE_KEYS.PROJECT);
    if (savedProject && savedProject !== "undefined") {
      try {
        setProject(JSON.parse(savedProject));
      } catch (err) {
        console.error('Error parsing saved project:', err);
      }
    }
  }, []);

  /**
   * Fetch project from server
   */
  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await projectService.getMyProject();
      setProject(data);
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(data));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync project data
   */
  const syncProject = async (projectData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await projectService.syncProject(projectData);
      setProject(response.data);
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(response.data));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update project locally (without API call)
   */
  const updateProjectLocal = (projectData) => {
    setProject(projectData);
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(projectData));
  };

  return {
    project,
    loading,
    error,
    fetchProject,
    syncProject,
    updateProjectLocal,
  };
};
