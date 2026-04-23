import { useState, useEffect } from 'react';
import { db } from '../helper';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

const today = () => new Date().toISOString().split("T")[0];
const next14 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
};

const initialCompForm = {
  nama: "",
  proyek: "",
  lokasi: "",
  wa: ""
};

const initialBooking = {
  company: null,
  kategori: "",
  items: [],
  selected_date: "",
  selected_slots: []
};

const initialMatForm = {
  sample: "",
  merk: "",
  dimensi: "",
  mutu: "",
  uji: "",
  isEditing: true
};

const initialOpenCards = {
  1: true,
  2: false,
  3: false,
  4: false,
  10: false
};

const getTotalQty = (items) => items.reduce((sum, item) => sum + (item.qty || 0), 0);
const getMesinNeeded = (items) => Math.ceil(getTotalQty(items) / 5);

export default function Booking() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [blockedScheduleInit, setBlockedScheduleInit] = useState({});
  const [blockedScheduleEdit, setBlockedScheduleEdit] = useState(blockedScheduleInit);
  const [companies, setCompanies] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [activeCompanyAction, setActiveCompanyAction] = useState(null);

  const [compForm, setCompForm] = useState(initialCompForm);
  const [booking, setBooking] = useState(initialBooking);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [matForm, setMatForm] = useState(initialMatForm);
  const [openCards, setOpenCards] = useState(initialOpenCards);

  /* ================= LOAD DATA ================= */

  const loadCompanies = async () => {
    const data = await apiService.get("/companies");
    setCompanies(data);
    if (data.length === 0) {
      setIsAdding(true);
      setActiveCompanyAction(true);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await apiService.get("/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal load bookings:", err);
      setBookings([]);
    }
  };

  const loadBlockedSchedule = async () => {
    const data = await apiService.get("/schedule");
    setBlockedScheduleInit(data);
  };

  useEffect(() => {
    if (user) {
      loadCompanies();
      loadBookings();
      loadBlockedSchedule();
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([
          loadCompanies(),
          loadBookings(),
          loadBlockedSchedule()
        ]);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        if (err.response?.status === 401) {
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  /* ================= COMPANY ================= */

  const saveCompany = async () => {
    const payload = {
      nama_pt: compForm.nama,
      nama_proyek: compForm.proyek,
      lokasi_proyek: compForm.lokasi,
      kontak_wa: compForm.wa
    };

    const method = editingCompanyId ? "put" : "post";
    const url = editingCompanyId ? "/companies/" + editingCompanyId : "/companies";

    const data = await apiService[method](url, payload);

    if (editingCompanyId) {
      setCompanies(companies.map(c => c.id === data[0].id ? data[0] : c));
    } else {
      setCompanies([...companies, data[0]]);
    }

    setBooking({ ...booking, company: data[0] });
    setIsAdding(false);
    setEditingCompanyId(null);
    setOpenCards({ ...openCards, 1: false, 2: true });
    setCompForm(initialCompForm);
  };

  const editCompany = (c) => {
    setCompForm({
      nama: c.nama_pt,
      proyek: c.nama_proyek,
      lokasi: c.lokasi_proyek,
      wa: c.kontak_wa
    });

    setEditingCompanyId(c.id);
    setIsAdding(true);
  };

  const deleteCompany = async (id) => {
    if (!window.confirm("Delete company?")) return;

    const data = await apiService.delete("/companies/" + id);

    if (data.success) {
      setCompanies(companies.filter(c => c.id !== id));
    }
  };

  const startEditBooking = (b) => {
    let newBlockedSchedule = JSON.parse(JSON.stringify(blockedScheduleInit));

    if (b.selected_date && b.selected_slots) {
      b.selected_slots.forEach(slot => {
        const time = slot.time;
        const kat = slot.kat;

        if (newBlockedSchedule[b.selected_date] && newBlockedSchedule[b.selected_date][time]) {
          if (newBlockedSchedule[b.selected_date][time][kat] > 0) {
            newBlockedSchedule[b.selected_date][time][kat] -= 1;
          }
        }
      });
    }

    setBlockedScheduleEdit(newBlockedSchedule);
    setEditingBookingId(b.id);
    setBooking({
      company: {
        id: b.company_id,
        nama_pt: b.companies?.nama_pt,
        nama_proyek: b.companies?.nama_proyek
      },
      kategori: b.kategori,
      items: b.unit_rows || [],
      selected_date: b.selected_date,
      selected_slots: b.selected_slots || []
    });

    setOpenCards({ 1: false, 2: false, 3: true, 4: true });
  };

  const deleteBooking = async (id) => {
    if (!confirm("Delete booking?")) return;

    await apiService.delete("/booking/" + id);
    loadBookings();
  };

  const removeItem = (i) => {
    setBooking({
      ...booking,
      items: booking.items.filter((_, x) => x !== i)
    });
  };

  const renderBookingList = () => {
    if (!bookings.length) return null;

    return (
      <Card title="Your Current Booking" active={openCards[10]} onClick={() => setOpenCards({ ...openCards, 10: !openCards[10] })}>
        {bookings.map(b => (
          <div key={b.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
            <div>{b.kategori}</div>
            <div style={{ fontSize: 10 }}>
              {b.selected_date} | {[...new Set(b.selected_slots?.map(slot => slot.time))].join(", ")}
            </div>
            {b.unit_rows.map((it, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                <span>{`${it.sample}(${it.merk})->${it.qty} pc`}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
              <button
                style={{ ...s.btn, background: "#6b7280", padding: 5 }}
                onClick={() => startEditBooking(b)}
              >
                Edit
              </button>
              <button
                style={{ ...s.btn, background: "#dc2626", padding: 5 }}
                onClick={() => deleteBooking(b.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </Card>
    );
  };

  const renderCompanyCard = () => (
    <Card
      title="1. Perusahaan"
      active={openCards[1]}
      onClick={() => setOpenCards({ ...openCards, 1: !openCards[1] })}
      sum={booking.company?.nama_pt}
      actions={
        <span
          style={{ cursor: "pointer", fontSize: 16 }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveCompanyAction(!activeCompanyAction);
            setOpenCards({ ...openCards, 1: true });
          }}
        >
          ⚙️
        </span>
      }
    >
      {companies.map(c => (
        <div key={c.id} style={s.item}>
          <button style={s.btn}
            onClick={() => {
              setBooking({ ...booking, company: c });
              setOpenCards({ ...openCards, 1: false, 2: true });
            }}>
            {c.nama_pt} - {c.nama_proyek}
          </button>

          {activeCompanyAction && (
            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
              <button
                style={{ ...s.btn, background: "#6b7280", padding: 5 }}
                onClick={() => editCompany(c)}
              >
                Edit
              </button>
              <button
                style={{ ...s.btn, background: "#dc2626", padding: 5 }}
                onClick={() => deleteCompany(c.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {activeCompanyAction && (
        !isAdding ? (
          <div style={s.addCard} onClick={() => setIsAdding(true)}>
            <span>+</span>
            <span>Tambah Perusahaan Baru</span>
          </div>
        ) : (
          <div style={s.fade}>
            {["nama", "proyek", "lokasi", "wa"].map(f => (
              <input
                key={f}
                style={s.in}
                placeholder={f.toUpperCase()}
                value={compForm[f] || ""}
                onChange={(e) => setCompForm({ ...compForm, [f]: e.target.value })}
              />
            ))}
            <button style={s.btn} onClick={saveCompany}>
              {editingCompanyId ? "Update Perusahaan" : "Simpan & Lanjut"}
            </button>
          </div>
        )
      )}
    </Card>
  );

  const renderCategoryCard = () => (
    <Card title="2. Kategori" active={openCards[2]} onClick={() => setOpenCards({ ...openCards, 2: !openCards[2] })} sum={booking.kategori}>
      {["BAJA", "BETON"].map(t => (
        <button key={t} style={s.btn}
          onClick={() => {
            setBooking({ ...booking, kategori: t });
            setOpenCards({ ...openCards, 2: false, 3: true });
          }}>
          {t}
        </button>
      ))}
    </Card>
  );

  const renderMaterialCard = () => (
    <Card title="3. Detail Material" active={openCards[3]} onClick={() => setOpenCards({ ...openCards, 3: !openCards[3] })} sum={`${booking.items.length} Item`}>
      {booking.items.map((it, i) => (
        <div key={i} style={s.item}>
          <span>{it.sample}|{it.merk}|{it.dimensi}|{it.qty}</span>
          <span style={{ cursor: "pointer" }} onClick={() => removeItem(i)}>❌</span>
        </div>
      ))}

      {!matForm.isEditing ? (
        <div style={s.addCard} onClick={() => setMatForm({ ...matForm, isEditing: true })}>
          <span>+</span>
          <span>Tambah Material Baru</span>
        </div>
      ) : (
        <div style={s.fade}>
          <select style={s.in}
            onChange={e => setMatForm({ ...matForm, sample: e.target.value })}>
            <option value="">Pilih Sub-Kategori</option>
            {Object.keys(db[booking.kategori]).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>

          {matForm.sample && (
            <>
              {["merk", "dimensi", "mutu", "uji"].map(k => {
                const keyName = k === "dimensi" ? "diameters" : k + "s";
                const opts = db[booking.kategori][matForm.sample][keyName] || [];
                if (opts.length === 0) return null;

                return (
                  <select
                    key={k}
                    style={s.in}
                    value={matForm[k] || ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "LAINNYA") {
                        const manual = window.prompt(`Masukkan ${k}`);
                        if (manual) {
                          setMatForm({ ...matForm, [k]: manual });
                        }
                      } else if (val.includes("...")) {
                        const prefix = val.replace("...", "").trim();
                        const manual = window.prompt(`Masukkan nilai ${prefix}`);
                        if (manual) {
                          setMatForm({ ...matForm, [k]: `${prefix} ${manual}` });
                        }
                      } else {
                        setMatForm({ ...matForm, [k]: val });
                      }
                    }}
                  >
                    <option value={matForm[k] || ""}>
                      {matForm[k] ? matForm[k] : `Pilih ${k}`}
                    </option>
                    {opts.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                );
              })}

              <input
                type="number"
                min="1"
                style={s.in}
                placeholder="Quantity"
                value={matForm.qty || ""}
                onChange={e => setMatForm({ ...matForm, qty: parseInt(e.target.value || 1) })}
              />
            </>
          )}

          <button style={{ ...s.btn, background: "#059669" }}
            onClick={() => {
              setBooking({ ...booking, items: [...booking.items, matForm] });
              setMatForm(initialMatForm);
            }}>
            Simpan Material
          </button>
        </div>
      )}

      {booking.items.length > 0 && (
        <button style={{ ...s.btn, marginTop: 20 }}
          onClick={() => setOpenCards({ ...openCards, 3: false, 4: true })}>
          Lanjut ke Jadwal
        </button>
      )}
    </Card>
  );

  const renderScheduleCard = () => {
    const totalQty = getTotalQty(booking.items);
    const mesinNeeded = getMesinNeeded(booking.items);
    const selectedSlotsCount = booking.selected_slots?.length || 0;
    const materialCovered = Math.min(selectedSlotsCount * 5, totalQty);
    const isDone = selectedSlotsCount >= mesinNeeded;
    const isReady = selectedSlotsCount >= mesinNeeded;

    return (
      <Card title="4. Jadwal Uji" active={openCards[4]} onClick={() => setOpenCards({ ...openCards, 4: !openCards[4] })}>
        <input type="date" style={s.in}
          min={today()} max={next14()}
          value={booking.selected_date}
          onChange={e => setBooking({ ...booking, selected_date: e.target.value })}
        />

        {booking.selected_date && (
          <>
            <div style={{
              margin: "15px 0", padding: "12px", background: isDone ? "#ecfdf5" : "#fffbeb",
              borderRadius: 10, border: `1px solid ${isDone ? "#10b981" : "#f59e0b"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontWeight: "bold", fontSize: "13px" }}>Kapasitas Terpenuhi</span>
                <span style={{ fontWeight: "bold", color: isDone ? "#059669" : "#d97706" }}>
                  {materialCovered} / {totalQty} Material
                </span>
              </div>
              <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${(materialCovered / totalQty) * 100}%`, height: "100%",
                  background: isDone ? "#10b981" : "#f59e0b", transition: "width 0.3s ease"
                }} />
              </div>
              <div style={{ fontSize: "11px", marginTop: 8, color: "#666" }}>
                {isDone ? "✅ Slot sudah cukup." : `⚠️ Pilih ${mesinNeeded - selectedSlotsCount} mesin lagi.`}
              </div>
            </div>

            <div className="no-scroll" style={{ ...s.scrollContainer, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 15 }}>
              {Array.from({ length: 60 }, (_, i) => {
                const hour = Math.floor(i / 4) + 9;
                if (hour >= 20) return null;
                const timeStr = `${hour.toString().padStart(2, '0')}:${((i % 4) * 15).toString().padStart(2, '0')}`;
                const kat = booking.kategori;
                if (!booking.selected_date || !blockedScheduleInit) return null;
                const blockedData = editingBookingId ? blockedScheduleEdit : blockedScheduleInit;
                const jamData = blockedData[booking.selected_date]?.[timeStr] || { BAJA: 0, BETON: 0 };
                const serverBlockedCount = jamData[kat] || 0;
                const currentUsageByMe = booking.selected_slots?.filter(s => s.time === timeStr && s.kat === kat).length || 0;
                const totalMesinTerpilihUser = booking.selected_slots?.filter(s => s.kat === kat).length || 0;
                const totalUsedInSlot = currentUsageByMe + serverBlockedCount;
                const isFullyBlockedByOthers = serverBlockedCount >= 3;
                const isQuotaReached = totalMesinTerpilihUser >= mesinNeeded;

                return (
                  <button
                    key={timeStr}
                    disabled={isFullyBlockedByOthers || (isQuotaReached && currentUsageByMe === 0)}
                    style={{
                      ...s.btn,
                      margin: 0,
                      padding: "8px 2px",
                      fontSize: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      background: currentUsageByMe > 0
                        ? "#059669"
                        : isFullyBlockedByOthers
                          ? "#fee2e2"
                          : serverBlockedCount > 0
                            ? "#fef08a"
                            : "#f9fafb",
                      color: currentUsageByMe > 0 ? "#fff" : (isFullyBlockedByOthers ? "#991b1b" : "#374151"),
                      border: currentUsageByMe > 0 ? "2px solid #047857" : (serverBlockedCount > 0 ? "1px solid #eab308" : "1px solid #e5e7eb"),
                      cursor: (isFullyBlockedByOthers || (isQuotaReached && currentUsageByMe === 0)) ? "not-allowed" : "pointer",
                      opacity: (isQuotaReached && currentUsageByMe === 0) ? 0.5 : 1,
                    }}
                    onClick={() => {
                      if (!kat) return alert("Pilih kategori terlebih dahulu!");
                      let newSlots = [...(booking.selected_slots || [])];
                      if (currentUsageByMe > 0) {
                        newSlots = newSlots.filter(s => !(s.time === timeStr && s.kat === kat));
                      } else {
                        const sisaKebutuhan = mesinNeeded - totalMesinTerpilihUser;
                        const sisaSlotJam = 3 - serverBlockedCount;
                        const ambil = Math.min(sisaKebutuhan, sisaSlotJam);
                        for (let j = 0; j < ambil; j++) {
                          newSlots.push({ time: timeStr, kat: kat });
                        }
                      }
                      setBooking({ ...booking, selected_slots: newSlots });
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>{timeStr}</span>
                    <span style={{ fontSize: "8px" }}>
                      {isFullyBlockedByOthers ? "FULL" : `${totalUsedInSlot}/3`}
                      {currentUsageByMe > 0 && ` (Me:${currentUsageByMe})`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          style={{ ...s.btn, background: isReady ? "#dc2626" : "#9ca3af", marginTop: 20, cursor: isReady ? "pointer" : "not-allowed" }}
          disabled={!isReady}
          onClick={async () => {
            const method = editingBookingId ? "put" : "post";
            const url = editingBookingId ? "/booking/" + editingBookingId : "/booking";
            const data = await apiService[method](url, booking);

            if (data) {
              alert(editingBookingId ? "Booking updated" : "Booking berhasil");
              setEditingBookingId(null);
              setBlockedScheduleEdit(blockedScheduleInit);
              loadBookings();
              loadBlockedSchedule();
              setBooking(initialBooking);
              setOpenCards({ 1: true, 2: false, 3: false, 4: false });
            }
          }}
        >
          {editingBookingId ? "Update Booking" : "Kirim Booking"}
        </button>
      </Card>
    );
  };

  return (
    (!isLoading && <div style={s.container}>
      {renderBookingList()}
      <style>{`.no-scroll::-webkit-scrollbar{display:none}`}</style>
      {renderCompanyCard()}
      {booking.company && renderCategoryCard()}
      {booking.kategori && renderMaterialCard()}
      {booking.items.length > 0 && renderScheduleCard()}
    </div>)
  );
}

const Card = ({ title, children, active, onClick, sum, actions }) => (
  <div style={s.card}>
    <div onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
      <h3 style={{ margin: "0 0 10px 0" }}>
        {title} {sum && <small>({sum})</small>}
      </h3>
      {actions}
    </div>
    <div style={{
      ...s.content,
      maxHeight: active ? "1000px" : "0px",
      opacity: active ? 1 : 0
    }}>
      {children}
    </div>
  </div>
);

const s = {
  container: { maxWidth: 400, margin: "20px auto", padding: 15, fontFamily: "sans-serif" },
  card: { background: "#fff", padding: 15, borderRadius: 10, border: "1px solid #ddd", marginBottom: 10 },
  content: { overflow: "hidden", transition: "max-height 0.4s ease, opacity 0.4s ease" },
  in: { width: "100%", padding: 8, marginTop: 5, boxSizing: "border-box" },
  btn: { width: "100%", padding: 10, background: "#2563eb", color: "#fff", border: "none", marginTop: 5, cursor: "pointer" },
  item: { padding: 10, borderBottom: "1px solid #eee", cursor: "pointer" },
  fade: { animation: "fadeIn 0.5s" },
  scrollContainer: { maxHeight: "200px", overflowY: "auto", paddingRight: "5px" },
  addCard: { width: "100%", border: "4px dashed #e2e8f0", borderRadius: "10px", padding: "10px", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", marginTop: "10px" }
};
