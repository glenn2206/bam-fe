import { useState, useEffect, useRef, useMemo } from 'react';
import SmartSelect from '../components/SmartSelect';
import PilihJadwal from '../components/PilihJadwal';
import { db } from '../helper';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../hooks/useBooking';

const Booking = () => {
  const isFromFetch = useRef(false); // Flag untuk tandai perubahan dari fetch
  
  // 1. STATE MANAGEMENT (Multi-Unit)
  const [units, setUnits] = useState([
    { 
      id: crypto.randomUUID(),
      nama_proyek: '', kontak_wa: '', nama_pt: '', lokasi_proyek: '',
      kategori: "", selected_date: "", selected_slots: [], 
      rows: [{ id: Date.now() + 1, sample: '', merk: '', dimensi: '', mutu: '', uji: '', qty: 1 }] 
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allBookings, setAllBookings] = useState({});

  const { user } = useAuth();
  const { fetchUnits, saveUnits, getBookedSchedules } = useBooking();

  // Fetch all bookings (global schedules)
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const data = await getBookedSchedules();
        setAllBookings(data);
      } catch (err) {
        console.error("Gagal load data booking global:", err);
      }
    };
    fetchAllBookings();
  }, [isSaving]);

  // Auto-save effect - HANYA trigger kalau ada INPUT DARI USER
  useEffect(() => {
    // Jika masih loading awal, jangan lakukan apa-apa
    if (isLoading) return;

    // Jika perubahan berasal dari FETCH, jangan saving
    if (isFromFetch.current) {
      console.log('⏭️ Skip auto-save: Data dari fetch backend');
      isFromFetch.current = false; // Reset flag
      return;
    }

    // Jika data kosong juga jangan saving
    if (units.length === 0) return;

    // Baru di sini logic saving jalan (ini dari USER INPUT)
    console.log('⏰ Auto-save scheduled: User input detected');
    setIsSaving(true);
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        await saveUnits(units);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 10000); 

    return () => clearTimeout(delayDebounceFn);
  }, [units, isLoading]);

  // Load data effect - hanya run SEKALI saat mount atau user berubah
  useEffect(() => {
    const loadData = async () => {
      // JANGAN fetch kalau user belum login
      if (!user) return; 

      setIsLoading(true);
      try {
        const savedData = await fetchUnits();
        
        // TANDAI bahwa perubahan berikutnya berasal dari FETCH
        isFromFetch.current = true;
        
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
          setUnits(savedData);
        } else {
          // Jika data di server kosong, tetap pakai default
          resetToDefault();
        }
      } catch (err) {
        console.error("Gagal load dari server, menggunakan data lokal.");
        isFromFetch.current = true; // Tetap tandai sebagai fetch
        resetToDefault();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]); // Hanya run saat user berubah (login/logout)

  // Helper function untuk reset ke default
  const resetToDefault = () => {
    setUnits([{ 
      id: Date.now(),
      nama_proyek: '', kontak_wa: '', nama_pt: '', lokasi_proyek: '',
      kategori: "", selected_date: "", selected_slots: [], 
      rows: [{ id: Date.now() + 1, sample: '', merk: '', dimensi: '', mutu: '', uji: '', qty: 1 }] 
    }]);
  };

  const [activeUnitId, setActiveUnitId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. HANDLER FUNCTIONS (LEVEL UNIT)
  const addUnit = () => {
    const newId = Date.now();
    setUnits([...units, { 
      id: newId, 
      nama_proyek: '', kontak_wa: '', nama_pt: '', lokasi_proyek: '',
      kategori: "", selected_date: "", selected_slots: [], 
      rows: [{ id: newId + 1, sample: '', qty: 1 }] 
    }]);
  };

  const deleteUnit = (unitId) => {
    if (units.length > 1) setUnits(units.filter(u => u.id !== unitId));
  };

  const updateUnitField = (unitId, field, value) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, [field]: value } : u));
  };

  // 3. HANDLER FUNCTIONS (LEVEL ROWS)
  const handleInputChange = (unitId, rowId, field, value) => {
    setUnits(prev => prev.map(u => u.id === unitId ? {
      ...u,
      rows: u.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
    } : u));
  };

  const addRow = (unitId) => {
    setUnits(prev => prev.map(u => u.id === unitId ? {
      ...u,
      rows: [...u.rows, { id: Date.now(), sample: '', merk: '', dimensi: '', mutu: '', uji: '', qty: 1 }]
    } : u));
  };

  const copyRow = (unitId, row) => {
    setUnits(prev => prev.map(u => u.id === unitId ? {
      ...u,
      rows: [...u.rows, { ...row, id: Date.now() }]
    } : u));
  };

  const deleteRow = (unitId, rowId) => {
    setUnits(prev => prev.map(u => u.id === unitId ? {
      ...u,
      rows: u.rows.length > 1 ? u.rows.filter(r => r.id !== rowId) : u.rows
    } : u));
  };

  // 4. JADWAL HANDLER
  const handleUpdateJadwal = (date, slots) => {
    setUnits(prev => prev.map(u => u.id === activeUnitId ? {
      ...u, selected_date: date, selected_slots: slots
    } : u));
  };

  const allOtherBookings = useMemo(() => {
      // Buat salinan data booking tapi buang unit yang sedang kita edit sekarang
      const filtered = {};
      Object.keys(allBookings).forEach(date => {
          filtered[date] = allBookings[date].filter(b => b.id !== activeUnitId);
      });
      return filtered;
  }, [allBookings, activeUnitId]);

  const activeUnit = units.find(u => u.id === activeUnitId) || {};

  return (
    <div className="max-w-7xl mx-auto my-4 md:my-8 font-sans px-4">
      
      {/* HEADER UTAMA */}
      <div className="bg-slate-800 p-4 rounded-t-xl flex justify-between items-center text-white shadow-lg">
        <h2 className="font-bold text-lg flex items-center gap-2">
          🧪 Lab Booking System 
          {isLoading ? (
              <span className="text-[10px] bg-blue-500 animate-pulse px-2 py-1 rounded">LOADING...</span>
          ) : isSaving ? (
             <span className="text-[10px] bg-amber-500 animate-pulse px-2 py-1 rounded">SAVING...</span>
          ) : (
             <span className="text-[10px] bg-emerald-500 px-2 py-1 rounded">SAVED</span>
          )}
        </h2>
        
  
      </div>

      {/* LOOPING UNITS */}
      {units.map((unit, unitIdx) => (
        <div key={unit.id} className="bg-white border-x border-b mb-10 shadow-md rounded-b-xl overflow-hidden">
          
          {/* SUB-HEADER UNIT */}
          <div className="bg-slate-100 p-3 border-b flex justify-between items-center px-6">
            <span className="font-black text-slate-500 text-sm tracking-widest uppercase">UNIT #{unitIdx + 1}</span>
            {units.length > 1 && (
              <button onClick={() => deleteUnit(unit.id)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-tighter">Hapus Unit</button>
            )}
          </div>

          {/* PROJECT INFO SECTION */}
          <div className="p-4 md:p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Nama Proyek', key: 'nama_proyek', placeholder: 'Input...' },
                { label: 'WhatsApp (WA)', key: 'kontak_wa', placeholder: '08...' },
                { label: 'Nama PT', key: 'nama_pt', placeholder: 'PT...' },
                { label: 'Lokasi', key: 'lokasi_proyek', placeholder: 'Alamat...' },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">{field.label}</label>
                  <input 
                    type="text" 
                    className="border p-2 rounded outline-sky-500 bg-white text-sm" 
                    placeholder={field.placeholder} 
                    value={unit[field.key]} 
                    onChange={(e) => updateUnitField(unit.id, field.key, e.target.value)} 
                  />
                </div>
              ))}
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Jadwal Pengujian</label>
                <button 
                  onClick={() => { setActiveUnitId(unit.id); setIsModalOpen(true); }}
                  className={`border p-2 rounded outline-sky-500 font-bold text-left text-sm transition-all bg-white ${unit.selected_date ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-dashed border-gray-300 text-gray-400'}`}
                >
                  {unit.selected_date ? `📅 ${unit.selected_date}` : "📅 Pilih Jadwal"}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Kategori Material</label>
                <select 
                  value={unit.kategori}
                  onChange={(e) => updateUnitField(unit.id, 'kategori', e.target.value)}
                  className="border p-2 rounded outline-sky-500 cursor-pointer bg-white text-sm font-semibold"
                >
                  <option value="">-- PILIH KATEGORI --</option>
                  <option value="BAJA">⚙️ BAJA</option>
                  <option value="BETON">🧱 BETON</option>
                </select>
              </div>
            </div>
          </div>

          {/* UNIFIED FLEX-TABLE VIEW */}
<div className="p-4 md:p-6 bg-slate-50 md:bg-white"> {/* Tambah bg tipis di mobile biar card lebih pop */}
  {/* Table Header (Hidden on Mobile) */}
  <div className="hidden md:flex bg-gray-100 border text-[10px] font-bold text-gray-500 uppercase tracking-wider rounded-t-lg">
    <div className="w-20 p-2 text-center border-r">Aksi</div>
    <div className="flex-1 p-2 border-r pl-4">Sample</div>
    <div className="flex-1 p-2 border-r pl-4">Merk</div>
    <div className="flex-1 p-2 border-r pl-4">Dimensi</div>
    <div className="flex-1 p-2 border-r pl-4">Mutu</div>
    <div className="flex-1 p-2 border-r pl-4">Jenis Uji</div>
    <div className="w-20 p-2 text-center">Qty</div>
  </div>

  {/* Table Body / Flex Rows */}
  {/* Perubahan: Tambahkan gap-3 di mobile, hilangkan divide-y agar tidak nempel */}
  <div className="flex flex-col gap-3 md:gap-0 md:border-x md:border-b md:border-t-0 md:divide-y bg-transparent md:bg-white">
    {unit.rows.map((row) => {
      const dbOptions = (unit.kategori && db[unit.kategori]?.[row.sample]) || null;
      return (
        <div 
          key={row.id} 
          // Perubahan: Tambahkan rounded & shadow di mobile agar terlihat seperti Card
          className="flex flex-col md:flex-row bg-white border md:border-none rounded-xl md:rounded-none shadow-sm md:shadow-none hover:bg-sky-50/50 transition-all group"
        >
          
          {/* Aksi & Label Mobile */}
          <div className="flex md:w-20 justify-between md:justify-center items-center p-3 md:p-0 border-b md:border-b-0 md:border-r bg-slate-50/50 md:bg-transparent px-4">
            <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Opsi Baris</span>
            <div className="flex gap-4">
              <button onClick={() => deleteRow(unit.id, row.id)} className="text-red-500 hover:scale-125 transition p-1 text-lg md:text-base">🗑️</button>
              <button onClick={() => copyRow(unit.id, row)} className="text-blue-500 hover:scale-125 transition p-1 text-lg md:text-base">📋</button>
            </div>
          </div>

          {/* Inputs Container */}
          <div className="flex flex-col md:flex-row flex-1 divide-y md:divide-y-0 md:divide-x">
            {[
              { label: 'Sample', key: 'sample', options: unit.kategori ? Object.keys(db[unit.kategori]) : [] },
              { label: 'Merk', key: 'merk', options: dbOptions?.merks || [] },
              { label: 'Dimensi', key: 'dimensi', options: dbOptions?.diameters || [] },
              { label: 'Mutu', key: 'mutu', options: dbOptions?.mutus || [] },
              { label: 'Jenis Uji', key: 'uji', options: dbOptions?.tests || [] },
            ].map((col) => (
              <div key={col.key} className="flex-1 p-3 md:p-2 flex flex-col justify-center">
                <span className="md:hidden text-[10px] font-bold text-blue-400/70 uppercase mb-1 tracking-widest">{col.label}</span>
                <SmartSelect 
                  value={row[col.key]} 
                  options={col.options} 
                  disabled={col.key !== 'sample' && !row.sample}
                  onChange={(v) => handleInputChange(unit.id, row.id, col.key, v)} 
                />
              </div>
            ))}

            {/* Qty Input */}
            <div className="w-full md:w-20 p-3 md:p-2 flex flex-row md:flex-col justify-between md:justify-center items-center bg-sky-50/30 md:bg-transparent px-4">
              <span className="md:hidden text-[10px] font-bold text-blue-500 uppercase">Jumlah (Qty)</span>
              <input 
                type="number" 
                className="w-20 md:w-full text-right md:text-center outline-none bg-white md:bg-transparent border md:border-none rounded md:rounded-none px-2 py-1 md:py-0 font-black text-blue-600 text-lg md:text-sm" 
                value={row.qty} 
                onChange={(e) => handleInputChange(unit.id, row.id, 'qty', e.target.value)} 
              />
            </div>
          </div>
        </div>
      );
    })}
  </div>

  {/* Add Row Button */}
  <button 
    onClick={() => addRow(unit.id)} 
    className="w-full py-4 mt-6 border-2 border-dashed border-sky-300 text-sky-600 bg-white font-black rounded-xl hover:bg-sky-50 transition-all uppercase tracking-widest text-xs shadow-sm"
  >
    + Tambah Item ({unit.kategori || 'Pilih Kategori'})
  </button>
</div>
        </div>
      ))}

      {/* FOOTER: TAMBAH UNIT BARU */}
      <button 
        onClick={addUnit} 
        className="w-full py-8 border-4 border-dashed border-slate-200 text-slate-400 font-black rounded-2xl hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all text-xl mb-20 flex flex-col items-center justify-center gap-2 group"
      >
        <span className="text-4xl group-hover:scale-125 transition-transform">+</span>
        TAMBAH UNIT / PROYEK BARU
      </button>

      {/* MODAL JADWAL */}
      <PilihJadwal 
          bookedSlots={allOtherBookings}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          kategori={activeUnit.kategori}
          totalQty={activeUnit.rows?.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0) || 0}
          selectedDate={activeUnit.selected_date}
          selectedSlots={activeUnit.selected_slots}
          onUpdate={handleUpdateJadwal}
      />
    </div>
  );
};

export default Booking;