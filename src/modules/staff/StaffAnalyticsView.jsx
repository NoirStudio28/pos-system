import { useState } from 'react'
import { usePOS, ROLE_CONFIG } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

function getDateRange(period) {
  const today = new Date()
  const pad   = (d) => d.toISOString().split('T')[0]
  if (period === 'today') return { from: pad(today), to: pad(today) }
  if (period === 'week')  { const f = new Date(today); f.setDate(today.getDate() - 6); return { from: pad(f), to: pad(today) } }
  if (period === 'month') { const f = new Date(today.getFullYear(), today.getMonth(), 1); return { from: pad(f), to: pad(today) } }
  return { from: null, to: null }
}

function StatBox({ label, value, color = '#F97316', sub }) {
  return (
    <div style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.7rem 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em', marginTop: '0.1rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  )
}

function RankBadge({ rank }) {
  const config = {
    1: { label: '🥇', color: '#F59E0B' },
    2: { label: '🥈', color: '#94A3B8' },
    3: { label: '🥉', color: '#CD7F32' },
  }
  const c = config[rank]
  if (!c) return <span style={{ fontSize: '0.7rem', color: '#334155', width: 24, display: 'inline-block', textAlign: 'center' }}>#{rank}</span>
  return <span style={{ fontSize: '1rem' }}>{c.label}</span>
}

