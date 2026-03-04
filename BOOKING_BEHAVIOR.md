# Booking Component Behavior

Dokumentasi tentang behavior auto-save dan data fetching di komponen Booking.

## 🎯 Behavior Overview

### Auto-Save (Setiap 10 Detik)
- ✅ Trigger: Saat user mengubah data (ketik, pilih, dll) - **HANYA INPUT USER**
- ✅ Delay: 10 detik setelah perubahan terakhir (debounced)
- ✅ Indicator: Status berubah "SAVING..." → "SAVED"
- ❌ TIDAK trigger saat data berubah karena fetch dari backend
- ❌ TIDAK fetch data dari server

### Manual Save (Tombol "💾 Save Now")
- ✅ Trigger: User klik tombol
- ✅ Langsung save tanpa delay
- ✅ Tampilkan alert sukses/gagal
- ❌ TIDAK fetch data dari server

### Load Data (Saat Mount)
- ✅ Trigger: Pertama kali buka halaman atau login
- ✅ Fetch data dari server
- ✅ Tampilkan data yang tersimpan
- ✅ Jika tidak ada data → tampilkan form kosong
- ✅ Set flag `isFromFetch` untuk mencegah auto-save

### Reload Data (Tombol "🔄 Reload")
- ✅ Trigger: User klik tombol
- ✅ Fetch data terbaru dari server
- ⚠️ Konfirmasi dulu (perubahan belum disimpan akan hilang)
- ✅ Replace data lokal dengan data server
- ✅ Set flag `isFromFetch` untuk mencegah auto-save

## 🔄 Data Flow

```
User Login
    ↓
Load Data (FETCH) - Set isFromFetch = true
    ↓
Display Data (NO AUTO-SAVE!)
    ↓
User Edit Data - isFromFetch = false
    ↓
Auto-Save (SAVE) - Every 10s
    ↓
Continue Editing (NO FETCH!)
    ↓
User Click "Reload"
    ↓
Confirm → Fetch Latest Data - Set isFromFetch = true
    ↓
Display Data (NO AUTO-SAVE!)
```

## 🎨 UI Elements

### Status Indicator
```
[LOADING...]  - Sedang fetch data dari server
[SAVING...]   - Sedang save data ke server
[SAVED]       - Data sudah tersimpan
```

### Buttons
```
[💾 Save Now]  - Manual save (langsung)
[🔄 Reload]    - Reload data dari server (dengan konfirmasi)
```

## 📝 Code Explanation

### 1. Auto-Save Effect (HANYA USER INPUT)
```javascript
const isFromFetch = useRef(false); // Flag untuk tandai data dari fetch

useEffect(() => {
  // Skip jika masih loading
  if (isLoading) return;
  
  // PENTING: Skip jika perubahan berasal dari FETCH backend
  if (isFromFetch.current) {
    console.log('⏭️ Skip auto-save: Data dari fetch backend');
    isFromFetch.current = false; // Reset flag
    return;
  }
  
  // Skip jika data kosong
  if (units.length === 0) return;
  
  // Debounce 10 detik - HANYA untuk USER INPUT
  console.log('⏰ Auto-save scheduled: User input detected');
  const timer = setTimeout(() => {
    saveBookingData(units); // SAVE ONLY, NO FETCH
  }, 10000);
  
  return () => clearTimeout(timer);
}, [units]); // Trigger saat units berubah
```

**Behavior:**
- ✅ Trigger saat `units` state berubah dari USER INPUT
- ✅ Debounced 10 detik (reset timer jika ada perubahan baru)
- ✅ Hanya SAVE, tidak FETCH
- ✅ Skip saat loading
- ✅ **Skip saat data berubah karena FETCH** (ini yang baru!)

### 2. Load Data Effect
```javascript
useEffect(() => {
  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const data = await fetchBookingData(); // FETCH ONLY
    
    // TANDAI bahwa perubahan berasal dari FETCH
    isFromFetch.current = true;
    
    setUnits(data); // Ini akan trigger useEffect auto-save, tapi di-skip!
    setIsLoading(false);
  };
  
  loadData();
}, [user]); // Hanya run saat user berubah
```

**Behavior:**
- ✅ Run SEKALI saat component mount
- ✅ Run lagi jika user login/logout
- ✅ Hanya FETCH, tidak SAVE
- ✅ **Set flag `isFromFetch = true` sebelum update state**
- ❌ TIDAK run saat `units` berubah

### 3. Manual Save Button
```javascript
<button onClick={async () => {
  setIsSaving(true);
  await saveBookingData(units); // SAVE ONLY
  alert('✅ Data berhasil disimpan!');
  setIsSaving(false);
}}>
  💾 Save Now
</button>
```

**Behavior:**
- ✅ Save langsung tanpa delay
- ✅ Tampilkan alert
- ❌ TIDAK fetch data

### 4. Reload Button
```javascript
<button onClick={async () => {
  if (!confirm('Reload data?')) return;
  
  setIsLoading(true);
  const data = await fetchBookingData(); // FETCH ONLY
  
  // TANDAI bahwa perubahan berasal dari FETCH
  isFromFetch.current = true;
  
  setUnits(data); // Ini akan trigger useEffect auto-save, tapi di-skip!
  setIsLoading(false);
}}>
  🔄 Reload
</button>
```

