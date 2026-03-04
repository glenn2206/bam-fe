import { useState, useEffect } from 'react';
import bookingService from '../services/booking.service';

/**
 * Custom hook for booking operations
 */
export const useBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all bookings
   */
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create new booking
   */
  const createBooking = async (bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.createBooking(bookingData);
      await fetchBookings(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update booking
   */
  const updateBooking = async (id, bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.updateBooking(id, bookingData);
      await fetchBookings(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete booking
   */
  const deleteBooking = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.deleteBooking(id);
      await fetchBookings(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get booked slots for date
   */
  const getBookedSlots = async (dateKey) => {
    try {
      const response = await bookingService.getBookedSlots(dateKey);
      return response.bookedSlots || [];
    } catch (err) {
      console.error('Error fetching booked slots:', err);
      return [];
    }
  };

  /**
   * Get booked schedules (global)
   */
  const getBookedSchedules = async () => {
    try {
      const data = await bookingService.getBookedSchedules();
      return data;
    } catch (err) {
      console.error('Error fetching booked schedules:', err);
      return {};
    }
  };

  // ========================================
  // UNITS OPERATIONS (Sistem Lama)
  // ========================================

  /**
   * Fetch units data
   */
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await bookingService.getUnits();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching units:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save/Sync units data
   */
  const saveUnits = async (units) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.syncUnits(units);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookedSlots,
    getBookedSchedules,
    // Units operations
    fetchUnits,
    saveUnits,
  };
};
