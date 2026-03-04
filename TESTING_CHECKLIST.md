# Testing Checklist - Booking Save/Fetch Separation

## ✅ Implementation Status: COMPLETE

### Changes Made:
1. ✅ Separated auto-save and fetch logic into two distinct useEffect hooks
2. ✅ Auto-save triggers on `units` change (debounced 10 seconds)
3. ✅ Fetch triggers ONLY on `user` change (mount/login/logout)
4. ✅ Added manual "💾 Save Now" button
5. ✅ Added manual "🔄 Reload" button with confirmation
6. ✅ Fixed `isFirstRender` logic to prevent saving on initial load
7. ✅ Moved `resetToDefault` to component scope for reusability

---

## 🧪 Test Scenarios

### Test 1: Initial Load
**Steps:**
1. Open browser, navigate to booking page
2. Login with valid credentials

**Expected:**
- ✅ Status shows "LOADING..."
- ✅ Data fetches from server (check Network tab: GET /api/booking)
- ✅ Status changes to "SAVED"
- ✅ Form displays saved data (or empty if no data)
- ✅ NO auto-save triggered on initial load

**Verify:**
```
Console logs should show:
📥 Fetching booking data...
✅ Fetch success: { units: X }
```

---

### Test 2: Edit Data (Auto-Save)
**Steps:**
1. After initial load, type in "Nama Proyek" field
2. Continue typing for a few seconds
3. Stop typing and wait

**Expected:**
- ✅ While typing: NO fetch requests
- ✅ After 10 seconds idle: Status shows "SAVING..."
- ✅ Network tab shows: POST /api/booking/sync
- ✅ Status changes to "SAVED"
- ✅ NO fetch request after save

**Verify:**
```
Console logs should show:
💾 Saving booking data... { units: 1, token: ✅ Present }
✅ Auto-save success: { status: 'success', ... }
```

---

### Test 3: Continue Editing After Auto-Save
**Steps:**
1. After auto-save completes
2. Immediately continue editing (add more text)
3. Wait 10 seconds

**Expected:**
- ✅ Data does NOT disappear while typing
- ✅ NO fetch requests
- ✅ After 10 seconds: Another auto-save triggers
- ✅ Status: "SAVING..." → "SAVED"

**Verify:**
```
NO logs like:
📥 Fetching booking data... (should NOT appear)
```

---

