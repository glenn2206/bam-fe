import React, { useState, useEffect } from 'react';
import { useBooking } from '../hooks/useBooking';

const Jadwal = () => {
  const [bookedData, setBookedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { getBookedSchedules } = useBooking();

  // 1. Hit API untuk ambil jadwal terisi
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getBookedSchedules();
        setBookedData(data);
      } catch (err) {
        console.error("Gagal mengambil jadwal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  // 2. Helper untuk generate list tanggal (misal 14 hari ke depan)
  const getNextTwoWeeks = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 16; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesToDisplay = getNextTwoWeeks();

  if (isLoading) return <div className="p-10 text-center animate-pulse">Memuat Kapasitas Lab...</div>;

  return (
    <div className="bg-slate-50 p-6 rounded-xl shadow-inner border border-slate-200">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">📅</span>
        <h2 className="font-bold text-slate-800 uppercase tracking-tight">Monitoring Kapasitas Lab (2 Minggu)</h2>
      </div>

{/* GRID CONTAINER */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {datesToDisplay.map((dateStr) => {
    const bookings = bookedData[dateStr] || [];
    const dateObj = new Date(dateStr);
    const dayLabel = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return (
      <div 
        key={dateStr} 
        // Tambahkan h-64 untuk tinggi seragam dan flex-col agar layout konsisten
        className={`bg-white rounded-lg border transition-all shadow-sm flex flex-col h-64 
          ${isToday ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
      >
        {/* Header Tanggal */}
        <div className={`p-2 text-center border-b font-bold text-xs uppercase tracking-tighter shrink-0
          ${isToday ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-600'}`}>
          {dayLabel}
        </div>

        {/* List Booking - Dengan overflow-y-auto agar bisa di-scroll kalau penuh */}
        <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-200">
          {bookings.length > 0 ? (
            bookings.map((b, idx) => (
              <div 
                key={idx} 
                className="flex flex-col border-l-4 border-red-500 bg-red-50 p-2 rounded-r shadow-sm shrink-0"
              >
                <div className="flex justify-between items-start mb-1 gap-1">
                  <span className="text-[10px] font-black text-slate-700 uppercase leading-tight break-words">
                    {b.perusahaan}
                  </span>
                  {b.kategori && (
                    <span className="text-[8px] font-bold bg-white px-1 rounded border border-red-200 text-red-500 shrink-0">
                      {b.kategori}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {b.slots && b.slots.sort().map((slot, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <span className="text-[10px] italic text-slate-300 font-medium font-sans">Tersedia</span>
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>
    </div>
  );
};

export default Jadwal;