export default function StaffAnalyticsView() {
  const { staff, orderHistory } = usePOS()
  const { isMobile } = useBreakpoint()
  const [period,   setPeriod]   = useState('all')
  const [sortBy,   setSortBy]   = useState('revenue')
  const [selected, setSelected] = useState(null)

  const { from, to } = getDateRange(period)

  const filteredOrders = orderHistory.filter(o => {
    if (!from) return true
    const d = o.closedAt?.split('T')[0]
    return d && d >= from && d <= to
  })

  // Build stats per staff member
  const staffStats = staff.map(member => {
    const orders       = filteredOrders.filter(o => o.placedBy === member.name)
    const revenue      = orders.reduce((s, o) => s + o.total, 0)
    const avgOrder     = orders.length ? revenue / orders.length : 0
    const totalItems   = orders.reduce((s, o) => s + (o.items?.reduce((x, i) => x + i.qty, 0) || 0), 0)
    const avgItems     = orders.length ? totalItems / orders.length : 0

    // Hours worked in period
    const clockRecords = member.clockRecords || []
    const periodRecords = clockRecords.filter(r => {
      if (!from) return true
      return r.in?.split('T')[0] >= from
    })
    const hoursWorked = periodRecords.reduce((t, r) => {
      if (!r.out) return t + (Date.now() - new Date(r.in).getTime()) / 3600000
      return t + (new Date(r.out) - new Date(r.in)) / 3600000
    }, 0)

    const revenuePerHour = hoursWorked > 0 ? revenue / hoursWorked : 0

    // Hourly order distribution
    const hourMap = {}
    orders.forEach(o => {
      if (!o.closedAt) return
      const h = new Date(o.closedAt).getHours()
      hourMap[h] = (hourMap[h] || 0) + 1
    })
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Category breakdown
    const catMap = {}
    orders.forEach(o => {
      (o.items || []).forEach(i => {
        catMap[i.category] = (catMap[i.category] || 0) + i.price * i.qty
      })
    })

    return {
      ...member,
      orders:          orders.length,
      revenue,
      avgOrder,
      avgItems:        parseFloat(avgItems.toFixed(1)),
      hoursWorked,
      revenuePerHour,
      peakHour:        peakHour ? `${peakHour.toString().padStart(2, '0')}:00` : '—',
      hourMap,
      catMap,
      recentOrders:    orders.slice(-5).reverse(),
    }
  })

  const sorted = [...staffStats].sort((a, b) => {
    if (sortBy === 'revenue')  return b.revenue - a.revenue
    if (sortBy === 'orders')   return b.orders - a.orders
    if (sortBy === 'avgOrder') return b.avgOrder - a.avgOrder
    if (sortBy === 'avgItems') return b.avgItems - a.avgItems
    if (sortBy === 'hours')    return b.hoursWorked - a.hoursWorked
    return b.revenue - a.revenue
  }).filter(s => s.orders > 0 || s.hoursWorked > 0)

  const topRevenue   = sorted[0]?.revenue || 1
  const selectedStat = staffStats.find(s => s.id === selected)

  const PERIODS = [
    { key: 'today', label: 'Today'      },
    { key: 'week',  label: 'This Week'  },
    { key: 'month', label: 'This Month' },
    { key: 'all',   label: 'All Time'   },
  ]

  const SORTS = [
    { key: 'revenue',  label: 'Revenue'    },
    { key: 'orders',   label: 'Orders'     },
    { key: 'avgOrder', label: 'Avg Order'  },
    { key: 'avgItems', label: 'Upsell'     },
    { key: 'hours',    label: 'Hours'      },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85}
        .ptab{padding:0.35rem 0.8rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.7rem;font-weight:700;transition:all 0.15s}
        .ptab.active{background:#3B82F622;border-color:#3B82F6;color:#3B82F6}
        .stab{padding:0.35rem 0.8rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.7rem;font-weight:700;transition:all 0.15s}
        .stab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .staff-row{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1rem 1.2rem;margin-bottom:0.5rem;cursor:pointer;transition:all 0.15s}
        .staff-row:hover{border-color:#3B3B52}
        .staff-row.sel{border-color:#F9731655;background:#F9731608}
        .bar{height:5px;border-radius:3px;transition:width 0.4s}
        .section{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1.2rem;margin-bottom:1rem}
      `}</style>

      <div style={{ maxWidth: 1050, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>TEAM</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Staff Analytics</h1>
          </div>
        </div>

        {/* Period filter */}
        <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.62rem', color: '#475569', letterSpacing: '0.1em' }}>PERIOD</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {PERIODS.map(p => (
              <button key={p.key} className={`ptab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
            ))}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#334155', marginLeft: 'auto' }}>
            {filteredOrders.length} orders in range
          </span>
        </div>

        {/* Team overview stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <StatBox label="TOTAL ORDERS"   value={filteredOrders.length}                                                                           color="#3B82F6" />
          <StatBox label="TOTAL REVENUE"  value={`€${filteredOrders.reduce((s, o) => s + o.total, 0).toFixed(0)}`}                               color="#F97316" />
          <StatBox label="TOP PERFORMER"  value={sorted[0]?.name.split(' ')[0] || '—'}                                                            color="#F59E0B" sub={sorted[0] ? `€${sorted[0].revenue.toFixed(0)}` : ''} />
          <StatBox label="AVG ORDER VALUE" value={filteredOrders.length ? `€${(filteredOrders.reduce((s, o) => s + o.total, 0) / filteredOrders.length).toFixed(2)}` : '€0'} color="#10B981" />
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.62rem', color: '#475569', letterSpacing: '0.1em' }}>SORT BY</span>
          {SORTS.map(s => (
            <button key={s.key} className={`stab ${sortBy === s.key ? 'active' : ''}`} onClick={() => setSortBy(s.key)}>{s.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: !isMobile && selected ? '1fr 340px' : '1fr', gap: '1.2rem' }}>

          {/* Staff list */}
          <div>
            {sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14, color: '#334155', fontSize: '0.85rem' }}>
                No activity in this period
              </div>
            ) : sorted.map((member, idx) => {
              const role    = ROLE_CONFIG[member.role]
              const barPct  = topRevenue > 0 ? (member.revenue / topRevenue) * 100 : 0
              const isSel   = selected === member.id

              return (
                <div key={member.id} className={`staff-row ${isSel ? 'sel' : ''}`} onClick={() => setSelected(isSel ? null : member.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <RankBadge rank={idx + 1} />
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: role.color + '22', border: `2px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: role.color, fontWeight: 700, flexShrink: 0 }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#CBD5E1' }}>{member.name}</div>
                        <div style={{ fontSize: '0.65rem', color: role.color }}>{role.label} · {member.section}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>REVENUE</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F97316' }}>€{member.revenue.toFixed(0)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>ORDERS</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3B82F6' }}>{member.orders}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>AVG ORDER</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10B981' }}>€{member.avgOrder.toFixed(0)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>UPSELL</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8B5CF6' }}>{member.avgItems}</div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue bar */}
                  <div style={{ background: '#0D0D14', borderRadius: 3, height: 5 }}>
                    <div className="bar" style={{ width: `${barPct}%`, background: idx === 0 ? '#F59E0B' : '#F97316' }} />
                  </div>

                  {/* Quick stats row */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.62rem', color: '#334155' }}>
                      ⏱ {member.hoursWorked > 0 ? `${member.hoursWorked.toFixed(1)}h worked` : 'No clock records'}
                    </span>
                    {member.hoursWorked > 0 && (
                      <span style={{ fontSize: '0.62rem', color: '#334155' }}>
                        💰 €{member.revenuePerHour.toFixed(0)}/hr
                      </span>
                    )}
                    {member.peakHour !== '—' && (
                      <span style={{ fontSize: '0.62rem', color: '#334155' }}>
                        🕐 Busiest at {member.peakHour}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selectedStat && (
            <div>
              {isMobile && <div style={{ height: '0.5rem' }} />}
              <DetailPanel stat={selectedStat} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ stat, onClose }) {
  const role     = ROLE_CONFIG[stat.role]
  const hours    = stat.hoursWorked
  const hrsLabel = hours > 0 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '—'

  const hourEntries = Object.entries(stat.hourMap).sort((a, b) => Number(a[0]) - Number(b[0]))
  const maxHour     = Math.max(...hourEntries.map(([, v]) => v), 1)

  const catEntries  = Object.entries(stat.catMap).sort((a, b) => b[1] - a[1])
  const maxCat      = catEntries[0]?.[1] || 1

  return (
    <div style={{ background: '#13131A', border: '1px solid #F9731644', borderRadius: 14, padding: '1.2rem', position: 'sticky', top: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: role.color + '22', border: `2px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: role.color, fontWeight: 700 }}>
            {stat.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#CBD5E1' }}>{stat.name}</div>
            <div style={{ fontSize: '0.65rem', color: role.color }}>{role.label} · {stat.section}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem' }}>✕</button>
      </div>

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {[
          { label: 'REVENUE',      value: `€${stat.revenue.toFixed(2)}`,      color: '#F97316' },
          { label: 'ORDERS',       value: stat.orders,                          color: '#3B82F6' },
          { label: 'AVG ORDER',    value: `€${stat.avgOrder.toFixed(2)}`,      color: '#10B981' },
          { label: 'AVG ITEMS',    value: stat.avgItems,                        color: '#8B5CF6' },
          { label: 'HOURS WORKED', value: hrsLabel,                             color: '#F59E0B' },
          { label: 'REV / HOUR',   value: hours > 0 ? `€${stat.revenuePerHour.toFixed(0)}` : '—', color: '#EC4899' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.5rem 0.7rem' }}>
            <div style={{ fontSize: '0.55rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>{s.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Hourly activity */}
      {hourEntries.length > 0 && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>ACTIVITY BY HOUR</div>
          {hourEntries.map(([hour, count]) => (
            <div key={hour} style={{ marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748B' }}>{hour.padStart(2, '0')}:00</span>
                <span style={{ fontSize: '0.65rem', color: '#F97316', fontWeight: 700 }}>{count} orders</span>
              </div>
              <div style={{ background: '#1E1E2E', borderRadius: 3, height: 4 }}>
                <div style={{ height: '100%', borderRadius: 3, background: '#F97316', width: `${(count / maxHour) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category revenue */}
      {catEntries.length > 0 && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>REVENUE BY CATEGORY</div>
          {catEntries.map(([cat, rev]) => {
            const colors = { Starters: '#10B981', Mains: '#F97316', Desserts: '#8B5CF6', Drinks: '#3B82F6' }
            const c = colors[cat] || '#64748B'
            return (
              <div key={cat} style={{ marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748B' }}>{cat}</span>
                  <span style={{ fontSize: '0.65rem', color: c, fontWeight: 700 }}>€{rev.toFixed(2)}</span>
                </div>
                <div style={{ background: '#1E1E2E', borderRadius: 3, height: 4 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: c, width: `${(rev / maxCat) * 100}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent orders */}
      {stat.recentOrders.length > 0 && (
        <div>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>RECENT ORDERS</div>
          {stat.recentOrders.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #0D0D14', fontSize: '0.7rem' }}>
              <span style={{ color: '#64748B' }}>{o.closedAt ? new Date(o.closedAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }) : '—'}</span>
              <span style={{ color: '#94A3B8' }}>T{o.table}</span>
              <span style={{ color: '#475569' }}>{o.items?.length || 0} items</span>
              <span style={{ color: '#F97316', fontWeight: 700 }}>€{o.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}