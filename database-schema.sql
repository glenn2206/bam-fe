-- =======================================
-- BAM Testing Laboratory - Database Schema
-- =======================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  no_hp VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_no_hp ON users(no_hp);

-- =======================================
-- 2. PROJECTS TABLE (Optional - untuk info project)
-- =======================================
CREATE TABLE IF NOT EXISTS projects (
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

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- =======================================
-- 3. UNITS TABLE (Sistem Lama - Multi Unit per User)
-- =======================================
CREATE TABLE IF NOT EXISTS units (
  id BIGINT PRIMARY KEY,  -- Generated dari Date.now() di frontend
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nama_proyek VARCHAR(200),
  kontak_wa VARCHAR(20),
  nama_pt VARCHAR(200),
  lokasi_proyek TEXT,
  kategori VARCHAR(50),  -- 'BAJA' atau 'BETON'
  selected_date DATE,
  selected_slots JSONB,  -- Array of slot indices
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_units_user_id ON units(user_id);
CREATE INDEX IF NOT EXISTS idx_units_selected_date ON units(selected_date);

-- =======================================
-- 4. UNIT_ROWS TABLE (Detail items per unit)
-- =======================================
CREATE TABLE IF NOT EXISTS unit_rows (
  id BIGINT PRIMARY KEY,  -- Generated dari Date.now() di frontend
  unit_id BIGINT REFERENCES units(id) ON DELETE CASCADE,
  sample VARCHAR(100),    -- Jenis sample (e.g., "REINFORCEMENT BAR")
  merk VARCHAR(100),      -- Brand
  dimensi VARCHAR(50),    -- Ukuran/dimensi
  mutu VARCHAR(50),       -- Mutu/grade
  uji VARCHAR(50),        -- Jenis pengujian
  qty INTEGER DEFAULT 1,  -- Jumlah
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_unit_rows_unit_id ON unit_rows(unit_id);

-- =======================================
-- 5. BOOKINGS TABLE (Sistem Baru - Single booking per entry)
-- =======================================
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_key ON bookings(date_key);

-- =======================================
-- SAMPLE DATA (Optional - untuk testing)
-- =======================================

-- Insert test user
-- INSERT INTO users (no_hp, password_hash, name) 
-- VALUES ('081234567890', '$2a$10$...', 'Test User');

-- =======================================
-- USEFUL QUERIES
-- =======================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check units for a user
-- SELECT u.*, 
--        (SELECT json_agg(ur.*) FROM unit_rows ur WHERE ur.unit_id = u.id) as rows
-- FROM units u
-- WHERE u.user_id = 1;

-- Check all units with rows
-- SELECT u.id, u.nama_proyek, u.kategori, 
--        COUNT(ur.id) as row_count
-- FROM units u
-- LEFT JOIN unit_rows ur ON ur.unit_id = u.id
-- GROUP BY u.id, u.nama_proyek, u.kategori;

-- Delete all data (CAREFUL!)
-- TRUNCATE unit_rows, units, bookings, projects, users CASCADE;

-- =======================================
-- TROUBLESHOOTING
-- =======================================

-- 1. Check if user exists
-- SELECT * FROM users WHERE no_hp = '081234567890';

-- 2. Check units for user
-- SELECT * FROM units WHERE user_id = 1;

-- 3. Check rows for unit
-- SELECT * FROM unit_rows WHERE unit_id = 1234567890;

-- 4. Check foreign key constraints
-- SELECT
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY';

-- =======================================
-- NOTES
-- =======================================

-- 1. UNITS vs BOOKINGS:
--    - UNITS: Sistem lama, multi-unit per user, dengan rows terpisah
--    - BOOKINGS: Sistem baru, single booking per entry
--
-- 2. ID Generation:
--    - units.id & unit_rows.id: BIGINT dari Date.now() (frontend)
--    - bookings.id: SERIAL (auto-increment dari database)
--
-- 3. Cascade Delete:
--    - Jika user dihapus, semua units, unit_rows, bookings ikut terhapus
--    - Jika unit dihapus, semua unit_rows ikut terhapus
--
-- 4. JSONB Fields:
--    - selected_slots: Array of integers [10, 11, 12]
--    - tests: Array of strings ["Tensile", "Bending"]
