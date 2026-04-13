import { useState } from 'react'
import { useMultiBusiness, PLAN_CONFIG, BUSINESS_TYPES } from '../../context/MultiBusinessContext'

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

const EMPTY_FORM = { name: '', type: 'restaurant', color: '#F97316', plan: 'pro' }

function PlanBadge({ plan }) {
  const p = PLAN_CONFIG[plan]
  return (
    <span style={{ fontSize: '0.62rem', fontWeight: 700, background: p.color + '22', color: p.color, border: `1px solid ${p.color}44`, borderRadius: 5, padding: '1px 8px', letterSpacing: '0.06em' }}>
      {p.label.toUpperCase()}
    </span>
  )
}

export default function SuperAdminPortal({ onEnterBusiness }) {
  const { businesses, superAdminUser, superLogout, addBusiness, updateBusiness, deleteBusiness, toggleBusinessActive, updateBusinessPlan } = useMultiBusiness()

  const [activeTab,   setActiveTab]   = useState('businesses')
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [editingId,   setEditingId]   = useState(null)
  const [expandedId,  setExpandedId]  = useState(null)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingId) {
      const biz = businesses.find(b => b.id === editingId)
      updateBusiness({ ...biz, name: form.name, type: form.type, color: form.color, plan: form.plan })
      setEditingId(null)
    } else {
      addBusiness(form)
    }
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const openEdit = (biz) => {
    setForm({ name: biz.name, type: biz.type, color: biz.color, plan: biz.plan })
    setEditingId(biz.id)
    setShowForm(true)
  }

  const totalRevenue = businesses.reduce((s, b) =>
    s + (b.data?.orderHistory || []).reduce((os, o) => os + o.total, 0), 0)
  const totalActive  = businesses.filter(b => b.active).length
  const totalOrders  = businesses.reduce((s, b) => s + (b.data?.orderHistory || []).length, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85;transform:translateY(-1px)}
        .btn-purple{background:#8B5CF6;color:#fff}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
        .btn-green{background:#10B98122;color:#10B981;border:1px solid #10B98144}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.55rem 0.8rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;width:100%;outline:none;box-sizing:border-box}
        .input:focus{border-color:#8B5CF6}
        .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.35rem;display:block}
        .tab{padding:0.4rem 1rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .tab.active{background:#8B5CF622;border-color:#8B5CF6;color:#8B5CF6}
        .biz-card{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1.2rem;margin-bottom:0.6rem;transition:border-color 0.15s}
        .biz-card:hover{border-color:#3B3B52}
        .plan-btn{border:1px solid;border-radius:8px;padding:0.45rem 0.8rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;font-weight:700;transition:all 0.15s;background:transparent}
        .plan-btn:hover{opacity:0.8}
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#13131A', borderBottom: '1px solid #8B5CF633', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8B5CF6' }}>Super Admin Portal</div>
            <div style={{ fontSize: '0.6rem', color: '#334155' }}>Logged in as {superAdminUser?.username}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={superLogout}>Sign Out</button>
      </div>

      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '2rem' }}>
          {[
            { label: 'TOTAL BUSINESSES', value: businesses.length,  color: '#8B5CF6' },
            { label: 'ACTIVE',           value: totalActive,        color: '#10B981' },
            { label: 'TOTAL ORDERS',     value: totalOrders,        color: '#3B82F6' },
            { label: 'TOTAL REVENUE',    value: `€${totalRevenue.toFixed(0)}`, color: '#F97316' },
          ].map(s => (
            <div key={s.label} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          <button className={`tab ${activeTab === 'businesses' ? 'active' : ''}`} onClick={() => setActiveTab('businesses')}>🏢 Businesses</button>
          <button className={`tab ${activeTab === 'plans'      ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>💳 Plans</button>
          <button className={`tab ${activeTab === 'overview'   ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        </div>

        {/* BUSINESSES TAB */}
        {activeTab === 'businesses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-purple" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}>+ Add Business</button>
            </div>

            {businesses.map(biz => {
              const typeInfo   = BUSINESS_TYPES.find(t => t.id === biz.type)
              const isExpanded = expandedId === biz.id
              const revenue    = (biz.data?.orderHistory || []).reduce((s, o) => s + o.total, 0)

              return (
                <div key={biz.id} className="biz-card" style={{ borderColor: isExpanded ? biz.color + '55' : '#1E1E2E', opacity: biz.active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>

                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : biz.id)}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: biz.color + '22', border: `2px solid ${biz.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                        {typeInfo?.icon || '🏢'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#CBD5E1' }}>{biz.name}</span>
                          <PlanBadge plan={biz.plan} />
                          {!biz.active && <span style={{ fontSize: '0.6rem', color: '#EF4444', background: '#EF444422', border: '1px solid #EF444433', borderRadius: 4, padding: '1px 6px' }}>INACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.15rem' }}>
                          {typeInfo?.label} · €{revenue.toFixed(0)} revenue · {(biz.data?.orderHistory || []).length} orders
                        </div>
                      </div>
                    </div>

                    {/* Right — actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="btn btn-purple btn-sm"
                        onClick={() => onEnterBusiness(biz.id)}
                        style={{ background: biz.color, color: '#fff' }}>
                        → Enter POS
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(biz)}>Edit</button>
                      <button className={`btn btn-sm ${biz.active ? 'btn-danger' : 'btn-green'}`}
                        onClick={() => toggleBusinessActive(biz.id)}>
                        {biz.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`Delete ${biz.name}?`)) deleteBusiness(biz.id) }}>✕</button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${biz.color}22` }}>
                      <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>CHANGE PLAN</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                          <button key={key}
                            className="plan-btn"
                            style={{ borderColor: biz.plan === key ? plan.color : '#1E1E2E', color: biz.plan === key ? plan.color : '#475569', background: biz.plan === key ? plan.color + '22' : 'transparent' }}
                            onClick={() => updateBusinessPlan(biz.id, key)}>
                            {plan.label} — €{plan.price}/mo
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>INCLUDED FEATURES</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {Object.entries(PLAN_CONFIG[biz.plan].features).map(([feature, enabled]) => (
                          <span key={feature} style={{ fontSize: '0.62rem', fontWeight: 700, background: enabled ? '#10B98122' : '#1E1E2E', color: enabled ? '#10B981' : '#334155', border: `1px solid ${enabled ? '#10B98133' : '#1E1E2E'}`, borderRadius: 5, padding: '2px 8px' }}>
                            {enabled ? '✓' : '✕'} {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
              <div key={key} style={{ background: '#13131A', border: `1px solid ${plan.color}44`, borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: plan.color, marginBottom: '0.3rem' }}>{plan.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>€{plan.price}<span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '1rem' }}>
                  {businesses.filter(b => b.plan === key).length} business{businesses.filter(b => b.plan === key).length !== 1 ? 'es' : ''} on this plan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {Object.entries(plan.features).map(([feature, enabled]) => (
                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: enabled ? '#94A3B8' : '#334155' }}>
                      <span style={{ color: enabled ? '#10B981' : '#334155', fontWeight: 700 }}>{enabled ? '✓' : '✕'}</span>
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.62rem', color: '#334155', fontStyle: 'italic' }}>
                  * Plans will expand as new features are added
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 100px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                {['BUSINESS', 'TYPE', 'PLAN', 'ORDERS', 'REVENUE'].map(h => (
                  <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                ))}
              </div>
              {businesses.map(biz => {
                const typeInfo = BUSINESS_TYPES.find(t => t.id === biz.type)
                const revenue  = (biz.data?.orderHistory || []).reduce((s, o) => s + o.total, 0)
                const plan     = PLAN_CONFIG[biz.plan]
                return (
                  <div key={biz.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 100px', padding: '0.75rem 1rem', borderBottom: '1px solid #0D0D14', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: biz.active ? '#10B981' : '#334155', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{biz.name}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{typeInfo?.icon} {typeInfo?.label}</span>
                    <span style={{ fontSize: '0.72rem', color: plan.color, fontWeight: 700 }}>{plan.label}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{(biz.data?.orderHistory || []).length}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316' }}>€{revenue.toFixed(0)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
            <div style={{ background: '#0F0F17', border: '1px solid #8B5CF644', borderRadius: 16, padding: '1.8rem', width: '100%', maxWidth: 480, fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{editingId ? 'Edit Business' : 'New Business'}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null) }}>✕</button>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <span className="label">BUSINESS NAME</span>
                <input className="input" placeholder="e.g. The Harbour Restaurant" value={form.name} onChange={e => f('name', e.target.value)} autoFocus />
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <span className="label">BUSINESS TYPE</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {BUSINESS_TYPES.map(t => (
                    <button key={t.id} onClick={() => f('type', t.id)}
                      style={{ border: '1px solid', borderColor: form.type === t.id ? '#8B5CF6' : '#1E1E2E', background: form.type === t.id ? '#8B5CF622' : '#13131A', color: form.type === t.id ? '#8B5CF6' : '#64748B', borderRadius: 8, padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', fontWeight: 700 }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <span className="label">BRAND COLOUR</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => f('color', c)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', transition: 'border 0.1s' }} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span className="label">PLAN</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                    <button key={key} onClick={() => f('plan', key)}
                      style={{ flex: 1, border: '1px solid', borderColor: form.plan === key ? plan.color : '#1E1E2E', background: form.plan === key ? plan.color + '22' : '#13131A', color: form.plan === key ? plan.color : '#475569', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700 }}>
                      {plan.label}<br />
                      <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>€{plan.price}/mo</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-purple" style={{ flex: 1 }} onClick={handleSave}>
                  {editingId ? 'Save Changes' : 'Create Business'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}