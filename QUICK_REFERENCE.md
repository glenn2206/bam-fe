# Quick Reference Guide

Cheat sheet untuk development BAM Frontend.

## 🚀 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Dependencies
npm install              # Install all dependencies
npm install <package>    # Install specific package
npm update               # Update dependencies
```

## 📦 Import Patterns

### Services
```javascript
// Individual import
import bookingService from '../services/booking.service';

// Multiple imports
import { authService, bookingService } from '../services';
```

### Hooks
```javascript
import { useBooking, useProject } from '../hooks';
```

### Utils
```javascript
import { formatCurrency, formatDateKey } from '../utils';
```

### Contexts
```javascript
import { useAuth } from '../contexts/AuthContext';
```

### Components
```javascript
import ProtectedRoute from '../components/ProtectedRoute';
```

## 🎣 Custom Hooks Usage

### useAuth
```javascript
const {
  user,           // Current user object
  token,          // JWT token
  loading,        // Loading state
  login,          // Login function
  register,       // Register function
  logout,         // Logout function
  isAuthenticated // Check if authenticated
} = useAuth();

// Usage
await login(no_hp, password);
if (isAuthenticated()) { /* ... */ }
logout();
```

### useBooking
```javascript
const {
  bookings,        // Array of bookings
  loading,         // Loading state
  error,           // Error message
  fetchBookings,   // Fetch all bookings
  createBooking,   // Create new booking
  updateBooking,   // Update booking
  deleteBooking,   // Delete booking
  getBookedSlots   // Get booked slots for date
} = useBooking();

// Usage
await fetchBookings();
await createBooking(data);
await updateBooking(id, data);
await deleteBooking(id);
const slots = await getBookedSlots('2024-02-11');
```

### useProject
```javascript
const {
  project,           // Project object
  loading,           // Loading state
  error,             // Error message
  fetchProject,      // Fetch project
  syncProject,       // Sync project
  updateProjectLocal // Update locally
} = useProject();

// Usage
await fetchProject();
await syncProject(projectData);
updateProjectLocal(projectData);
```

## 🛠️ Services API

### authService
```javascript
import authService from '../services/auth.service';

// Login
const response = await authService.login(no_hp, password);
// Returns: { token, user, message }

// Register
const response = await authService.register(no_hp, password, name);
// Returns: { token, user, message }

// Logout
authService.logout();
```

### bookingService
```javascript
import bookingService from '../services/booking.service';

// Get all bookings
const bookings = await bookingService.getBookings();

// Get booking by ID
const booking = await bookingService.getBookingById(id);

// Create booking
const response = await bookingService.createBooking({
  kategori: 'steel',
  material: 'Reinforcement Bar',
  merk: 'Master Steel',
  ukuran: '16',
  mutu: 'BjTS 420B',
  tests: ['Tensile'],
  qty_sample: 5,
  date_key: '2024-02-11',
  selected_slots: [10, 11, 12]
});

// Update booking
const response = await bookingService.updateBooking(id, data);

// Delete booking
const response = await bookingService.deleteBooking(id);

// Get booked slots
const slots = await bookingService.getBookedSlots('2024-02-11');
// Returns: { bookedSlots: [10, 11, 12, ...] }
```

### projectService
```javascript
import projectService from '../services/project.service';

// Sync project
const response = await projectService.syncProject({
  nama_proyek: 'Project A',
  nama_perusahaan: 'PT ABC',
  lokasi_proyek: 'Jakarta',
  kontak_person: '081234567890'
});

// Get my project
const project = await projectService.getMyProject();
```

## 🧰 Utility Functions

### Date Utils
```javascript
import { 
  formatDateKey,
  formatDateIndonesian,
  formatTimeFromSlot,
  getTimeRange,
  isToday,
  isPastDate
} from '../utils/date.utils';

