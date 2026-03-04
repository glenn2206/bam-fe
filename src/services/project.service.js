import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

/**
 * Project Service
 */
class ProjectService {
  /**
   * Sync project data
   */
  async syncProject(projectData) {
    return await apiService.post(API_ENDPOINTS.PROJECTS_SYNC, projectData);
  }

  /**
   * Get user's project
   */
  async getMyProject() {
    return await apiService.get(API_ENDPOINTS.PROJECTS_MY);
  }
}

export default new ProjectService();
