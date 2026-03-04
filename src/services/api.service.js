import { API_BASE_URL } from '../config/api';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Base API Service with authentication
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get auth token from localStorage
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get default headers with auth token
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.clear();
        window.location.href = '/';
      }

      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  /**
   * GET request
   */
  async get(endpoint, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('GET Error:', error);
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('POST Error:', error);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('PUT Error:', error);
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, includeAuth = true) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('DELETE Error:', error);
      throw error;
    }
  }
}

export default new ApiService();
