import { useState } from 'react'
import { usePOS, ROLE_CONFIG } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

export default function EODView() {
  const { orderHistory, staff, settings, isClockedIn, getTotalHours } = usePOS()
  const { isMobile } = useBreakpoint()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const todayOrders = orderHistory.filter(o => o.closedAt?.startsWith(date))

  // ── Revenue ──
  const totalRevenue     = todayOrders.reduce((s, o) => s + o.total, 0)
  const totalOrders      = todayOrders.length
  const avgOrderValue    = totalOrders ? totalRevenue / totalOrders : 0
  const totalCovers      = todayOrders.reduce((s, o) => s + (o.items?.length ? 1 : 0), 0)

  // ── Payment method breakdown ──
  const paymentTotals = { Cash: 0, Card: 0, Voucher: 0, 'Gift Card': 0 }
  todayOrders.forEach(o => {
    if (o.payment?.payments) {
      o.payment.payments.forEach(p => {
        const amt = parseFloat(p.amount) || 0
        if (paymentTotals[p.method] !== undefined) paymentTotals[p.method] += amt
        else paymentTotals[p.method] = (paymentTotals[p.method] || 0) + amt
      })
    }
  })
  const expectedCash = paymentTotals['Cash'] || 0

  // ── Discounts & service charges ──
  const totalDiscounts      = todayOrders.reduce((s, o) => s + (o.payment?.discountAmount || 0), 0)
  const totalServiceCharges = todayOrders.reduce((s, o) => s + (o.payment?.serviceChargeAmount || 0), 0)
  const totalTips           = todayOrders.reduce((s, o) => s + (o.payment?.tip || 0), 0)

  // ── Food vs drinks ──
  const foodRevenue  = todayOrders.reduce((s, o) =>
    s + (o.items || []).filter(i => ['Starters', 'Mains', 'Desserts'].includes(i.category)).reduce((x, i) => x + i.price * i.qty, 0), 0)
  const drinkRevenue = todayOrders.reduce((s, o) =>
    s + (o.items || []).filter(i => i.category === 'Drinks').reduce((x, i) => x + i.price * i.qty, 0), 0)

  // ── Hourly breakdown ──
  const hourlyMap = {}
  todayOrders.forEach(o => {
    const hour = o.closedAt ? new Date(o.closedAt).getHours() : null
    if (hour === null) return
    const key = `${hour.toString().padStart(2, '0')}:00`
    if (!hourlyMap[key]) hourlyMap[key] = { revenue: 0, orders: 0 }
    hourlyMap[key].revenue += o.total
    hourlyMap[key].orders  += 1
  })
  const hourlyData = Object.entries(hourlyMap).sort((a, b) => a[0].localeCompare(b[0]))
  const maxHourly  = Math.max(...hourlyData.map(([, v]) => v.revenue), 1)

  // ── Top items ──
  const itemMap = {}
  todayOrders.forEach(o => {
    (o.items || []).forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0, category: i.category }
      itemMap[i.name].qty     += i.qty
      itemMap[i.name].revenue += i.price * i.qty
    })
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 8)

  // ── Staff summary ──
  const todayStaff = staff.filter(s => {
    return s.clockRecords?.some(r => r.in?.startsWith(date))
  }).map(s => {
    const todayRecords = s.clockRecords?.filter(r => r.in?.startsWith(date)) || []
    const hoursToday   = todayRecords.reduce((t, r) => {
      if (!r.out) return t + (Date.now() - new Date(r.in).getTime()) / 3600000
      return t + (new Date(r.out) - new Date(r.in)) / 3600000
    }, 0)
    const ordersToday = todayOrders.filter(o => o.placedBy === s.name).length
    const revenueToday = todayOrders.filter(o => o.placedBy === s.name).reduce((x, o) => x + o.total, 0)
    return { ...s, hoursToday, ordersToday, revenueToday, stillIn: todayRecords.some(r => !r.out) }
  })

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const handlePrint = () => {
    const methodRows = Object.entries(paymentTotals)
      .filter(([, amt]) => amt > 0)
      .map(([method, amt]) => `<tr><td>${method}</td><td style="text-align:right">€${amt.toFixed(2)}</td></tr>`).join('')

    const hourRows = hourlyData.map(([hour, data]) =>
      `<tr><td>${hour}</td><td style="text-align:center">${data.orders}</td><td style="text-align:right">€${data.revenue.toFixed(2)}</td></tr>`
    ).join('')

    const itemRows = topItems.map((item, i) =>
      `<tr><td>#${i + 1} ${item.name}</td><td style="text-align:center">${item.qty}</td><td style="text-align:right">€${item.revenue.toFixed(2)}</td></tr>`
    ).join('')

    const staffRows = todayStaff.map(s =>
      `<tr><td>${s.name}</td><td>${ROLE_CONFIG[s.role]?.label || s.role}</td><td style="text-align:center">${s.hoursToday.toFixed(1)}h</td><td style="text-align:center">${s.ordersToday}</td><td style="text-align:right">€${s.revenueToday.toFixed(2)}</td></tr>`
    ).join('')

    const html = `
      <html><head><title>End of Day Report — ${dateLabel}</title>
      <style>
        body{font-family:monospace;padding:2rem;color:#000;max-width:700px;margin:0 auto}
        h1{font-size:1.3rem;margin-bottom:0.2rem}
        .sub{font-size:0.8rem;color:#555;margin-bottom:1.5rem}
        .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0.8rem;margin-bottom:1.5rem}
        .box{border:1px solid #ccc;border-radius:6px;padding:0.7rem 1rem}
        .box-label{font-size:0.6rem;color:#888;letter-spacing:0.1em}
        .box-value{font-size:1.3rem;font-weight:bold;margin-top:0.2rem}
        h2{font-size:0.9rem;margin-top:1.5rem;margin-bottom:0.5rem;border-bottom:1px solid #ccc;padding-bottom:0.3rem;letter-spacing:0.08em}
        table{width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:0.5rem}
        th{text-align:left;border-bottom:2px solid #000;padding:0.35rem 0.5rem;font-size:0.75rem}
        td{padding:0.35rem 0.5rem;border-bottom:1px solid #eee}
        tfoot td{font-weight:bold;border-top:2px solid #000;border-bottom:none}
        .highlight{background:#f9f9f9}
        .cash-box{border:2px solid #000;border-radius:6px;padding:1rem;margin-top:1rem;display:flex;justify-content:space-between;align-items:center}
        .cash-label{font-size:0.8rem;font-weight:bold}
        .cash-value{font-size:1.8rem;font-weight:bold}
        @media print{body{padding:0.5rem}}
      </style></head>
      <body>
        <h1>End of Day Report</h1>
        <div class="sub">${dateLabel} · Generated ${new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })} · ${settings.restaurantName}</div>

        <div class="grid">
          <div class="box"><div class="box-label">TOTAL REVENUE</div><div class="box-value">€${totalRevenue.toFixed(2)}</div></div>
          <div class="box"><div class="box-label">ORDERS CLOSED</div><div class="box-value">${totalOrders}</div></div>
          <div class="box"><div class="box-label">AVG ORDER</div><div class="box-value">€${avgOrderValue.toFixed(2)}</div></div>
          <div class="box"><div class="box-label">COVERS</div><div class="box-value">${totalCovers}</div></div>
        </div>

        <h2>CASH RECONCILIATION</h2>
        <div class="cash-box">
          <div class="cash-label">Expected Cash in Till</div>
          <div class="cash-value">€${expectedCash.toFixed(2)}</div>
        </div>

        <h2>PAYMENT METHODS</h2>
        <table><thead><tr><th>Method</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${methodRows}</tbody>
        <tfoot><tr><td>TOTAL</td><td style="text-align:right">€${totalRevenue.toFixed(2)}</td></tr></tfoot></table>

        <h2>REVENUE BREAKDOWN</h2>
        <table><thead><tr><th>Category</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
        <tbody>
          <tr><td>Food</td><td style="text-align:right">€${foodRevenue.toFixed(2)}</td><td style="text-align:right">${totalRevenue ? (foodRevenue / totalRevenue * 100).toFixed(1) : 0}%</td></tr>
          <tr><td>Drinks</td><td style="text-align:right">€${drinkRevenue.toFixed(2)}</td><td style="text-align:right">${totalRevenue ? (drinkRevenue / totalRevenue * 100).toFixed(1) : 0}%</td></tr>
          ${totalDiscounts > 0 ? `<tr><td>Discounts given</td><td style="text-align:right">-€${totalDiscounts.toFixed(2)}</td><td></td></tr>` : ''}
          ${totalServiceCharges > 0 ? `<tr><td>Service charges</td><td style="text-align:right">+€${totalServiceCharges.toFixed(2)}</td><td></td></tr>` : ''}
          ${totalTips > 0 ? `<tr><td>Tips</td><td style="text-align:right">€${totalTips.toFixed(2)}</td><td></td></tr>` : ''}
        </tbody></table>

        <h2>HOURLY BREAKDOWN</h2>
        <table><thead><tr><th>Hour</th><th style="text-align:center">Orders</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>${hourRows}</tbody></table>

        <h2>TOP ITEMS</h2>
        <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>${itemRows}</tbody></table>

        <h2>STAFF</h2>
        <table><thead><tr><th>Name</th><th>Role</th><th style="text-align:center">Hours</th><th style="text-align:center">Orders</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>${staffRows}</tbody></table>

        <div style="margin-top:2rem;font-size:0.7rem;color:#999;text-align:center">
          ${settings.restaurantName} · End of Day Report · ${dateLabel}
        </div>
      </body></html>
    `
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .stat-card{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1rem 1.2rem}
        .section{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1.2rem;margin-bottom:1rem}
        .row{display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid #0D0D14}
        .row:last-child{border-bottom:none}
        .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;display:block;margin-bottom:0.2rem}
        .bar{height:6px;border-radius:3px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>END OF DAY</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Daily Report</h1>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.3rem' }}>{dateLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.45rem 0.7rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none' }} />
            <button onClick={handlePrint}
              style={{ border: 'none', background: '#F97316', color: '#000', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.78rem', fontWeight: 700 }}>
              🖨️ Print EOD Report
            </button>
          </div>
        </div>

        {totalOrders === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📋</div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>No orders closed on this date</div>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
              {[
                { label: 'TOTAL REVENUE',   value: `€${totalRevenue.toFixed(2)}`,  color: '#F97316', big: true },
                { label: 'ORDERS CLOSED',   value: totalOrders,                     color: '#3B82F6' },
                { label: 'AVG ORDER VALUE', value: `€${avgOrderValue.toFixed(2)}`,  color: '#10B981' },
                { label: 'COVERS',          value: totalCovers,                     color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <span className="label">{s.label}</span>
                  <div style={{ fontSize: s.big ? '1.8rem' : '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Cash reconciliation — highlighted */}
            <div style={{ background: '#10B98122', border: '2px solid #10B98155', borderRadius: 14, padding: '1.2rem 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#10B981', marginBottom: '0.3rem' }}>EXPECTED CASH IN TILL</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#10B981' }}>€{expectedCash.toFixed(2)}</div>
                <div style={{ fontSize: '0.65rem', color: '#10B98199', marginTop: '0.2rem' }}>Based on cash payments taken today</div>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>PAYMENT SPLIT</div>
                {Object.entries(paymentTotals).filter(([, v]) => v > 0).map(([method, amt]) => {
                  const colors = { Cash: '#10B981', Card: '#3B82F6', Voucher: '#8B5CF6', 'Gift Card': '#F59E0B' }
                  return (
                    <div key={method} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', color: colors[method] || '#94A3B8' }}>{method}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors[method] || '#94A3B8' }}>€{amt.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

              {/* Food vs Drinks */}
              <div className="section">
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>REVENUE BREAKDOWN</div>
                {[
                  { label: 'Food',    value: foodRevenue,  color: '#F97316' },
                  { label: 'Drinks',  value: drinkRevenue, color: '#3B82F6' },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color }}>€{s.value.toFixed(2)}</span>
                    </div>
                    <div style={{ background: '#1E1E2E', borderRadius: 3, height: 6 }}>
                      <div className="bar" style={{ width: `${totalRevenue ? (s.value / totalRevenue) * 100 : 0}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
                {(totalDiscounts > 0 || totalServiceCharges > 0 || totalTips > 0) && (
                  <div style={{ borderTop: '1px solid #1E1E2E', paddingTop: '0.7rem', marginTop: '0.3rem' }}>
                    {totalDiscounts > 0 && (
                      <div className="row"><span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Discounts given</span><span style={{ fontSize: '0.72rem', color: '#10B981' }}>-€{totalDiscounts.toFixed(2)}</span></div>
                    )}
                    {totalServiceCharges > 0 && (
                      <div className="row"><span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Service charges</span><span style={{ fontSize: '0.72rem', color: '#F97316' }}>+€{totalServiceCharges.toFixed(2)}</span></div>
                    )}
                    {totalTips > 0 && (
                      <div className="row"><span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Tips 🙏</span><span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>€{totalTips.toFixed(2)}</span></div>
                    )}
                  </div>
                )}
              </div>

              {/* Hourly breakdown */}
              <div className="section">
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>HOURLY REVENUE</div>
                {hourlyData.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#334155' }}>No data</div>
                ) : hourlyData.map(([hour, data]) => (
                  <div key={hour} style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{hour}</span>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#475569' }}>{data.orders} orders</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F97316' }}>€{data.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div style={{ background: '#1E1E2E', borderRadius: 3, height: 5 }}>
                      <div className="bar" style={{ width: `${(data.revenue / maxHourly) * 100}%`, background: '#F97316' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top items */}
            <div className="section" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>TOP ITEMS TODAY</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.4rem' }}>
                {topItems.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.8rem', background: '#0D0D14', borderRadius: 8, border: '1px solid #1E1E2E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#334155', width: 18 }}>#{i + 1}</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{item.name}</div>
                        <div style={{ fontSize: '0.62rem', color: '#475569' }}>{item.category}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316' }}>{item.qty}×</div>
                      <div style={{ fontSize: '0.62rem', color: '#475569' }}>€{item.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff summary */}
            <div className="section">
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>STAFF TODAY</div>
              {todayStaff.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>No staff clocked in today</div>
              ) : (
                <div>
                  {isMobile ? (
                    todayStaff.map(s => {
                      const role = ROLE_CONFIG[s.role]
                      return (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#0D0D14', borderRadius: 8, border: '1px solid #1E1E2E', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: role.color + '22', border: `2px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: role.color, fontWeight: 700, flexShrink: 0 }}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: '0.62rem', color: role.color }}>{role.label}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{s.hoursToday.toFixed(1)}h · {s.ordersToday} orders</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>€{s.revenueToday.toFixed(2)}</div>
                            {s.stillIn && <div style={{ fontSize: '0.58rem', color: '#10B981' }}>● Still clocked in</div>}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ background: '#0D0D14', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 80px', padding: '0.5rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                        {['STAFF', 'ROLE', 'HOURS', 'ORDERS', 'REVENUE'].map(h => (
                          <span key={h} style={{ fontSize: '0.55rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                        ))}
                      </div>
                      {todayStaff.map(s => {
                        const role = ROLE_CONFIG[s.role]
                        return (
                          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px 80px', padding: '0.6rem 1rem', borderBottom: '1px solid #0A0A0F', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{s.name}</span>
                              {s.stillIn && <span style={{ fontSize: '0.55rem', color: '#10B981', background: '#10B98122', border: '1px solid #10B98133', borderRadius: 4, padding: '1px 5px' }}>IN</span>}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: role.color, fontWeight: 700 }}>{role.label}</span>
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{s.hoursToday.toFixed(1)}h</span>
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{s.ordersToday}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316' }}>€{s.revenueToday.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}