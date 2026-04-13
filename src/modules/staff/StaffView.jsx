import { useState } from 'react'
import { usePOS, ROLE_CONFIG } from '../../context/POSContext'

const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior']
const SECTIONS = ['Indoor', 'Outdoor', 'Bar', 'Kitchen', 'All']

const EMPTY_FORM = { name: '', username: '', password: '', role: 'waiter', section: 'Indoor', experience: 'Mid', active: true }

function formatHours(h) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs}h ${mins}m`
}

export default function StaffView() {
  const { staff, currentUser, addStaff, updateStaff, deleteStaff, clockIn, clockOut, isClockedIn, getTotalHours, orderHistory } = usePOS()
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState('roster')
  const [expandedId, setExpandedId] = useState(null)

  const isAdmin = currentUser?.role === 'admin'
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openEdit = (member) => {
    setForm({ ...member })
    setEditingId(member.id)
    setShowAdd(false)
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowAdd(true)
  }

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) return
    if (editingId) updateStaff({ ...form, id: editingId })
    else addStaff(form)
    setShowAdd(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const getOrdersByStaff = (name) => orderHistory.filter(o => o.placedBy === name)

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '2rem',
    }}>
      <style>{`
        .btn { border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.78rem; font-weight: 700; transition: all 0.15s; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-primary { background: #F97316; color: #000; }
        .btn-ghost { background: #13131A; color: #94A3B8; border: 1px solid #1E1E2E; }
        .btn-danger { background: #EF444422; color: #EF4444; border: 1px solid #EF444433; }
        .btn-green { background: #10B98122; color: #10B981; border: 1px solid #10B98144; }
        .btn-sm { padding: 0.3rem 0.7rem; font-size: 0.68rem; }
        .input { background: #0D0D14; border: 1px solid #2D2D3F; border-radius: 8px; padding: 0.5rem 0.7rem; color: #E2E8F0; font-family: 'Courier New', monospace; font-size: 0.78rem; width: 100%; outline: none; box-sizing: border-box; }
        .input:focus { border-color: #F97316; }
        .label { font-size: 0.58rem; letter-spacing: 0.12em; color: #475569; margin-bottom: 0.35rem; display: block; }
        .tab { padding: 0.4rem 1rem; border-radius: 6px; border: 1px solid #1E1E2E; background: transparent; color: #64748B; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.72rem; font-weight: 700; transition: all 0.15s; }
        .tab.active { background: #F9731622; border-color: #F97316; color: #F97316; }
        .staff-card { background: #13131A; border: 1px solid #1E1E2E; border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.5rem; cursor: pointer; transition: border-color 0.15s; }
        .staff-card:hover { border-color: #3B3B52; }
        .staff-card.expanded { border-color: #F9731644; }
        .panel { background: #13131A; border: 1px solid #F9731644; border-radius: 14px; padding: 1.5rem; margin-top: 1.5rem; }
        .clocked-in { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>TEAM</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Staff</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className={`tab ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>👥 Roster</button>
              <button className={`tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>⏱ Hours</button>
              <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>📋 Activity</button>
            </div>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Staff</button>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'TOTAL STAFF', value: staff.length, color: '#E2E8F0' },
            { label: 'CLOCKED IN', value: staff.filter(s => isClockedIn(s.id)).length, color: '#10B981' },
            { label: 'ACTIVE', value: staff.filter(s => s.active).length, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.6rem 1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ROSTER TAB */}
        {activeTab === 'roster' && (
          <div>
            {staff.map(member => {
              const role = ROLE_CONFIG[member.role]
              const clockedIn = isClockedIn(member.id)
              const isExpanded = expandedId === member.id
              const isSelf = currentUser?.id === member.id
              return (
                <div key={member.id} className={`staff-card ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedId(isExpanded ? null : member.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: role.color + '22', border: `2px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#CBD5E1' }}>{member.name}</span>
                          {isSelf && <span style={{ fontSize: '0.58rem', background: '#F9731622', color: '#F97316', border: '1px solid #F9731633', borderRadius: 4, padding: '1px 6px' }}>YOU</span>}
                          {clockedIn && <span className="clocked-in" style={{ fontSize: '0.58rem', background: '#10B98122', color: '#10B981', border: '1px solid #10B98133', borderRadius: 4, padding: '1px 6px' }}>● CLOCKED IN</span>}
                          {!member.active && <span style={{ fontSize: '0.58rem', background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433', borderRadius: 4, padding: '1px 6px' }}>INACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.15rem' }}>
                          <span style={{ color: role.color }}>{role.label}</span>
                          {' · '}{member.section}{' · '}{member.experience}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        className={`btn btn-sm ${clockedIn ? 'btn-danger' : 'btn-green'}`}
                        onClick={() => clockedIn ? clockOut(member.id) : clockIn(member.id)}
                      >
                        {clockedIn ? '⏹ Clock Out' : '▶ Clock In'}
                      </button>
                      {isAdmin && editingId !== member.id && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(member)}>Edit</button>
                      )}
                      {isAdmin && currentUser?.id !== member.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteStaff(member.id)}>✕</button>
                      )}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1E1E2E', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }} onClick={e => e.stopPropagation()}>
                      <div>
                        <span className="label">USERNAME</span>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>@{member.username}</div>
                      </div>
                      <div>
                        <span className="label">SECTION</span>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{member.section}</div>
                      </div>
                      <div>
                        <span className="label">EXPERIENCE</span>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{member.experience}</div>
                      </div>
                      <div>
                        <span className="label">HOURS TODAY</span>
                        <div style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 700 }}>{formatHours(getTotalHours(member.id))}</div>
                      </div>
                      <div>
                        <span className="label">ORDERS TODAY</span>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{getOrdersByStaff(member.name).length}</div>
                      </div>
                      <div>
                        <span className="label">ACCESS</span>
                        <div style={{ fontSize: '0.68rem', color: role.color }}>
                          {ROLE_CONFIG[member.role].routes.includes('*') ? 'Full Access' : ROLE_CONFIG[member.role].routes.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* HOURS TAB */}
        {activeTab === 'hours' && (
          <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
              {['STAFF MEMBER', 'ROLE', 'STATUS', 'HOURS TODAY'].map(h => (
                <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
              ))}
            </div>
            {staff.map(member => {
              const role = ROLE_CONFIG[member.role]
              const clockedIn = isClockedIn(member.id)
              const hours = getTotalHours(member.id)
              return (
                <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', padding: '0.75rem 1rem', borderBottom: '1px solid #0D0D14', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 600 }}>{member.name}</span>
                  <span style={{ fontSize: '0.7rem', color: role.color }}>{role.label}</span>
                  <span style={{ fontSize: '0.68rem' }}>
                    {clockedIn
                      ? <span style={{ color: '#10B981' }}>● In</span>
                      : <span style={{ color: '#334155' }}>○ Out</span>}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: hours > 0 ? '#F97316' : '#334155' }}>
                    {formatHours(hours)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div>
            {staff.filter(s => getOrdersByStaff(s.name).length > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#334155', fontSize: '0.85rem' }}>No order activity yet</div>
            ) : staff.map(member => {
              const memberOrders = getOrdersByStaff(member.name)
              if (memberOrders.length === 0) return null
              const role = ROLE_CONFIG[member.role]
              const revenue = memberOrders.reduce((s, o) => s + o.total, 0)
              return (
                <div key={member.id} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '1rem 1.2rem', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{member.name}</span>
                      <span style={{ fontSize: '0.65rem', color: role.color, background: role.color + '22', border: `1px solid ${role.color}33`, borderRadius: 5, padding: '1px 7px' }}>{role.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: '#475569' }}>ORDERS</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3B82F6' }}>{memberOrders.length}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: '#475569' }}>REVENUE</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F97316' }}>€{revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {memberOrders.slice(-5).map(o => (
                      <div key={o.id} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.65rem', color: '#64748B' }}>
                        T{o.table} · €{o.total.toFixed(2)} · {o.time}
                      </div>
                    ))}
                    {memberOrders.length > 5 && <span style={{ fontSize: '0.65rem', color: '#334155', alignSelf: 'center' }}>+{memberOrders.length - 5} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {(showAdd || editingId) && isAdmin && (
          <div className="panel">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316', marginBottom: '1.2rem' }}>
              {editingId ? 'Edit Staff Member' : 'New Staff Member'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">FULL NAME</span><input className="input" placeholder="Full name" value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><span className="label">USERNAME</span><input className="input" placeholder="username" value={form.username} onChange={e => f('username', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div>
                <span className="label">PASSWORD</span>
                <input className="input" type="password" placeholder="Password" value={form.password} onChange={e => f('password', e.target.value)} />
              </div>
              <div>
                <span className="label">ROLE</span>
                <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <span className="label">SECTION</span>
                <select className="input" value={form.section} onChange={e => f('section', e.target.value)}>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <span className="label">EXPERIENCE</span>
                <select className="input" value={form.experience} onChange={e => f('experience', e.target.value)}>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#94A3B8' }}>
                <input type="checkbox" checked={form.active} onChange={e => f('active', e.target.checked)} style={{ accentColor: '#F97316' }} />
                Active — can log in
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Staff Member'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditingId(null) }}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}