### Test 4: Manual Save Button
**Steps:**
1. Edit some data
2. Click "💾 Save Now" button immediately (don't wait 10 seconds)

**Expected:**
- ✅ Status shows "SAVING..." immediately
- ✅ Network tab: POST /api/booking/sync
- ✅ Alert shows: "✅ Data berhasil disimpan!"
- ✅ Status changes to "SAVED"
- ✅ NO fetch request

**Verify:**
```
Console logs:
💾 Saving booking data...
✅ Auto-save success
```

---

### Test 5: Manual Reload Button
**Steps:**
1. Edit some data (don't save)
2. Click "🔄 Reload" button
3. Click "OK" on confirmation dialog

**Expected:**
- ✅ Confirmation dialog appears: "Reload data dari server? Perubahan yang belum disimpan akan hilang."
- ✅ Status shows "LOADING..."
- ✅ Network tab: GET /api/booking
- ✅ Data reloads from server
- ✅ Unsaved changes are lost (expected behavior)
- ✅ Alert shows: "✅ Data berhasil di-reload!"

**Verify:**
```
Console logs:
📥 Fetching booking data...
✅ Fetch success: { units: X }
```

---

### Test 6: Page Refresh (Data Persistence)
**Steps:**
1. Edit data
2. Wait for auto-save (10 seconds)
3. Verify status shows "SAVED"
4. Press F5 to refresh page

**Expected:**
- ✅ Page reloads
- ✅ Status shows "LOADING..."
- ✅ Data fetches from server
- ✅ Previously saved data appears
- ✅ NO data loss

---

### Test 7: Rapid Typing (Debounce Test)
**Steps:**
1. Type continuously in a field for 15 seconds
2. Stop typing

**Expected:**
- ✅ While typing: NO save requests
- ✅ Timer resets on each keystroke
- ✅ After 10 seconds idle: ONE save request
- ✅ NO multiple save requests

**Verify:**
```
Network tab should show:
- NO requests while typing
- ONE POST /api/booking/sync after 10s idle
```

---

### Test 8: Multiple Fields Edit
**Steps:**
1. Edit "Nama Proyek"
2. Wait 5 seconds
3. Edit "Kontak WA"
4. Wait 5 seconds
5. Edit "Nama PT"
6. Wait 10 seconds

**Expected:**
- ✅ Timer resets on each edit
- ✅ Only ONE save request after final 10 seconds idle
- ✅ All changes saved together

---

### Test 9: Add/Delete Rows
**Steps:**
1. Click "Tambah Item" to add a row
2. Fill in the new row
3. Wait 10 seconds

**Expected:**
- ✅ Auto-save triggers
- ✅ New row saved to server
- ✅ NO fetch request

**Steps (Delete):**
1. Click delete button on a row
2. Wait 10 seconds

**Expected:**
- ✅ Auto-save triggers
- ✅ Row deletion saved
- ✅ NO fetch request

---

### Test 10: Add/Delete Units
**Steps:**
1. Click "TAMBAH UNIT / PROYEK BARU"
2. Fill in the new unit
3. Wait 10 seconds

**Expected:**
- ✅ Auto-save triggers
- ✅ New unit saved
- ✅ NO fetch request

---

### Test 11: Logout/Login Flow
**Steps:**
1. Edit data and save
2. Logout
3. Login again

**Expected:**
- ✅ After logout: Form clears or shows login prompt
- ✅ After login: Status shows "LOADING..."
- ✅ Data fetches from server
- ✅ Previously saved data appears

---

### Test 12: No Token (Not Logged In)
**Steps:**
1. Clear localStorage (or logout)
2. Try to access booking page

**Expected:**
- ✅ Blur overlay appears
- ✅ Message: "Silakan Login untuk Akses Halaman Ini"
- ✅ Login popup shows
- ✅ NO fetch/save requests

---

## 🐛 Common Issues to Watch For

### ❌ Issue: Data disappears while typing
**Cause:** Fetch triggered on `units` change
**Check:** Network tab should NOT show GET /api/booking while typing

### ❌ Issue: Infinite loop
**Cause:** Fetch updates state → triggers fetch again
**Check:** Console should NOT show repeated fetch logs

### ❌ Issue: Save on every keystroke
**Cause:** No debounce or debounce too short
**Check:** Network tab should show ONE save after 10s idle, not multiple

### ❌ Issue: Data not persisting
**Cause:** Save not working or token missing
**Check:** Console logs for "❌ Cannot save: No token found"

### ❌ Issue: Auto-save on initial load
**Cause:** `isFirstRender` logic not working
**Check:** Network tab should NOT show POST /api/booking/sync on page load

---

## 📊 Network Tab Expected Behavior

### On Page Load:
```
GET /api/booking (fetch data)
```

### While Typing:
```
(no requests)
```

### After 10s Idle:
```
POST /api/booking/sync (save data)
```

### On Manual Save:
```
POST /api/booking/sync (save data)
```

### On Manual Reload:
```
GET /api/booking (fetch data)
```

---

## 🎯 Success Criteria

All tests pass if:
- ✅ NO fetch requests while typing
- ✅ Auto-save works after 10 seconds idle
- ✅ Manual save works immediately
- ✅ Manual reload works with confirmation
- ✅ Data persists after page refresh
- ✅ NO infinite loops
- ✅ NO data loss while editing

---

## 🔍 Debugging Tips

### Check Console Logs:
```javascript
// Should see these patterns:
📥 Fetching booking data...  // Only on mount/login/reload
💾 Saving booking data...    // Only on auto-save/manual save
✅ Fetch success
✅ Auto-save success
```

### Check Network Tab:
- Filter by "booking" to see only relevant requests
- GET = fetch, POST = save
- Should NOT see GET while typing

### Check React DevTools:
- Watch `units` state changes
- Watch `isLoading` and `isSaving` states
- Verify useEffect dependencies

---

**Last Updated:** 2024-02-11
**Status:** Ready for Testing
