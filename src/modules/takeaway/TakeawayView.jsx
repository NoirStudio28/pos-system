import { useState } from 'react'
import { usePOS, getItemCourse, getItemDestination } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const EMPTY_ORDER = { name: '', phone: '', collectionTime: '', note: '' }

function TakeawayItemPicker({ onClose, onPlace }) {
  const { menu, settings } = usePOS()
  const { isMobile } = useBreakpoint()
  const [activeCategory, setActiveCategory] = useState(Object.keys(menu)[0])
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_ORDER)
  const [activeModifierGroup, setActiveModifierGroup] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  const total = items.reduce((s, i) => s + (i.price + (i.modifierTotal || 0)) * i.qty, 0)

  const addItem = (item) => {
    setItems(prev => {
      const key = item.id + '[]'
      const exists = prev.find(i => i._key === key)
      if (exists) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1, modifiers: [], modifierTotal: 0, note: '', _key: key + Date.now() }]
    })
  }

  const removeItem = (key) => {
    setItems(prev => {
      const exists = prev.find(i => i._key === key)
      if (!exists) return prev
      if (exists.qty === 1) return prev.filter(i => i._key !== key)
      return prev.map(i => i._key === key ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  const handlePlace = () => {
    if (!form.name.trim() || items.length === 0) return
    onPlace({ ...form, items, total })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A0F', zIndex: 900, display: 'flex', flexDirection: 'column', fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
      <style>{`
        .ip-btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700}
        .ip-primary{background:#F97316;color:#000}
        .ip-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .ip-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .ip-tab{padding:0.4rem 0.9rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700}
        .ip-tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .ip-item{display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0.8rem;border-radius:8px;background:#0D0D14;border:1px solid #1E1E2E;margin-bottom:0.4rem}
        .qty-btn{width:26px;height:26px;border-radius:50%;border:1px solid #3B3B52;background:#13131A;color:#E2E8F0;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center}
        .qty-btn:hover{background:#F97316;border-color:#F97316;color:#000}
        .ip-input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.4rem 0.6rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.75rem;outline:none;box-sizing:border-box}
      `}</style>

      {/* Header */}
      <div style={{ background: '#13131A', borderBottom: '1px solid #1E1E2E', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button className="ip-btn ip-ghost ip-sm" onClick={onClose}>✕ Exit</button>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em' }}>NEW TAKEAWAY ORDER</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>🥡 Takeaway</div>
          </div>
        </div>
        <button className="ip-btn ip-primary" disabled={!form.name.trim() || items.length === 0}
          style={{ opacity: form.name.trim() && items.length > 0 ? 1 : 0.4 }}
          onClick={handlePlace}>
          ✓ Place Order
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', overflow: 'hidden' }}>
        {/* Left — menu */}
        <div style={{ overflow: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {Object.keys(menu).map(cat => (
              <button key={cat} className={`ip-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
          {(menu[activeCategory] || []).map(item => {
            const inOrder = items.filter(i => i.id === item.id)
            const totalQty = inOrder.reduce((s, i) => s + i.qty, 0)
            return (
              <div className="ip-item" key={item.id} style={{ opacity: item.available ? 1 : 0.45, pointerEvents: item.available ? 'auto' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#F97316' }}>€{item.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {totalQty > 0 && (
                    <>
                      <button className="qty-btn" onClick={() => removeItem(items.find(i => i.id === item.id)?._key)}>−</button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{totalQty}</span>
                    </>
                  )}
                  <button className="qty-btn" onClick={() => addItem(item)}>+</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right — order details */}
        <div style={{ borderLeft: isMobile ? 'none' : '1px solid #1E1E2E', borderTop: isMobile ? '1px solid #1E1E2E' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0A0A0F' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #1E1E2E', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em' }}>CUSTOMER & ORDER</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem' }}>
            {/* Customer info */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#F97316', letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 700 }}>CUSTOMER</div>
              <input className="ip-input" style={{ width: '100%', marginBottom: '0.4rem' }} placeholder="Customer name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <input className="ip-input" style={{ width: '100%', marginBottom: '0.4rem' }} placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="ip-input" style={{ width: '100%', marginBottom: '0.4rem' }} type="time" value={form.collectionTime} onChange={e => setForm(p => ({ ...p, collectionTime: e.target.value }))} />
              <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '0.4rem' }}>Collection time</div>
              <input className="ip-input" style={{ width: '100%' }} placeholder="Order note..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
            </div>

            {/* Items */}
            <div style={{ fontSize: '0.6rem', color: '#F97316', letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 700 }}>ITEMS</div>
            {items.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#334155', textAlign: 'center', padding: '1rem 0' }}>No items yet</div>
            ) : items.map(i => (
              <div key={i._key} style={{ marginBottom: '0.4rem', padding: '0.5rem', background: '#0D0D14', borderRadius: 8, border: '1px solid #1E1E2E', cursor: 'pointer' }} onClick={() => setEditingItem(i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{i.name} ×{i.qty}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>€{((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</span>
                    <button className="qty-btn" style={{ width: 20, height: 20, fontSize: '0.7rem' }} onClick={e => { e.stopPropagation(); removeItem(i._key) }}>−</button>
                  </div>
                </div>
                {i.note && <div style={{ fontSize: '0.6rem', color: '#F59E0B', marginTop: '0.1rem' }}>📝 {i.note}</div>}
              </div>
            ))}
          </div>
          <div style={{ padding: '0.8rem', borderTop: '1px solid #1E1E2E', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TakeawayView() {
  const { orders, placeOrder, closeOrder, openPayment, currentUser, menu, advanceOrderStatus } = usePOS()
  const { isMobile } = useBreakpoint()
  const [showPicker, setShowPicker] = useState(false)
  const [counter, setCounter] = useState(1)

  const takeawayOrders = orders.filter(o => o.isTakeaway)

  const handlePlace = ({ name, phone, collectionTime, note, items, total }) => {
    const orderNum = String(counter).padStart(3, '0')
    placeOrder({
      id: Date.now(),
      table: null,
      isTakeaway: true,
      takeawayName: name,
      takeawayPhone: phone,
      collectionTime,
      note,
      orderNum,
      items,
      total,
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    setCounter(c => c + 1)
  }

  const STATUS_COLOR = { pending: '#F59E0B', 'in-progress': '#3B82F6', ready: '#10B981' }
  const STATUS_LABEL = { pending: 'Pending', 'in-progress': 'In Progress', ready: '✓ Ready' }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '1.5rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      {showPicker && <TakeawayItemPicker onClose={() => setShowPicker(false)} onPlace={handlePlace} />}

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>TAKEAWAY</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🥡 Takeaway Orders</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[
              { label: 'PENDING',     color: '#F59E0B', count: takeawayOrders.filter(o => o.status === 'pending').length },
              { label: 'IN PROGRESS', color: '#3B82F6', count: takeawayOrders.filter(o => o.status === 'in-progress').length },
              { label: 'READY',       color: '#10B981', count: takeawayOrders.filter(o => o.status === 'ready').length },
            ].map(s => (
              <div key={s.label} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '0.35rem 0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '0.55rem', color: s.color, letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
            <button className="btn btn-primary" onClick={() => setShowPicker(true)}>+ New Order</button>
          </div>
        </div>

        {takeawayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#334155' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥡</div>
            <div style={{ fontSize: '0.85rem' }}>No active takeaway orders</div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowPicker(true)}>+ New Order</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {takeawayOrders.map(order => {
              const sc = STATUS_COLOR[order.status] || '#F59E0B'
              return (
                <div key={order.id} style={{ background: '#13131A', border: `1px solid ${order.status === 'ready' ? '#10B98166' : '#1E1E2E'}`, borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: order.status === 'ready' ? 'pulse 2s infinite' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#475569', background: '#1E1E2E', borderRadius: 4, padding: '1px 6px' }}>#{order.orderNum}</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>{order.takeawayName}</span>
                      </div>
                      {order.takeawayPhone && <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.1rem' }}>📞 {order.takeawayPhone}</div>}
                      {order.collectionTime && <div style={{ fontSize: '0.65rem', color: '#F97316', marginTop: '0.1rem' }}>🕐 Collect: {order.collectionTime}</div>}
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: sc, background: sc + '22', border: `1px solid ${sc}44`, borderRadius: 5, padding: '2px 8px' }}>{STATUS_LABEL[order.status]}</span>
                  </div>

                  {order.note && <div style={{ fontSize: '0.65rem', color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B33', borderRadius: 6, padding: '0.3rem 0.6rem' }}>📝 {order.note}</div>}

                  <div style={{ background: '#0D0D14', borderRadius: 8, padding: '0.6rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.name} ×{item.qty}</span>
                        <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>€{((item.price + (item.modifierTotal || 0)) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '0.4rem', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Total</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {order.status === 'pending' && (
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44' }}
                        onClick={() => advanceOrderStatus(order.id)}>🍳 Start</button>
                    )}
                    {order.status === 'in-progress' && (
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1, background: '#10B98122', color: '#10B981', border: '1px solid #10B98144' }}
                        onClick={() => advanceOrderStatus(order.id)}>✓ Ready</button>
                    )}
                    {order.status === 'ready' && (
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={() => openPayment(order.id)}>💳 Pay & Close</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openPayment(order.id)}>💳</button>
                    <button className="btn btn-sm" style={{ background: '#EF444411', color: '#EF4444', border: '1px solid #EF444433' }}
                      onClick={() => closeOrder(order.id)}>✕</button>
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