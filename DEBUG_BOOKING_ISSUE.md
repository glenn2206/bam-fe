# Debug: Data Booking Tidak Muncul

Panduan debug untuk masalah data booking tidak muncul saat GET `/api/booking`.

## 🔍 Diagnosis Steps

### Step 1: Cek Backend Logs

Setelah update `server-fixed.js`, backend akan menampilkan logs detail:

```bash
# Saat POST /api/booking/sync
💾 POST /api/booking/sync - User ID: 1
📦 Units to save: 1
  📝 Saving unit ID: 1707654321000
  ✅ Unit saved: [...]
  📝 Saving 3 rows for unit 1707654321000
  ✅ Rows saved: 3
✅ All units synced successfully

# Saat GET /api/booking
📥 GET /api/booking - User ID: 1
✅ Units found: 1
```

**Cek di terminal backend:**
- Apakah POST berhasil?
- Apakah ada error?
- User ID sama antara POST dan GET?

### Step 2: Cek Database Langsung

**Via Supabase Dashboard:**
1. Buka Supabase Dashboard
2. Go to Table Editor
3. Pilih table `units`
4. Cek apakah ada data

**Via SQL:**
```sql
-- Cek semua units
SELECT * FROM units;

-- Cek units untuk user tertentu
SELECT * FROM units WHERE user_id = 1;

-- Cek dengan rows
SELECT u.*, 
       (SELECT json_agg(ur.*) FROM unit_rows ur WHERE ur.unit_id = u.id) as rows
FROM units u
WHERE u.user_id = 1;
```

### Step 3: Cek Request di Browser

**Network Tab:**
1. Buka DevTools (F12)
2. Go to Network tab
3. Trigger save (tunggu 10 detik atau klik "Send Manual")
4. Cek request `booking/sync`:
   - Status: 200?
   - Response: `{ status: 'success' }`?
   - Request payload: ada `units` array?

5. Refresh page atau trigger fetch
6. Cek request `booking`:
   - Status: 200?
   - Response: array of units?
   - Headers: Authorization ada?

### Step 4: Cek Token & User ID

**Di Browser Console:**
```javascript
// Cek token
console.log(localStorage.getItem('bam_token'));

// Cek user
console.log(localStorage.getItem('bam_user'));

// Decode JWT token (manual)
// Copy token, paste di jwt.io
```

**Di Backend:**
```javascript
// Tambah log di middleware
const authenticateToken = (req, res, next) => {
  // ...
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid' });
    
    console.log('🔐 Decoded token:', decoded); // ADD THIS
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      no_hp: decoded.no_hp
    };
    next();
  });
};
```

## 🐛 Common Issues & Solutions

### Issue 1: Data Tersimpan Tapi Tidak Muncul

**Kemungkinan Penyebab:**
- User ID berbeda saat save vs fetch
- Data tersimpan untuk user lain

**Solusi:**
```javascript
// Cek di backend logs
// POST: User ID: 1
// GET: User ID: 2  ← BERBEDA!

// Fix: Pastikan login dengan user yang sama
// Atau cek token masih valid
```

### Issue 2: Error "Foreign Key Constraint"

**Error Message:**
```
insert or update on table "units" violates foreign key constraint
```

**Penyebab:**
- `user_id` tidak ada di table `users`

**Solusi:**
```sql
-- Cek user exists
SELECT * FROM users WHERE id = 1;

-- Jika tidak ada, user belum register
-- Login/register ulang
```

### Issue 3: Error "Duplicate Key"

**Error Message:**
```
duplicate key value violates unique constraint "units_pkey"
```

**Penyebab:**
- ID unit sudah ada di database
- Frontend generate ID yang sama

**Solusi:**
```javascript
// Di frontend, pastikan ID unique
const newId = Date.now() + Math.random(); // Tambah random

// Atau clear data lama
// DELETE FROM units WHERE id = 1707654321000;
```

### Issue 4: selected_slots Tidak Tersimpan

