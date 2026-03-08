// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Projects
  PROJECTS_SYNC: '/api/projects/sync',
  PROJECTS_MY: '/api/projects/my-project',
  
  // Bookings
  BOOKINGS: '/api/bookings',
  BOOKINGS_BY_ID: (id) => `/api/bookings/${id}`,
  BOOKINGS_SLOTS: (dateKey) => `/api/bookings/slots/${dateKey}`,
  
  // Units (Alternative structure)
  UNITS: '/api/booking',
  UNITS_SYNC: '/api/booking/sync',
  BOOKED_SCHEDULES: '/schedule-all',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};
