rmat
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: 0812-3456-7890
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  // Format: +62 812-3456-7890
  if (cleaned.startsWith('62')) {
    return '+' + cleaned.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '$1 $2-$3-$4');
  }
  
  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format array to comma-separated string
 */
export const formatArrayToString = (arr, separator = ', ') => {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(separator);
};