**Penyebab:**
- Format data salah
- Bukan array

**Solusi:**
```javascript
// Pastikan format benar
selected_slots: [10, 11, 12] // ✅ Array of numbers

// Bukan:
selected_slots: "10,11,12"   // ❌ String
selected_slots: null         // ❌ Null
```

### Issue 5: Rows Tidak Muncul

**Penyebab:**
- Foreign key `unit_id` tidak match
- Rows tidak tersimpan

**Solusi:**
```sql
-- Cek rows untuk unit
SELECT * FROM unit_rows WHERE unit_id = 1707654321000;

-- Cek foreign key
SELECT ur.*, u.id as unit_exists
FROM unit_rows ur
LEFT JOIN units u ON u.id = ur.unit_id
WHERE ur.unit_id = 1707654321000;
```

## 🔧 Quick Fixes

### Fix 1: Clear & Resync

```javascript
// Di browser console
localStorage.clear();
location.reload();

// Login ulang
// Isi form booking
// Tunggu auto-save atau klik "Send Manual"
```

### Fix 2: Manual Insert (Testing)

```sql
-- Insert test unit
INSERT INTO units (id, user_id, nama_proyek, kategori, selected_date, selected_slots)
VALUES (1707654321000, 1, 'Test Project', 'BAJA', '2024-02-15', '[10, 11, 12]');

-- Insert test rows
INSERT INTO unit_rows (id, unit_id, sample, merk, dimensi, mutu, uji, qty)
VALUES 
  (1707654321001, 1707654321000, 'REINFORCEMENT BAR', 'MASTER STEEL', 'SIRIP/ULIR 16', 'BjTS 420B', 'TENSILE', 5),
  (1707654321002, 1707654321000, 'WIREMESH', 'LIONMESH', 'M8', 'U-50', 'SHEAR', 3);

-- Verify
SELECT u.*, 
       (SELECT json_agg(ur.*) FROM unit_rows ur WHERE ur.unit_id = u.id) as rows
FROM units u
WHERE u.id = 1707654321000;
```

### Fix 3: Reset Database (CAREFUL!)

```sql
-- Delete all units & rows
TRUNCATE unit_rows, units CASCADE;

-- Verify empty
SELECT COUNT(*) FROM units;
SELECT COUNT(*) FROM unit_rows;
```

## 📊 Verification Checklist

Setelah fix, verify:

- [ ] Backend logs menunjukkan save berhasil
- [ ] Database ada data di table `units`
- [ ] Database ada data di table `unit_rows`
- [ ] GET `/api/booking` return array (bukan empty)
- [ ] Frontend menampilkan data
- [ ] User ID konsisten
- [ ] Token valid

## 🧪 Test Scenario

### Manual Test:

1. **Login**
   ```
   No HP: 081234567890
   Password: password123
   ```

2. **Isi Form Booking**
   - Nama Proyek: "Test Project"
   - Kategori: "BAJA"
   - Sample: "REINFORCEMENT BAR"
   - Qty: 5

3. **Tunggu Auto-Save (10 detik)**
   - Atau klik "Send Manual"
   - Cek backend logs
   - Cek status indicator (SAVING → SAVED)

4. **Refresh Page**
   - Data harus muncul kembali
   - Cek browser console untuk errors

5. **Cek Database**
   ```sql
   SELECT * FROM units WHERE user_id = 1;
   ```

## 📞 Still Not Working?

Jika masih tidak work setelah semua steps:

1. **Capture Info:**
   - Screenshot backend logs
   - Screenshot browser Network tab
   - Screenshot database query result
   - Error messages (full text)

2. **Check:**
   - Supabase connection OK?
   - Environment variables correct?
   - Backend & frontend running?
   - CORS enabled?

3. **Try:**
   - Restart backend
   - Clear browser cache
   - Try different browser
   - Check Supabase dashboard for errors

---

**Last Updated**: 2024-02-11
