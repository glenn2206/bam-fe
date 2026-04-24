import { useState, useEffect } from 'react';
import { db } from '../helper';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.service';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['QRIS', 'VA', 'GOPAY', 'OVO'];
const CATEGORIES = ['BAJA', 'BETON'];

const INITIAL_COMP_FORM = { nama: '', proyek: '', lokasi: '', wa: '' };
const INITIAL_BOOKING = { company: null, kategori: '', items: [], selected_date: '', selected_slots: [], reschedule: false, payment_method: '' };
const INITIAL_MAT_FORM = { sample: '', merk: '', dimensi: '', mutu: '', uji: {}, caping: false, dibubut: false, isEditing: true };
const INITIAL_OPEN_CARDS = { 1: true, 2: false, 3: false, 4: false, 5: false, 10: false };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];
const next14 = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; };
// item.uji = { TENSILE: 2, BENDING: 3 } — sum semua qty per jenis uji
const itemTotalQty = (it) => typeof it.uji === 'object'
    ? Object.values(it.uji).reduce((s, v) => s + (parseInt(v) || 0), 0)
    : (it.qty || 0);
const totalQty = (items) => items.reduce((sum, it) => sum + itemTotalQty(it), 0);
const mesinNeeded = (items) => Math.ceil(totalQty(items) / 5);

const diffDays = (dateString) => {
    const target = new Date(dateString);
    const now = new Date();
    [target, now].forEach(d => d.setHours(0, 0, 0, 0));
    return Math.ceil((target - now) / 86400000);
};

const getReschedulePenalty = (days) => {
    if (days >= 3) return { points: 0, note: 'Reschedule h-3 free', dpLost: false };
    if (days === 2) return { points: -1, note: 'Reschedule H-2: Credit Score berkurang 1', dpLost: false };
    if (days === 1) return { points: -2, note: 'Reschedule H-1: Credit Score -2 & DP Hangus 50%', dpLost: true };
    return { points: -3, note: 'Reschedule Hari-H: Credit Score -3 & DP Hangus 50%', dpLost: true };
};

// ─── Shared UI ───────────────────────────────────────────────────────────────

const Card = ({ title, children, active, onClick, sum, actions }) => (
    <div style={s.card}>
        <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{title} {sum && <small>({sum})</small>}</h3>
            {actions}
        </div>
        <div style={{ ...s.content, maxHeight: active ? '1000px' : '0px', opacity: active ? 1 : 0 }}>
            {children}
        </div>
    </div>
);

