import { useState } from 'react'
import { usePOS } from '../../context/POSContext'

const START_HOUR = 9
const END_HOUR   = 23
const HOUR_W     = 100
const ROW_H      = 60
const LABEL_W    = 72

const SLOT_OPTIONS  = [{ label: '15 min', mins: 15 }, { label: '30 min', mins: 30 }, { label: '1 hour', mins: 60 }]
const DURATION_OPTS = [60, 90, 120, 150, 180]
const STATUS_COLORS = { pending: '#F59E0B', confirmed: '#10B981', seated: '#3B82F6', cancelled: '#475569' }

const timeToMins = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m }
const minsToTime = (mins) => `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
const minsToX    = (mins) => ((mins - START_HOUR * 60) / 60) * HOUR_W

const hasConflict = (bookings, tableId, date, time, duration, excludeId = null) => {
  if (!time) return false
  const s = timeToMins(time), e = s + duration
  return bookings.some(b => {
    if (b.id === excludeId || b.preferredTable !== tableId || b.date !== date || b.status === 'cancelled') return false
    const bs = timeToMins(b.time), be = bs + (b.duration || 90)
    return s < be && e > bs
  })
}

const EMPTY_FORM = { name: '', phone: '', email: '', guests: 2, date: '', time: '', duration: 90, preferredTable: null, notes: '', depositPaid: false, depositAmount: 0, favDishes: '', favDrinks: '', status: 'confirmed' }

export default function TimelineView() {
  const { tables, bookings, addBooking, updateBooking, deleteBooking } = usePOS()

  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [slotMins, setSlotMins] = useState(30)
  const [modal,    setModal]    = useState(null)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [error,    setError]    = useState('')

  const f     = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const gridW = (END_HOUR - START_HOUR) * HOUR_W
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const slots = []
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += slotMins) slots.push(m)

  const now     = new Date()
  const nowMins = now.toISOString().split('T')[0] === date ? now.getHours() * 60 + now.getMinutes() : null
  const nowX    = nowMins !== null ? minsToX(nowMins) : null

  const dayBookings = bookings.filter(b => b.date === date && b.status !== 'cancelled')

  const openNew = (tableId, slotStart) => {
    setEditing(null); setError('')
    setForm({ ...EMPTY_FORM, date, time: minsToTime(slotStart), preferredTable: tableId })
    setModal('open')
  }

  const openEdit = (b, e) => {
    e.stopPropagation()
    setEditing(b); setError('')
    setForm({ ...b })
    setModal('open')
  }

  const handleSave = () => {
    if (!form.name || !form.time) { setError('Name and time are required'); return }
    const conflict = hasConflict(bookings, form.preferredTable, form.date, form.time, parseInt(form.duration) || 90, editing?.id)
    if (conflict) { setError('This table is already booked at that time'); return }
    if (editing) {
      updateBooking({ ...editing, ...form, duration: parseInt(form.duration) || 90, guests: parseInt(form.guests) || 2 })
    } else {
      addBooking({ ...form, duration: parseInt(form.duration) || 90, guests: parseInt(form.guests) || 2 })
    }
    setModal(null)
  }

  const isSlotTaken = (tableId, slotStart) => {
    const slotEnd = slotStart + slotMins
    return dayBookings.some(b => {
      if (b.preferredTable !== tableId) return false
      const bs = timeToMins(b.time), be = bs + (b.duration || 90)
      return slotStart < be && slotEnd > bs
    })
  }

  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
      <style>{`
        .tl-slot { box-sizing: border-box; height: 100%; transition: background 0.1s; }
        .tl-slot.free { cursor: pointer; }
        .tl-slot.free:hover { background: #F9731622 !important; }
        .tl-slot.taken { background: #1E293B88; cursor: not-allowed; }
        .bk-block { position: absolute; border-radius: 7px; padding: 4px 7px; cursor: pointer; overflow: hidden; transition: opacity 0.15s; z-index: 4; display: flex; flex-direction: column; justify-content: center; }
        .bk-block:hover { opacity: 0.8; filter: brightness(1.15); }
        .btn { border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.78rem; font-weight: 700; transition: all 0.15s; }
        .btn:hover { opacity: 0.85; }
        .btn-primary { background: #F97316; color: #000; }
        .btn-ghost { background: #13131A; color: #94A3B8; border: 1px solid #1E1E2E; }
        .btn-danger { background: #EF444422; color: #EF4444; border: 1px solid #EF444433; }
        .btn-sm { padding: 0.3rem 0.7rem; font-size: 0.68rem; }
        .input { background: #0D0D14; border: 1px solid #2D2D3F; border-radius: 8px; padding: 0.5rem 0.7rem; color: #E2E8F0; font-family: 'Courier New', monospace; font-size: 0.78rem; width: 100%; outline: none; box-sizing: border-box; }
        .input:focus { border-color: #F97316; }
        .label { font-size: 0.58rem; letter-spacing: 0.12em; color: #475569; margin-bottom: 0.3rem; display: block; }
      `}</style>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.4rem 0.7rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.78rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {SLOT_OPTIONS.map(o => (
            <button key={o.mins} onClick={() => setSlotMins(o.mins)}
              style={{ border: '1px solid', borderColor: slotMins === o.mins ? '#F97316' : '#1E1E2E', background: slotMins === o.mins ? '#F9731622' : '#13131A', color: slotMins === o.mins ? '#F97316' : '#64748B', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem', fontWeight: 700 }}>
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.62rem', color: '#334155' }}>
          {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} · click empty slot to add
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'cancelled').map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', color: '#475569' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', color: '#475569' }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#1E293B', border: '1px solid #334155' }} />
          Unavailable
        </div>
        {nowX !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', color: '#EF4444' }}>
            <div style={{ width: 2, height: 10, background: '#EF4444' }} />
            Now
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #1E1E2E', borderRadius: 12, background: '#0A0A0F' }}>
        <div style={{ minWidth: LABEL_W + gridW }}>

          {/* Hour header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1E1E2E', background: '#0D0D14', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '1px solid #1E1E2E', height: 32 }} />
            <div style={{ position: 'relative', width: gridW, flexShrink: 0, height: 32 }}>
              {hours.map(h => (
                <div key={h} style={{ position: 'absolute', left: (h - START_HOUR) * HOUR_W, width: HOUR_W, height: '100%', fontSize: '0.6rem', color: '#475569', padding: '0.4rem 0.4rem', borderLeft: '1px solid #1E1E2E', boxSizing: 'border-box' }}>
                  {h.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Table rows */}
          {tables.map((table, tIdx) => (
            <div key={table.id} style={{ display: 'flex', height: ROW_H, borderBottom: tIdx < tables.length - 1 ? '1px solid #1E1E2E' : 'none' }}>

              {/* Label */}
              <div style={{ width: LABEL_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #1E1E2E', background: '#0D0D14' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>T{table.id}</span>
              </div>

              {/* Row area — two layers stacked */}
              <div style={{ position: 'relative', width: gridW, flexShrink: 0, height: ROW_H }}>

                {/* Layer 1 — clickable slot cells */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 1 }}>
                  {slots.map(slotStart => {
                    const taken  = isSlotTaken(table.id, slotStart)
                    const isHour = slotStart % 60 === 0
                    return (
                      <div
                        key={slotStart}
                        className={`tl-slot ${taken ? 'taken' : 'free'}`}
                        style={{
                          width: (slotMins / 60) * HOUR_W,
                          flexShrink: 0,
                          borderLeft: isHour ? '1px solid #1E1E2E' : '1px solid #ffffff08',
                        }}
                        onClick={() => !taken && openNew(table.id, slotStart)}
                      />
                    )
                  })}
                </div>

                {/* Layer 2 — booking blocks floating on top */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
                  {dayBookings.filter(b => b.preferredTable === table.id).map(b => {
                    const startMins = timeToMins(b.time)
                    const x = minsToX(startMins)
                    const w = ((b.duration || 90) / 60) * HOUR_W
                    const c = STATUS_COLORS[b.status] || '#F59E0B'
                    if (x < 0 || x > gridW) return null
                    const clampedW = Math.min(w - 3, gridW - x - 2)
                    if (clampedW <= 0) return null
                    return (
                      <div
                        key={b.id}
                        className="bk-block"
                        style={{
                          left: x + 1,
                          top: 4,
                          width: clampedW,
                          height: ROW_H - 8,
                          background: c + '33',
                          border: `1.5px solid ${c}99`,
                          color: c,
                          pointerEvents: 'all',
                        }}
                        onClick={(e) => openEdit(b, e)}
                      >
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.name.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '0.55rem', opacity: 0.85, whiteSpace: 'nowrap' }}>
                          {b.time} · {b.guests}p · {b.duration || 90}m
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Now indicator */}
                {nowX !== null && nowX >= 0 && nowX <= gridW && (
                  <div style={{ position: 'absolute', left: nowX, top: 0, bottom: 0, width: 2, background: '#EF4444', zIndex: 5, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: 3, left: -3, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ background: '#0F0F17', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 480, fontFamily: "'Courier New', monospace", color: '#E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {editing ? `Edit — ${editing.name}` : `New Booking · T${form.preferredTable} · ${form.time}`}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>

            {error && (
              <div style={{ fontSize: '0.72rem', color: '#EF4444', background: '#EF444422', border: '1px solid #EF444433', borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: '0.8rem' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
              <div><span className="label">NAME</span><input className="input" value={form.name || ''} onChange={e => f('name', e.target.value)} placeholder="Guest name" autoFocus /></div>
              <div><span className="label">PHONE</span><input className="input" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="Phone" /></div>
              <div><span className="label">DATE</span><input className="input" type="date" value={form.date || date} onChange={e => f('date', e.target.value)} /></div>
              <div><span className="label">TIME</span><input className="input" type="time" value={form.time || ''} onChange={e => { f('time', e.target.value); setError('') }} /></div>
              <div>
                <span className="label">DURATION</span>
                <select className="input" value={form.duration || 90} onChange={e => { f('duration', parseInt(e.target.value)); setError('') }}>
                  {DURATION_OPTS.map(d => <option key={d} value={d}>{d}min ({Math.floor(d/60)}h{d%60 ? `${d%60}m` : ''})</option>)}
                </select>
              </div>
              <div>
                <span className="label">TABLE</span>
                <select className="input" value={form.preferredTable || ''} onChange={e => { f('preferredTable', parseInt(e.target.value)); setError('') }}>
                  {tables.map(t => {
                    const conflict = form.time ? hasConflict(bookings, t.id, form.date || date, form.time, parseInt(form.duration) || 90, editing?.id) : false
                    return <option key={t.id} value={t.id} disabled={conflict}>T{t.id}{conflict ? ' (booked)' : ''}</option>
                  })}
                </select>
              </div>
              <div><span className="label">GUESTS</span><input className="input" type="number" min="1" value={form.guests || 2} onChange={e => f('guests', e.target.value)} /></div>
              <div>
                <span className="label">STATUS</span>
                <select className="input" value={form.status || 'confirmed'} onChange={e => f('status', e.target.value)}>
                  {['pending', 'confirmed', 'seated', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span className="label">NOTES</span>
              <input className="input" value={form.notes || ''} onChange={e => f('notes', e.target.value)} placeholder="Any special requests or notes" />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                {editing ? 'Save Changes' : 'Book Table'}
              </button>
              {editing && (
                <button className="btn btn-danger btn-sm" onClick={() => { deleteBooking(editing.id); setModal(null) }}>Delete</button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}