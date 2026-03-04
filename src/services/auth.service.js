import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Login user
   */
  async login(no_hp, password) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.LOGIN,
        { no_hp, password },
        false // No auth needed for login
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(no_hp, password, name) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.REGISTER,
        { no_hp, password, name },
        false // No auth needed for register
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user (client-side only)
   */
  logout() {
    localStorage.clear();
    window.location.href = '/';
  }
}

export default new AuthService();
