import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const FOOD_CATEGORIES  = ['Starters', 'Mains', 'Desserts']
const DRINK_CATEGORIES = ['Drinks']

function getDateRange(mode, customFrom, customTo) {
  const today = new Date()
  const pad = (d) => d.toISOString().split('T')[0]
  if (mode === 'today')  return { from: pad(today), to: pad(today) }
  if (mode === 'week')   { const from = new Date(today); from.setDate(today.getDate() - 6); return { from: pad(from), to: pad(today) } }
  if (mode === 'month')  { const from = new Date(today.getFullYear(), today.getMonth(), 1); return { from: pad(from), to: pad(today) } }
  if (mode === 'custom') return { from: customFrom, to: customTo }
  return { from: pad(today), to: pad(today) }
}

function inRange(dateStr, from, to) { return dateStr >= from && dateStr <= to }

export default function ReportsView() {
  const { orderHistory, menu } = usePOS()
  const { isMobile } = useBreakpoint()

  const [activeSection, setActiveSection] = useState('financial')
  const [printCategory, setPrintCategory] = useState('All')
  const [period,        setPeriod]        = useState('today')
  const [customFrom,    setCustomFrom]    = useState(new Date().toISOString().split('T')[0])
  const [customTo,      setCustomTo]      = useState(new Date().toISOString().split('T')[0])

  const { from, to } = getDateRange(period, customFrom, customTo)

  const filteredOrders = orderHistory.filter(o => {
    const d = o.closedAt?.split('T')[0]
    return d && inRange(d, from, to)
  })

  const totalRevenue   = filteredOrders.reduce((s, o) => s + o.total, 0)
  const totalOrders    = filteredOrders.length
  const avgOrderValue  = totalOrders ? totalRevenue / totalOrders : 0
  const totalCovers    = filteredOrders.length

  const foodRevenue  = filteredOrders.reduce((s, o) => s + o.items.filter(i => FOOD_CATEGORIES.includes(i.category)).reduce((x, i) => x + i.price * i.qty, 0), 0)
  const drinkRevenue = filteredOrders.reduce((s, o) => s + o.items.filter(i => DRINK_CATEGORIES.includes(i.category)).reduce((x, i) => x + i.price * i.qty, 0), 0)

  const slotMap = {}
  filteredOrders.forEach(o => { const slot = o.time?.slice(0, 5) || 'Unknown'; slotMap[slot] = (slotMap[slot] || 0) + 1 })
  const slots   = Object.entries(slotMap).sort((a, b) => b[1] - a[1])
  const maxSlot = slots[0]?.[1] || 1

  const itemMap = {}
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0, category: item.category, price: item.price }
      itemMap[item.name].qty     += item.qty
      itemMap[item.name].revenue += item.price * item.qty
    })
  })
  const itemStats   = Object.values(itemMap).sort((a, b) => b.qty - a.qty)
  const topDishes   = itemStats.filter(i => FOOD_CATEGORIES.includes(i.category))
  const allCategories = ['All', ...Object.keys(menu)]
  const printItems  = printCategory === 'All' ? itemStats : itemStats.filter(i => i.category === printCategory)

  const avgUsage = (qty) => {
    if (qty >= 20) return { label: 'High',   color: '#EF4444' }
    if (qty >= 10) return { label: 'Medium', color: '#F59E0B' }
    return                { label: 'Low',    color: '#10B981' }
  }

  const periodLabel = () => {
    if (period === 'today') return new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (period === 'week')  return `Last 7 days (${from} → ${to})`
    if (period === 'month') return `This month (${from} → ${to})`
    return `${from} → ${to}`
  }

  const handlePrintFinancial = () => {
    const html = `<html><head><title>Financial Report</title><style>body{font-family:monospace;padding:2rem;color:#000}h1{font-size:1.3rem;margin-bottom:0.2rem}p{font-size:0.8rem;color:#555;margin-bottom:1.5rem}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}.box{border:1px solid #ccc;border-radius:6px;padding:0.8rem 1rem}.box-label{font-size:0.65rem;color:#888;letter-spacing:0.1em}.box-value{font-size:1.4rem;font-weight:bold;margin-top:0.2rem}table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:1rem}th{text-align:left;border-bottom:2px solid #000;padding:0.4rem 0.6rem}td{padding:0.4rem 0.6rem;border-bottom:1px solid #ddd}tfoot td{font-weight:bold;border-top:2px solid #000}h2{font-size:0.9rem;margin-top:1.5rem;margin-bottom:0.5rem;border-bottom:1px solid #ccc;padding-bottom:0.3rem}</style></head><body>
      <h1>Financial Report</h1><p>${periodLabel()}</p>
      <div class="grid">
        <div class="box"><div class="box-label">TOTAL REVENUE</div><div class="box-value">€${totalRevenue.toFixed(2)}</div></div>
        <div class="box"><div class="box-label">ORDERS CLOSED</div><div class="box-value">${totalOrders}</div></div>
        <div class="box"><div class="box-label">AVG ORDER VALUE</div><div class="box-value">€${avgOrderValue.toFixed(2)}</div></div>
        <div class="box"><div class="box-label">TABLES SERVED</div><div class="box-value">${totalCovers}</div></div>
      </div>
      <h2>Revenue Breakdown</h2>
      <table><thead><tr><th>Category</th><th style="text-align:right">Revenue</th><th style="text-align:right">%</th></tr></thead>
      <tbody>
        <tr><td>Food</td><td style="text-align:right">€${foodRevenue.toFixed(2)}</td><td style="text-align:right">${totalRevenue ? (foodRevenue / totalRevenue * 100).toFixed(1) : 0}%</td></tr>
        <tr><td>Drinks</td><td style="text-align:right">€${drinkRevenue.toFixed(2)}</td><td style="text-align:right">${totalRevenue ? (drinkRevenue / totalRevenue * 100).toFixed(1) : 0}%</td></tr>
      </tbody>
      <tfoot><tr><td>TOTAL</td><td style="text-align:right">€${totalRevenue.toFixed(2)}</td><td style="text-align:right">100%</td></tr></tfoot></table>
      <h2>Busiest Time Slots</h2>
      <table><thead><tr><th>Time</th><th style="text-align:right">Orders</th></tr></thead>
      <tbody>${slots.map(([slot, count]) => `<tr><td>${slot}</td><td style="text-align:right">${count}</td></tr>`).join('')}</tbody></table>
    </body></html>`
    const win = window.open('', '_blank'); win.document.write(html); win.document.close(); win.print()
  }

  const handlePrintStock = () => {
    const title = printCategory === 'All' ? 'Full Stock Report' : `${printCategory} Stock Report`
    const rows  = printItems.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">€${i.revenue.toFixed(2)}</td></tr>`).join('')
    const html  = `<html><head><title>${title}</title><style>body{font-family:monospace;padding:2rem;color:#000}h1{font-size:1.2rem;margin-bottom:0.2rem}p{font-size:0.8rem;color:#555;margin-bottom:1.5rem}table{width:100%;border-collapse:collapse;font-size:0.85rem}th{text-align:left;border-bottom:2px solid #000;padding:0.4rem 0.6rem}td{padding:0.4rem 0.6rem;border-bottom:1px solid #ddd}tfoot td{font-weight:bold;border-top:2px solid #000}</style></head><body>
      <h1>${title}</h1><p>${periodLabel()}</p>
      <table><thead><tr><th>Item</th><th>Category</th><th style="text-align:center">Qty</th><th style="text-align:right">Revenue</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">TOTAL</td><td style="text-align:center">${printItems.reduce((s, i) => s + i.qty, 0)}</td><td style="text-align:right">€${printItems.reduce((s, i) => s + i.revenue, 0).toFixed(2)}</td></tr></tfoot></table>
    </body></html>`
    const win = window.open('', '_blank'); win.document.write(html); win.document.close(); win.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85;transform:translateY(-1px)}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-print{background:#1E293B;color:#94A3B8;border:1px solid #334155}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .section-tab{padding:0.45rem 1.1rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .section-tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .period-tab{padding:0.35rem 0.85rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.7rem;font-weight:700;transition:all 0.15s}
        .period-tab.active{background:#3B82F622;border-color:#3B82F6;color:#3B82F6}
        .stat-card{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1rem}
        .label{font-size:0.58rem;letter-spacing:0.15em;color:#475569;margin-bottom:0.3rem;display:block}
        .item-row{display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.8rem;border-radius:8px;background:#0D0D14;border:1px solid #1E1E2E;margin-bottom:0.4rem}
        .bar{height:6px;border-radius:3px;transition:width 0.4s ease}
        .cat-tab{padding:0.35rem 0.8rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;font-weight:700;transition:all 0.15s}
        .cat-tab.active{background:#1E293B;border-color:#334155;color:#94A3B8}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.45rem 0.7rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.75rem;outline:none}
        .input:focus{border-color:#3B82F6}
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>REPORTS</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Reports</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className={`section-tab ${activeSection === 'financial' ? 'active' : ''}`} onClick={() => setActiveSection('financial')}>📊 Financial</button>
            <button className={`section-tab ${activeSection === 'stock'     ? 'active' : ''}`} onClick={() => setActiveSection('stock')}>📦 Stock</button>
          </div>
        </div>

        {/* Period filter */}
        <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: period === 'custom' ? '0.8rem' : 0 }}>
            <span style={{ fontSize: '0.62rem', color: '#475569', letterSpacing: '0.1em' }}>PERIOD</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'week',  label: 'Week'  },
                { key: 'month', label: 'Month' },
                { key: 'custom',label: 'Custom'},
              ].map(p => (
                <button key={p.key} className={`period-tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
              ))}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#334155', marginLeft: 'auto' }}>
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="date" className="input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <span style={{ color: '#475569', fontSize: '0.75rem' }}>→</span>
              <input type="date" className="input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>

        {/* FINANCIAL */}
        {activeSection === 'financial' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-print" onClick={handlePrintFinancial}>🖨️ Print Financial Report</button>
            </div>

            {/* Stats — 2x2 on mobile, 4 across on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.2rem' }}>
              {[
                { label: 'TOTAL REVENUE',   value: `€${totalRevenue.toFixed(2)}`,  color: '#F97316' },
                { label: 'ORDERS CLOSED',   value: totalOrders,                     color: '#3B82F6' },
                { label: 'AVG ORDER VALUE', value: `€${avgOrderValue.toFixed(2)}`,  color: '#10B981' },
                { label: 'TABLES SERVED',   value: totalCovers,                     color: '#8B5CF6' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <span className="label">{s.label}</span>
                  <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Food vs Drinks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
              {[
                { label: 'FOOD REVENUE',   value: foodRevenue,  color: '#F97316', pct: totalRevenue ? (foodRevenue / totalRevenue * 100).toFixed(1) : 0 },
                { label: 'DRINKS REVENUE', value: drinkRevenue, color: '#3B82F6', pct: totalRevenue ? (drinkRevenue / totalRevenue * 100).toFixed(1) : 0 },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <span className="label">{s.label}</span>
                  <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: s.color }}>€{s.value.toFixed(2)}</div>
                  <div style={{ marginTop: '0.6rem', background: '#1E1E2E', borderRadius: 3, height: 6 }}>
                    <div className="bar" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.3rem' }}>{s.pct}% of total</div>
                </div>
              ))}
            </div>

            {/* Busiest slots */}
            <div className="stat-card">
              <span className="label" style={{ marginBottom: '1rem' }}>BUSIEST TIME SLOTS</span>
              {slots.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>No data for this period</div>
              ) : slots.map(([slot, count]) => (
                <div key={slot} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{slot}</span>
                    <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 700 }}>{count} order{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ background: '#1E1E2E', borderRadius: 3, height: 5 }}>
                    <div className="bar" style={{ width: `${(count / maxSlot) * 100}%`, background: '#F97316' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOCK */}
        {activeSection === 'stock' && (
          <div>
            {/* Print controls */}
            <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                {allCategories.map(cat => (
                  <button key={cat} className={`cat-tab ${printCategory === cat ? 'active' : ''}`} onClick={() => setPrintCategory(cat)}>{cat}</button>
                ))}
              </div>
              <button className="btn btn-print" onClick={handlePrintStock}>
                🖨️ Print {printCategory === 'All' ? 'All' : printCategory}
              </button>
            </div>

            {/* Top dishes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>TOP DISHES</div>
              {topDishes.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>No food orders in this period</div>
              ) : topDishes.slice(0, 5).map((item, i) => (
                <div className="item-row" key={item.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#334155', width: 16 }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F97316' }}>{item.qty} sold</span>
                </div>
              ))}
            </div>

            {/* Full breakdown — scrollable on mobile */}
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.8rem' }}>ALL ITEMS</div>
              <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflowX: 'auto' }}>
                <div style={{ minWidth: 420 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 60px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                    {['ITEM', 'CATEGORY', 'QTY', 'REVENUE', 'USAGE'].map(h => (
                      <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                    ))}
                  </div>
                  {itemStats.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#334155' }}>No items sold in this period</div>
                  ) : itemStats.map(item => {
                    const usage = avgUsage(item.qty)
                    return (
                      <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 60px', padding: '0.65rem 1rem', borderBottom: '1px solid #0D0D14' }}>
                        <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{item.name}</span>
                        <span style={{ fontSize: '0.7rem',  color: '#475569' }}>{item.category}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316' }}>{item.qty}</span>
                        <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>€{item.revenue.toFixed(2)}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: usage.color }}>{usage.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}