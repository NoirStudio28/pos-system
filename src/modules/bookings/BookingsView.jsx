import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import TimelineView from './TimelineView'

const TOTAL_TABLES = 15
const TIME_SLOTS = ['12:00','12:30','13:00','13:30','14:00','14:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30']

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#F59E0B22' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#3B82F622' },
  seated:    { label: 'Seated',    color: '#10B981', bg: '#10B98122' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#EF444422' },
}

const EMPTY_FORM = {
  name: '', phone: '', email: '', guests: 2,
  date: new Date().toISOString().split('T')[0],
  time: '19:00', duration: 90, status: 'pending', notes: '',
  depositPaid: false, preferredTable: '', favDishes: '', favDrinks: '',
}

export default function BookingsView() {
  const { bookings, addBooking, updateBooking, deleteBooking, updateBookingStatus } = usePOS()

  const [activeView,      setActiveView]      = useState('timeline')
  const [selectedDate,    setSelectedDate]    = useState(new Date().toISOString().split('T')[0])
  const [showForm,        setShowForm]        = useState(false)
  const [editingBooking,  setEditingBooking]  = useState(null)
  const [expandedId,      setExpandedId]      = useState(null)
  const [form,            setForm]            = useState(EMPTY_FORM)

  const todayBookings = bookings
    .filter(b => b.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const allBookings = [...bookings].sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  )

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = bookings.filter(b => b.status === k).length
    return acc
  }, {})

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, date: selectedDate })
    setEditingBooking(null)
    setShowForm(true)
  }

  const openEdit = (booking) => {
    setForm({ ...booking })
    setEditingBooking(booking)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name || !form.date || !form.time) return
    if (editingBooking) {
      updateBooking({ ...form, id: editingBooking.id })
    } else {
      addBooking(form)
    }
    setShowForm(false)
    setEditingBooking(null)
    setForm(EMPTY_FORM)
  }

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      fontFamily: "'Courier New', monospace",
      color: '#E2E8F0',
      padding: '2rem',
    }}>
      <style>{`
        .btn { border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.78rem; font-weight: 700; transition: all 0.15s; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-primary { background: #F97316; color: #000; }
        .btn-ghost { background: #13131A; color: #94A3B8; border: 1px solid #1E1E2E; }
        .btn-danger { background: #EF444422; color: #EF4444; border: 1px solid #EF444433; }
        .btn-sm { padding: 0.3rem 0.7rem; font-size: 0.68rem; }
        .input { background: #0D0D14; border: 1px solid #2D2D3F; border-radius: 8px; padding: 0.55rem 0.8rem; color: #E2E8F0; font-family: 'Courier New', monospace; font-size: 0.78rem; width: 100%; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .input:focus { border-color: #F97316; }
        .label { font-size: 0.6rem; letter-spacing: 0.12em; color: #475569; margin-bottom: 0.4rem; display: block; }
        .view-tab { padding: 0.4rem 1rem; border-radius: 6px; border: 1px solid #1E1E2E; background: transparent; color: #64748B; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.72rem; font-weight: 700; transition: all 0.15s; }
        .view-tab.active { background: #F9731622; border-color: #F97316; color: #F97316; }
        .booking-row { background: #13131A; border: 1px solid #1E1E2E; border-radius: 12px; padding: 1rem; margin-bottom: 0.5rem; cursor: pointer; transition: border-color 0.15s; }
        .booking-row:hover { border-color: #3B3B52; }
        .booking-row.expanded { border-color: #F9731644; }
        .status-select { background: #0D0D14; border: 1px solid #2D2D3F; border-radius: 6px; padding: 0.3rem 0.5rem; color: #E2E8F0; font-family: 'Courier New', monospace; font-size: 0.68rem; cursor: pointer; outline: none; }
        .time-slot { background: #13131A; border: 1px solid #1E1E2E; border-radius: 10px; padding: 0.6rem 0.8rem; min-height: 52px; }
        .slot-booking { border-radius: 6px; padding: 0.4rem 0.6rem; margin-bottom: 0.3rem; cursor: pointer; transition: opacity 0.15s; }
        .slot-booking:hover { opacity: 0.8; }
        .checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: #F97316; }
        .panel { background: #13131A; border: 1px solid #F9731644; border-radius: 14px; padding: 1.5rem; margin-top: 1.5rem; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>RESERVATIONS</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Bookings</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className={`view-tab ${activeView === 'timeline' ? 'active' : ''}`} onClick={() => setActiveView('timeline')}>📅 Timeline</button>
              <button className={`view-tab ${activeView === 'day'      ? 'active' : ''}`} onClick={() => setActiveView('day')}>Day View</button>
              <button className={`view-tab ${activeView === 'list'     ? 'active' : ''}`} onClick={() => setActiveView('list')}>All Bookings</button>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ New Booking</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CONFIG).map(([key, s]) => (
            <div key={key} style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 10, padding: '0.4rem 0.9rem', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{counts[key] || 0}</div>
              <div style={{ fontSize: '0.58rem', color: s.color, opacity: 0.8, letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
          <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.4rem 0.9rem', textAlign: 'center', minWidth: 70 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E2E8F0' }}>{bookings.reduce((s, b) => s + Number(b.guests), 0)}</div>
            <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>TOTAL COVERS</div>
          </div>
        </div>

        {/* TIMELINE VIEW */}
        {activeView === 'timeline' && <TimelineView />}

        {/* DAY VIEW */}
        {activeView === 'day' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="date" className="input" style={{ width: 'auto' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {todayBookings.length} booking{todayBookings.length !== 1 ? 's' : ''} · {todayBookings.reduce((s, b) => s + Number(b.guests), 0)} covers
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
              {TIME_SLOTS.map(slot => {
                const slotBookings = todayBookings.filter(b => b.time === slot)
                return (
                  <div className="time-slot" key={slot}>
                    <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '0.4rem', fontWeight: 700 }}>{slot}</div>
                    {slotBookings.length === 0 ? (
                      <div style={{ fontSize: '0.65rem', color: '#1E1E2E' }}>—</div>
                    ) : slotBookings.map(b => {
                      const s = STATUS_CONFIG[b.status]
                      return (
                        <div key={b.id} className="slot-booking" style={{ background: s.bg, border: `1px solid ${s.color}44` }} onClick={() => openEdit(b)}>
                          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: s.color }}>{b.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748B' }}>👥 {b.guests} · T{b.preferredTable || '?'}</div>
                          {b.notes && <div style={{ fontSize: '0.6rem', color: '#F59E0B', marginTop: '0.2rem' }}>⚠ {b.notes.slice(0, 30)}{b.notes.length > 30 ? '…' : ''}</div>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {activeView === 'list' && (
          <div>
            {allBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#334155', fontSize: '0.85rem' }}>No bookings yet</div>
            ) : allBookings.map(b => {
              const s = STATUS_CONFIG[b.status]
              const isExpanded = expandedId === b.id
              return (
                <div key={b.id} className={`booking-row ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#CBD5E1' }}>{b.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#475569' }}>{b.date} · {b.time} · {b.duration || 90}min · 👥 {b.guests} · T{b.preferredTable || '?'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }} onClick={e => e.stopPropagation()}>
                      {b.depositPaid && <span style={{ fontSize: '0.62rem', background: '#10B98122', color: '#10B981', border: '1px solid #10B98133', borderRadius: 5, padding: '2px 7px' }}>DEPOSIT ✓</span>}
                      <select className="status-select" value={b.status} style={{ color: s.color, borderColor: s.color + '44' }} onChange={e => updateBookingStatus(b.id, e.target.value)}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteBooking(b.id)}>✕</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1E1E2E', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }} onClick={e => e.stopPropagation()}>
                      <div><span className="label">CONTACT</span><div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.phone}</div><div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.email}</div></div>
                      {b.favDishes && <div><span className="label">FAV DISHES</span><div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.favDishes}</div></div>}
                      {b.favDrinks && <div><span className="label">FAV DRINKS</span><div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.favDrinks}</div></div>}
                      {b.notes && <div style={{ gridColumn: '1 / -1' }}><span className="label">NOTES</span><div style={{ fontSize: '0.75rem', color: '#F59E0B' }}>⚠ {b.notes}</div></div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="panel">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316', marginBottom: '1.2rem' }}>
              {editingBooking ? `Editing — ${editingBooking.name}` : 'New Booking'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">NAME</span><input className="input" placeholder="Full name" value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><span className="label">PHONE</span><input className="input" placeholder="087 000 0000" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
              <div><span className="label">EMAIL</span><input className="input" placeholder="email@example.com" value={form.email} onChange={e => f('email', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">DATE</span><input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
              <div>
                <span className="label">TIME</span>
                <select className="input" value={form.time} onChange={e => f('time', e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <span className="label">DURATION</span>
                <select className="input" value={form.duration || 90} onChange={e => f('duration', parseInt(e.target.value))}>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={150}>2.5 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
              <div><span className="label">GUESTS</span><input className="input" type="number" min="1" max="50" value={form.guests} onChange={e => f('guests', e.target.value)} /></div>
              <div>
                <span className="label">PREFERRED TABLE</span>
                <select className="input" value={form.preferredTable} onChange={e => f('preferredTable', Number(e.target.value))}>
                  <option value="">No preference</option>
                  {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(n => <option key={n} value={n}>Table {n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">FAV DISHES</span><input className="input" placeholder="e.g. Grilled Salmon" value={form.favDishes} onChange={e => f('favDishes', e.target.value)} /></div>
              <div><span className="label">FAV DRINKS</span><input className="input" placeholder="e.g. House Wine" value={form.favDrinks} onChange={e => f('favDrinks', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <span className="label">NOTES</span>
              <input className="input" placeholder="Allergies, occasions, special requirements..." value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#94A3B8' }}>
                <input type="checkbox" className="checkbox" checked={form.depositPaid} onChange={e => f('depositPaid', e.target.checked)} />
                Deposit paid
              </label>
              <div>
                <span className="label" style={{ display: 'inline', marginRight: '0.5rem' }}>STATUS</span>
                <select className="status-select" value={form.status} onChange={e => f('status', e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingBooking ? 'Save Changes' : 'Add Booking'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingBooking(null) }}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}