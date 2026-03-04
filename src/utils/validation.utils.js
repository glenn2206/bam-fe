/**
 * Validation utility functions
 */

/**
 * Validate phone number (Indonesian format)
 */
export const validatePhoneNumber = (phone) => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check if starts with 08 or +62 or 62
  const regex = /^(08|628|\+628)[0-9]{8,11}$/;
  
  return regex.test(cleaned);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password minimal 6 karakter');
  }
  
  if (password.length > 50) {
    errors.push('Password maksimal 50 karakter');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      error: `${fieldName} wajib diisi`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate booking data
 */
export const validateBookingData = (data) => {
  const errors = {};
  
  if (!data.kategori) errors.kategori = 'Kategori wajib dipilih';
  if (!data.material) errors.material = 'Material wajib dipilih';
  if (!data.merk) errors.merk = 'Merek wajib dipilih';
  if (!data.ukuran) errors.ukuran = 'Ukuran wajib dipilih';
  if (!data.mutu) errors.mutu = 'Mutu wajib dipilih';
  if (!data.tests || data.tests.length === 0) errors.tests = 'Metode uji wajib dipilih';
  if (!data.qty_sample || data.qty_sample < 1) errors.qty_sample = 'Jumlah sampel minimal 1';
  if (!data.date_key) errors.date_key = 'Tanggal wajib dipilih';
  if (!data.selected_slots || data.selected_slots.length === 0) {
    errors.selected_slots = 'Jadwal wajib dipilih';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