**Behavior:**
- ✅ Konfirmasi dulu
- ✅ Fetch data terbaru
- ✅ Replace data lokal
- ✅ **Set flag `isFromFetch = true` untuk skip auto-save**
- ⚠️ Perubahan belum disimpan akan hilang

## ⚠️ Important Notes

### 1. Separation of Concerns
- **SAVE**: Hanya kirim data ke server (dari USER INPUT)
- **FETCH**: Hanya ambil data dari server
- **TIDAK** save dan fetch bersamaan
- **TIDAK** auto-save saat data berubah karena fetch

### 2. User Experience
- User bisa terus mengetik tanpa gangguan
- Auto-save di background (debounced)
- Reload hanya jika user mau (manual)
- **Data dari fetch TIDAK trigger auto-save**

### 3. Data Consistency
- Auto-save memastikan data tidak hilang
- Reload memastikan data sync dengan server
- Konfirmasi mencegah data loss
- **Flag `isFromFetch` mencegah save loop**

### 4. Flag System
```javascript
isFromFetch.current = true  // Set sebelum fetch data
↓
setUnits(data)              // Update state (trigger useEffect)
↓
useEffect detects flag      // Skip auto-save
↓
isFromFetch.current = false // Reset flag
```

## 🐛 Common Issues (FIXED)

### ❌ Issue: Auto-Save Trigger Saat Fetch Data
**Penyebab:** Fetch data → update state → trigger auto-save useEffect

**Fix:** 
```javascript
// SALAH - Auto-save trigger saat fetch
const data = await fetchData();
setUnits(data); // ❌ Trigger auto-save!

// BENAR - Set flag sebelum update state
isFromFetch.current = true; // Tandai sebagai fetch
const data = await fetchData();
setUnits(data); // ✅ Auto-save di-skip!
```

### ❌ Issue: Data Hilang Saat Ketik
**Penyebab:** Fetch data setiap kali `units` berubah

**Fix:** 
```javascript
// SALAH - Fetch saat units berubah
useEffect(() => {
  fetchData(); // ❌ Akan fetch terus!
}, [units]);

// BENAR - Fetch hanya saat mount
useEffect(() => {
  fetchData(); // ✅ Hanya sekali
}, [user]);
```

### ❌ Issue: Infinite Loop
**Penyebab:** Fetch data → update state → trigger fetch lagi

**Fix:**
```javascript
// SALAH
useEffect(() => {
  const data = await fetchData();
  setUnits(data); // Trigger useEffect lagi!
}, [units]); // ❌ Loop!

// BENAR
useEffect(() => {
  const data = await fetchData();
  setUnits(data); // Tidak trigger lagi
}, [user]); // ✅ Hanya saat user berubah
```

### ❌ Issue: Save Terlalu Sering
**Penyebab:** Save setiap keystroke

**Fix:**
```javascript
// SALAH
onChange={() => {
  saveData(); // ❌ Save setiap ketik!
}}

// BENAR - Debounced
useEffect(() => {
  const timer = setTimeout(() => {
    saveData(); // ✅ Save setelah 10 detik idle
  }, 10000);
  return () => clearTimeout(timer);
}, [units]);
```

## 🧪 Testing

### Test 1: Auto-Save
1. Login
2. Isi form booking
3. Tunggu 10 detik
4. Cek status: "SAVING..." → "SAVED"
5. Cek backend logs: POST /api/booking/sync
6. ✅ Data tersimpan

### Test 2: Continue Editing
1. Setelah auto-save
2. Lanjut edit data
3. ✅ Data TIDAK hilang
4. ✅ TIDAK ada fetch request
5. Tunggu 10 detik lagi
6. ✅ Auto-save lagi

### Test 3: Manual Save
1. Edit data
2. Klik "💾 Save Now"
3. ✅ Langsung save (tidak tunggu 10 detik)
4. ✅ Alert muncul
5. ✅ Status "SAVED"

### Test 4: Reload
1. Edit data (jangan save)
2. Klik "🔄 Reload"
3. ✅ Konfirmasi muncul
4. Klik OK
5. ✅ Data kembali ke versi server
6. ✅ Perubahan hilang (expected)

### Test 5: Page Refresh
1. Edit data
2. Tunggu auto-save (10 detik)
3. Refresh page (F5)
4. ✅ Data muncul kembali
5. ✅ Tidak hilang

## 📊 Comparison

### Before (Broken)
```
User ketik → units berubah → useEffect trigger → FETCH data → 
units berubah lagi → useEffect trigger lagi → FETCH lagi → LOOP!
```

### After (Fixed)
```
User ketik → units berubah → useEffect trigger → SAVE data → 
Continue editing → units berubah → SAVE lagi (debounced) → 
NO FETCH unless user click Reload
```

## 🎯 Best Practices

1. **Separate Save & Fetch**
   - Save: Triggered by user action
   - Fetch: Triggered by mount/reload only

2. **Debounce Auto-Save**
   - Prevent too many requests
   - Better UX (no interruption)

3. **Confirm Before Reload**
   - Prevent accidental data loss
   - User awareness

4. **Show Status**
   - User knows what's happening
   - Loading/Saving/Saved indicators

5. **Error Handling**
   - Show alerts on error
   - Don't silently fail

---

**Last Updated**: 2024-02-11
