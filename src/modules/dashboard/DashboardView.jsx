import { usePOS, ROLE_CONFIG } from '../../context/POSContext'
import { useNavigate } from 'react-router-dom'
import useBreakpoint from '../../hooks/useBreakpoint'

function StatCard({ label, value, sub, color = '#F97316', onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '1rem 1.2rem', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = '#3B3B52')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = '#1E1E2E')}
    >
      <div style={{ fontSize: '0.58rem', letterSpacing: '0.12em', color: '#475569', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', fontWeight: 700 }}>{title}</div>
      {action && <button onClick={onAction} style={{ border: 'none', background: 'none', color: '#F97316', fontSize: '0.65rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{action} →</button>}
    </div>
  )
}

export default function DashboardView() {
  const { tables, orders, orderHistory, stock, staff, bookings, currentUser, isClockedIn } = usePOS()
  const navigate     = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()

  const now      = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const todayHistory = orderHistory.filter(o => o.closedAt?.startsWith(todayStr))
  const todayRevenue = todayHistory.reduce((s, o) => s + o.total, 0)

  const pending    = orders.filter(o => o.status === 'pending')
  const inProgress = orders.filter(o => o.status === 'in-progress')
  const ready      = orders.filter(o => o.status === 'ready')

  const freeTables     = tables.filter(t => t.status === 'free').length
  const occupiedTables = tables.filter(t => t.status === 'occupied').length
  const reservedTables = tables.filter(t => t.status === 'reserved').length

  const lowStock   = stock.filter(s => s.quantity <= s.minThreshold).sort((a, b) => a.quantity - b.quantity)
  const clockedIn  = staff.filter(s => isClockedIn(s.id))

  const todayBookings = bookings
    .filter(b => b.date === todayStr && b.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))

  const itemSales = {}
  todayHistory.forEach(o => o.items.forEach(i => { itemSales[i.name] = (itemSales[i.name] || 0) + i.qty }))
  const topItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const recentPayments = [...orderHistory].sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt)).slice(0, 5)

  const TABLE_STATUS_COLOR = { free: '#10B981', occupied: '#F97316', reserved: '#3B82F6' }

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const col2 = isMobile ? '1fr' : '1fr 1fr'
  const col3 = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr'
  const col4 = isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr'

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .dash-card{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1rem 1.2rem}
        .booking-row{display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid #0D0D14}
        .booking-row:last-child{border-bottom:none}
        .staff-chip{display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.7rem;background:#0D0D14;border:1px solid #1E1E2E;border-radius:8px}
        .payment-row{display:flex;justify-content:space-between;align-items:center;padding:0.45rem 0;border-bottom:1px solid #0D0D14}
        .payment-row:last-child{border-bottom:none}
        .table-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>
            {now.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700, margin: 0 }}>
            {greeting()}, {currentUser?.name.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Alert badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {orders.length > 0 && (
            <div style={{ background: '#F9731622', border: '1px solid #F9731644', borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.68rem', color: '#F97316', fontWeight: 700 }}>
              ⚡ {orders.length} active order{orders.length !== 1 ? 's' : ''}
            </div>
          )}
          {lowStock.length > 0 && (
            <div style={{ background: '#EF444422', border: '1px solid #EF444444', borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.68rem', color: '#EF4444', fontWeight: 700 }}>
              ⚠ {lowStock.length} low stock
            </div>
          )}
        </div>

        {/* Top stats — 2x2 on mobile, 4 across on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: col4, gap: '0.8rem', marginBottom: '1.2rem' }}>
          <StatCard label="TODAY'S REVENUE"  value={`€${todayRevenue.toFixed(2)}`}  sub={`${todayHistory.length} orders closed`} color="#F97316" onClick={() => navigate('/reports')} />
          <StatCard label="TABLES OCCUPIED"  value={`${occupiedTables}/${tables.length}`} sub={`${freeTables} free · ${reservedTables} reserved`} color="#3B82F6" onClick={() => navigate('/tables')} />
          <StatCard label="ORDERS IN FLIGHT" value={orders.length} sub={`${pending.length} pending · ${inProgress.length} in progress · ${ready.length} ready`} color="#10B981" onClick={() => navigate('/orders')} />
          <StatCard label="STAFF ON SHIFT"   value={clockedIn.length} sub={`of ${staff.length} total staff`} color="#8B5CF6" onClick={() => navigate('/staff')} />
        </div>

        {/* Tables + Active Orders */}
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: '1rem', marginBottom: '1rem' }}>

          {/* Tables */}
          <div className="dash-card">
            <SectionHeader title="TABLES" action="Manage" onAction={() => navigate('/tables')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem' }}>
              {tables.slice(0, 15).map(t => {
                const status = TABLE_STATUS_COLOR[t.status] || '#10B981'
                return (
                  <div key={t.id} onClick={() => navigate('/tables')} style={{ background: status + '18', border: `1px solid ${status}44`, borderRadius: 6, padding: '0.3rem', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.5rem', color: '#475569' }}>T</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: status }}>{t.id}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              {[['free', 'Free'], ['occupied', 'Occupied'], ['reserved', 'Reserved']].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div className="table-dot" style={{ background: TABLE_STATUS_COLOR[k] }} />
                  <span style={{ fontSize: '0.62rem', color: '#475569' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Orders */}
          <div className="dash-card">
            <SectionHeader title="ACTIVE ORDERS" action="View all" onAction={() => navigate('/orders')} />
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>No active orders</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                {orders.map(o => {
                  const sc = { pending: '#F59E0B', 'in-progress': '#3B82F6', ready: '#10B981' }[o.status] || '#F59E0B'
                  return (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.7rem', background: '#0D0D14', borderRadius: 8, border: `1px solid ${sc}22` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: sc }}>T{o.table}</span>
                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                        {o.urgent && <span style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 700 }}>🔴</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>€{o.total.toFixed(2)}</span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: sc + '22', color: sc, border: `1px solid ${sc}44`, borderRadius: 4, padding: '1px 6px' }}>
                          {o.status.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom section — stacks on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: col3, gap: '1rem', marginBottom: '1rem' }}>

          {/* Today's bookings */}
          <div className="dash-card">
            <SectionHeader title="TODAY'S BOOKINGS" action="View all" onAction={() => navigate('/bookings')} />
            {todayBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>No bookings today</div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {todayBookings.map(b => {
                  const sc = { pending: '#F59E0B', confirmed: '#10B981', seated: '#3B82F6', cancelled: '#EF4444' }[b.status] || '#475569'
                  return (
                    <div key={b.id} className="booking-row">
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#CBD5E1' }}>{b.name}</div>
                        <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.1rem' }}>{b.time} · {b.guests} guests · T{b.preferredTable}</div>
                        {b.notes && <div style={{ fontSize: '0.6rem', color: '#F59E0B', marginTop: '0.1rem' }}>⚠ {b.notes}</div>}
                      </div>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, background: sc + '22', color: sc, border: `1px solid ${sc}44`, borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top items */}
          <div className="dash-card">
            <SectionHeader title="TOP ITEMS TODAY" action="Reports" onAction={() => navigate('/reports')} />
            {topItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>No sales yet today</div>
            ) : (
              <div>
                {topItems.map(([name, qty], i) => {
                  const pct = (qty / topItems[0][1]) * 100
                  return (
                    <div key={name} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{i + 1}. {name}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>{qty}×</span>
                      </div>
                      <div style={{ background: '#1E1E2E', borderRadius: 3, height: 4 }}>
                        <div style={{ background: '#F97316', borderRadius: 3, height: '100%', width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Staff on shift */}
          <div className="dash-card">
            <SectionHeader title="STAFF ON SHIFT" action="Manage" onAction={() => navigate('/staff')} />
            {clockedIn.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>Nobody clocked in</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflowY: 'auto' }}>
                {clockedIn.map(s => {
                  const role = ROLE_CONFIG[s.role]
                  return (
                    <div key={s.id} className="staff-chip">
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: role.color + '22', border: `2px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: role.color, fontWeight: 700, flexShrink: 0 }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#CBD5E1' }}>{s.name}</div>
                        <div style={{ fontSize: '0.6rem', color: role.color }}>{role.label} · {s.section}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Low stock + Recent payments */}
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: '1rem' }}>

          {/* Low stock */}
          <div className="dash-card">
            <SectionHeader title="LOW STOCK ALERTS" action="Manage" onAction={() => navigate('/stock')} />
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#10B981' }}>✅ All stock levels healthy</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflowY: 'auto' }}>
                {lowStock.map(item => {
                  const isOut = item.quantity === 0
                  const color = isOut ? '#EF4444' : '#F59E0B'
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.7rem', background: color + '11', border: `1px solid ${color}33`, borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{item.name}</div>
                        <div style={{ fontSize: '0.62rem', color: '#475569' }}>{item.supplier}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{item.quantity} <span style={{ fontSize: '0.6rem' }}>{item.unit}</span></div>
                        <div style={{ fontSize: '0.6rem', color: '#334155' }}>min {item.minThreshold}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="dash-card">
            <SectionHeader title="RECENT PAYMENTS" action="Reports" onAction={() => navigate('/reports')} />
            {recentPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>No payments yet</div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {recentPayments.map(o => (
                  <div key={o.id} className="payment-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F9731622', border: '1px solid #F9731644', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#F97316', fontWeight: 700, flexShrink: 0 }}>
                        T{o.table}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{o.placedBy || 'Unknown'}</div>
                        <div style={{ fontSize: '0.62rem', color: '#334155' }}>
                          {new Date(o.closedAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>€{o.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}