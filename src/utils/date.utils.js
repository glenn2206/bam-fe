/**
 * Date utility functions
 */

/**
 * Format date to YYYY-MM-DD
 */
export const formatDateKey = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format date to Indonesian format
 */
export const formatDateIndonesian = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return d.toLocaleDateString('id-ID', options);
};

/**
 * Format time from slot index
 */
export const formatTimeFromSlot = (slotIndex, startHour = 8, intervalMinutes = 15) => {
  const totalMinutes = startHour * 60 + slotIndex * intervalMinutes;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

/**
 * Get time range from slot indices
 */
export const getTimeRange = (slots, startHour = 8, intervalMinutes = 15) => {
  if (!slots || slots.length === 0) return '';
  
  const sortedSlots = [...slots].sort((a, b) => a - b);
  const startTime = formatTimeFromSlot(sortedSlots[0], startHour, intervalMinutes);
  const endSlot = sortedSlots[sortedSlots.length - 1] + 1;
  const endTime = formatTimeFromSlot(endSlot, startHour, intervalMinutes);
  
  return `${startTime} - ${endTime}`;
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.toDateString() === checkDate.toDateString();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
};
