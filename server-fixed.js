const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseKey || !JWT_SECRET) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// =======================================
// MIDDLEWARE JWT - FIXED
// =======================================
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
    
    // FIXED: Konsisten gunakan struktur yang sama
    req.user = {
      id: decoded.userId,      // Primary ID
      userId: decoded.userId,  // Alias untuk backward compatibility
      no_hp: decoded.no_hp
    };
    
    next();
  });
};

// =======================================
// AUTH: REGISTER
// =======================================
app.post('/api/auth/register', async (req, res) => {
  const { no_hp, password, name } = req.body;

  if (!no_hp || !password) {
    return res.status(400).json({ error: 'No HP dan password wajib diisi' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('no_hp', no_hp)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Nomor HP sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ 
        no_hp, 
        password_hash: hashedPassword, 
        name: name || null 
      }])
      .select('id, no_hp, name')
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: newUser.id, no_hp: newUser.no_hp },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: { id: newUser.id, no_hp: newUser.no_hp, name: newUser.name }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal registrasi' });
  }
});

// =======================================
// AUTH: LOGIN
// =======================================
app.post('/api/auth/login', async (req, res) => {
  const { no_hp, password } = req.body;

  if (!no_hp || !password) {
    return res.status(400).json({ error: 'No HP dan password wajib diisi' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, no_hp, name, password_hash')
      .eq('no_hp', no_hp)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Nomor HP atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Nomor HP atau password salah' });
    }

    const token = jwt.sign(
      { userId: user.id, no_hp: user.no_hp },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, no_hp: user.no_hp, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// =======================================
// PROJECTS: SYNC
// =======================================
app.post('/api/projects/sync', authenticateToken, async (req, res) => {
  const { nama_proyek, nama_perusahaan, lokasi_proyek, kontak_person } = req.body;

  try {
    const { data, error } = await supabase
      .from('projects')
      .upsert({
        user_id: req.user.id,  // FIXED: Gunakan req.user.id
        nama_proyek,
        nama_perusahaan,
        lokasi_proyek,
        kontak_person,
        updated_at: new Date()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Sync berhasil', data });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Gagal sinkronisasi data proyek' });
  }
});

// =======================================
// PROJECTS: GET MY PROJECT
// =======================================
app.get('/api/projects/my-project', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', req.user.id)  // FIXED
      .maybeSingle();

    if (error) throw error;

    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data proyek' });
  }
});

// =======================================
// BOOKINGS: CREATE
// =======================================
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const {
    kategori,
    material,
    merk,
    tipe,
    ukuran,
    mutu,
    tests,
    qty_sample = 0,
    total_pengujian,
    tanggal,
    jadwal,
    date_key,
    selected_slots
  } = req.body;

  if (!date_key || !Array.isArray(selected_slots) || selected_slots.length === 0) {
    return res.status(400).json({ 
      error: 'date_key dan selected_slots wajib diisi dan tidak boleh kosong' 
    });
  }

  try {
    // Cek konflik slot
    const { data: existing } = await supabase
      .from('bookings')
      .select('selected_slots')
      .eq('date_key', date_key);

    const used = new Set();
    existing?.forEach(row => {
      row.selected_slots?.forEach(s => used.add(s));
    });

    const conflicts = selected_slots.filter(s => used.has(s));
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Beberapa slot sudah dibooking',
        conflicted_slots: conflicts
      });
    }

    // Insert booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{
        user_id: req.user.id,  // FIXED
        kategori,
        material,
        merk,
        tipe,
        ukuran,
        mutu,
        tests,
        qty_sample,
        total_pengujian,
        tanggal,
        jadwal,
        date_key,
        selected_slots
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Booking berhasil disimpan',
      booking
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Gagal menyimpan booking' });
  }
});

// =======================================
// BOOKINGS: UPDATE
// =======================================
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    kategori,
    material,
    merk,
    tipe,
    ukuran,
    mutu,
    tests,
    qty_sample,
    total_pengujian,
    tanggal,
    jadwal,
    date_key,
    selected_slots
  } = req.body;

  try {
    // Cek booking ada dan milik user ini
    const { data: existingBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, user_id, date_key, selected_slots')
      .eq('id', id)
      .eq('user_id', req.user.id)  // FIXED
      .single();

    if (fetchErr || !existingBooking) {
      return res.status(404).json({ 
        error: 'Booking tidak ditemukan atau bukan milik Anda' 
      });
    }

    // Cek konflik slot jika ada perubahan
    let hasSlotChange = false;
    let newDateKey = date_key || existingBooking.date_key;
    let newSlots = selected_slots || existingBooking.selected_slots;

    if (date_key && date_key !== existingBooking.date_key) {
      hasSlotChange = true;
    }
    if (selected_slots && JSON.stringify(selected_slots) !== JSON.stringify(existingBooking.selected_slots)) {
      hasSlotChange = true;
    }

    if (hasSlotChange) {
      const { data: bookingsOnNewDate } = await supabase
        .from('bookings')
        .select('selected_slots')
        .eq('date_key', newDateKey)
        .neq('id', id);

      const used = new Set();
      bookingsOnNewDate?.forEach(row => {
        row.selected_slots?.forEach(s => used.add(s));
      });

      const conflicts = newSlots.filter(s => used.has(s));
      if (conflicts.length > 0) {
        return res.status(409).json({
          error: 'Beberapa slot sudah dibooking oleh orang lain',
          conflicted_slots: conflicts
        });
      }
    }

    // Siapkan data update
    const updateData = {};
    if (kategori !== undefined) updateData.kategori = kategori;
    if (material !== undefined) updateData.material = material;
    if (merk !== undefined) updateData.merk = merk;
    if (tipe !== undefined) updateData.tipe = tipe;
    if (ukuran !== undefined) updateData.ukuran = ukuran;
    if (mutu !== undefined) updateData.mutu = mutu;
    if (tests !== undefined) updateData.tests = tests;
    if (qty_sample !== undefined) updateData.qty_sample = qty_sample;
    if (total_pengujian !== undefined) updateData.total_pengujian = total_pengujian;
    if (tanggal !== undefined) updateData.tanggal = tanggal;
    if (jadwal !== undefined) updateData.jadwal = jadwal;
    if (date_key !== undefined) updateData.date_key = date_key;
    if (selected_slots !== undefined) updateData.selected_slots = selected_slots;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah' });
    }

    const { data: updatedBooking, error: updateErr } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      message: 'Booking berhasil diupdate',
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Gagal mengupdate booking' });
  }
});

