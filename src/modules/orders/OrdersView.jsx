import { useState } from 'react'
import { usePOS } from '../../context/POSContext'

const STATUS_COLORS = {
  pending:       { color: '#F59E0B', bg: '#F59E0B22', label: 'Pending' },
  ready:         { color: '#10B981', bg: '#10B98122', label: 'Ready' },
  'in-progress': { color: '#3B82F6', bg: '#3B82F622', label: 'In Progress' },
}

export default function OrdersView() {
  const { orders, closeOrder, toggleOrderStatus, openPayment, updateOrder, customers } = usePOS()
  const [activeOrder, setActiveOrder] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85;transform:translateY(-1px)}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
        .btn-blue{background:#3B82F622;color:#3B82F6;border:1px solid #3B82F644}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .order-card{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1rem;transition:all 0.15s;cursor:pointer}
        .order-card:hover{border-color:#3B3B52}
        .order-card.active{border-color:#F97316}
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>ACTIVE</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Orders</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'PENDING',     color: '#F59E0B', count: orders.filter(o => o.status === 'pending').length },
              { label: 'IN PROGRESS', color: '#3B82F6', count: orders.filter(o => o.status === 'in-progress').length },
              { label: 'READY',       color: '#10B981', count: orders.filter(o => o.status === 'ready').length },
            ].map(s => (
              <div key={s.label} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '0.4rem 0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '0.55rem', color: s.color, letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders grid */}
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#334155', fontSize: '0.85rem' }}>
            No active orders — go to Tables to place one
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {orders.map(order => {
              const s        = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const isActive = activeOrder === order.id
              const allAllergens = [...new Set(order.items.flatMap(i =>
                (i.allergens && i.allergens !== 'None') ? i.allergens.split(', ') : []
              ))]
              const customer = customers.find(c => c.id === order.customerId)

              return (
                <div key={order.id} className={`order-card ${isActive ? 'active' : ''}`} onClick={() => setActiveOrder(isActive ? null : order.id)}>

                  {/* Card header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Table {order.table}</div>
                    <div style={{ fontSize: '0.65rem', background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 6, border: `1px solid ${s.color}44` }}>
                      {s.label.toUpperCase()}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '0.4rem' }}>
                    {order.time} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    {order.placedBy && <span style={{ color: '#334155' }}> · {order.placedBy}</span>}
                  </div>

                  {/* Customer */}
                  {customer && (
                    <div style={{ fontSize: '0.65rem', color: '#F97316', background: '#F9731611', border: '1px solid #F9731633', borderRadius: 5, padding: '2px 7px', marginBottom: '0.4rem', display: 'inline-block' }}>
                      🏆 {customer.name}
                    </div>
                  )}

                  {/* Allergens */}
                  {allAllergens.length > 0 && (
                    <div style={{ fontSize: '0.62rem', color: '#F59E0B', background: '#F59E0B11', border: '1px solid #F59E0B22', borderRadius: 5, padding: '2px 7px', marginBottom: '0.4rem', display: 'inline-block' }}>
                      ⚠ {allAllergens.join(' · ')}
                    </div>
                  )}

                  {/* Urgent flag */}
                  {order.urgent && (
                    <div style={{ fontSize: '0.62rem', color: '#EF4444', fontWeight: 700, marginBottom: '0.4rem' }}>🔴 URGENT</div>
                  )}

                  {/* Expanded items */}
                  {isActive && (
                    <div style={{ borderTop: '1px solid #1E1E2E', paddingTop: '0.6rem', marginBottom: '0.6rem' }}>
                      {order.items.map((i, idx) => (
                        <div key={idx} style={{ marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{i.name} ×{i.qty}</span>
                            <span style={{ fontSize: '0.73rem', color: '#CBD5E1' }}>€{((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</span>
                          </div>
                          {i.modifiers?.length > 0 && (
                            <div style={{ fontSize: '0.6rem', color: '#8B5CF6', marginTop: '0.1rem' }}>
                              {i.modifiers.map(m => `${m.optionName}${m.price > 0 ? ` +€${m.price.toFixed(2)}` : ''}`).join(' · ')}
                            </div>
                          )}
                          {i.allergens && i.allergens !== 'None' && (
                            <div style={{ fontSize: '0.6rem', color: '#F59E0B' }}>⚠ {i.allergens}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(2)}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleOrderStatus(order.id)}>
                        {order.status === 'pending' ? 'Mark Ready' : 'Mark Pending'}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => openPayment(order.id)}>💳 Pay</button>
                      <button className="btn btn-danger btn-sm" onClick={() => closeOrder(order.id)}>✕</button>
                    </div>
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