import { useState } from 'react'
import { usePOS } from '../../context/POSContext'

function Section({ title, children }) {
  return (
    <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.5rem', marginBottom: '1.2rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', fontWeight: 700, marginBottom: '1.2rem' }}>{title}</div>
      {children}
    </div>
  )
}

export default function SettingsView() {
  const { settings, updateSettings, tables, setTables } = usePOS()
  const [form,    setForm]    = useState({ ...settings })
  const [saved,   setSaved]   = useState(false)
  const [section, setSection] = useState('restaurant')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    updateSettings({ ...form, tableCount: parseInt(form.tableCount) || 15 })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(settings)

  const TABS = [
    { id: 'restaurant', label: '🏠 Restaurant' },
    { id: 'operations', label: '⚙️ Operations' },
    { id: 'modules',    label: '🧩 Modules' },
    { id: 'courses',    label: '🍽️ Courses' },
    { id: 'loyalty',    label: '🏆 Loyalty' },
    { id: 'receipt',    label: '🧾 Receipt' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85;transform:translateY(-1px)}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.55rem 0.8rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;width:100%;outline:none;box-sizing:border-box;transition:border-color 0.15s}
        .input:focus{border-color:#F97316}
        .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.35rem;display:block}
        .tab{padding:0.45rem 1rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:0.8rem}
        .row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.8rem;margin-bottom:0.8rem}
        .hint{font-size:0.62rem;color:#334155;margin-top:0.3rem}
        .preview{background:#0D0D14;border:1px solid #1E1E2E;border-radius:10px;padding:1rem;margin-top:0.8rem}
        .tier-card{background:#0D0D14;border-radius:10px;padding:0.8rem 1rem;border:1px solid}
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>CONFIGURATION</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Settings</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {saved && <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>✓ Saved</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...settings })}>Reset</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges} style={{ opacity: hasChanges ? 1 : 0.4 }}>
              Save Changes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab ${section === t.id ? 'active' : ''}`} onClick={() => setSection(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* RESTAURANT */}
        {section === 'restaurant' && (
          <Section title="RESTAURANT INFO">
            <div className="row">
              <div>
                <span className="label">RESTAURANT NAME</span>
                <input className="input" value={form.restaurantName} onChange={e => f('restaurantName', e.target.value)} placeholder="My Restaurant" />
              </div>
              <div>
                <span className="label">CURRENCY SYMBOL</span>
                <input className="input" value={form.currency} onChange={e => f('currency', e.target.value)} placeholder="€" style={{ maxWidth: 80 }} />
              </div>
            </div>
            <div className="row">
              <div>
                <span className="label">PHONE</span>
                <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="01 234 5678" />
              </div>
              <div>
                <span className="label">EMAIL</span>
                <input className="input" value={form.email} onChange={e => f('email', e.target.value)} placeholder="hello@restaurant.com" />
              </div>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <span className="label">ADDRESS</span>
              <input className="input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="123 Main Street" />
            </div>

            {/* Live preview */}
            <div className="preview">
              <div style={{ fontSize: '0.6rem', color: '#334155', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>RECEIPT HEADER PREVIEW</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F97316' }}>{form.restaurantName || 'My Restaurant'}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.2rem' }}>{form.address}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{form.phone} · {form.email}</div>
              </div>
            </div>
          </Section>
        )}

        {/* OPERATIONS */}
        {section === 'operations' && (
          <Section title="OPERATIONS">
            <div className="row">
              <div>
                <span className="label">DEFAULT SERVICE CHARGE %</span>
                <input className="input" type="number" min="0" max="100" value={form.defaultServiceCharge} onChange={e => f('defaultServiceCharge', parseFloat(e.target.value) || 0)} />
                <p className="hint">Pre-fills the service charge field in payments</p>
              </div>
              <div>
                <span className="label">NUMBER OF TABLES</span>
                <input className="input" type="number" min="1" max="100" value={form.tableCount} onChange={e => f('tableCount', e.target.value)} />
                <p className="hint">Tables are recreated when you save</p>
              </div>
            </div>

            {/* Table count preview */}
            <div className="preview">
              <div style={{ fontSize: '0.6rem', color: '#334155', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>TABLE LAYOUT PREVIEW</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {Array.from({ length: Math.min(parseInt(form.tableCount) || 0, 50) }, (_, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: '#1E293B', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748B' }}>
                    {i + 1}
                  </div>
                ))}
                {(parseInt(form.tableCount) || 0) > 50 && (
                  <div style={{ fontSize: '0.65rem', color: '#334155', alignSelf: 'center' }}>+{form.tableCount - 50} more</div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* LOYALTY */}
        {section === 'loyalty' && (
          <Section title="LOYALTY PROGRAMME">
            <div className="row">
              <div>
                <span className="label">POINTS PER {form.currency || '€'}1 SPENT</span>
                <input className="input" type="number" min="0" step="0.5" value={form.pointsPerEuro} onChange={e => f('pointsPerEuro', parseFloat(e.target.value) || 0)} />
                <p className="hint">e.g. 1 = one point per euro</p>
              </div>
              <div>
                <span className="label">POINTS TO REDEEM {form.currency || '€'}1</span>
                <input className="input" type="number" min="1" value={form.pointsRedeemRate} onChange={e => f('pointsRedeemRate', parseFloat(e.target.value) || 100)} />
                <p className="hint">e.g. 100 = 100 pts = €1 off</p>
              </div>
            </div>

            <div className="row">
              <div>
                <span className="label">STAMPS FOR REWARD</span>
                <input className="input" type="number" min="1" value={form.stampTarget} onChange={e => f('stampTarget', parseInt(e.target.value) || 10)} />
                <p className="hint">Number of visits to earn reward</p>
              </div>
              <div>
                <span className="label">STAMP REWARD VALUE ({form.currency || '€'})</span>
                <input className="input" type="number" min="0" step="0.50" value={form.stampRewardValue} onChange={e => f('stampRewardValue', parseFloat(e.target.value) || 0)} />
                <p className="hint">Discount when stamps are complete</p>
              </div>
            </div>

            {/* Tier thresholds */}
            <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.8rem', marginTop: '0.4rem' }}>TIER THRESHOLDS (TOTAL SPEND)</div>
            <div className="row3" style={{ marginBottom: '0.8rem' }}>
              <div className="tier-card" style={{ borderColor: '#CD7F3244' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#CD7F32', marginBottom: '0.5rem' }}>🥉 BRONZE</div>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>From {form.currency}0</div>
              </div>
              <div className="tier-card" style={{ borderColor: '#94A3B844' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '0.5rem' }}>🥈 SILVER</div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>FROM</span>
                <input className="input" type="number" min="0" value={form.tierSilverMin} onChange={e => f('tierSilverMin', parseInt(e.target.value) || 0)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }} />
              </div>
              <div className="tier-card" style={{ borderColor: '#F59E0B44' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.5rem' }}>🥇 GOLD</div>
                <span className="label" style={{ marginBottom: '0.25rem' }}>FROM</span>
                <input className="input" type="number" min="0" value={form.tierGoldMin} onChange={e => f('tierGoldMin', parseInt(e.target.value) || 0)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }} />
              </div>
            </div>

            {/* Loyalty preview */}
            <div className="preview">
              <div style={{ fontSize: '0.6rem', color: '#334155', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>EXAMPLE — {form.currency}50 SPEND</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Earns <span style={{ color: '#F97316', fontWeight: 700 }}>{Math.floor(50 * form.pointsPerEuro)} points</span> = <span style={{ color: '#10B981', fontWeight: 700 }}>{form.currency}{(Math.floor(50 * form.pointsPerEuro) / form.pointsRedeemRate).toFixed(2)} redeemable</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                Stamp card: <span style={{ color: '#F59E0B', fontWeight: 700 }}>1/{form.stampTarget}</span> — reward at {form.stampTarget} visits = <span style={{ color: '#F97316', fontWeight: 700 }}>{form.currency}{form.stampRewardValue} off</span>
              </div>
            </div>
          </Section>
        )}

        {/* COURSES */}
{section === 'courses' && (
  <Section title="COURSE CONFIGURATION">
    <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '1rem' }}>
      Define the courses for your service. Each course maps to menu categories. Drag to reorder.
    </div>
    {(form.courses || []).sort((a,b) => a.position - b.position).map((course, idx) => (
      <div key={course.id} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, minWidth: 24 }}>{idx + 1}.</span>
          <input className="input" style={{ flex: 1, minWidth: 120 }} value={course.name}
            onChange={e => f('courses', form.courses.map(c => c.id === course.id ? { ...c, name: e.target.value } : c))} />
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button onClick={() => f('courses', form.courses.map(c => c.id === course.id ? { ...c, position: c.position - 1 } : c.position === course.position - 1 ? { ...c, position: c.position + 1 } : c))}
              disabled={idx === 0}
              style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
            <button onClick={() => f('courses', form.courses.map(c => c.id === course.id ? { ...c, position: c.position + 1 } : c.position === course.position + 1 ? { ...c, position: c.position - 1 } : c))}
              disabled={idx === form.courses.length - 1}
              style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', opacity: idx === form.courses.length - 1 ? 0.3 : 1 }}>↓</button>
            <button onClick={() => f('courses', form.courses.filter(c => c.id !== course.id))}
              style={{ border: '1px solid #EF444433', background: '#EF444411', color: '#EF4444', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem' }}>✕</button>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <span className="label">MENU CATEGORIES (comma separated)</span>
          <input className="input" placeholder="e.g. Starters, Soups"
            value={(course.menuCategories || []).join(', ')}
            onChange={e => f('courses', form.courses.map(c => c.id === course.id ? { ...c, menuCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : c))} />
        </div>
      </div>
    ))}
    <button onClick={() => f('courses', [...(form.courses || []), { id: 'course-' + Date.now(), name: 'New Course', position: (form.courses?.length || 0) + 1, menuCategories: [] }])}
      style={{ border: '1px dashed #334155', background: 'transparent', color: '#475569', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700, width: '100%', marginTop: '0.3rem' }}>
      + Add Course
    </button>
    <button onClick={() => f('courses', [
      { id: 'starters', name: 'Starters', position: 1, menuCategories: ['Starters'] },
      { id: 'mains',    name: 'Mains',    position: 2, menuCategories: ['Mains']    },
      { id: 'desserts', name: 'Desserts', position: 3, menuCategories: ['Desserts'] },
    ])}
      style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#475569', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700, width: '100%', marginTop: '0.3rem' }}>
      ↺ Restore Defaults
    </button>
  </Section>
)}

        {/* RECEIPT */}
        {section === 'receipt' && (
          <Section title="RECEIPT">
            <div style={{ marginBottom: '0.8rem' }}>
              <span className="label">FOOTER MESSAGE</span>
              <input className="input" value={form.receiptFooter} onChange={e => f('receiptFooter', e.target.value)} placeholder="Thank you for dining with us!" />
              <p className="hint">Shown at the bottom of every printed receipt</p>
            </div>

            {/* Receipt preview */}
            <div className="preview" style={{ fontFamily: 'monospace' }}>
              <div style={{ fontSize: '0.6rem', color: '#334155', marginBottom: '0.8rem', letterSpacing: '0.1em', fontFamily: "'Courier New', monospace" }}>RECEIPT PREVIEW</div>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #1E1E2E', paddingBottom: '0.6rem', marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F97316' }}>{form.restaurantName || 'My Restaurant'}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>{form.address}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>{form.phone}</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '0.4rem' }}>Table 4 · 19:45</div>
              <div style={{ borderBottom: '1px dashed #1E1E2E', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                {[['Beef Burger', 1, 14.00], ['House Wine', 2, 13.00]].map(([n, q, t]) => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.2rem' }}>
                    <span>{n} ×{q}</span><span>{form.currency}{t.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.6rem' }}>
                <span>TOTAL</span><span>{form.currency}27.00</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#334155', borderTop: '1px dashed #1E1E2E', paddingTop: '0.5rem' }}>
                {form.receiptFooter || 'Thank you for dining with us!'}
              </div>
            </div>
          </Section>
        )}

        {section === 'modules' && (
  <Section title="MODULES">
    {[
      { id: 'dashboard',        label: '🏠 Dashboard',     desc: 'Overview of daily sales, tables and activity',  plans: ['starter','pro','enterprise'] },
      { id: 'tables',           label: '🍽️ Tables',         desc: 'Floor plan, table status and order management', plans: ['starter','pro','enterprise'] },
      { id: 'orders',           label: '📋 Orders',         desc: 'Order taking and item management',              plans: ['starter','pro','enterprise'] },
      { id: 'kds',              label: '👨‍🍳 Kitchen Display', desc: 'Kitchen ticket system with course firing',      plans: ['pro','enterprise'] },
      { id: 'bar',              label: '🍺 Bar',            desc: 'Bar display for drinks orders',                 plans: ['pro','enterprise'] },
      { id: 'menu',             label: '📖 Menu',           desc: 'Menu management, modifiers and availability',   plans: ['starter','pro','enterprise'] },
      { id: 'bookings',         label: '📅 Bookings',       desc: 'Reservation management and table assignment',   plans: ['pro','enterprise'] },
      { id: 'reports',          label: '📊 Reports',        desc: 'Sales reports and business analytics',          plans: ['pro','enterprise'] },
      { id: 'stock',            label: '📦 Stock',          desc: 'Inventory tracking and low stock alerts',       plans: ['pro','enterprise'] },
      { id: 'staff',            label: '👥 Staff',          desc: 'Staff management and clock in/out',             plans: ['starter','pro','enterprise'] },
      { id: 'staff-analytics',  label: '📈 Performance',   desc: 'Staff revenue and performance analytics',       plans: ['enterprise'] },
      { id: 'customers',        label: '💳 Customers',      desc: 'Customer profiles and loyalty programme',       plans: ['pro','enterprise'] },
      { id: 'eod',              label: '📋 EOD Report',     desc: 'End of day cash reconciliation and summary',    plans: ['pro','enterprise'] },
      { id: 'history',          label: '🗂️ History',        desc: 'Full searchable order history log',             plans: ['starter','pro','enterprise'] },
    ].map(mod => {
      const hasPlan  = mod.plans.includes(form.plan || 'pro')
      const isActive = (form.activeModules || []).includes(mod.id)
      const toggle   = () => {
        if (!hasPlan) return
        const updated = isActive
          ? (form.activeModules || []).filter(m => m !== mod.id)
          : [...(form.activeModules || []), mod.id]
        f('activeModules', updated)
      }
      return (
        <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #1E1E2E' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: hasPlan ? '#CBD5E1' : '#334155' }}>{mod.label}</span>
              {!hasPlan && <span style={{ fontSize: '0.58rem', color: '#475569', background: '#1E1E2E', borderRadius: 4, padding: '1px 6px' }}>🔒 Upgrade</span>}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#334155' }}>{mod.desc}</div>
          </div>
          <button
            onClick={toggle}
            style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: hasPlan ? 'pointer' : 'not-allowed', background: isActive && hasPlan ? '#F97316' : '#1E293B', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: isActive && hasPlan ? 21 : 3, transition: 'left 0.2s' }} />
          </button>
        </div>
      )
    })}
  </Section>
)}

      </div>
    </div>
  )
}