// Label + field wrapper untuk form material
const FieldWrapper = ({ label, children }) => (
    <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        {children}
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Booking() {
    const { user, updateUser } = useAuth();

    // ── State ──────────────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [blockedScheduleInit, setBlockedScheduleInit] = useState({});
    const [blockedScheduleEdit, setBlockedScheduleEdit] = useState({});
    const [creditScore, setCreditScore] = useState(user?.credit_score ?? 5);

    const [booking, setBooking] = useState(INITIAL_BOOKING);
    const [compForm, setCompForm] = useState(INITIAL_COMP_FORM);
    const [matForm, setMatForm] = useState(INITIAL_MAT_FORM);
    const [openCards, setOpenCards] = useState(INITIAL_OPEN_CARDS);

    const [isAdding, setIsAdding] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState(null);
    const [activeCompanyAction, setActiveCompanyAction] = useState(null);
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [originalSelectedDate, setOriginalSelectedDate] = useState('');

    const isAdmin = user?.role === 'admin' || user?.is_admin;

    // ── Sync credit score from user ────────────────────────────────────────────
    useEffect(() => { setCreditScore(user?.credit_score ?? 5); }, [user]);

    // ── Data loaders ───────────────────────────────────────────────────────────
    const loadCompanies = async () => {
        const data = await apiService.get('/companies');
        setCompanies(data);
        if (data.length === 0) { setIsAdding(true); setActiveCompanyAction(true); }
    };

    const loadBookings = async () => {
        try {
            const data = await apiService.get('/bookings');
            setBookings(Array.isArray(data) ? data.map(item => ({ reschedule: false, payment_method: '', ...item })) : []);
        } catch (err) {
            console.error('Gagal load bookings:', err);
            setBookings([]);
        }
    };

    const loadBlockedSchedule = async () => {
        const data = await apiService.get('/schedule');
        setBlockedScheduleInit(data);
    };

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        setIsLoading(true);
        Promise.all([loadCompanies(), loadBookings(), loadBlockedSchedule()])
            .catch(err => { console.error('Gagal memuat data:', err); })
            .finally(() => setIsLoading(false));
    }, [user]);

    // ── Company actions ────────────────────────────────────────────────────────
    const saveCompany = async () => {
        const payload = { nama_pt: compForm.nama, nama_proyek: compForm.proyek, lokasi_proyek: compForm.lokasi, kontak_wa: compForm.wa };
        const method = editingCompanyId ? 'put' : 'post';
        const url = editingCompanyId ? `/companies/${editingCompanyId}` : '/companies';
        const data = await apiService[method](url, payload);

        setCompanies(prev => editingCompanyId ? prev.map(c => c.id === data[0].id ? data[0] : c) : [...prev, data[0]]);
        setBooking({ ...booking, company: data[0] });
        setIsAdding(false);
        setEditingCompanyId(null);
        setOpenCards({ ...openCards, 1: false, 2: true });
        setCompForm(INITIAL_COMP_FORM);
    };

    const editCompany = (c) => {
        setCompForm({ nama: c.nama_pt, proyek: c.nama_proyek, lokasi: c.lokasi_proyek, wa: c.kontak_wa });
        setEditingCompanyId(c.id);
        setIsAdding(true);
    };

    const deleteCompany = async (id) => {
        if (!window.confirm('Delete company?')) return;
        const data = await apiService.delete(`/companies/${id}`);
        if (data.success) setCompanies(prev => prev.filter(c => c.id !== id));
    };

    // ── Booking actions ────────────────────────────────────────────────────────
    const startEditBooking = (b) => {
        // Buka kembali slot yang dimiliki booking ini agar bisa dipilih ulang
        const newBlocked = JSON.parse(JSON.stringify(blockedScheduleInit));
        (b.selected_slots || []).forEach(({ time, kat }) => {
            if (newBlocked[b.selected_date]?.[time]?.[kat] > 0)
                newBlocked[b.selected_date][time][kat] -= 1;
        });

        setBlockedScheduleEdit(newBlocked);
        setEditingBookingId(b.id);
        setOriginalSelectedDate(b.selected_date || '');
        setBooking({
            company: { id: b.company_id, nama_pt: b.companies?.nama_pt, nama_proyek: b.companies?.nama_proyek },
            kategori: b.kategori,
            items: b.unit_rows || [],
            selected_date: b.selected_date,
            selected_slots: b.selected_slots || [],
            reschedule: b.reschedule || false,
            payment_method: b.payment_method || '',
        });
        setOpenCards({ 1: false, 2: false, 3: true, 4: true, 5: true });
    };

    const deleteBooking = async (id) => {
        if (!confirm('Delete booking?')) return;
        await apiService.delete(`/booking/${id}`);
        loadBookings();
    };

    const submitBooking = async () => {
        const method = editingBookingId ? 'put' : 'post';
        const url = editingBookingId ? `/booking/${editingBookingId}` : '/booking';
        const data = await apiService[method](url, booking);
        if (!data) return;

        // Update credit score jika reschedule
        if (editingBookingId && originalSelectedDate) {
            const days = diffDays(originalSelectedDate);
            const penalty = days >= 3 ? 0 : days === 2 ? 1 : 2;
            updateUser({ credit_score: Math.max(0, user.credit_score - penalty) });
        }

        alert(data.message || (editingBookingId ? 'Booking updated' : 'Booking berhasil'));
        setEditingBookingId(null);
        setBlockedScheduleEdit(blockedScheduleInit);
        setBooking(INITIAL_BOOKING);
        setOpenCards({ 1: true, 2: false, 3: false, 4: false, 5: false });
        loadBookings();
        loadBlockedSchedule();
    };

    const removeItem = (i) => setBooking({ ...booking, items: booking.items.filter((_, x) => x !== i) });

    const adminUpdateTests = async (b) => {
        const updatedItems = b.unit_rows.map((item, idx) => {
            const newTest = window.prompt(`Uji untuk item ${idx + 1} (${item.sample}):`, item.uji || '');
            return { ...item, uji: newTest || item.uji };
        });
        await apiService.put(`/booking/${b.id}`, { ...b, unit_rows: updatedItems });
        loadBookings();
    };

    // ── Toggle card helper ─────────────────────────────────────────────────────
    const toggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));
    const openNext = (close, open) => setOpenCards(prev => ({ ...prev, [close]: false, [open]: true }));


    // ── Render: Booking List ───────────────────────────────────────────────────
    const renderBookingList = () => {
        if (!bookings.length) return null;
        return (
            <Card title="Your Current Booking" active={openCards[10]} onClick={() => toggleCard(10)}>
                {bookings.map(b => (
                    <div key={b.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {b.reschedule && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />}
                            <span style={{ fontWeight: 'bold' }}>{b.kategori}</span>
                            {b.reschedule && <span style={{ fontSize: 11, color: '#dc2626' }}>Rescheduled</span>}
                        </div>
                        <div style={{ fontSize: 10 }}>
                            {b.selected_date} | {[...new Set(b.selected_slots?.map(s => s.time))].join(', ')}
                        </div>
                        {b.unit_rows.map((it, i) => (
                            <div key={i} style={{ fontSize: 12 }}>
                                {`${it.sample}(${it.merk}) → ${itemTotalQty(it)} pc`}
                                {typeof it.uji === 'object'
                                    ? Object.entries(it.uji).map(([t, q]) => ` | ${t}: ${q}`).join('')
                                    : it.uji ? ` | ${it.uji}` : ''
                                }
                                {it.caping !== undefined && ` • Caping: ${it.caping ? 'Ya' : 'Tidak'}`}
                                {it.dibubut !== undefined && ` • Dibubut: ${it.dibubut ? 'Ya' : 'Tidak'}`}
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                            <button style={{ ...s.btn, background: '#6b7280', padding: 5, flex: 1, minWidth: 90 }} onClick={() => startEditBooking(b)}>Reschedule</button>
                            <button style={{ ...s.btn, background: '#dc2626', padding: 5, flex: 1, minWidth: 90 }} onClick={() => deleteBooking(b.id)}>Delete</button>
                            {isAdmin && (
                                <button style={{ ...s.btn, background: '#f59e0b', padding: 5, flex: 1, minWidth: 90 }} onClick={() => adminUpdateTests(b)}>Update Uji</button>
                            )}
                        </div>
                    </div>
                ))}
            </Card>
        );
    };

    // ── Render: Company Card ───────────────────────────────────────────────────
    const renderCompanyCard = () => (
        <Card
            title="1. Perusahaan"
            active={openCards[1]}
            onClick={() => toggleCard(1)}
            sum={booking.company?.nama_pt}
            actions={
                <span style={{ cursor: 'pointer', fontSize: 16 }} onClick={(e) => { e.stopPropagation(); setActiveCompanyAction(!activeCompanyAction); setOpenCards(prev => ({ ...prev, 1: true })); }}>
                    ⚙️
                </span>
            }
        >
            {companies.map(c => (
                <div key={c.id} style={s.item}>
                    <button style={s.btn} onClick={() => { setBooking({ ...booking, company: c }); openNext(1, 2); }}>
                        {c.nama_pt} - {c.nama_proyek}
                    </button>
                    {activeCompanyAction && (
                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                            <button style={{ ...s.btn, background: '#6b7280', padding: 5, flex: 1, minWidth: 90 }} onClick={() => editCompany(c)}>Edit</button>
                            <button style={{ ...s.btn, background: '#dc2626', padding: 5, flex: 1, minWidth: 90 }} onClick={() => deleteCompany(c.id)}>Delete</button>
                        </div>
                    )}
                </div>
            ))}

            {activeCompanyAction && (
                !isAdding ? (
                    <div style={s.addCard} onClick={() => setIsAdding(true)}>
                        <span>+</span><span>Tambah Perusahaan Baru</span>
                    </div>
                ) : (
                    <div style={s.fade}>
                        {['nama', 'proyek', 'lokasi', 'wa'].map(f => (
                            <input key={f} style={s.in} placeholder={f.toUpperCase()} value={compForm[f] || ''} onChange={e => setCompForm({ ...compForm, [f]: e.target.value })} />
                        ))}
                        <button style={s.btn} onClick={saveCompany}>{editingCompanyId ? 'Update Perusahaan' : 'Simpan & Lanjut'}</button>
                    </div>
                )
            )}
        </Card>
    );

    // ── Render: Category Card ──────────────────────────────────────────────────
    const renderCategoryCard = () => (
        <Card title="2. Kategori" active={openCards[2]} onClick={() => toggleCard(2)} sum={booking.kategori}>
            {CATEGORIES.map(t => (
                <button key={t} style={s.btn} onClick={() => { setBooking({ ...booking, kategori: t }); openNext(2, 3); }}>{t}</button>
            ))}
        </Card>
    );

    // ── Render: Material Card ──────────────────────────────────────────────────
    const renderMaterialCard = () => {
        const dbSample = db[booking.kategori]?.[matForm.sample];

        // Field config: label, key di matForm, key di db
        const FIELD_CONFIG = [
            { label: 'Merk', key: 'merk', dbKey: 'merks' },
            { label: 'Dimensi', key: 'dimensi', dbKey: 'diameters' },
            { label: 'Mutu', key: 'mutu', dbKey: 'mutus' },
        ];

        const handleFieldChange = (key, val) => {
            if (val === 'LAINNYA') {
                const manual = window.prompt(`Masukkan ${key}`);
                if (manual) setMatForm(prev => ({ ...prev, [key]: manual }));
            } else if (val.includes('...')) {
                const prefix = val.replace('...', '').trim();
                const manual = window.prompt(`Masukkan nilai ${prefix}`);
                if (manual) setMatForm(prev => ({ ...prev, [key]: `${prefix} ${manual}` }));
            } else {
                setMatForm(prev => ({ ...prev, [key]: val }));
            }
        };

        return (
            <Card title="3. Detail Material" active={openCards[3]} onClick={() => toggleCard(3)} sum={`${booking.items.length} Item`}>

                {/* ── Daftar item yang sudah ditambah ── */}
                {booking.items.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        {booking.items.map((it, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', marginBottom: 6, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{it.sample} <span style={{ color: '#64748b', fontWeight: 'normal' }}>— {it.merk}</span></div>
                                    <div style={{ color: '#475569' }}>{it.dimensi}{it.mutu ? ` · ${it.mutu}` : ''} · <b>Total: {itemTotalQty(it)} pc</b></div>
                                    {typeof it.uji === 'object'
                                        ? Object.entries(it.uji).map(([test, qty]) => (
                                            <div key={test} style={{ color: '#2563eb', fontSize: 11 }}>🧪 {test}: {qty} pc</div>
                                        ))
                                        : <div style={{ color: '#2563eb', fontSize: 11 }}>🧪 {it.uji || '-'}</div>
                                    }
                                    {it.caping && <div style={{ color: '#059669', fontSize: 11 }}>✔ Caping</div>}
                                    {it.dibubut && <div style={{ color: '#059669', fontSize: 11 }}>✔ Dibubut</div>}
                                </div>
                                <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ef4444', padding: '0 4px' }}>✕</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Form tambah material ── */}
                {!matForm.isEditing ? (
                    <div style={s.addCard} onClick={() => setMatForm({ ...matForm, isEditing: true })}>
                        <span>+</span><span>Tambah Material Baru</span>
                    </div>
                ) : (
                    <div style={{ ...s.fade, background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Form Material</div>

                        {/* Sub-kategori */}
                        <FieldWrapper label="Sub-Kategori">
                            <select style={s.in} value={matForm.sample || ''} onChange={e => setMatForm({ ...matForm, sample: e.target.value, merk: '', dimensi: '', mutu: '', uji: '', caping: false, dibubut: false })}>
                                <option value=''>Pilih Sub-Kategori</option>
                                {Object.keys(db[booking.kategori] || {}).map(k => <option key={k}>{k}</option>)}
                            </select>
                        </FieldWrapper>

                        {matForm.sample && (
                            <>
                                {/* Merk, Dimensi, Mutu */}
                                {FIELD_CONFIG.map(({ label, key, dbKey }) => {
                                    const opts = dbSample?.[dbKey] || [];
                                    if (!opts.length) return null;
                                    return (
                                        <FieldWrapper key={key} label={label}>
                                            <select style={s.in} value={matForm[key] || ''} onChange={e => handleFieldChange(key, e.target.value)}>
                                                <option value=''>{matForm[key] || `Pilih ${label}`}</option>
                                                {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </FieldWrapper>
                                    );
                                })}

                                {/* Jenis Uji — toggle pill + qty per test */}
                                {dbSample?.tests?.length > 0 && (
                                    <FieldWrapper label="Jenis Uji & Quantity">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                                            {dbSample.tests.map(t => {
                                                const isActive = t in (matForm.uji || {});
                                                const qtyVal = matForm.uji?.[t] || '';
                                                return (
                                                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                const next = { ...(matForm.uji || {}) };
                                                                if (isActive) delete next[t]; else next[t] = '';
                                                                setMatForm(prev => ({ ...prev, uji: next }));
                                                            }}
                                                            style={{
                                                                padding: '5px 14px', fontSize: 12, borderRadius: 20, border: 'none',
                                                                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                                                background: isActive ? '#2563eb' : '#e2e8f0',
                                                                color: isActive ? '#fff' : '#334155',
                                                                fontWeight: isActive ? 'bold' : 'normal',
                                                                transition: 'all 0.15s',
                                                            }}
                                                        >
                                                            {t}
                                                        </button>
                                                        {isActive && (
                                                            <input
                                                                type='number' min='1'
                                                                placeholder='Qty'
                                                                value={qtyVal}
                                                                onChange={e => setMatForm(prev => ({ ...prev, uji: { ...prev.uji, [t]: parseInt(e.target.value) || '' } }))}
                                                                style={{ width: 70, padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12 }}
                                                            />
                                                        )}
                                                        {isActive && qtyVal && (
                                                            <span style={{ fontSize: 11, color: '#64748b' }}>{qtyVal} pc</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </FieldWrapper>
                                )}

                                {/* Checkbox Caping (BETON) */}
                                {booking.kategori === 'BETON' && (
                                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
                                        <input type='checkbox' checked={matForm.caping} onChange={e => setMatForm({ ...matForm, caping: e.target.checked })} />
                                        Caping?
                                    </label>
                                )}

                                {/* Checkbox Dibubut (BAJA - PLATE) */}
                                {booking.kategori === 'BAJA' && matForm.sample === 'PLATE' && (
                                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
                                        <input type='checkbox' checked={matForm.dibubut} onChange={e => setMatForm({ ...matForm, dibubut: e.target.checked })} />
                                        Dibubut di BAM?
                                    </label>
                                )}

                            </>
                        )}

                        <button
                            style={{ ...s.btn, background: matForm.sample && Object.values(matForm.uji || {}).some(v => v > 0) ? '#059669' : '#9ca3af', marginTop: 12 }}
                            disabled={!matForm.sample || !Object.values(matForm.uji || {}).some(v => v > 0)}
                            onClick={() => { setBooking({ ...booking, items: [...booking.items, matForm] }); setMatForm(INITIAL_MAT_FORM); }}
                        >
                            Add
                        </button>
                    </div>
                )}

                {booking.items.length > 0 && (
                    <button style={{ ...s.btn, marginTop: 12 }} onClick={() => openNext(3, 4)}>Lanjut ke Jadwal →</button>
                )}
            </Card>
        );
    };


    // ── Render: Schedule Card ──────────────────────────────────────────────────
    const renderScheduleCard = () => {
        const qty = totalQty(booking.items);
        const needed = mesinNeeded(booking.items);
        const selectedCount = booking.selected_slots?.length || 0;
        const covered = Math.min(selectedCount * 5, qty);
        const isDone = selectedCount >= needed;
        const daysUntilOld = editingBookingId && originalSelectedDate ? diffDays(originalSelectedDate) : null;
        const rescheduleInfo = daysUntilOld !== null ? getReschedulePenalty(daysUntilOld) : null;
        const blockedData = editingBookingId ? blockedScheduleEdit : blockedScheduleInit;

        return (
            <Card title="4. Jadwal Uji" active={openCards[4]} onClick={() => toggleCard(4)} sum={booking.selected_date}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12 }}><b>Credit Score:</b> {creditScore}</div>
                    {editingBookingId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                            <span style={{ fontSize: 12, color: '#dc2626' }}>Reschedule aktif</span>
                        </div>
                    )}
                </div>

                <input type='date' style={s.in} min={today()} max={next14()} value={booking.selected_date} onChange={e => setBooking({ ...booking, selected_date: e.target.value })} />

                {editingBookingId && rescheduleInfo && (
                    <div style={{ marginTop: 10, padding: 10, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
                        ⚠️ {rescheduleInfo.note} ({daysUntilOld} hari ke jadwal lama)
                    </div>
                )}

                <div style={{ marginTop: 15, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Aturan Reschedule & Credit Score</div>
                    <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0, color: '#334155' }}>
                        <li>H-3 reschedule free, tidak mengurangi credit score.</li>
                        <li>H-2 reschedule → credit score -1.</li>
                        <li>H-1 reschedule → credit score -2 dan DP hangus 50%.</li>
                        <li>Tidak datang tanpa pemberitahuan → credit score -3 dan DP hangus 50%.</li>
                    </ul>
                    {rescheduleInfo && editingBookingId && (
                        <div style={{ marginTop: 10, fontSize: 12, color: daysUntilOld <= 1 ? '#b91c1c' : '#334155' }}>
                            {rescheduleInfo.note} ({daysUntilOld} hari lagi)
                        </div>
                    )}
                </div>

                {booking.selected_date && (
                    <>
                        {/* Progress bar kapasitas */}
                        <div style={{ margin: '15px 0', padding: 12, background: isDone ? '#ecfdf5' : '#fffbeb', borderRadius: 10, border: `1px solid ${isDone ? '#10b981' : '#f59e0b'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontWeight: 'bold', fontSize: 13 }}>Kapasitas Terpenuhi</span>
                                <span style={{ fontWeight: 'bold', color: isDone ? '#059669' : '#d97706' }}>{covered} / {qty} Material</span>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${(covered / qty) * 100}%`, height: '100%', background: isDone ? '#10b981' : '#f59e0b', transition: 'width 0.3s ease' }} />
                            </div>
                            <div style={{ fontSize: 11, marginTop: 8, color: '#666' }}>
                                {isDone ? '✅ Slot sudah cukup.' : `⚠️ Pilih ${needed - selectedCount} mesin lagi.`}
                            </div>
                        </div>

                        {/* Grid slot waktu */}
                        <div className='no-scroll' style={{ ...s.scrollContainer, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 15 }}>
                            {Array.from({ length: 60 }, (_, i) => {
                                const hour = Math.floor(i / 4) + 9;
                                if (hour >= 20) return null;
                                const timeStr = `${String(hour).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`;
                                const kat = booking.kategori;
                                const jamData = blockedData[booking.selected_date]?.[timeStr] || { BAJA: 0, BETON: 0 };
                                const serverBlocked = jamData[kat] || 0;
                                const myUsage = booking.selected_slots?.filter(s => s.time === timeStr && s.kat === kat).length || 0;
                                const totalSelected = booking.selected_slots?.filter(s => s.kat === kat).length || 0;
                                const isFull = serverBlocked >= 3;
                                const quotaReached = totalSelected >= needed;

                                return (
                                    <button
                                        key={timeStr}
                                        disabled={isFull || (quotaReached && myUsage === 0)}
                                        style={{
                                            ...s.btn, margin: 0, padding: '8px 2px', fontSize: 10,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            background: myUsage > 0 ? '#059669' : isFull ? '#fee2e2' : serverBlocked > 0 ? '#fef08a' : '#f9fafb',
                                            color: myUsage > 0 ? '#fff' : isFull ? '#991b1b' : '#374151',
                                            border: myUsage > 0 ? '2px solid #047857' : serverBlocked > 0 ? '1px solid #eab308' : '1px solid #e5e7eb',
                                            cursor: (isFull || (quotaReached && myUsage === 0)) ? 'not-allowed' : 'pointer',
                                            opacity: (quotaReached && myUsage === 0) ? 0.5 : 1,
                                        }}
                                        onClick={() => {
                                            if (!kat) return alert('Pilih kategori terlebih dahulu!');
                                            let newSlots = [...(booking.selected_slots || [])];
                                            if (myUsage > 0) {
                                                newSlots = newSlots.filter(s => !(s.time === timeStr && s.kat === kat));
                                            } else {
                                                const ambil = Math.min(needed - totalSelected, 3 - serverBlocked);
                                                for (let j = 0; j < ambil; j++) newSlots.push({ time: timeStr, kat });
                                            }
                                            setBooking({ ...booking, selected_slots: newSlots });
                                        }}
                                    >
                                        <span style={{ fontWeight: 'bold' }}>{timeStr}</span>
                                        <span style={{ fontSize: 8 }}>{isFull ? 'FULL' : `${myUsage + serverBlocked}/3`}{myUsage > 0 && ` (Me:${myUsage})`}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                <button
                    style={{ ...s.btn, background: isDone ? '#dc2626' : '#9ca3af', marginTop: 20, cursor: isDone ? 'pointer' : 'not-allowed' }}
                    disabled={!isDone}
                    onClick={submitBooking}
                >
                    {editingBookingId ? 'Update Booking' : 'Kirim Booking'}
                </button>
            </Card>
        );
    };

    // ── Render: Payment Card ───────────────────────────────────────────────────
    const renderPaymentCard = () => (
        <Card title="5. Invoice & Pembayaran" active={openCards[5]} onClick={() => toggleCard(5)} sum={booking.payment_method}>
            <div style={{ marginBottom: 10, fontSize: 12, color: '#334155' }}>
                Pilih metode pembayaran mock: QRIS, VA, GOPAY, atau OVO. Fokus ke QRIS dan VA.
            </div>
            {PAYMENT_METHODS.map(method => (
                <button key={method} style={{ ...s.btn, background: booking.payment_method === method ? '#0f766e' : '#2563eb', marginTop: 5, padding: 10 }} onClick={() => setBooking({ ...booking, payment_method: method })}>
                    {method}
                </button>
            ))}
            <div style={{ fontSize: 11, marginTop: 12, color: '#475569' }}>Pembayaran mock saja: tidak terkoneksi ke gateway nyata.</div>
        </Card>
    );

    // ── Main render ────────────────────────────────────────────────────────────
    if (isLoading) return null;

    return (
        <div style={s.container}>
            <style>{`.no-scroll::-webkit-scrollbar{display:none}`}</style>
            {!editingBookingId && renderBookingList()}
            {!editingBookingId && renderCompanyCard()}
            {!editingBookingId && booking.company && renderCategoryCard()}
            {!editingBookingId && booking.kategori && renderMaterialCard()}
            {booking.items.length > 0 && renderScheduleCard()}
            {booking.selected_slots.length > 0 && renderPaymentCard()}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    container: { maxWidth: 400, margin: '20px auto', padding: 15, fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: 15, borderRadius: 10, border: '1px solid #ddd', marginBottom: 10 },
    content: { overflow: 'hidden', transition: 'max-height 0.4s ease, opacity 0.4s ease' },
    in: { width: '100%', padding: 8, marginTop: 5, boxSizing: 'border-box' },
    btn: { width: '100%', padding: 10, background: '#2563eb', color: '#fff', border: 'none', marginTop: 5, cursor: 'pointer' },
    item: { padding: 10, borderBottom: '1px solid #eee', cursor: 'pointer' },
    fade: { animation: 'fadeIn 0.5s' },
    scrollContainer: { maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' },
    addCard: { width: '100%', border: '4px dashed #e2e8f0', borderRadius: 10, padding: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 10 },
};