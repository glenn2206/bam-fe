# Auth Troubleshooting - Token & User ID Issues

Panduan untuk debug masalah authentication dan user_id.

## 🔍 Symptoms

- Data tidak tersimpan ke database
- GET `/api/booking` return empty array `[]`
- Backend logs: "User ID: undefined"
- Error: "Token diperlukan. Silakan login."

## 🎯 Root Cause

Token tidak dikirim dari frontend ke backend, sehingga:
1. Backend tidak bisa extract `user_id` dari token
2. Query database dengan `user_id = undefined`
3. Tidak ada data yang match

## ✅ Solution

### Step 1: Verify Token Exists

**Di Browser Console:**
```javascript
// Cek token
console.log(localStorage.getItem('bam_token'));

// Cek user
console.log(localStorage.getItem('bam_user'));

// Jika null atau undefined → LOGIN ULANG
```

**Di UI (Development Mode):**
- Lihat widget "Auth Status" di pojok kanan bawah
- Pastikan status: "LOGGED IN" (hijau)
- Pastikan Token: ada (bukan "None")
- Pastikan User ID: ada (bukan "None")

### Step 2: Check Network Requests

**Browser DevTools → Network Tab:**

1. **POST `/api/booking/sync`:**
   - Headers → Request Headers
   - Cari: `Authorization: Bearer eyJhbGc...`
   - Jika tidak ada → Token tidak dikirim!

2. **GET `/api/booking`:**
   - Headers → Request Headers
   - Cari: `Authorization: Bearer eyJhbGc...`
   - Jika tidak ada → Token tidak dikirim!

### Step 3: Check Backend Logs

**Terminal Backend:**
```bash
# Saat POST /api/booking/sync
💾 POST /api/booking/sync - User ID: 1  ← Harus ada angka!
📦 Units to save: 1

# Jika User ID: undefined → Token tidak valid atau tidak dikirim
```

### Step 4: Verify Token is Valid

**Decode JWT Token:**
1. Copy token dari localStorage
2. Buka https://jwt.io
3. Paste token di "Encoded" section
4. Cek payload:
   ```json
   {
     "userId": 1,
     "no_hp": "081234567890",
     "iat": 1707654321,
     "exp": 1708259121
   }
   ```
5. Cek `exp` (expiry) - jika sudah lewat → Token expired!

## 🔧 Fixes

### Fix 1: Login Ulang

Jika token tidak ada atau expired:

```javascript
// Di browser console
localStorage.clear();
location.reload();

// Lalu login ulang
```

### Fix 2: Check AuthContext

**Pastikan AuthProvider membungkus app:**

```jsx
// src/main.jsx
<AuthProvider>  {/* ← Harus ada ini! */}
  <BrowserRouter>
    <Routes>
      {/* ... */}
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

### Fix 3: Check Token Persistence

**Pastikan token disimpan saat login:**

```javascript
// src/contexts/AuthContext.jsx
const login = async (no_hp, password) => {
  const response = await authService.login(no_hp, password);
  
  // Harus ada ini:
  localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
  
  setToken(response.token);
  setUser(response.user);
};
```

### Fix 4: Check Backend Middleware

**Pastikan middleware extract user dengan benar:**

```javascript
// server/index.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token diperlukan' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    
    // PENTING: Set req.user dengan benar
    req.user = {
      id: decoded.userId,      // ← Harus ada ini!
      userId: decoded.userId,
      no_hp: decoded.no_hp
    };
    
    next();
  });
};
```

## 🧪 Testing

### Test 1: Manual Token Check

```javascript
// Di browser console
const token = localStorage.getItem('bam_token');

if (!token) {
  console.error('❌ No token! Please login.');
} else {
  console.log('✅ Token exists:', token.substring(0, 20) + '...');
  
  // Test decode
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('User ID:', payload.userId);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Test 2: Manual API Call

```javascript
// Di browser console
const token = localStorage.getItem('bam_token');

fetch('http://localhost:5000/api/booking', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
})
.catch(err => {
  console.error('❌ Error:', err);
});
```

### Test 3: Check Auth Status Component

1. Buka aplikasi
2. Lihat widget "Auth Status" di pojok kanan bawah
3. Klik "Log to Console"
4. Cek console output:
   ```
   === AUTH DEBUG INFO ===
   User: { id: 1, no_hp: "081234567890", name: "Test User" }
   Token: eyJhbGc...
   LocalStorage token: eyJhbGc...
   LocalStorage user: {"id":1,"no_hp":"081234567890"}
   ======================
   ```

## 📊 Verification Checklist

Sebelum save/fetch data, pastikan:

- [ ] User sudah login (cek Auth Status widget)
- [ ] Token ada di localStorage
- [ ] Token belum expired (cek jwt.io)
- [ ] User ID ada di token payload
- [ ] Authorization header dikirim di request
- [ ] Backend logs menunjukkan User ID (bukan undefined)

## 🐛 Common Errors

### Error 1: "Token diperlukan. Silakan login."

**Penyebab:** Token tidak dikirim atau tidak ada

**Fix:**
```javascript
localStorage.clear();
// Login ulang
```

### Error 2: "Token tidak valid atau kadaluarsa"

**Penyebab:** Token expired atau JWT_SECRET berbeda

**Fix:**
```javascript
// Cek expiry di jwt.io
// Jika expired → login ulang
localStorage.clear();
```

### Error 3: Backend logs "User ID: undefined"

**Penyebab:** Token tidak di-decode dengan benar

**Fix:**
```javascript
// Cek middleware authenticateToken
// Pastikan req.user.id = decoded.userId
```

### Error 4: Data tersimpan tapi tidak muncul

**Penyebab:** User ID berbeda saat save vs fetch

**Fix:**
```sql
-- Cek di database
SELECT * FROM units;

-- Cek user_id
SELECT user_id, COUNT(*) FROM units GROUP BY user_id;

-- Jika ada user_id = NULL atau berbeda → data tersimpan untuk user lain
```

## 🔄 Complete Reset Flow

Jika semua gagal, reset lengkap:

```javascript
// 1. Clear frontend
localStorage.clear();
sessionStorage.clear();

// 2. Clear cookies (jika ada)
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// 3. Reload
location.reload();

// 4. Login ulang
// 5. Test save/fetch
```

## 📝 Enhanced Logging

Dengan update terbaru, frontend akan log:

```javascript
// Saat save
💾 Saving booking data... { units: 1, token: '✅ Present' }
✅ Auto-save success: { status: 'success', message: '1 unit(s) synced' }

// Saat fetch
📥 Fetching booking data... { token: '✅ Present' }
✅ Fetch success: { units: 1 }

// Jika error
❌ Cannot save: No token found. Please login first.
❌ Save failed: { error: 'Token tidak valid' }
```

## 📞 Still Not Working?

1. **Screenshot:**
   - Auth Status widget
   - Browser console logs
   - Network tab (request headers)
   - Backend terminal logs

2. **Check:**
   - Backend running?
   - Frontend running?
   - .env correct?
   - Database connection OK?

3. **Try:**
   - Different browser
   - Incognito mode
   - Clear all cache
   - Restart both servers

---

**Last Updated**: 2024-02-11
