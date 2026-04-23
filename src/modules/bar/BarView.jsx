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
  const { orders, menu, tables, updateBarStatus, acknowledgeOrder, tabs, openTab, closeTab, updateTab, openPayment } = usePOS()
const [showNewTab, setShowNewTab] = useState(false)
const [tabName, setTabName]       = useState('')
const [activeTab, setActiveTab]   = useState(null)

  const barOrders = orders.filter(o =>
    o.items.some(i => getItemDestination(i.id, menu) === 'bar') &&
    o.barStatus !== 'none' &&
    o.barStatus !== 'done'
  )

  const sorted = [...barOrders].sort((a, b) => new Date(a.placedAt || 0) - new Date(b.placedAt || 0))

  const pending  = barOrders.filter(o => o.barStatus === 'pending')
  const making   = barOrders.filter(o => o.barStatus === 'making')
  const barReady = barOrders.filter(o => o.barStatus === 'ready')

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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
  {[
    { label: 'PENDING', color: '#F59E0B', count: pending.length },
    { label: 'MAKING',  color: '#3B82F6', count: making.length },
    { label: 'READY',   color: '#10B981', count: barReady.length },
  ].map(s => (
    <div key={s.label} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '0.35rem 0.8rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.count}</div>
      <div style={{ fontSize: '0.55rem', color: s.color, letterSpacing: '0.08em' }}>{s.label}</div>
    </div>
  ))}
</div>
        </div>

        {/* Tabs */}
{tabs.length > 0 && (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ fontSize: '0.6rem', color: '#F97316', letterSpacing: '0.15em', marginBottom: '0.6rem', fontWeight: 700 }}>🗂 OPEN TABS</div>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {tabs.map(tab => (
        <div key={tab.id} style={{ background: '#13131A', border: '1px solid #F9731644', borderRadius: 10, padding: '0.7rem 1rem', minWidth: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>{tab.name}</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>€{tab.total.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '0.62rem', color: '#475569', marginBottom: '0.5rem' }}>{tab.items.reduce((s, i) => s + i.qty, 0)} drinks · Round {tab.round}</div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button className="bar-btn" style={{ flex: 1, background: '#3B82F622', color: '#3B82F6', border: '1px solid #3B82F644', padding: '0.3rem' }}
              onClick={() => setActiveTab(tab)}>
              + Add
            </button>
            <button className="bar-btn" style={{ flex: 1, background: '#10B98122', color: '#10B981', border: '1px solid #10B98144', padding: '0.3rem' }}
              onClick={() => closeTab(tab.id)}>
              Pay
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* New tab button */}
<div style={{ marginBottom: '1.2rem' }}>
  {showNewTab ? (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input value={tabName} onChange={e => setTabName(e.target.value)}
        placeholder="Customer name or tab number..."
        onKeyDown={e => { if (e.key === 'Enter' && tabName.trim()) { openTab(tabName.trim()); setTabName(''); setShowNewTab(false) }}}
        autoFocus
        style={{ flex: 1, background: '#0D0D14', border: '1px solid #F97316', borderRadius: 8, padding: '0.5rem 0.8rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none' }} />
      <button className="bar-btn" style={{ background: '#F97316', color: '#000' }}
        onClick={() => { if (tabName.trim()) { openTab(tabName.trim()); setTabName(''); setShowNewTab(false) }}}>
        Open Tab
      </button>
      <button className="bar-btn" style={{ background: '#13131A', color: '#94A3B8', border: '1px solid #1E1E2E' }}
        onClick={() => { setShowNewTab(false); setTabName('') }}>
        Cancel
      </button>
    </div>
  ) : (
    <button className="bar-btn" style={{ background: '#F9731622', color: '#F97316', border: '1px solid #F9731644' }}
      onClick={() => setShowNewTab(true)}>
      + Open Tab
    </button>
  )}
</div>

{/* Tab drink picker */}
{activeTab && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
    <div style={{ background: '#0F0F17', border: '1px solid #F9731644', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 400, fontFamily: "'Courier New', monospace", color: '#E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em' }}>ADD TO TAB</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F97316' }}>{activeTab.name}</div>
        </div>
        <button onClick={() => setActiveTab(null)}
          style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem' }}>✕</button>
      </div>

      {Object.entries(menu).filter(([cat]) => {
        const c = cat.toLowerCase()
        return c.includes('drink') || c.includes('bar') || c.includes('beverage') || c.includes('wine') || c.includes('beer') || c.includes('cocktail') || c.includes('soft')
      }).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{cat.toUpperCase()}</div>
          {items.filter(i => i.available).map(item => {
            const inTab = activeTab.items.find(i => i.id === item.id)
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.7rem', background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, marginBottom: '0.3rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#F97316' }}>€{item.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {inTab && (
                    <>
                      <button onClick={() => {
                        const updatedItems = inTab.qty === 1
                          ? activeTab.items.filter(i => i.id !== item.id)
                          : activeTab.items.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i)
                        const updated = { ...activeTab, items: updatedItems, total: updatedItems.reduce((s, i) => s + i.price * i.qty, 0) }
                        setActiveTab(updated)
                        updateTab(updated)
                      }} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #3B3B52', background: '#13131A', color: '#E2E8F0', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{inTab.qty}</span>
                    </>
                  )}
                  <button onClick={() => {
                    const updatedItems = inTab
                      ? activeTab.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                      : [...activeTab.items, { ...item, qty: 1 }]
                    const updated = { ...activeTab, items: updatedItems, total: updatedItems.reduce((s, i) => s + i.price * i.qty, 0) }
                    setActiveTab(updated)
                    updateTab(updated)
                  }} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #3B3B52', background: '#13131A', color: '#E2E8F0', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {activeTab.items.length > 0 && (
        <div style={{ borderTop: '1px solid #1E1E2E', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tab Total</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>€{activeTab.total.toFixed(2)}</span>
          </div>
          <button onClick={() => setActiveTab(null)}
            style={{ width: '100%', border: 'none', background: '#F97316', color: '#000', borderRadius: 8, padding: '0.65rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '0.8rem' }}>
            ✓ Done
          </button>
        </div>
      )}
    </div>
  </div>
)}

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
                  style={{ animation: 'slidein 0.2s ease', borderColor: order.barStatus === 'ready' ? '#10B98166' : order.barStatus === 'making' ? '#3B82F666' : '#1E1E2E' }}>

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
                        {order.round > 1 && <div style={{ fontSize: '0.62rem', color: '#F97316', fontWeight: 700 }}>🔄 Round {order.round}</div>}
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
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {order.barStatus === 'pending' && (
                      <button className="bar-btn" style={{ flex: 1, background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44' }}
                        onClick={() => updateBarStatus(order.id, 'making')}>
                        🍹 Start Making
                      </button>
                    )}
                    {order.barStatus === 'making' && (
                      <button className="bar-btn" style={{ flex: 1, background: '#10B98122', color: '#10B981', border: '1px solid #10B98144' }}
                        onClick={() => updateBarStatus(order.id, 'ready')}>
                        ✓ Ready
                      </button>
                    )}
                    {order.barStatus === 'ready' && (
                      <button className="bar-btn" style={{ flex: 1, background: '#10B981', color: '#000', border: 'none', animation: 'pulse 1.5s infinite' }}
                        onClick={() => { updateBarStatus(order.id, 'done'); acknowledgeOrder(order.id) }}>
                        ✓ Served — Clear
                      </button>
                    )}
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