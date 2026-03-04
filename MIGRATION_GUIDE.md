# Migration Guide - Frontend Refactoring

Panduan untuk migrate dari struktur lama ke struktur baru yang lebih terorganisir.

## 📋 Overview

### What Changed?
1. ✅ Folder structure reorganized
2. ✅ Service layer added
3. ✅ Custom hooks created
4. ✅ Route protection implemented
5. ✅ Utils functions extracted
6. ✅ Better separation of concerns

## 🔄 Step-by-Step Migration

### Step 1: Update Imports

#### AuthContext
**Before:**
```javascript
import { useAuth } from './helper/authContext';
```

**After:**
```javascript
import { useAuth } from './contexts/AuthContext';
```

**Files to Update:**
- `src/components/AuthPopup.jsx` ✅
- `src/components/Navbar.jsx` ✅
- `src/pages/Booking.jsx`
- `src/pages/Jadwal.jsx`
- `src/pages/Profile.jsx`

### Step 2: Replace Direct API Calls with Services

#### Before (Direct fetch):
```javascript
const response = await fetch('http://localhost:5000/api/bookings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

#### After (Using service):
```javascript
import bookingService from '../services/booking.service';

const data = await bookingService.getBookings();
```

### Step 3: Use Custom Hooks

#### Before (Manual state management):
```javascript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(false);

const fetchBookings = async () => {
  setLoading(true);
  try {
    const response = await fetch(...);
    const data = await response.json();
    setBookings(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### After (Using custom hook):
```javascript
import { useBooking } from '../hooks/useBooking';

const { bookings, loading, fetchBookings } = useBooking();
```

### Step 4: Add Route Protection

#### Before (No protection):
```jsx
<Route path="/booking" element={<Booking />} />
```

#### After (With protection):
```jsx
<Route 
  path="/booking" 
  element={
    <ProtectedRoute>
      <Booking />
    </ProtectedRoute>
  } 
/>
```

### Step 5: Use Utility Functions

#### Before (Inline formatting):
```javascript
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
};
```

#### After (Using utils):
```javascript
import { formatDateKey } from '../utils/date.utils';

const dateKey = formatDateKey(date);
```

## 📝 File-by-File Migration

### Booking.jsx

**Changes Needed:**
1. Import `useBooking` hook
2. Import `bookingService` if needed
3. Replace direct API calls
4. Use utility functions for formatting

**Example:**
```javascript
// Old
import { useState, useEffect } from 'react';
import { useAuth } from '../helper/authContext';

const Booking = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:5000/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setBookings(data));
  }, [token]);
  
  return <div>...</div>;
};

// New
import { useEffect } from 'react';
import { useBooking } from '../hooks/useBooking';
import { formatDateKey } from '../utils/date.utils';

const Booking = () => {
  const { bookings, loading, fetchBookings } = useBooking();
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>...</div>;
};
```

### Jadwal.jsx

**Changes Needed:**
1. Import `useBooking` for slot data
2. Use `date.utils` for date formatting
3. Replace direct API calls

### Profile.jsx

**Changes Needed:**
1. Import `useProject` hook
2. Use `format.utils` for phone/currency formatting

## 🔧 Configuration Updates

### 1. Create .env file
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 2. Update vite.config.js (if needed)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

## ✅ Checklist

### Phase 1: Setup
- [ ] Create `.env` file
- [ ] Install dependencies (`npm install`)
- [ ] Verify backend is running

### Phase 2: Core Files
- [x] Create `src/config/api.js`
- [x] Create `src/config/constants.js`
- [x] Create `src/contexts/AuthContext.jsx`
- [x] Create service layer files
- [x] Create custom hooks
- [x] Create utility functions

### Phase 3: Components
- [x] Update `AuthPopup.jsx`
- [x] Create `Navbar.jsx`
- [x] Create `ProtectedRoute.jsx`
- [x] Create `PublicRoute.jsx`
- [ ] Update `PilihJadwal.jsx`
- [ ] Update `SmartSelect.jsx`

### Phase 4: Pages
- [ ] Update `Booking.jsx`
- [ ] Update `Jadwal.jsx`
- [ ] Update `Profile.jsx`

### Phase 5: Routing
- [x] Update `main.jsx`
- [x] Create `MainLayout.jsx`
- [ ] Remove old `App.jsx` (optional)

### Phase 6: Testing
- [ ] Test login/register
- [ ] Test protected routes
- [ ] Test booking CRUD
- [ ] Test schedule view
- [ ] Test responsive design

## 🐛 Common Issues

### Issue 1: Import errors
**Error:** `Cannot find module '../contexts/AuthContext'`

**Solution:** Check file path and ensure file exists

### Issue 2: API calls failing
**Error:** `Network Error` or `CORS Error`

**Solution:** 
1. Check backend is running
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in backend

### Issue 3: Token not found
**Error:** `Token diperlukan. Silakan login.`

**Solution:**
1. Clear localStorage
2. Login again
3. Check token is saved in localStorage

### Issue 4: Routes not working
**Error:** Blank page or 404

**Solution:**
1. Check route paths in `main.jsx`
2. Verify component imports
3. Check browser console for errors

## 📊 Before vs After Comparison

### Code Organization
| Aspect | Before | After |
|--------|--------|-------|
| API Calls | Scattered in components | Centralized in services |
| State Management | Local useState everywhere | Custom hooks + Context |
| Validation | Inline in components | Utility functions |
| Formatting | Inline functions | Utility functions |
| Route Protection | None | ProtectedRoute component |

### File Count
| Category | Before | After |
|----------|--------|-------|
| Components | 3 | 6 |
| Services | 0 | 4 |
| Hooks | 0 | 2 |
| Utils | 0 | 3 |
| Config | 0 | 2 |
| Total | ~10 files | ~25 files |

### Benefits
✅ Better code organization
✅ Easier to test
✅ Reusable logic
✅ Type-safe API calls
✅ Consistent error handling
✅ Better developer experience

## 🚀 Next Steps

After migration:
1. Test all features thoroughly
2. Update documentation
3. Add unit tests
4. Optimize performance
5. Add error boundaries
6. Implement loading states
7. Add toast notifications

## 📞 Support

Jika ada masalah saat migration:
1. Check console for errors
2. Review this guide
3. Check [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
4. Ask team for help

---

**Migration Status**: 🟡 In Progress
**Estimated Time**: 2-4 hours
**Last Updated**: 2024-02-11
