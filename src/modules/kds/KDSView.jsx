import { useState, useEffect } from 'react'
import { usePOS, getItemCourse, getItemDestination } from '../../context/POSContext'

const COURSE_CONFIG = {
  starters: { label: 'Starters', color: '#10B981', icon: '🥗' },
  mains:    { label: 'Mains',    color: '#F97316', icon: '🍽️' },
  desserts: { label: 'Desserts', color: '#8B5CF6', icon: '🍰' },
}

function Ticker({ placedAt }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [placedAt])
  const color = elapsed >= 30 ? '#EF4444' : elapsed >= 15 ? '#F59E0B' : '#10B981'
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, color, background: color + '22', border: `1px solid ${color}44`, borderRadius: 5, padding: '1px 7px' }}>
      {elapsed}m
    </span>
  )
}

export default function KDSView() {
  const { orders, menu, advanceOrderStatus, toggleUrgent, acknowledgeOrder } = usePOS()
  const [filter, setFilter] = useState('all')

  // Only show orders that have food items
  const ordersWithFood = orders.filter(o =>
    o.items.some(i => getItemDestination(i.id, menu) === 'kitchen')
  )

  const active = ordersWithFood.filter(o => o.status !== 'ready')
  const ready  = ordersWithFood.filter(o => o.status === 'ready')

  const filtered = filter === 'all'    ? active
    : filter === 'urgent'              ? active.filter(o => o.urgent)
    : active.filter(o => o.status === filter)

  const sorted = [...filtered].sort((a, b) => {
    if (a.urgent && !b.urgent) return -1
    if (!a.urgent && b.urgent) return 1
    return new Date(a.placedAt || 0) - new Date(b.placedAt || 0)
  })

  const modifiedCount = active.filter(o => o.modified).length
  const STATUS_NEXT   = { pending: 'in-progress', 'in-progress': 'ready' }
  const STATUS_LABEL  = { pending: 'Start Cooking', 'in-progress': 'Mark Ready' }
  const STATUS_COLOR  = { pending: '#F59E0B', 'in-progress': '#3B82F6', ready: '#10B981' }

  const getFoodItems = (order, course) =>
    order.items.filter(i =>
      getItemDestination(i.id, menu) === 'kitchen' &&
      getItemCourse(i.id, menu) === course
    )

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '1.5rem' }}>
      <style>{`
        .kds-btn{border:none;border-radius:8px;padding:0.45rem 0.9rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .kds-btn:hover{opacity:0.85}
        .filter-tab{padding:0.35rem 0.8rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;font-weight:700;transition:all 0.15s}
        .filter-tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .ticket{background:#13131A;border:1px solid #1E1E2E;border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:0.5rem}
        .ticket.urgent{border-color:#EF4444 !important;box-shadow:0 0 0 1px #EF444433}
        .ticket.modified{border-color:#F59E0B !important;box-shadow:0 0 0 1px #F59E0B33}
        .course-section{border-radius:8px;padding:0.5rem 0.6rem;margin-bottom:0.3rem}
        .course-section.waiting{opacity:0.4;border:1px dashed #334155;background:transparent}
        .course-section.fired{border:1px solid}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>KITCHEN</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Kitchen Display</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'PENDING',     color: '#F59E0B', count: active.filter(o => o.status === 'pending').length },
              { label: 'IN PROGRESS', color: '#3B82F6', count: active.filter(o => o.status === 'in-progress').length },
              { label: 'READY',       color: '#10B981', count: ready.length },
            ].map(s => (
              <div key={s.label} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '0.35rem 0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '0.55rem', color: s.color, letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
            {modifiedCount > 0 && (
              <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B55', borderRadius: 8, padding: '0.35rem 0.8rem', textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F59E0B' }}>{modifiedCount}</div>
                <div style={{ fontSize: '0.55rem', color: '#F59E0B', letterSpacing: '0.08em' }}>UPDATED</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all',         label: `All (${active.length})` },
            { id: 'pending',     label: `Pending (${active.filter(o => o.status === 'pending').length})` },
            { id: 'in-progress', label: `In Progress (${active.filter(o => o.status === 'in-progress').length})` },
            { id: 'urgent',      label: `🔴 Urgent (${active.filter(o => o.urgent).length})` },
          ].map(t => (
            <button key={t.id} className={`filter-tab ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ── ADDITIONS PANEL ── */}
        {active.some(o => o.modified) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#F59E0B', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block' }}>⚡</span>
              ADDITIONS — NEW ITEMS ONLY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
              {active.filter(o => o.modified).map(order => {
                const newFoodItems = order.items.filter(i =>
                  i.isNew && getItemDestination(i.id, menu) === 'kitchen'
                )
                if (newFoodItems.length === 0) return null
                return (
                  <div key={order.id} style={{ background: '#F59E0B11', border: '2px solid #F59E0B55', borderRadius: 12, padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F59E0B' }}>T{order.table}</span>
                        {order.modifiedAt && (
                          <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                            {new Date(order.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <button onClick={() => acknowledgeOrder(order.id)}
                        style={{ border: 'none', background: '#F59E0B', color: '#000', borderRadius: 6, padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700 }}>
                        ✓ Ack
                      </button>
                    </div>
                    {newFoodItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#F59E0B', color: '#000', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                            {item._addedQty ? `+${item._addedQty}` : 'NEW'}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F59E0B' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>×{item.qty}</span>
                      </div>
                    ))}
                    {newFoodItems.filter(i => i.note).map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.62rem', color: '#FCD34D', marginTop: '0.2rem' }}>📝 {item.name}: {item.note}</div>
                    ))}
                  </div>
                )
              })}
            </div>
            <div style={{ borderBottom: '1px solid #1E1E2E', marginTop: '1.2rem' }} />
          </div>
        )}


        {/* Tickets */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#334155', fontSize: '0.85rem' }}>No active food orders</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {sorted.map(order => {
              const sc       = STATUS_COLOR[order.status] || '#F59E0B'
              const hasNew   = order.modified
              const courses  = order.courses || {}
              const foodAllergens = [...new Set(
                order.items
                  .filter(i => getItemDestination(i.id, menu) === 'kitchen')
                  .flatMap(i => i.allergens && i.allergens !== 'None' ? i.allergens.split(', ') : [])
              )]

              return (
                <div key={order.id} className={`ticket ${order.urgent ? 'urgent' : ''} ${hasNew ? 'modified' : ''}`}>

                  {/* Modified banner */}
                  {hasNew && (
                    <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B55', borderRadius: 8, padding: '0.4rem 0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B' }}>⚡ UPDATED</span>
                        {order.modifiedAt && (
                          <span style={{ fontSize: '0.62rem', color: '#94A3B8' }}>
                            {new Date(order.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <button onClick={() => acknowledgeOrder(order.id)}
                        style={{ border: 'none', background: '#F59E0B', color: '#000', borderRadius: 6, padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700 }}>
                        ✓ Ack
                      </button>
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>T{order.table}</span>
                      {order.urgent && <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700 }}>🔴</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {order.placedAt && <Ticker placedAt={order.placedAt} />}
                      <button onClick={() => toggleUrgent(order.id)}
                        style={{ border: `1px solid ${order.urgent ? '#EF444444' : '#1E1E2E'}`, background: order.urgent ? '#EF444422' : 'transparent', color: order.urgent ? '#EF4444' : '#334155', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.6rem', fontWeight: 700 }}>
                        🔴
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: sc, background: sc + '22', border: `1px solid ${sc}44`, borderRadius: 5, padding: '2px 8px', display: 'inline-block' }}>
                    {order.status.toUpperCase().replace('-', ' ')}
                  </div>

                  {/* Allergens — food only */}
                  {foodAllergens.length > 0 && (
                    <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B55', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.65rem', color: '#F59E0B', fontWeight: 700 }}>
                      ⚠ ALLERGENS: {foodAllergens.join(' · ')}
                    </div>
                  )}

                  {/* Course sections — food only */}
                  {['starters', 'mains', 'desserts'].map(course => {
                    const cc          = COURSE_CONFIG[course]
                    const courseItems = getFoodItems(order, course)
                    if (courseItems.length === 0) return null
                    const courseStatus = courses[course] || 'waiting'
                    const isFired      = courseStatus === 'fired'

                    return (
                      <div key={course} className={`course-section ${isFired ? 'fired' : 'waiting'}`}
                        style={isFired ? { borderColor: cc.color + '55', background: cc.color + '0A' } : {}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.7rem' }}>{cc.icon}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isFired ? cc.color : '#334155', letterSpacing: '0.08em' }}>
                              {cc.label.toUpperCase()}
                            </span>
                          </div>
                          {isFired ? (
                            <span style={{ fontSize: '0.58rem', color: cc.color, background: cc.color + '22', borderRadius: 4, padding: '1px 6px', border: `1px solid ${cc.color}33` }}>🔥 FIRED</span>
                          ) : (
                            <span style={{ fontSize: '0.58rem', color: '#334155', background: '#1E1E2E', borderRadius: 4, padding: '1px 6px' }}>⏳ WAITING</span>
                          )}
                        </div>
                        {courseItems.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '0.35rem', opacity: isFired ? 1 : 0.45 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {item.isNew && isFired && (
                                  <span style={{ fontSize: '0.55rem', fontWeight: 700, background: '#F59E0B', color: '#000', borderRadius: 3, padding: '1px 5px' }}>
                                    {item._addedQty ? `+${item._addedQty}` : 'NEW'}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.78rem', color: item.isNew && isFired ? '#F59E0B' : '#CBD5E1', fontWeight: item.isNew ? 700 : 600 }}>
                                  {item.name}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>×{item.qty}</span>
                            </div>
                            {item.modifiers?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                                {item.modifiers.map((m, i) => (
                                  <span key={i} style={{ fontSize: '0.62rem', color: '#8B5CF6', background: '#8B5CF611', border: '1px solid #8B5CF633', borderRadius: 4, padding: '1px 6px' }}>
                                    {m.optionName}{m.price > 0 ? ` +€${m.price.toFixed(2)}` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.allergens && item.allergens !== 'None' && (
                              <div style={{ fontSize: '0.62rem', color: '#F59E0B', marginTop: '0.1rem' }}>⚠ {item.allergens}</div>
                            )}
                            {item.note && (
                              <div style={{ fontSize: '0.62rem', color: '#FCD34D', background: '#FCD34D11', border: '1px solid #FCD34D33', borderRadius: 4, padding: '1px 6px', marginTop: '0.15rem', display: 'inline-block' }}>
                                📝 {item.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {order.placedBy && <div style={{ fontSize: '0.6rem', color: '#334155' }}>by {order.placedBy}</div>}

                  {STATUS_NEXT[order.status] && (
                    <button className="kds-btn" style={{ background: sc + '22', color: sc, border: `1px solid ${sc}44`, width: '100%', marginTop: '0.2rem' }}
                      onClick={() => advanceOrderStatus(order.id)}>
                      {STATUS_LABEL[order.status]} →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Ready */}
        {ready.length > 0 && (
          <>
            <div style={{ fontSize: '0.6rem', color: '#334155', letterSpacing: '0.15em', marginBottom: '0.8rem' }}>READY — WAITING FOR COLLECTION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem', opacity: 0.5 }}>
              {ready.map(order => (
                <div key={order.id} style={{ background: '#13131A', border: '1px solid #10B98133', borderRadius: 12, padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10B981' }}>T{order.table}</div>
                    <div style={{ fontSize: '0.65rem', color: '#334155' }}>{order.items.filter(i => getItemDestination(i.id, menu) === 'kitchen').length} food items</div>
                  </div>
                  {order.placedAt && <Ticker placedAt={order.placedAt} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}