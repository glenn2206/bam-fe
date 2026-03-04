# Troubleshooting Guide

Panduan mengatasi masalah umum di BAM Frontend.

## 🐛 Common Errors

### 1. "Cannot destructure property 'user' of 'useAuth()' as it is undefined"

**Penyebab:**
- `AuthProvider` tidak membungkus komponen
- Import path salah
- Context tidak ter-export dengan benar

**Solusi:**

1. **Cek import path:**
```javascript
// ❌ SALAH
import { useAuth } from '../helper/authContext';

// ✅ BENAR
import { useAuth } from '../contexts/AuthContext';
```

2. **Pastikan AuthProvider ada di main.jsx:**
```javascript
// src/main.jsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* ... */}
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

3. **Cek export di AuthContext.jsx:**
```javascript
// Harus ada export ini
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. "data is not defined" di fetchBookingData

**Penyebab:**
Variable `data` tidak didefinisikan sebelum return.

**Solusi:**
```javascript
// ❌ SALAH
const response = await fetch(...);
if (!response.ok) throw new Error('Gagal');
return data; // data tidak ada!

// ✅ BENAR
const response = await fetch(...);
if (!response.ok) throw new Error('Gagal');
const data = await response.json();
return data;
```

### 3. Network Error / CORS Error

**Penyebab:**
- Backend tidak running
- CORS tidak dikonfigurasi
- URL salah

**Solusi:**

1. **Cek backend running:**
```bash
# Di terminal backend
node server.js
# atau
node server-fixed.js
```

2. **Cek .env:**
```env
VITE_API_URL=http://localhost:5000
```

3. **Cek CORS di backend:**
```javascript
// server.js
app.use(cors()); // Harus ada ini
```

### 4. Token Expired / 401 Unauthorized

**Penyebab:**
- Token sudah expired
- Token tidak valid
- Token tidak dikirim

**Solusi:**

1. **Clear localStorage dan login ulang:**
```javascript
localStorage.clear();
// Lalu login lagi
```

2. **Cek token di localStorage:**
```javascript
// Di browser console
console.log(localStorage.getItem('bam_token'));
```

3. **Cek header Authorization:**
```javascript
// Di service
headers: {
  'Authorization': `Bearer ${token}` // Pastikan format benar
}
```

### 5. Routes Not Working / Blank Page

**Penyebab:**
- Route path salah
- Component tidak ter-import
- Layout tidak render Outlet

**Solusi:**

1. **Cek route path:**
```javascript
// Pastikan path konsisten
<Route path="/booking" element={<Booking />} />
<Link to="/booking">Booking</Link> // Harus sama
```

2. **Cek import component:**
```javascript
import Booking from './pages/Booking'; // Pastikan path benar
```

3. **Cek Layout punya Outlet:**
```javascript
// MainLayout.jsx
import { Outlet } from 'react-router-dom';

const MainLayout = () => (
  <div>
    <Navbar />
    <Outlet /> {/* Harus ada ini! */}
  </div>
);
```

### 6. "Module not found" Error

**Penyebab:**
- File tidak ada
- Path salah
- Extension salah

**Solusi:**

1. **Cek file exists:**
```bash
ls src/contexts/AuthContext.jsx
```

2. **Cek relative path:**
```javascript
// Dari src/pages/Booking.jsx
import { useAuth } from '../contexts/AuthContext'; // Naik 1 level

// Dari src/components/Navbar.jsx
import { useAuth } from '../contexts/AuthContext'; // Naik 1 level
```

3. **Cek extension:**
```javascript
// ❌ SALAH
import { useAuth } from '../contexts/AuthContext.js';

// ✅ BENAR
import { useAuth } from '../contexts/AuthContext'; // Tanpa extension
```

### 7. "localStorage is not defined" (SSR)

**Penyebab:**
- Trying to access localStorage during SSR

**Solusi:**
```javascript
// Cek window exists
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
}
```

### 8. Infinite Re-render Loop

**Penyebab:**
- useEffect tanpa dependency array
- State update di render

**Solusi:**

1. **Tambah dependency array:**
```javascript
// ❌ SALAH
useEffect(() => {
  fetchData();
}); // Akan loop terus!

// ✅ BENAR
useEffect(() => {
  fetchData();
}, []); // Hanya run sekali
```

2. **Jangan update state di render:**
```javascript
// ❌ SALAH
const Component = () => {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Infinite loop!
  return <div>{count}</div>;
};

// ✅ BENAR
const Component = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1); // Update di event handler
  };
  
  return <button onClick={handleClick}>{count}</button>;
};
```

## 🔍 Debugging Tips

### 1. Check Console
Selalu buka browser console (F12) untuk lihat error messages.

### 2. Check Network Tab
Lihat API calls di Network tab:
- Status code (200, 401, 500, etc.)
- Request headers
- Response body

### 3. Add Console Logs
```javascript
console.log('User:', user);
console.log('Token:', token);
console.log('Response:', response);
```

### 4. Use React DevTools
Install React DevTools extension untuk inspect:
- Component tree
- Props & State
- Context values

### 5. Check localStorage
```javascript
// Di browser console
console.log(localStorage);
console.log(localStorage.getItem('bam_token'));
console.log(localStorage.getItem('bam_user'));
```

## 🛠️ Quick Fixes

### Clear Everything and Start Fresh
```bash
# 1. Clear node_modules
rm -rf node_modules package-lock.json

# 2. Reinstall
npm install

# 3. Clear browser cache
# Ctrl + Shift + Delete

# 4. Clear localStorage
localStorage.clear();

# 5. Restart dev server
npm run dev
```

### Reset to Default State
```javascript
// Di browser console
localStorage.clear();
location.reload();
```

### Force Re-render
```javascript
// Tambah key prop
<Component key={Date.now()} />
```

## 📞 Getting Help

### 1. Check Documentation
- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### 2. Search Error Message
Copy error message dan search di:
- Google
- Stack Overflow
- React documentation

### 3. Ask Team
Jika masih stuck, tanya team dengan info:
- Error message lengkap
- Screenshot
- Code yang bermasalah
- Steps to reproduce

## ✅ Checklist Before Asking for Help

- [ ] Sudah cek console untuk error messages
- [ ] Sudah cek Network tab untuk API calls
- [ ] Sudah coba clear cache & localStorage
- [ ] Sudah cek dokumentasi
- [ ] Sudah coba restart dev server
- [ ] Sudah cek backend is running
- [ ] Sudah cek import paths
- [ ] Sudah cek .env file

---

**Last Updated**: 2024-02-11
