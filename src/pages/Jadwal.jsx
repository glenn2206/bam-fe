import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';

const Jadwal = () => {
  const [bookedData, setBookedData] = useState({});
  const [showBaja, setShowBaja] = useState(true);
  const [showBeton, setShowBeton] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    apiService.get("/schedule-all").then((res) => {
      // res.data diasumsikan adalah object scheduleMap
      setBookedData(res.data || res); 
    });
  }, []);

  const getDates = () => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getFilteredBookings = (dateStr) => {
    const day = bookedData[dateStr] || {};
    let merged = [];

    // Kelompokkan berdasarkan PT dan Kategori
    Object.entries(day).forEach(([time, cats]) => {
      ['BAJA', 'BETON'].forEach(kat => {
        if ((kat === 'BAJA' && !showBaja) || (kat === 'BETON' && !showBeton)) return;
        
        cats[kat].forEach(item => {
          // Cari apakah sudah ada di array merged (sama PT dan kategori)
          const existing = merged.find(m => m.nama_pt === item.nama_pt && m.kat === kat);
          
          if (existing) {
            // Jika ada, tambahkan jamnya ke array times jika belum ada
            if (!existing.times.includes(time)) existing.times.push(time);
          } else {
            // Jika belum, buat entry baru
            merged.push({ ...item, kat, times: [time] });
          }
        });
      });
    });

    return onlyMine ? merged.filter(i => i.is_my_booking) : merged;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans text-slate-800">
      <h2 className="text-2xl font-black mb-6 tracking-tight">JADWAL LABORATORIUM</h2>
      
      <div className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={() => setShowBaja(!showBaja)} className={`px-4 py-2 rounded-lg text-xs font-bold ${showBaja ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>BAJA</button>
        <button onClick={() => setShowBeton(!showBeton)} className={`px-4 py-2 rounded-lg text-xs font-bold ${showBeton ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>BETON</button>
        <button onClick={() => setOnlyMine(!onlyMine)} className={`px-4 py-2 rounded-lg text-xs font-bold ${onlyMine ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>JADWAL SAYA</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {getDates().map((dateStr) => (
          <div key={dateStr} className="bg-white rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-50 border-b font-black text-[10px] text-center uppercase text-slate-500">
              {new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-y-auto">
              {getFilteredBookings(dateStr).map((b, i) => (
                <div key={i} className={`p-3 rounded-lg border text-[11px] font-bold ${b.is_my_booking ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-800 truncate">{b.nama_pt}</span>
                    <div className="flex flex-wrap gap-1">
                      {b.times.sort().map(t => (
                        <span key={t} className="bg-white border px-1 rounded text-[9px] text-slate-600">{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`mt-2 inline-block text-[9px] px-1.5 py-0.5 rounded ${b.kat === 'BAJA' ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}>{b.kat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jadwal;