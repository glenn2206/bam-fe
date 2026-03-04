import React, { useMemo } from 'react';

// Konfigurasi Statis
const hourSlots = (() => {
    let slots = [];
    for (let h = 9; h < 18; h++) {
        for (let m = 0; m < 60; m += 15) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
})();

const restHours = ["12:00", "12:15", "12:30", "12:45"];
const blockedDays = []; // Contoh: ["2024-05-20"]
// const bookedSlots = {}; // Contoh: {"2024-05-20": ["09:00", "09:15"]}

const PilihJadwal = ({
    isOpen,
    onClose,
    kategori,
    totalQty,
    selectedDate = "",
    selectedSlots = [],
    bookedSlots = {}, // Data input dari parent
    onUpdate
}) => {

    // Hitung aturan slot (Contoh: 1 slot per 5 item)
    const slotRules = { "BAJA": 5, "BETON": 5 };
    const required = Math.ceil(totalQty / (slotRules[kategori] || 5));
    const isOk = selectedDate && selectedSlots.length === required && required > 0;

    // Generate 14 hari ke depan
    const dates = useMemo(() => {
        const arr = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            arr.push({
                full: d.toISOString().split('T')[0],
                date: d.getDate(),
                dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                isBlocked: blockedDays.includes(d.toISOString().split('T')[0])
            });
        }
        return arr;
    }, []);

    if (!isOpen) return null;

    const handleToggleSlot = (hour) => {
        // Jangan biarkan user memilih jika tanggal belum dipilih
        if (!selectedDate) return;

        let newSlots = [...selectedSlots];
        if (newSlots.includes(hour)) {
            newSlots = newSlots.filter(s => s !== hour);
        } else {
            newSlots.push(hour);
        }
        // Kirim update ke parent
        onUpdate(selectedDate, newSlots);
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Jadwal Pengujian</h3>
                        <p className="text-xs text-gray-500">Pilih tanggal dan slot waktu</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
                </div>

                <div className="p-4 overflow-y-auto space-y-6">
                    {/* Horizontal Date Picker */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {dates.map((d) => (
                            <button
                                key={d.full}
                                disabled={d.isBlocked}
                                onClick={() => onUpdate(d.full, [])}
                                className={`flex-shrink-0 w-14 py-3 rounded-xl border-2 transition-all flex flex-col items-center
                                    ${d.isWeekend ? 'bg-red-50 border-red-100' : 'bg-white'}
                                    ${selectedDate === d.full ? 'border-sky-500 bg-sky-500 text-white shadow-md scale-105' : 'border-gray-100 text-gray-600'}
                                    ${d.isBlocked ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:border-sky-300'}
                                `}
                            >
                                <span className={`text-[10px] font-bold ${selectedDate === d.full ? 'text-sky-100' : 'text-gray-400'}`}>
                                    {d.dayName}
                                </span>
                                <span className="text-lg font-black">{d.date}</span>
                            </button>
                        ))}
                    </div>

                    {/* Time Slots Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-gray-700">Slot Tersedia</span>
                            <div className="flex gap-3 text-[10px] font-bold uppercase">
                                <span className="flex items-center gap-1"><i className="w-2 h-2 bg-gray-200 rounded-full"></i> Istirahat</span>
                                <span className="flex items-center gap-1"><i className="w-2 h-2 bg-sky-500 rounded-full"></i> Terpilih</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {hourSlots.map((hour) => {
                                const isRest = restHours.includes(hour);
                                const allBookingsToday = bookedSlots[selectedDate] || [];

                                // 1. Cek apakah slot ini sudah diambil orang lain
                                const isBookedByOthers = allBookingsToday.some(booking => {
                                    return booking.kategori === kategori && booking.slots.includes(hour);
                                });

                                // 2. Cek apakah slot ini adalah yang sedang kita pilih di UI saat ini
                                const isSelected = selectedSlots.includes(hour);

                                return (
                                    <button
                                        key={hour}
                                        type="button"
                                        // KUNCINYA DI SINI: 
                                        // Jika isSelected bernilai true, maka disabled harus false 
                                        // supaya bisa diklik lagi untuk batal pilih (unselect)
                                        disabled={isRest || (isBookedByOthers && !isSelected) || !selectedDate}

                                        onClick={() => handleToggleSlot(hour)}
                                        className={`py-2 text-xs font-bold rounded-lg border-2 transition-all
                ${isSelected
                                                ? 'bg-sky-500 border-sky-500 text-white shadow-md scale-105 z-10'
                                                : isBookedByOthers
                                                    ? 'bg-red-50 border-red-100 text-red-400 cursor-not-allowed opacity-70'
                                                    : isRest
                                                        ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border-gray-100 text-gray-700 hover:border-sky-300'}
            `}
                                    >
                                        {hour}
                                        {isRest && <span className="block text-[8px] opacity-60">REST</span>}
                                        {/* Tampilkan label FULL hanya jika benar-benar punya orang lain & tidak kita pilih */}
                                        {isBookedByOthers && !isSelected && <span className="block text-[8px] opacity-60">FULL</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Summary */}
                <div className={`p-4 border-t flex justify-between items-center ${isOk ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <div className="text-sm">
                        <div className="flex gap-2">
                            <span className="text-gray-500">Total: <b>{totalQty} Item</b></span>
                            <span className="text-gray-500">Butuh: <b>{required} Slot</b></span>
                        </div>
                        <div className={`font-bold ${isOk ? 'text-emerald-600' : 'text-red-500'}`}>
                            {selectedDate ? (
                                selectedSlots.length < required ? `Kurang ${required - selectedSlots.length} slot lagi` :
                                    selectedSlots.length > required ? `Kelebihan ${selectedSlots.length - required} slot` : "Sudah Sesuai"
                            ) : "Pilih Tanggal"}
                        </div>
                    </div>
                    <button
                        disabled={!isOk}
                        onClick={onClose}
                        className={`px-8 py-2 rounded-xl font-bold transition-all shadow-lg ${isOk ? 'bg-emerald-500 text-white scale-105 active:scale-95' : 'bg-gray-300 text-white cursor-not-allowed'}`}
                    >
                        SIMPAN JADWAL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PilihJadwal;