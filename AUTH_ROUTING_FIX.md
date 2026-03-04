# Auth Routing Fix - Protected Routes with Popup

## 🎯 Problem
- User belum login → redirect ke `/` → redirect ke `/booking` → infinite loop
- AuthPopup logic duplikat di `Booking.jsx` dan routing
- Tidak konsisten antara protected routes

## ✅ Solution
Refactor `ProtectedRoute` component untuk show popup instead of redirect.

---

## 📝 Changes Made

### 1. `src/components/ProtectedRoute.jsx`

**Before:**
```javascript
// Redirect to home if not authenticated
if (!user) {
  return <Navigate to="/" replace />;
}
```

**After:**
```javascript
// Show auth popup if not authenticated
if (!user) {
  return (
    <>
      {/* Blur overlay with message */}
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-600 mb-4">
              🔒 Halaman Terlindungi
            </p>
            <p className="text-slate-500 mb-6">
              Silakan login untuk mengakses halaman ini
            </p>
            <button
              onClick={() => setShowAuthPopup(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all"
            >
              Login Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Auth Popup */}
      <AuthPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} />
    </>
  );
}
```

### 2. `src/pages/Booking.jsx`

**Removed:**
- ❌ `import AuthPopup` (tidak perlu lagi)
- ❌ `const [showAuth, setShowAuth] = useState(false)`
- ❌ `useEffect` untuk show popup saat `!user`
- ❌ Blur overlay di return statement
- ❌ `<AuthPopup isOpen={showAuth} ... />`

**Result:**
- Component lebih clean
- Tidak ada duplikasi logic
- Auth handling sepenuhnya di `ProtectedRoute`

### 3. `src/components/AuthPopup.jsx`

**Fixed:**
- ❌ Removed unused `React` import
- ✅ Only import `{ useState }` from 'react'

---

## 🏗️ Architecture Flow

### Old Flow (Broken)
```
User access /booking (not logged in)
    ↓
ProtectedRoute checks: !user
    ↓
Redirect to "/"
    ↓
Route "/" redirects to "/booking"
    ↓
INFINITE LOOP! 🔄
```

### New Flow (Fixed)
```
User access /booking (not logged in)
    ↓
ProtectedRoute checks: !user
    ↓
Render blurred content + overlay
    ↓
Show "Login Sekarang" button
    ↓
User clicks button
    ↓
AuthPopup opens
    ↓
User login
    ↓
AuthContext updates: setUser(userData)
    ↓
ProtectedRoute re-renders
    ↓
Check: user exists ✅
    ↓
Render children (Booking component)
```

---

## 🎨 UI Behavior

### When Not Logged In:
1. **Blur Effect**: Content di-blur untuk privacy
2. **Overlay**: Semi-transparent overlay dengan message
3. **Call-to-Action**: Button "Login Sekarang" yang prominent
4. **Popup**: AuthPopup muncul saat button diklik

### When Logged In:
1. **Normal View**: Content tampil normal tanpa blur
2. **No Overlay**: Tidak ada overlay
3. **Full Access**: User bisa interact dengan form

---

## 🔐 Protected Routes

All routes wrapped with `<ProtectedRoute>`:
- `/booking` - Booking form page
- `/jadwal` - Schedule monitoring page

Public routes (no protection):
- `/profile` - Company profile page

---

## 📊 Component Hierarchy

```
main.jsx
  └── AuthProvider
      └── BrowserRouter
          └── Routes
              └── Route (MainLayout)
                  ├── Route /booking
                  │   └── ProtectedRoute
                  │       ├── Blur Overlay (if !user)
                  │       ├── Login Button (if !user)
                  │       ├── AuthPopup (if !user)
                  │       └── Booking Component
                  │
                  ├── Route /jadwal
                  │   └── ProtectedRoute
                  │       ├── Blur Overlay (if !user)
                  │       ├── Login Button (if !user)
                  │       ├── AuthPopup (if !user)
                  │       └── Jadwal Component
                  │
                  └── Route /profile
                      └── Profile Component (public)
```

---

## ✅ Benefits

### 1. No Infinite Loop
- Tidak ada redirect loop
- User tetap di halaman yang diminta

### 2. Better UX
- User tahu mereka di halaman yang benar
- Content preview (blurred) memberikan context
- Clear call-to-action

### 3. Consistent Behavior
- Semua protected routes behave sama
- Centralized auth logic di `ProtectedRoute`

### 4. Clean Code
- No duplicate AuthPopup logic
- Components fokus pada business logic
- Auth handling separated

### 5. Maintainable
- Single source of truth untuk auth UI
- Easy to update auth behavior globally
- Clear separation of concerns

---

## 🧪 Testing Checklist

### Test 1: Access Protected Route (Not Logged In)
**Steps:**
1. Clear localStorage (logout)
2. Navigate to `/booking`

**Expected:**
- ✅ Page loads (no redirect)
- ✅ Content is blurred
- ✅ Overlay shows "🔒 Halaman Terlindungi"
- ✅ Button "Login Sekarang" visible
- ✅ No infinite loop

### Test 2: Click Login Button
**Steps:**
1. From blurred page, click "Login Sekarang"

**Expected:**
- ✅ AuthPopup opens
- ✅ Login form visible
- ✅ Can switch to register

### Test 3: Login Success
**Steps:**
1. Enter credentials
2. Click "MASUK SEKARANG"

**Expected:**
- ✅ Popup closes
- ✅ Blur overlay disappears
- ✅ Content becomes interactive
- ✅ User can use the form

### Test 4: Access Protected Route (Logged In)
**Steps:**
1. Already logged in
2. Navigate to `/booking`

**Expected:**
- ✅ Page loads normally
- ✅ No blur
- ✅ No overlay
- ✅ Full access to form

### Test 5: Logout from Protected Route
**Steps:**
1. On `/booking` page (logged in)
2. Click logout

**Expected:**
- ✅ User logged out
- ✅ Page re-renders with blur
- ✅ Overlay appears
- ✅ Login button shows

### Test 6: Multiple Protected Routes
**Steps:**
1. Not logged in
2. Try `/booking` and `/jadwal`

**Expected:**
- ✅ Both show same auth behavior
- ✅ Consistent UI
- ✅ Same popup

---

## 🚀 Future Improvements

### 1. Remember Intended Route
```javascript
// Save intended route before showing login
const [intendedRoute, setIntendedRoute] = useState(null);

// After login, redirect to intended route
if (loginSuccess && intendedRoute) {
  navigate(intendedRoute);
}
```

### 2. Auto-open Popup
```javascript
// Auto-open popup after 2 seconds if not logged in
useEffect(() => {
  if (!user) {
    const timer = setTimeout(() => {
      setShowAuthPopup(true);
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [user]);
```

### 3. Session Timeout Warning
```javascript
// Show warning before session expires
useEffect(() => {
  if (user) {
    const timer = setTimeout(() => {
      alert('Session akan berakhir dalam 5 menit');
    }, 25 * 60 * 1000); // 25 minutes
    return () => clearTimeout(timer);
  }
}, [user]);
```

---

**Last Updated:** 2024-02-11
**Status:** ✅ Complete
