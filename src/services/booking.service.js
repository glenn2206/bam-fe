import apiService from './api.service';
import { API_ENDPOINTS } from '../config/api';

/**
 * Booking Service
 */
class BookingService {
  /**
   * Get all user's bookings
   */
  async getBookings() {
    return await apiService.get(API_ENDPOINTS.BOOKINGS);
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id) {
    return await apiService.get(API_ENDPOINTS.BOOKINGS_BY_ID(id));
  }

  /**
   * Create new booking
   */
  async createBooking(bookingData) {
    return await apiService.post(API_ENDPOINTS.BOOKINGS, bookingData);
  }

  /**
   * Update booking
   */
  async updateBooking(id, bookingData) {
    return await apiService.put(API_ENDPOINTS.BOOKINGS_BY_ID(id), bookingData);
  }

  /**
   * Delete booking
   */
  async deleteBooking(id) {
    return await apiService.delete(API_ENDPOINTS.BOOKINGS_BY_ID(id));
  }

  /**
   * Get booked slots for a specific date
   */
  async getBookedSlots(dateKey) {
    return await apiService.get(API_ENDPOINTS.BOOKINGS_SLOTS(dateKey), false);
  }

  /**
   * Get all booked schedules (global)
   */
  async getBookedSchedules() {
    return await apiService.get(API_ENDPOINTS.BOOKED_SCHEDULES, false);
  }

  // ========================================
  // UNITS API (Sistem Lama - Table: units)
  // ========================================

  /**
   * Get user's units (booking data - old system)
   */
  async getUnits() {
    return await apiService.get(API_ENDPOINTS.UNITS);
  }

  /**
   * Sync/Save units data (auto-save)
   */
  async syncUnits(units) {
    return await apiService.post(API_ENDPOINTS.UNITS_SYNC, { units });
  }
}

export default new BookingService();
