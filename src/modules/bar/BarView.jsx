import { useState, useEffect } from 'react'
import { usePOS, getItemDestination } from '../../context/POSContext'

function Ticker({ placedAt }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [placedAt])
  const color = elapsed >= 10 ? '#EF4444' : elapsed >= 5 ? '#F59E0B' : '#10B981'
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, color, background: color + '22', border: `1px solid ${color}44`, borderRadius: 5, padding: '1px 7px' }}>
      {elapsed}m
    </span>
  )
}

export default function BarView() {
  const { orders, menu, tables } = usePOS()

  const barOrders = orders.filter(o =>
    o.items.some(i => getItemDestination(i.id, menu) === 'bar') &&
    o.barStatus !== 'none'
  )

  const sorted = [...barOrders].sort((a, b) => new Date(a.placedAt || 0) - new Date(b.placedAt || 0))

  const getDrinkItems = (order) =>
    order.items.filter(i => getItemDestination(i.id, menu) === 'bar')

  const hasAdditions = barOrders.some(o => o.items.some(i => i.isNew && getItemDestination(i.id, menu) === 'bar'))

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '1.5rem' }}>
      <style>{`
        .bar-btn{border:none;border-radius:8px;padding:0.45rem 0.9rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .bar-btn:hover{opacity:0.85}
        .ticket{background:#13131A;border:1px solid #1E1E2E;border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:0.6rem}
        .ticket.new-drinks{border-color:#3B82F6 !important;box-shadow:0 0 0 1px #3B82F633}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slidein{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>BAR</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Bar Display 🍺</h1>
          </div>
          <div style={{ background: '#3B82F622', border: '1px solid #3B82F644', borderRadius: 8, padding: '0.35rem 0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>{barOrders.length}</div>
            <div style={{ fontSize: '0.55rem', color: '#3B82F6', letterSpacing: '0.08em' }}>ACTIVE</div>
          </div>
        </div>

        {/* Additions panel */}
        {hasAdditions && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#3B82F6', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block' }}>⚡</span>
              ADDITIONS — NEW DRINKS ONLY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              {barOrders.filter(o => o.items.some(i => i.isNew && getItemDestination(i.id, menu) === 'bar')).map(order => {
                const newDrinks = order.items.filter(i => i.isNew && getItemDestination(i.id, menu) === 'bar')
                return (
                  <div key={order.id} style={{ background: '#3B82F611', border: '2px solid #3B82F655', borderRadius: 12, padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#3B82F6' }}>T{order.table}</span>
                      {order.modifiedAt && (
                        <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                          {new Date(order.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {newDrinks.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#3B82F6', color: '#fff', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                            {item._addedQty ? `+${item._addedQty}` : 'NEW'}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3B82F6' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>×{item.qty}</span>
                      </div>
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
          <div style={{ textAlign: 'center', padding: '4rem', color: '#334155' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍺</div>
            <div style={{ fontSize: '0.85rem' }}>No active drink orders</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {sorted.map(order => {
              const drinkItems   = getDrinkItems(order)
              const hasNewDrinks = drinkItems.some(i => i.isNew)

              return (
                <div key={order.id} className={`ticket ${hasNewDrinks ? 'new-drinks' : ''}`}
                  style={{ animation: 'slidein 0.2s ease' }}>

                  {hasNewDrinks && (
                    <div style={{ background: '#3B82F622', border: '1px solid #3B82F644', borderRadius: 7, padding: '0.35rem 0.6rem', fontSize: '0.68rem', color: '#3B82F6', fontWeight: 700 }}>
                      ⚡ Updated — new drinks added
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#3B82F622', border: '2px solid #3B82F644', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3B82F6' }}>T{order.table}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{order.placedBy}</div>
                        <div style={{ fontSize: '0.62rem', color: '#334155' }}>{drinkItems.reduce((s, i) => s + i.qty, 0)} drink{drinkItems.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}</div>
                        {order.covers > 0 && <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>👥 {order.covers} covers</div>}
                        {(() => { const tbl = tables?.find(t => t.id === order.table); return tbl?.note ? <div style={{ fontSize: '0.7rem' }}>{tbl.note.startsWith('🎂') ? '🎂' : tbl.note.startsWith('💍') ? '💍' : tbl.note.startsWith('🪟') ? '🪟' : tbl.note.startsWith('👑') ? '👑' : tbl.note.startsWith('🍼') ? '🍼' : tbl.note.startsWith('♿') ? '♿' : tbl.note.startsWith('🎉') ? '🎉' : '📝'} {tbl.note.replace(/^\S+\s/, '')}</div> : null })()}
                      </div>
                    </div>
                    {order.placedAt && <Ticker placedAt={order.placedAt} />}
                  </div>

                  <div style={{ background: '#0D0D14', borderRadius: 8, padding: '0.6rem 0.7rem' }}>
                    {drinkItems.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: idx < drinkItems.length - 1 ? '0.5rem' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {item.isNew && (
                              <span style={{ fontSize: '0.55rem', fontWeight: 700, background: '#3B82F6', color: '#fff', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                                {item._addedQty ? `+${item._addedQty}` : 'NEW'}
                              </span>
                            )}
                            <span style={{ fontSize: '0.85rem', color: item.isNew ? '#3B82F6' : '#CBD5E1', fontWeight: item.isNew ? 700 : 600 }}>
                              {item.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748B', background: '#13131A', borderRadius: 6, padding: '0.1rem 0.5rem', minWidth: 28, textAlign: 'center' }}>
                            ×{item.qty}
                          </span>
                        </div>
                        {item.modifiers?.length > 0 && (
                          <div style={{ fontSize: '0.62rem', color: '#8B5CF6', marginTop: '0.15rem' }}>
                            {item.modifiers.map(m => m.optionName).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}