import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

export default function OrderHistoryView() {
  const { orderHistory, settings } = usePOS()
  const { isMobile } = useBreakpoint()

  const [search,     setSearch]     = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [expanded,   setExpanded]   = useState(null)

  const filtered = orderHistory.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `t${o.table}`.includes(q) ||
      (o.placedBy || '').toLowerCase().includes(q) ||
      (o.items || []).some(i => i.name.toLowerCase().includes(q))
    const matchFrom = !dateFrom || o.closedAt >= dateFrom
    const matchTo   = !dateTo   || o.closedAt <= dateTo + 'T23:59:59'
    return matchSearch && matchFrom && matchTo
  }).sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.5rem 0.7rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.75rem;outline:none;box-sizing:border-box}
        .input:focus{border-color:#F97316}
        .order-row{background:#13131A;border:1px solid #1E1E2E;border-radius:10px;padding:0.8rem 1rem;margin-bottom:0.5rem;cursor:pointer;transition:border-color 0.15s}
        .order-row:hover{border-color:#3B3B52}
        .order-row.open{border-color:#F9731644}
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>RECORDS</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Order History</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F97316' }}>{filtered.length}</div>
              <div style={{ fontSize: '0.58rem', color: '#475569' }}>ORDERS</div>
            </div>
            <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>€{totalRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.58rem', color: '#475569' }}>REVENUE</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ flex: '1 1 200px' }} placeholder="Search table, staff, item..." value={search} onChange={e => setSearch(e.target.value)} />
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ color: '#475569', fontSize: '0.75rem' }}>→</span>
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
              style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', fontWeight: 700 }}>
              Clear
            </button>
          )}
        </div>

        {/* Orders */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#334155', fontSize: '0.85rem' }}>No orders found</div>
        ) : filtered.map(order => {
          const isOpen = expanded === order.id
          const payMethod = order.payment?.payments?.map(p => p.method).join(', ') || '—'

          return (
            <div key={order.id} className={`order-row ${isOpen ? 'open' : ''}`} onClick={() => setExpanded(isOpen ? null : order.id)}>

              {/* Summary row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F9731622', border: '1px solid #F9731644', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F97316' }}>T{order.table}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1' }}>
                      {order.placedBy || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.1rem' }}>
                      {order.closedAt ? new Date(order.closedAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {' · '}
                      {order.closedAt ? new Date(order.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {' · '}{order.items?.length || 0} items
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(2)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#334155' }}>{payMethod}</div>
                  </div>
                  <span style={{ color: '#334155', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded items */}
              {isOpen && (
                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #1E1E2E' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem' }}>

                    {/* Items list */}
                    <div>
                      <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>ITEMS</div>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.name} ×{item.qty}</span>
                          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>€{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment breakdown */}
                    <div>
                      <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PAYMENT</div>
                      {order.payment?.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Discount</span>
                          <span style={{ fontSize: '0.72rem', color: '#10B981' }}>-€{order.payment.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.payment?.serviceChargeAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Service Charge</span>
                          <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>€{order.payment.serviceChargeAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.payment?.tip > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>Tip</span>
                          <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>€{order.payment.tip.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1E1E2E', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(2)}</span>
                      </div>
                      {order.payment?.payments?.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#475569' }}>{p.method}{p.note ? ` (${p.note})` : ''}</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>€{parseFloat(p.amount).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.payment?.change > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#F59E0B' }}>Change given</span>
                          <span style={{ fontSize: '0.68rem', color: '#F59E0B' }}>€{order.payment.change.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}