// =======================================
// BOOKINGS: GET BOOKED SLOTS
// =======================================
app.get('/api/bookings/slots/:dateKey', async (req, res) => {
  const { dateKey } = req.params;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('selected_slots')
      .eq('date_key', dateKey);

    if (error) throw error;

    const allSlots = data.flatMap(row => row.selected_slots || []);
    const unique = [...new Set(allSlots)].sort((a, b) => a - b);

    res.json({ bookedSlots: unique });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil booked slots' });
  }
});

// =======================================
// BOOKINGS: GET USER'S BOOKINGS
// =======================================
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)  // FIXED
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar booking' });
  }
});

// =======================================
// BOOKINGS: GET DETAIL BY ID
// =======================================
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)  // FIXED
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        error: 'Booking tidak ditemukan atau bukan milik Anda' 
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail' });
  }
});

// =======================================
// BOOKINGS: DELETE
// =======================================
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      return res.status(404).json({ error: 'Booking tidak ditemukan' });
    }

    if (booking.user_id !== req.user.id) {  // FIXED
      return res.status(403).json({ 
        error: 'Tidak berhak menghapus booking ini' 
      });
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Booking berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus booking' });
  }
});

// =======================================
// UNITS: GET USER'S UNITS (Alternative Structure)
// =======================================
// UNITS: GET USER'S UNITS (Alternative Structure)
// =======================================
app.get('/api/booking', authenticateToken, async (req, res) => {
  console.log('📥 GET /api/booking - User ID:', req.user.id);
  
  try {
    const { data, error } = await supabase
      .from('units')
      .select(`*, rows:unit_rows(*)`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching units:', error);
      throw error;
    }

    console.log('✅ Units found:', data?.length || 0);
    res.json(data || []);
  } catch (err) {
    console.error('❌ GET /api/booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =======================================
// UNITS: GET BOOKED SCHEDULES (Global)
// =======================================
app.get('/api/booked-schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('units')
      .select('selected_date, selected_slots')
      .not('selected_date', 'is', null);

    if (error) throw error;

    const bookedMap = data.reduce((acc, curr) => {
      const date = curr.selected_date;
      if (!acc[date]) acc[date] = [];
      acc[date] = [...acc[date], ...curr.selected_slots];
      return acc;
    }, {});

    res.json(bookedMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================================
// UNITS: SYNC (Auto-Save)
// =======================================
app.post('/api/booking/sync', authenticateToken, async (req, res) => {
  const { units } = req.body;
  
  console.log('💾 POST /api/booking/sync - User ID:', req.user.id);
  console.log('📦 Units to save:', units?.length || 0);

  if (!units || !Array.isArray(units)) {
    return res.status(400).json({ error: 'Units array is required' });
  }

  try {
    for (const unit of units) {
      console.log(`  📝 Saving unit ID: ${unit.id}`);
      
      // Upsert Unit
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .upsert({
          id: unit.id,
          user_id: req.user.id,
          nama_proyek: unit.namaProyek,
          kontak_wa: unit.kontakWA,
          nama_pt: unit.namaPT,
          lokasi_proyek: unit.lokasiProyek,
          kategori: unit.kategori,
          selected_date: unit.selectedDate,
          selected_slots: unit.selectedSlots
        })
        .select();

      if (unitError) {
        console.error('❌ Error saving unit:', unitError);
        throw unitError;
      }
      
      console.log('  ✅ Unit saved:', unitData);

      // Upsert Rows
      if (unit.rows?.length > 0) {
        console.log(`  📝 Saving ${unit.rows.length} rows for unit ${unit.id}`);
        
        const { data: rowsData, error: rowsError } = await supabase
          .from('unit_rows')
          .upsert(
            unit.rows.map(r => ({
              id: r.id,
              unit_id: unit.id,
              sample: r.sample,
              merk: r.merk,
              dimensi: r.dimensi,
              mutu: r.mutu,
              uji: r.uji,
              qty: r.qty
            }))
          )
          .select();

        if (rowsError) {
          console.error('❌ Error saving rows:', rowsError);
          throw rowsError;
        }
        
        console.log('  ✅ Rows saved:', rowsData?.length || 0);
      }
    }

    console.log('✅ All units synced successfully');
    res.json({ 
      status: 'success',
      message: `${units.length} unit(s) synced successfully`
    });
  } catch (err) {
    console.error('❌ POST /api/booking/sync error:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.details || err.hint || 'No additional details'
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
  console.log(`📝 Endpoints tersedia:`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET/POST /api/bookings`);
  console.log(`   - GET/POST /api/booking (units)`);
  console.log(`   - GET/POST /api/projects`);
});
