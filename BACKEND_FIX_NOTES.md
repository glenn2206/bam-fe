# Backend Authentication Context - Fix Notes

## 🐛 Masalah yang Ditemukan

### 1. Inkonsistensi User ID di Middleware JWT
**Masalah:**
```javascript
// Middleware menggunakan req.user.userId
jwt.verify(token, JWT_SECRET, (err, user) => {
  req.user = user;  // user = { userId: ..., no_hp: ... }
  next();
});

// Tapi di beberapa endpoint menggunakan req.user.id
app.post('/api/booking/sync', authenticateToken, async (req, res) => {
  const userId = req.user.id;  // ❌ UNDEFINED!
});
```

**Dampak:**
- Query database gagal karena `user_id` bernilai `undefined`
- User tidak bisa menyimpan/mengambil data mereka
- Authorization check gagal

### 2. Duplikasi Endpoint dengan Struktur Berbeda
Ada 2 sistem booking yang berbeda:
- `/api/bookings` - Untuk sistem booking material
- `/api/booking` - Untuk sistem units (struktur berbeda)

Ini membingungkan dan tidak konsisten.

## ✅ Solusi yang Diterapkan

### 1. Fix Middleware JWT
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token diperlukan. Silakan login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid atau kadaluarsa' });
    }
    
    // ✅ FIXED: Konsisten gunakan struktur yang sama
    req.user = {
      id: decoded.userId,      // Primary ID - gunakan ini di semua endpoint
      userId: decoded.userId,  // Alias untuk backward compatibility
      no_hp: decoded.no_hp
    };
    
    next();
  });
};
```

### 2. Standardisasi Penggunaan User ID
Semua endpoint sekarang menggunakan `req.user.id`:

```javascript
// ✅ BENAR - Konsisten di semua endpoint
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      user_id: req.user.id,  // ✅ Gunakan req.user.id
      // ...
    }]);
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', req.user.id);  // ✅ Konsisten
});
```

## 📋 Checklist Perubahan

### Endpoints yang Diperbaiki:

- [x] `POST /api/projects/sync` - req.user.userId → req.user.id
- [x] `GET /api/projects/my-project` - req.user.userId → req.user.id
- [x] `POST /api/bookings` - req.user.userId → req.user.id
- [x] `PUT /api/bookings/:id` - req.user.userId → req.user.id
- [x] `GET /api/bookings` - req.user.userId → req.user.id
- [x] `GET /api/bookings/:id` - req.user.userId → req.user.id
- [x] `DELETE /api/bookings/:id` - req.user.userId → req.user.id
- [x] `GET /api/booking` - req.user.userId → req.user.id
- [x] `POST /api/booking/sync` - req.user.id (sudah benar, tapi ditambah comment)

## 🔍 Cara Testing

### 1. Test Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "no_hp": "081234567890",
    "password": "password123",
    "name": "Test User"
  }'
```

Response:
```json
{
  "message": "Registrasi berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "no_hp": "081234567890",
    "name": "Test User"
  }
}
```

### 2. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "no_hp": "081234567890",
    "password": "password123"
  }'
```

### 3. Test Create Booking (dengan token)
```bash
TOKEN="your_token_here"

curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "kategori": "steel",
    "material": "Reinforcement Bar",
    "merk": "Master Steel",
    "ukuran": "16",
    "mutu": "BjTS 420B",
    "tests": ["Tensile"],
    "qty_sample": 5,
    "date_key": "2024-02-15",
    "selected_slots": [10, 11, 12]
  }'
```

### 4. Test Get My Bookings
```bash
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

## 🗄️ Database Schema yang Dibutuhkan

### Table: users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  no_hp VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_users_no_hp ON users(no_hp);
```

### Table: projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nama_proyek VARCHAR(200),
  nama_perusahaan VARCHAR(200),
  lokasi_proyek TEXT,
  kontak_person VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)  -- Satu user hanya punya satu project aktif
);
```

### Table: bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  kategori VARCHAR(50),
  material VARCHAR(100),
  merk VARCHAR(100),
  tipe VARCHAR(50),
  ukuran VARCHAR(50),
  mutu VARCHAR(50),
  tests JSONB,  -- Array of test methods
  qty_sample INTEGER DEFAULT 0,
  total_pengujian INTEGER,
  tanggal DATE,
  jadwal VARCHAR(50),
  date_key VARCHAR(20),  -- Format: YYYY-MM-DD
  selected_slots JSONB,  -- Array of slot indices
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date_key ON bookings(date_key);
```

### Table: units (Alternative structure)
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nama_proyek VARCHAR(200),
  kontak_wa VARCHAR(20),
  nama_pt VARCHAR(200),
  lokasi_proyek TEXT,
  kategori VARCHAR(50),
  selected_date DATE,
  selected_slots JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE unit_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  sample VARCHAR(100),
  merk VARCHAR(100),
  dimensi VARCHAR(50),
  mutu VARCHAR(50),
  uji VARCHAR(50),
  qty INTEGER
);
```

## 🚀 Deployment

### 1. Setup Environment Variables
```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=5000
```

### 2. Install Dependencies
```bash
npm install express cors bcryptjs jsonwebtoken @supabase/supabase-js dotenv
```

### 3. Run Server
```bash
node server-fixed.js
```

## 📝 Best Practices yang Diterapkan

1. **Konsistensi Naming**: Semua endpoint menggunakan `req.user.id`
2. **Error Handling**: Proper error messages dan status codes
3. **Security**: 
   - Password hashing dengan bcrypt
   - JWT dengan expiry
   - Authorization checks
4. **Validation**: Input validation sebelum database operations
5. **Conflict Detection**: Cek slot conflicts sebelum booking
6. **Logging**: Console.error untuk debugging

## ⚠️ Breaking Changes

Jika Anda sudah punya frontend yang menggunakan backend lama:

### Tidak Ada Breaking Changes!
Middleware sudah dibuat backward compatible dengan menyediakan:
- `req.user.id` (recommended)
- `req.user.userId` (alias untuk compatibility)

Jadi frontend lama tetap bisa jalan, tapi disarankan update ke `req.user.id`.

## 🔄 Migration Guide

Jika ingin migrate dari backend lama:

1. Backup database
2. Replace file server dengan `server-fixed.js`
3. Restart server
4. Test semua endpoints
5. Update frontend jika perlu (optional)

## 📞 Support

Jika ada masalah:
1. Cek console log server
2. Cek network tab di browser
3. Pastikan token valid (belum expired)
4. Pastikan environment variables sudah benar

---

**Status**: ✅ Production Ready
**Version**: 2.0.0 (Fixed)
**Last Updated**: 2024-02-11
