import { useState } from 'react'
import { usePOS, TIER_CONFIG, getTier } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const EMPTY_FORM = { name: '', phone: '', email: '', birthday: '', notes: '' }

function TierBadge({ totalSpend }) {
  const tier = getTier(totalSpend)
  const t    = TIER_CONFIG[tier]
  return (
    <span style={{ fontSize: '0.6rem', fontWeight: 700, background: t.color + '22', color: t.color, border: `1px solid ${t.color}44`, borderRadius: 5, padding: '1px 7px', letterSpacing: '0.08em' }}>
      {t.label.toUpperCase()}
    </span>
  )
}

function PointsBar({ points, stamps }) {
  const stampPct    = (stamps / 10) * 100
  const nextTierPts = points >= 500 ? null : points >= 200 ? 500 : 200
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.62rem', color: '#475569' }}>STAMPS</span>
        <span style={{ fontSize: '0.62rem', color: '#475569' }}>{stamps}/10</span>
      </div>
      <div style={{ background: '#1E1E2E', borderRadius: 4, height: 5, marginBottom: '0.6rem' }}>
        <div style={{ background: '#F59E0B', borderRadius: 4, height: '100%', width: `${stampPct}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.62rem', color: '#475569' }}>POINTS</span>
        <span style={{ fontSize: '0.62rem', color: '#F97316', fontWeight: 700 }}>{points} pts = €{(points / 100).toFixed(2)}</span>
      </div>
      {nextTierPts && (
        <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.2rem' }}>
          €{nextTierPts - Math.floor(points / 1)} more spend to next tier
        </div>
      )}
    </div>
  )
}

export default function CustomersView() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, orderHistory } = usePOS()
  const { isMobile } = useBreakpoint()

  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('all')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    if (!matchSearch) return false
    if (activeTab === 'gold')   return getTier(c.totalSpend) === 'gold'
    if (activeTab === 'silver') return getTier(c.totalSpend) === 'silver'
    if (activeTab === 'bronze') return getTier(c.totalSpend) === 'bronze'
    return true
  }).sort((a, b) => b.totalSpend - a.totalSpend)

  const openAdd  = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setSelected(null) }
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone, email: c.email, birthday: c.birthday || '', notes: c.notes || '' }); setEditingId(c.id); setShowForm(true) }

  const handleSave = () => {
    if (!form.name) return
    if (editingId) updateCustomer({ ...customers.find(c => c.id === editingId), ...form })
    else addCustomer(form)
    setShowForm(false); setEditingId(null); setForm(EMPTY_FORM)
  }

  const selectedCustomer = customers.find(c => c.id === selected)
  const customerOrders   = selectedCustomer ? orderHistory.filter(o => o.customerId === selectedCustomer.id) : []

  const isBirthdaySoon = (birthday) => {
    if (!birthday) return false
    const today = new Date()
    const bday  = new Date(birthday)
    bday.setFullYear(today.getFullYear())
    const diff = (bday - today) / 86400000
    return diff >= 0 && diff <= 14
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.55rem 0.8rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;width:100%;outline:none;box-sizing:border-box;transition:border-color 0.15s}
        .input:focus{border-color:#F97316}
        .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.35rem;display:block}
        .tab{padding:0.35rem 0.7rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;font-weight:700;transition:all 0.15s}
        .tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .cust-row{display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid #0D0D14;cursor:pointer;transition:background 0.1s;gap:0.5rem}
        .cust-row:hover{background:#13131A}
        .cust-row.sel{background:#F9731611;border-left:3px solid #F97316}
        .panel{background:#13131A;border:1px solid #1E1E2E;border-radius:14px;padding:1.2rem}
        .stat-box{background:#0D0D14;border:1px solid #1E1E2E;border-radius:10px;padding:0.6rem 0.8rem;text-align:center}
      `}</style>

      <div style={{ maxWidth: 1050, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>LOYALTY</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Customers</h1>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
        </div>

        {/* Stats — scrollable row on mobile */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
          {[
            { label: 'TOTAL',          value: customers.length,                                                  color: '#E2E8F0' },
            { label: 'GOLD',           value: customers.filter(c => getTier(c.totalSpend) === 'gold').length,   color: '#F59E0B' },
            { label: 'SILVER',         value: customers.filter(c => getTier(c.totalSpend) === 'silver').length, color: '#94A3B8' },
            { label: 'BRONZE',         value: customers.filter(c => getTier(c.totalSpend) === 'bronze').length, color: '#CD7F32' },
            { label: 'BIRTHDAYS SOON', value: customers.filter(c => isBirthdaySoon(c.birthday)).length,         color: '#EC4899' },
          ].map(s => (
            <div key={s.label} className="stat-box" style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.55rem', color: '#475569', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Profile panel — shown above list on mobile when selected */}
        {isMobile && selectedCustomer && (
          <div style={{ marginBottom: '1rem' }}>
            <CustomerProfile
              customer={selectedCustomer}
              customerOrders={customerOrders}
              isBirthdaySoon={isBirthdaySoon}
              onClose={() => setSelected(null)}
              onEdit={openEdit}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: !isMobile && selected ? '1fr 360px' : '1fr', gap: '1.5rem' }}>

          {/* Left — list */}
          <div>
            {/* Search + filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="input" placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                {['all', 'gold', 'silver', 'bronze'].map(t => (
                  <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table — mobile shows simplified cards, desktop shows grid */}
            {isMobile ? (
              <div>
                {filtered.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.78rem', color: '#334155' }}>No customers found</div>
                )}
                {filtered.map(c => {
                  const tier = getTier(c.totalSpend)
                  const tc   = TIER_CONFIG[tier]
                  const bday = isBirthdaySoon(c.birthday)
                  return (
                    <div key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)}
                      style={{ background: selected === c.id ? '#F9731611' : '#13131A', border: `1px solid ${selected === c.id ? '#F9731644' : '#1E1E2E'}`, borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: tc.color + '22', border: `2px solid ${tc.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: tc.color, fontWeight: 700, flexShrink: 0 }}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{c.name} {bday ? '🎂' : ''}</div>
                            <div style={{ fontSize: '0.62rem', color: '#475569' }}>{c.phone}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: tc.color, fontWeight: 700 }}>{tc.label}</div>
                          <div style={{ fontSize: '0.68rem', color: '#F97316' }}>{c.points}pts</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); openEdit(c) }}>✏ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteCustomer(c.id); if (selected === c.id) setSelected(null) }}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px 100px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                  {['CUSTOMER', 'TIER', 'VISITS', 'SPEND', 'POINTS'].map(h => (
                    <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.78rem', color: '#334155' }}>No customers found</div>
                )}
                {filtered.map(c => {
                  const tier = getTier(c.totalSpend)
                  const tc   = TIER_CONFIG[tier]
                  const bday = isBirthdaySoon(c.birthday)
                  return (
                    <div key={c.id} className={`cust-row ${selected === c.id ? 'sel' : ''}`} onClick={() => setSelected(selected === c.id ? null : c.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: tc.color + '22', border: `2px solid ${tc.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, color: tc.color, fontWeight: 700 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {c.name} {bday && <span style={{ fontSize: '0.6rem' }}>🎂</span>}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#475569' }}>{c.phone}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: tc.color, fontWeight: 700 }}>{tc.label}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.visits}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>€{c.totalSpend.toFixed(0)}</span>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#F97316', fontWeight: 700 }}>{c.points}</span>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.6rem' }} onClick={e => { e.stopPropagation(); openEdit(c) }}>✏</button>
                        <button className="btn btn-danger btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.6rem' }} onClick={e => { e.stopPropagation(); deleteCustomer(c.id); if (selected === c.id) setSelected(null) }}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right — profile (desktop only) */}
          {!isMobile && selectedCustomer && (
            <CustomerProfile
              customer={selectedCustomer}
              customerOrders={customerOrders}
              isBirthdaySoon={isBirthdaySoon}
              onClose={() => setSelected(null)}
              onEdit={openEdit}
            />
          )}
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div style={{ background: '#13131A', border: '1px solid #F9731644', borderRadius: 14, padding: '1.2rem', marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316', marginBottom: '1.2rem' }}>
              {editingId ? 'Edit Customer' : 'New Customer'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">FULL NAME</span><input className="input" placeholder="Full name" value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><span className="label">PHONE</span><input className="input" placeholder="Phone number" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
              <div><span className="label">EMAIL</span><input className="input" placeholder="Email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
              <div><span className="label">BIRTHDAY</span><input className="input" type="date" value={form.birthday} onChange={e => f('birthday', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: '1.2rem' }}>
              <span className="label">NOTES</span>
              <input className="input" placeholder="Any notes about this customer" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Customer'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CustomerProfile({ customer, customerOrders, isBirthdaySoon, onClose, onEdit }) {
  return (
    <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.3rem' }}>{customer.name}</div>
          <TierBadge totalSpend={customer.totalSpend} />
          {isBirthdaySoon(customer.birthday) && (
            <div style={{ fontSize: '0.65rem', color: '#EC4899', marginTop: '0.3rem' }}>🎂 Birthday coming up!</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => onEdit(customer)} style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem' }}>✏ Edit</button>
          <button onClick={onClose} style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem' }}>✕</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'PHONE',    value: customer.phone },
          { label: 'EMAIL',    value: customer.email },
          { label: 'BIRTHDAY', value: customer.birthday || '—' },
          { label: 'NOTES',    value: customer.notes || '—' },
        ].map(row => (
          <div key={row.label}>
            <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', color: '#475569', marginBottom: '0.2rem', display: 'block' }}>{row.label}</span>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', wordBreak: 'break-word' }}>{row.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'VISITS', value: customer.visits,                    color: '#3B82F6' },
          { label: 'SPENT',  value: `€${customer.totalSpend.toFixed(0)}`, color: '#F97316' },
          { label: 'POINTS', value: customer.points,                    color: '#10B981' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.55rem', color: '#475569' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <PointsBar points={customer.points} stamps={customer.stamps} />
      </div>

      <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>VISIT HISTORY</div>
      {customerOrders.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: '#334155', textAlign: 'center', padding: '0.8rem 0' }}>No visit history yet</div>
      ) : customerOrders.slice(-5).reverse().map(o => (
        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #0D0D14', fontSize: '0.72rem' }}>
          <span style={{ color: '#64748B' }}>{new Date(o.closedAt).toLocaleDateString()}</span>
          <span style={{ color: '#94A3B8' }}>T{o.table}</span>
          <span style={{ color: '#F97316', fontWeight: 700 }}>€{o.total.toFixed(2)}</span>
          <span style={{ color: '#10B981' }}>+{Math.floor(o.total)}pts</span>
        </div>
      ))}
    </div>
  )
}