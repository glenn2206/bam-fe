import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../helper';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

const API = "http://localhost:5000"



const today = () => new Date().toISOString().split("T")[0]
const next14 = () => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split("T")[0]
}
export default function Booking() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [blockedScheduleInit, setBlockedScheduleInit] = useState({})
  const [blockedScheduleEdit, setBlockedScheduleEdit] = useState({})
  const [companies, setCompanies] = useState([])
  const [bookings, setBookings] = useState([])

  const [isAdding, setIsAdding] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [activeCompanyAction, setActiveCompanyAction] = useState(null)

  const [compForm, setCompForm] = useState({
    nama: "",
    proyek: "",
    lokasi: "",
    wa: ""
  })

  const [booking, setBooking] = useState({
    company: null,
    kategori: "",
    items: [],
    selected_date: "",
    selected_slots: []
  })

  const [editingBookingId, setEditingBookingId] = useState(null)

  const [matForm, setMatForm] = useState({
    sample: "",
    merk: "",
    dimensi: "",
    mutu: "",
    uji: "",
    isEditing: true
  })

  const [openCards, setOpenCards] = useState({
    1: true,
    2: false,
    3: false,
    4: false,
    10: false
  })

  /* ================= LOAD DATA ================= */

  const loadCompanies = async () => {
    const data = await apiService.get("/companies")
    setCompanies(data)
    if (data.length === 0) { setIsAdding(true); setActiveCompanyAction(true); }

  }

  const loadBookings = async () => {
    const data = await apiService.get("/bookings")
    setBookings(data)
  }

  const loadBlockedSchedule = async () => {
    const data = await apiService.get("/schedule")
    setBlockedScheduleInit(data)
  }

  useEffect(() => {
    if (user) {
      loadCompanies()
      loadBookings()
      loadBlockedSchedule()
    }
  }, [user])

  // Load data effect - hanya run SEKALI saat mount atau user berubah
  useEffect(() => {
    const loadData = async () => {
      if (!user) return; 

      setIsLoading(true);
      try {
        loadCompanies()
        loadBookings()
        loadBlockedSchedule()
      } catch (err) {
        console.log(err)
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]); // Hanya run saat user berubah (login/logout)
  /* ================= COMPANY ================= */

  const saveCompany = async () => {

    const payload = {
      nama_pt: compForm.nama,
      nama_proyek: compForm.proyek,
      lokasi_proyek: compForm.lokasi,
      kontak_wa: compForm.wa
    }

    const method = editingCompanyId ? "put" : "post"
    const url = editingCompanyId ? "/companies/" + editingCompanyId : "/companies"

    const data = await apiService[method](url, payload)

    if (editingCompanyId) {
      setCompanies(companies.map(c => c.id === data[0].id ? data[0] : c))
    } else {
      setCompanies([...companies, data[0]])
    }

    setBooking({ ...booking, company: data[0] })
    setIsAdding(false)
    setEditingCompanyId(null)

    setOpenCards({ ...openCards, 1: false, 2: true })

    setCompForm({
      nama: "",
      proyek: "",
      lokasi: "",
      wa: ""
    })
  }

  const editCompany = (c) => {
    setCompForm({
      nama: c.nama_pt,
      proyek: c.nama_proyek,
      lokasi: c.lokasi_proyek,
      wa: c.kontak_wa
    })

    setEditingCompanyId(c.id)
    setIsAdding(true)
  }

  const deleteCompany = async (id) => {
    if (!window.confirm("Delete company?")) return

    const data = await apiService.delete("/companies/" + id)

    if (data.success) {
      setCompanies(companies.filter(c => c.id !== id))
    }
  }
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

    // 3. Set state dengan data blokir yang sudah bersih
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
    })

    setOpenCards({ 1: false, 2: false, 3: true, 4: true });
  }

  const deleteBooking = async (id) => {
    if (!confirm("Delete booking?")) return

    await apiService.delete("/booking/" + id)
    loadBookings()
  }

  const removeItem = (i) => {
    setBooking({
      ...booking,
      items: booking.items.filter((_, x) => x !== i)
    })
  }

  /* ================= MAIN UI ================= */

  return (
    <div style={s.container}>

      {bookings.length > 0 && (
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
          {/* </div> */}
        </Card>
      )}

      <style>{`.no-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* ===== CARD 1 ===== */}

      <Card
        title="1. Perusahaan"
        active={openCards[1]}
        onClick={() => setOpenCards({ ...openCards, 1: !openCards[1] })}
        sum={booking.company?.nama_pt}

        actions={
          <span
            style={{ cursor: "pointer", fontSize: 16 }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveCompanyAction(!activeCompanyAction)
            }}
          >
            ⚙️
          </span>
        }
      >

        {companies.map(c => {

          return (
            <div key={c.id} style={s.item}>

              {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> */}


              <button style={s.btn}
                onClick={() => {
                  setBooking({ ...booking, company: c })
                  setOpenCards({ ...openCards, 1: false, 2: true })
                }}>
                {c.nama_pt} - {c.nama_proyek}
              </button>

              {/* </div> */}

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
          )

        })}

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
                  onChange={(e) =>
                    setCompForm({ ...compForm, [f]: e.target.value })
                  }
                />
              ))}

              <button style={s.btn} onClick={saveCompany}>
                {editingCompanyId ? "Update Perusahaan" : "Simpan & Lanjut"}
              </button>

            </div>

          )

        )}

      </Card>


      {booking.company && (
        <Card title="2. Kategori" active={openCards[2]} onClick={() => setOpenCards({ ...openCards, 2: !openCards[2] })} sum={booking.kategori}>

          {["BAJA", "BETON"].map(t => (
            <button key={t} style={s.btn}
              onClick={() => {
                setBooking({ ...booking, kategori: t })
                setOpenCards({ ...openCards, 2: false, 3: true })
              }}>
              {t}
            </button>
          ))}

        </Card>
      )}

      {booking.kategori && (
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

                    const keyName = k === "dimensi" ? "diameters" : k + "s"
                    const opts = db[booking.kategori][matForm.sample][keyName] || []

                    if (opts.length === 0) return null

                    return (
                      <select
                        key={k}
                        style={s.in}
                        value={matForm[k] || ""}
                        onChange={e => {

                          const val = e.target.value

                          // case 1: LAINNYA
                          if (val === "LAINNYA") {

                            const manual = window.prompt(`Masukkan ${k}`)

                            if (manual) {
                              setMatForm({
                                ...matForm,
                                [k]: manual
                              })
                            }

                          }

                          // case 2: ada "..."
                          else if (val.includes("...")) {

                            const prefix = val.replace("...", "").trim()

                            const manual = window.prompt(`Masukkan nilai ${prefix}`)

                            if (manual) {
                              setMatForm({
                                ...matForm,
                                [k]: `${prefix} ${manual}`
                              })
                            }

                          }

                          // normal
                          else {

                            setMatForm({
                              ...matForm,
                              [k]: val
                            })

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
                    )

                  })}

                  <input
                    type="number"
                    min="1"
                    style={s.in}
                    placeholder="Quantity"
                    value={matForm.qty || ""}
                    onChange={e =>
                      setMatForm({ ...matForm, qty: parseInt(e.target.value || 1) })
                    }
                  />
                </>
              )}

              <button style={{ ...s.btn, background: "#059669" }}
                onClick={() => {
                  setBooking({ ...booking, items: [...booking.items, matForm] })
                  setMatForm({ sample: "", merk: "", dimensi: "", mutu: "", uji: "", isEditing: false })
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
      )}

      {booking.items.length > 0 && (
        <Card title="4. Jadwal Uji" active={openCards[4]} onClick={() => setOpenCards({ ...openCards, 4: !openCards[4] })}>

          <input type="date" style={s.in}
            min={today()} max={next14()}
            value={booking.selected_date}
            onChange={e => setBooking({ ...booking, selected_date: e.target.value })}
          />

          {booking.selected_date && (
            <>
              {/* 1. INDIKATOR PROGRES MATERIAL & MESIN */}
              {(() => {
                const totalQty = booking.items.reduce((sum, item) => sum + (item.qty || 0), 0);
                const mesinNeeded = Math.ceil(totalQty / 5); // 1 mesin = 5 material
                const mesinSelected = booking.selected_slots?.length || 0;
                const materialCovered = Math.min(mesinSelected * 5, totalQty);
                const isDone = mesinSelected >= mesinNeeded;

                return (
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
                      {isDone ? "✅ Slot sudah cukup." : `⚠️ Pilih ${mesinNeeded - mesinSelected} mesin lagi.`}
                    </div>
                  </div>
                );
              })()}

              {/* 2. GRID SLOT JADWAL */}
              <div className="no-scroll" style={{ ...s.scrollContainer, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 15 }}>
                {Array.from({ length: 60 }, (_, i) => {
                  const hour = Math.floor(i / 4) + 9;
                  if (hour >= 20) return null;
                  const timeStr = `${hour.toString().padStart(2, '0')}:${((i % 4) * 15).toString().padStart(2, '0')}`;

                  // Ambil kategori aktif dari state booking
                  const kat = booking.kategori; // "BAJA" atau "BETON"

                  const totalQty = booking.items.reduce((sum, item) => sum + (item.qty || 0), 0);
                  const mesinNeeded = Math.ceil(totalQty / 5);

                  // 1. Data dari server sesuai kategori aktif
                  const jamData = blockedScheduleEdit[booking.selected_date]?.[timeStr] || { BAJA: 0, BETON: 0 };
                  let serverBlockedCount = jamData[kat] || 0;

                  // 2. Hitung penggunaan USER saat ini untuk kategori AKTIF di jam ini
                  // Note: selected_slots sekarang berisi [{time: "09:00", kat: "BAJA"}, ...]
                  const currentUsageByMe = booking.selected_slots?.filter(s => s.time === timeStr && s.kat === kat).length || 0;

                  // 3. Total mesin yang sudah dipesan user khusus untuk kategori aktif saja
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
                        // Warna Dinamis
                        background: currentUsageByMe > 0
                          ? "#059669" // Hijau (Milik kita)
                          : isFullyBlockedByOthers
                            ? "#fee2e2" // Merah (Full orang kategori ini)
                            : serverBlockedCount > 0
                              ? "#fef08a" // Kuning (Terisi sebagian kategori ini)
                              : "#f9fafb", // Putih (Kosong)
                        color: currentUsageByMe > 0 ? "#fff" : (isFullyBlockedByOthers ? "#991b1b" : "#374151"),
                        border: currentUsageByMe > 0 ? "2px solid #047857" : (serverBlockedCount > 0 ? "1px solid #eab308" : "1px solid #e5e7eb"),
                        cursor: (isFullyBlockedByOthers || (isQuotaReached && currentUsageByMe === 0)) ? "not-allowed" : "pointer",
                        opacity: (isQuotaReached && currentUsageByMe === 0) ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (!kat) return alert("Pilih kategori terlebih dahulu!");

                        let newSlots = [...(booking.selected_slots || [])];

                        if (currentUsageByMe > 0) {
                          // Klik ulang: Hapus semua slot jam ini khusus untuk kategori aktif
                          newSlots = newSlots.filter(s => !(s.time === timeStr && s.kat === kat));
                        } else {
                          // Klik pertama: AUTO-MAX
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

          {/* 3. TOMBOL SUBMIT DENGAN VALIDASI */}
          {(() => {
            const totalQty = booking.items.reduce((sum, item) => sum + (item.qty || 0), 0);
            const isReady = (booking.selected_slots?.length || 0) >= Math.ceil(totalQty / 5);

            return (
              <button
                style={{ ...s.btn, background: isReady ? "#dc2626" : "#9ca3af", marginTop: 20, cursor: isReady ? "pointer" : "not-allowed" }}
                disabled={!isReady}
                onClick={async () => {
                  const method = editingBookingId ? "put" : "post"
                  const url = editingBookingId ? "/booking/" + editingBookingId : "/booking"
                  const data = await apiService[method](url, booking)

                  if (data) {
                    alert(editingBookingId ? "Booking updated" : "Booking berhasil")
                    setEditingBookingId(null)
                    setBlockedScheduleEdit(blockedScheduleInit) // reset blokir edit ke kondisi awal
                    loadBookings()
                    loadBlockedSchedule()
                    setBooking({ company: null, kategori: "", items: [], selected_date: "", selected_slots: [] })
                  }
                }}
              >
                {editingBookingId ? "Update Booking" : "Kirim Booking"}
              </button>
            );
          })()}

        </Card>
      )}

    </div>
  )
}

/* ================= CARD COMPONENT ================= */

const Card = ({ title, children, active, onClick, sum, actions }) => (
  <div style={s.card}>

    <div onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>

      <h3

        style={{ margin: "0 0 10px 0" }}
      >
        {title} {sum && <small>({sum})</small>}
      </h3>

      {actions}

    </div>

    <div
      style={{
        ...s.content,
        maxHeight: active ? "1000px" : "0px",
        opacity: active ? 1 : 0
      }}
    >
      {children}
    </div>

  </div>
)

/* ================= STYLE ================= */

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
}