formatDateKey(new Date());              // "2024-02-11"
formatDateIndonesian(new Date());       // "Minggu, 11 Februari 2024"
formatTimeFromSlot(10);                 // "10:30"
getTimeRange([10, 11, 12]);             // "10:30 - 11:15"
isToday(new Date());                    // true
isPastDate('2024-01-01');               // true
```

### Format Utils
```javascript
import {
  formatCurrency,
  formatNumber,
  formatPhoneNumber,
  truncateText,
  capitalizeFirst,
  formatArrayToString
} from '../utils/format.utils';

formatCurrency(150000);                 // "Rp 150.000"
formatNumber(1000000);                  // "1.000.000"
formatPhoneNumber('081234567890');      // "0812-3456-7890"
truncateText('Long text...', 10);       // "Long text..."
capitalizeFirst('hello');               // "Hello"
formatArrayToString(['a', 'b', 'c']);   // "a, b, c"
```

### Validation Utils
```javascript
import {
  validatePhoneNumber,
  validatePassword,
  validateEmail,
  validateRequired,
  validateBookingData
} from '../utils/validation.utils';

validatePhoneNumber('081234567890');    // true
validatePassword('pass123');            // { isValid: true, errors: [] }
validateEmail('test@example.com');      // true
validateRequired('value', 'Name');      // { isValid: true }
validateBookingData(data);              // { isValid: true, errors: {} }
```

## 🎨 Common Tailwind Classes

### Layout
```jsx
<div className="container mx-auto px-4">        // Container
<div className="flex items-center justify-between"> // Flexbox
<div className="grid grid-cols-3 gap-4">       // Grid
```

### Spacing
```jsx
className="p-4"      // Padding all sides
className="px-4 py-2" // Padding horizontal & vertical
className="m-4"      // Margin all sides
className="space-y-4" // Vertical spacing between children
```

### Colors
```jsx
className="bg-sky-500 text-white"     // Background & text
className="border-gray-200"           // Border color
className="hover:bg-sky-600"          // Hover state
```

### Typography
```jsx
className="text-lg font-bold"         // Size & weight
className="text-center"               // Alignment
className="uppercase tracking-wide"   // Transform & spacing
```

### Borders & Shadows
```jsx
className="rounded-lg"                // Border radius
className="border-2 border-gray-200"  // Border
className="shadow-lg"                 // Shadow
```

### Responsive
```jsx
className="md:flex lg:grid-cols-4"   // Breakpoint prefixes
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

## 🔐 Route Protection

### Protected Route
```jsx
import ProtectedRoute from '../components/ProtectedRoute';

<Route 
  path="/booking" 
  element={
    <ProtectedRoute>
      <Booking />
    </ProtectedRoute>
  } 
/>
```

### Public Route
```jsx
import PublicRoute from '../components/PublicRoute';

<Route 
  path="/login" 
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  } 
/>
```

## 🐛 Debugging

### Check Auth State
```javascript
const { user, token } = useAuth();
console.log('User:', user);
console.log('Token:', token);
console.log('LocalStorage:', localStorage.getItem('bam_token'));
```

### Check API Calls
```javascript
// In browser console
localStorage.getItem('bam_token');  // Check token
localStorage.getItem('bam_user');   // Check user data
```

### Common Errors

**401 Unauthorized**
- Token expired or invalid
- Solution: Logout and login again

**CORS Error**
- Backend not allowing frontend origin
- Solution: Check backend CORS settings

**Network Error**
- Backend not running
- Solution: Start backend server

## 📝 Code Snippets

### Create New Component
```jsx
import React from 'react';

const MyComponent = ({ prop1, prop2 }) => {
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Create New Hook
```javascript
import { useState, useEffect } from 'react';

export const useMyHook = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch logic
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, fetchData };
};
```

### Error Handling Pattern
```javascript
try {
  const response = await someService.someMethod();
  // Success handling
  alert('Success!');
} catch (error) {
  // Error handling
  console.error(error);
  alert(error.message || 'Something went wrong');
}
```

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2024-02-11
