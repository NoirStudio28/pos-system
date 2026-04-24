import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const UNITS = ['portions', 'bottles', 'cans', 'kegs', 'kg', 'g', 'litres', 'units', 'boxes', 'bags']
const DELIVERY_DAYS = ['Daily', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const EMPTY_FORM = { name: '', category: '', unit: 'portions', quantity: 0, minThreshold: 5, costPrice: 0, supplier: '', supplierPhone: '', supplierEmail: '', deliveryDay: 'Monday', menuItemId: '', portionPerSale: 1 }

export default function StockView() {
  const { stock, menu, orderHistory, addStockItem, updateStockItem, deleteStockItem, adjustStock, stockMovements } = usePOS()
  const { isMobile } = useBreakpoint()

  const [activeTab,    setActiveTab]    = useState('stock')
  const [filterCat,    setFilterCat]    = useState('All')
  const [showForm,     setShowForm]     = useState(false)
  const [editingItem,  setEditingItem]  = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [adjustingId,  setAdjustingId]  = useState(null)
  const [adjustDelta,  setAdjustDelta]  = useState('')
  const [adjustReason, setAdjustReason] = useState('Manual adjustment')
  const [recoPeriod,   setRecoPeriod]   = useState('week')
  const [historySearch, setHistorySearch] = useState('')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const allMenuItems = Object.entries(menu).flatMap(([cat, items]) => items.map(i => ({ ...i, cat })))
  const categories   = ['All', ...new Set(stock.map(s => s.category).filter(Boolean))]
  const filtered     = filterCat === 'All' ? stock : stock.filter(s => s.category === filterCat)
  const lowStock     = stock.filter(s => s.quantity <= s.minThreshold)
  const totalValue   = stock.reduce((sum, s) => sum + s.quantity * s.costPrice, 0)

  const openAdd  = () => { setForm(EMPTY_FORM); setEditingItem(null); setShowForm(true) }
  const openEdit = (item) => { setForm({ ...item }); setEditingItem(item); setShowForm(true) }
  const handleSave = () => {
    if (!form.name) return
    const item = { ...form, quantity: parseFloat(form.quantity) || 0, minThreshold: parseFloat(form.minThreshold) || 0, costPrice: parseFloat(form.costPrice) || 0, portionPerSale: parseFloat(form.portionPerSale) || 0 }
    if (editingItem) updateStockItem({ ...item, id: editingItem.id })
    else addStockItem(item)
    setShowForm(false); setEditingItem(null); setForm(EMPTY_FORM)
  }

  const handleAdjust = (id) => {
    let delta = parseFloat(adjustDelta)
    if (isNaN(delta)) return
    const negativeReasons = ['Waste', 'Spoilage', 'Damaged', 'Staff meal', 'Returned to supplier']
    if (negativeReasons.includes(adjustReason) && delta > 0) delta = -delta
    adjustStock(id, delta, adjustReason)
    setAdjustingId(null); setAdjustDelta(''); setAdjustReason('Manual adjustment')
  }

  const getStockStatus = (item) => {
    if (item.quantity === 0)                       return { label: 'OUT',      color: '#EF4444', bg: '#EF444422' }
    if (item.quantity <= item.minThreshold)        return { label: 'LOW',      color: '#F59E0B', bg: '#F59E0B22' }
    if (item.quantity <= item.minThreshold * 1.5)  return { label: 'WATCH',    color: '#F97316', bg: '#F9731622' }
    return                                                { label: 'OK',       color: '#10B981', bg: '#10B98122' }
  }

  // ── Recommendations ──
  const now     = new Date()
  const daysBack = recoPeriod === 'week' ? 7 : 30
  const cutoff  = new Date(now - daysBack * 86400000).toISOString()
  const periodOrders = orderHistory.filter(o => o.closedAt >= cutoff)

  const usageMap = {}
  periodOrders.forEach(o => {
    o.items.forEach(item => {
      usageMap[item.id] = (usageMap[item.id] || 0) + item.qty
    })
  })

  const recommendations = stock
    .filter(s => s.menuItemId && usageMap[s.menuItemId])
    .map(s => {
      const soldQty    = usageMap[s.menuItemId] || 0
      const consumed   = soldQty * s.portionPerSale
      const dailyRate  = consumed / daysBack
      const sevenDay   = dailyRate * 7
      const suggested  = Math.max(0, Math.ceil(sevenDay - s.quantity))
      return { ...s, soldQty, consumed, dailyRate, sevenDay, suggested }
    })
    .sort((a, b) => b.suggested - a.suggested)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85;transform:translateY(-1px)}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
        .btn-green{background:#10B98122;color:#10B981;border:1px solid #10B98144}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.5rem 0.7rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;width:100%;outline:none;box-sizing:border-box}
        .input:focus{border-color:#F97316}
        .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.35rem;display:block}
        .tab{padding:0.4rem 1rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .cat-tab{padding:0.35rem 0.8rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;font-weight:700;transition:all 0.15s}
        .cat-tab.active{background:#1E293B;border-color:#334155;color:#94A3B8}
        .stock-row{display:grid;grid-template-columns:2fr 80px 80px 70px 90px 160px 140px;gap:0;padding:0.7rem 1rem;border-bottom:1px solid #0D0D14;align-items:center;transition:background 0.1s}
        .stock-row:hover{background:#13131A}
        .panel{background:#13131A;border:1px solid #F9731644;border-radius:14px;padding:1.5rem;margin-top:1.5rem}
        .alert-row{display:flex;justify-content:space-between;align-items:center;padding:0.65rem 1rem;border-radius:8px;margin-bottom:0.4rem}
        .period-tab{padding:0.35rem 0.85rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.7rem;font-weight:700;transition:all 0.15s}
        .period-tab.active{background:#3B82F622;border-color:#3B82F6;color:#3B82F6}
      `}</style>

      <div style={{ maxWidth: 1050, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>INVENTORY</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Stock Management</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={`tab ${activeTab === 'stock'   ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>📦 Stock</button>
            <button className={`tab ${activeTab === 'alerts'  ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
              🔔 Alerts {lowStock.length > 0 && <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', fontSize: '0.6rem', padding: '0 5px', marginLeft: 4 }}>{lowStock.length}</span>}
            </button>
            <button className={`tab ${activeTab === 'reorder' ? 'active' : ''}`} onClick={() => setActiveTab('reorder')}>📋 Reorder</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 History</button>
            <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🛒 Purchase Orders</button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Item</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'TOTAL ITEMS',   value: stock.length,        color: '#E2E8F0' },
            { label: 'LOW / OUT',     value: lowStock.length,     color: lowStock.length > 0 ? '#EF4444' : '#10B981' },
            { label: 'STOCK VALUE',   value: `€${totalValue.toFixed(2)}`, color: '#F97316' },
            { label: 'LINKED TO MENU', value: stock.filter(s => s.menuItemId).length, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.6rem 1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
          <div>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
              {categories.map(c => (
                <button key={c} className={`cat-tab ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden' }}>
              {!isMobile && <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 70px 90px 160px 140px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                {['ITEM', 'QTY', 'UNIT', 'MIN', 'COST/UNIT', 'SUPPLIER', 'STATUS'].map(h => (
                  <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                ))}
              </div>}

              {filtered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.78rem', color: '#334155' }}>No stock items yet</div>
              )}

              {filtered.map(item => {
                const status   = getStockStatus(item)
                const isAdjust = adjustingId === item.id
                const linked   = allMenuItems.find(m => m.id === item.menuItemId)
                const isEditing = editingItem?.id === item.id && showForm
                return (
                  <>
                  {isMobile ? (
                    <div key={item.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #0D0D14' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</div>
                          <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: '0.1rem' }}>{item.category}{linked ? ` · ${linked.name}` : ''} · 🚚 {item.deliveryDay}</div>
                          {item.supplierPhone && <a href={`tel:${item.supplierPhone}`} style={{ fontSize: '0.6rem', color: '#3B82F6', textDecoration: 'none', display: 'block' }}>📞 {item.supplierPhone}</a>}
                        </div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: status.bg, color: status.color, border: `1px solid ${status.color}44`, borderRadius: 5, padding: '1px 6px' }}>{status.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>QTY</div>
                          {isAdjust ? (
                            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input className="input" style={{ width: 52, padding: '0.2rem 0.4rem', fontSize: '0.72rem' }} placeholder="qty" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdjust(item.id)} autoFocus />
                              <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 6, padding: '0.2rem 0.3rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.62rem', outline: 'none' }}>
                                <option value="Manual adjustment">Manual</option>
                                <option value="Waste">🗑 Waste</option>
                                <option value="Spoilage">🤢 Spoilage</option>
                                <option value="Delivery received">🚚 Delivery</option>
                                <option value="Returned to supplier">↩ Return</option>
                                <option value="Damaged">💥 Damaged</option>
                                <option value="Staff meal">🍽 Staff meal</option>
                              </select>
                              <button className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={() => handleAdjust(item.id)}>✓</button>
                              <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={() => setAdjustingId(null)}>✕</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: status.color, cursor: 'pointer', textDecoration: 'underline dotted' }} onClick={() => { setAdjustingId(item.id); setAdjustDelta('') }}>
                              {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)} {item.unit}
                            </span>
                          )}
                        </div>
                        <div><div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>MIN</div><span style={{ fontSize: '0.78rem', color: '#475569' }}>{item.minThreshold}</span></div>
                        <div><div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.08em' }}>COST</div><span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>€{item.costPrice.toFixed(2)}</span></div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>✏</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteStockItem(item.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="stock-row">
                    
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.1rem' }}>
                        {item.category}{linked ? ` · linked: ${linked.name}` : ''}{' · '}🚚 {item.deliveryDay}
                      </div>
                    </div>

                    {/* Qty with adjust */}
                    <div>
                      {isAdjust ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              className="input"
                              style={{ width: 52, padding: '0.2rem 0.4rem', fontSize: '0.72rem' }}
                              placeholder={['Waste','Spoilage','Damaged','Staff meal','Returned to supplier'].includes(adjustReason) ? 'qty' : '+/-'}
                              value={adjustDelta}
                              onChange={e => setAdjustDelta(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAdjust(item.id)}
                              autoFocus
                            />
                            <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                              style={{ background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 6, padding: '0.2rem 0.3rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.62rem', outline: 'none' }}>
                              <option value="Manual adjustment">Manual</option>
                              <option value="Waste">🗑 Waste</option>
                              <option value="Spoilage">🤢 Spoilage</option>
                              <option value="Delivery received">🚚 Delivery</option>
                              <option value="Returned to supplier">↩ Return</option>
                              <option value="Damaged">💥 Damaged</option>
                              <option value="Staff meal">🍽 Staff meal</option>
                            </select>
                            <button className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={() => handleAdjust(item.id)}>✓</button>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }} onClick={() => setAdjustingId(null)}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{ fontSize: '0.88rem', fontWeight: 700, color: status.color, cursor: 'pointer', textDecoration: 'underline dotted' }}
                          title="Click to adjust"
                          onClick={() => { setAdjustingId(item.id); setAdjustDelta('') }}
                        >
                          {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.unit}</span>
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>{item.minThreshold}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>€{item.costPrice.toFixed(2)}</span>
                    <div>
  <div style={{ fontSize: '0.68rem', color: '#475569' }}>{item.supplier}</div>
  {item.supplierPhone && <a href={`tel:${item.supplierPhone}`} style={{ fontSize: '0.6rem', color: '#3B82F6', textDecoration: 'none' }}>📞 {item.supplierPhone}</a>}
  {item.supplierEmail && <a href={`mailto:${item.supplierEmail}`} style={{ fontSize: '0.6rem', color: '#3B82F6', textDecoration: 'none', display: 'block' }}>✉️ {item.supplierEmail}</a>}
</div>

                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, background: status.bg, color: status.color, border: `1px solid ${status.color}44`, borderRadius: 5, padding: '1px 6px' }}>
                        {status.label}
                      </span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.62rem' }} onClick={() => openEdit(item)}>✏</button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.62rem' }} onClick={() => deleteStockItem(item.id)}>✕</button>
                    </div>
                  </div>
                  )}
                  {isEditing && (
                    <div style={{ padding: '1.2rem', background: '#0D0D14', borderBottom: '1px solid #F9731644' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316', marginBottom: '1rem' }}>Editing — {editingItem.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
                        <div><span className="label">ITEM NAME</span><input className="input" value={form.name} onChange={e => f('name', e.target.value)} /></div>
                        <div><span className="label">CATEGORY</span><input className="input" value={form.category} onChange={e => f('category', e.target.value)} /></div>
                        <div><span className="label">UNIT</span><select className="input" value={form.unit} onChange={e => f('unit', e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                        <div><span className="label">CURRENT QTY</span><input className="input" type="number" value={form.quantity} onChange={e => f('quantity', e.target.value)} /></div>
                        <div><span className="label">MIN THRESHOLD</span><input className="input" type="number" value={form.minThreshold} onChange={e => f('minThreshold', e.target.value)} /></div>
                        <div><span className="label">COST PRICE (€)</span><input className="input" type="number" step="0.01" value={form.costPrice} onChange={e => f('costPrice', e.target.value)} /></div>
                        <div><span className="label">DELIVERY DAY</span><select className="input" value={form.deliveryDay} onChange={e => f('deliveryDay', e.target.value)}>{DELIVERY_DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div><span className="label">SUPPLIER</span><input className="input" value={form.supplier} onChange={e => f('supplier', e.target.value)} /></div>
                        <div><span className="label">SUPPLIER PHONE</span><input className="input" value={form.supplierPhone || ''} onChange={e => f('supplierPhone', e.target.value)} /></div>
                        <div><span className="label">SUPPLIER EMAIL</span><input className="input" value={form.supplierEmail || ''} onChange={e => f('supplierEmail', e.target.value)} /></div>
                        <div><span className="label">LINK TO MENU ITEM</span><select className="input" value={form.menuItemId} onChange={e => f('menuItemId', e.target.value)}><option value="">Not linked</option>{allMenuItems.map(m => <option key={m.id} value={m.id}>{m.cat} — {m.name}</option>)}</select></div>
                        {form.menuItemId && <div><span className="label">UNITS PER SALE</span><input className="input" type="number" step="0.01" value={form.portionPerSale} onChange={e => f('portionPerSale', e.target.value)} /></div>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                        <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingItem(null) }}>Cancel</button>
                      </div>
                    </div>
                  )}
                  </>
                )
              })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.6rem' }}>
              💡 Click any quantity number to adjust stock manually
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div>
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#10B981', fontSize: '0.9rem' }}>
                ✅ All stock levels are healthy
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '1rem' }}>
                  {lowStock.length} item{lowStock.length !== 1 ? 's' : ''} need attention
                </div>
                {lowStock.sort((a, b) => a.quantity - b.quantity).map(item => {
                  const status = getStockStatus(item)
                  return (
                    <div key={item.id} className="alert-row" style={{ background: status.bg, border: `1px solid ${status.color}33` }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: status.color }}>{item.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.15rem' }}>
  {item.supplier} · Delivery: {item.deliveryDay}
</div>
{item.supplierPhone && <a href={`tel:${item.supplierPhone}`} style={{ fontSize: '0.62rem', color: '#3B82F6', textDecoration: 'none' }}>📞 {item.supplierPhone}</a>}
{item.supplierEmail && <a href={`mailto:${item.supplierEmail}`} style={{ fontSize: '0.62rem', color: '#3B82F6', textDecoration: 'none', marginLeft: '0.5rem' }}>✉️ {item.supplierEmail}</a>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: status.color }}>{item.quantity} <span style={{ fontSize: '0.65rem' }}>{item.unit}</span></div>
                        <div style={{ fontSize: '0.62rem', color: '#475569' }}>min: {item.minThreshold}</div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* REORDER TAB */}
        {activeTab === 'reorder' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em' }}>BASED ON SALES FROM</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className={`period-tab ${recoPeriod === 'week'  ? 'active' : ''}`} onClick={() => setRecoPeriod('week')}>Last 7 Days</button>
                <button className={`period-tab ${recoPeriod === 'month' ? 'active' : ''}`} onClick={() => setRecoPeriod('month')}>Last 30 Days</button>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#334155' }}>{periodOrders.length} orders analysed</span>
            </div>

            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#334155', fontSize: '0.85rem' }}>
                No linked stock items with order history yet
              </div>
            ) : (
              <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 100px 110px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
                  {['ITEM', 'CURRENT', 'SOLD', 'USED', '7-DAY NEED', 'SUGGESTED ORDER'].map(h => (
                    <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                  ))}
                </div>
                {recommendations.map(item => {
                  const urgent = item.suggested > 0
                  return (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 100px 110px', padding: '0.75rem 1rem', borderBottom: '1px solid #0D0D14', alignItems: 'center', background: urgent ? '#F9731608' : 'transparent' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#334155' }}>{item.supplier} · {item.deliveryDay}</div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: getStockStatus(item).color, fontWeight: 700 }}>{item.quantity} {item.unit}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.soldQty} sold</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.consumed.toFixed(1)} {item.unit}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.sevenDay.toFixed(1)} {item.unit}</span>
                      <div>
                        {item.suggested > 0 ? (
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316', background: '#F9731622', border: '1px solid #F9731644', borderRadius: 6, padding: '2px 10px' }}>
                            +{item.suggested} {item.unit}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#10B981' }}>✓ Sufficient</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.8rem' }}>
              💡 Suggested order = estimated 7-day usage minus current stock · based on {recoPeriod === 'week' ? 'last 7' : 'last 30'} days of sales
            </div>
          </div>
        )}

        {/* PURCHASE ORDERS TAB */}
{activeTab === 'orders' && (
  <div>
    {/* Group low/needed stock by supplier */}
    {(() => {
      const needed = stock.filter(s => s.quantity <= s.minThreshold || recommendations.find(r => r.id === s.id && r.suggested > 0))
      const bySupplier = needed.reduce((acc, s) => {
        const key = s.supplier || 'Unknown Supplier'
        if (!acc[key]) acc[key] = { supplier: key, phone: s.supplierPhone, email: s.supplierEmail, items: [] }
        const rec = recommendations.find(r => r.id === s.id)
        acc[key].items.push({ ...s, suggested: rec?.suggested || Math.max(0, s.minThreshold * 2 - s.quantity) })
        return acc
      }, {})

      if (Object.keys(bySupplier).length === 0) return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#10B981', fontSize: '0.85rem' }}>✅ No purchase orders needed right now</div>
      )

      return Object.values(bySupplier).map(({ supplier, phone, email, items }) => {
        const printOrder = () => {
          const rows = items.map(i => `<tr><td>${i.name}</td><td>${i.unit}</td><td>${i.quantity}</td><td>${i.minThreshold}</td><td><strong>${i.suggested}</strong></td></tr>`).join('')
          const html = `<html><head><title>Purchase Order</title><style>body{font-family:monospace;padding:1.5rem;max-width:500px;margin:0 auto}h1{font-size:1rem}table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:1rem}td,th{padding:0.4rem;border-bottom:1px solid #ddd}th{text-align:left}.div{border-top:1px dashed #bbb;margin:0.8rem 0}</style></head><body>
            <h1>PURCHASE ORDER</h1>
            <div>${new Date().toLocaleDateString('en-IE')} · ${new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="div"></div>
            <strong>${supplier}</strong>${phone ? `<br/>📞 ${phone}` : ''}${email ? `<br/>✉️ ${email}` : ''}
            <table><thead><tr><th>Item</th><th>Unit</th><th>Current</th><th>Min</th><th>Order Qty</th></tr></thead><tbody>${rows}</tbody></table>
            <div class="div"></div>
            <div style="font-size:0.75rem;color:#666">Generated by POS System</div>
          </body></html>`
          const win = window.open('', '_blank')
          win.document.write(html)
          win.document.close()
          win.print()
        }

        const emailOrder = () => {
          const subject = encodeURIComponent(`Purchase Order — ${new Date().toLocaleDateString('en-IE')}`)
          const body = encodeURIComponent([
            `Purchase Order — ${new Date().toLocaleDateString('en-IE')}`,
            ``,
            `Dear ${supplier},`,
            ``,
            `Please supply the following items:`,
            ``,
            ...items.map(i => `${i.name} — ${i.suggested} ${i.unit}`),
            ``,
            `Thank you`,
          ].join('\n'))
          window.open(`mailto:${email || ''}?subject=${subject}&body=${body}`)
        }

        return (
          <div key={supplier} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '1.2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#CBD5E1' }}>{supplier}</div>
                {phone && <a href={`tel:${phone}`} style={{ fontSize: '0.68rem', color: '#3B82F6', textDecoration: 'none', display: 'block' }}>📞 {phone}</a>}
                {email && <a href={`mailto:${email}`} style={{ fontSize: '0.68rem', color: '#3B82F6', textDecoration: 'none', display: 'block' }}>✉️ {email}</a>}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={printOrder}>🖨️ Print</button>
                <button className="btn btn-ghost btn-sm" onClick={emailOrder}>✉️ Email</button>
              </div>
            </div>
            <div style={{ background: '#0D0D14', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', padding: '0.5rem 0.8rem', borderBottom: '1px solid #1E1E2E' }}>
                {['ITEM', 'UNIT', 'CURRENT', 'MIN', 'ORDER QTY'].map(h => (
                  <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
                ))}
              </div>
              {items.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', padding: '0.5rem 0.8rem', borderBottom: '1px solid #0A0A0F', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{item.name}</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{item.unit}</span>
                  <span style={{ fontSize: '0.72rem', color: getStockStatus(item).color, fontWeight: 700 }}>{item.quantity}</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{item.minThreshold}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F97316' }}>{item.suggested} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })
    })()}
  </div>
)}

        {/* HISTORY TAB */}
{activeTab === 'history' && (
  <div>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
      <input placeholder="Search item..." onChange={e => setHistorySearch(e.target.value)}
        style={{ background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 8, padding: '0.45rem 0.7rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none', flex: 1 }} />
    </div>
    {[...stockMovements].reverse().filter(m => !historySearch || m.stockItemName.toLowerCase().includes(historySearch.toLowerCase())).slice(0, 100).length === 0 ? (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#334155', fontSize: '0.85rem' }}>No stock movements yet</div>
    ) : (
      <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr 120px 100px', padding: '0.6rem 1rem', borderBottom: '1px solid #1E1E2E' }}>
          {['ITEM', 'CHANGE', 'AFTER', 'REASON', 'BY', 'TIME'].map(h => (
            <span key={h} style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>
        {[...stockMovements].reverse().filter(m => !historySearch || m.stockItemName.toLowerCase().includes(historySearch.toLowerCase())).slice(0, 100).map(m => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr 120px 100px', padding: '0.6rem 1rem', borderBottom: '1px solid #0D0D14', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{m.stockItemName}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: m.delta > 0 ? '#10B981' : '#EF4444' }}>{m.delta > 0 ? `+${m.delta.toFixed(2)}` : m.delta.toFixed(2)}</span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{m.after.toFixed(2)}</span>
            <span style={{ fontSize: '0.68rem', color: '#475569' }}>{m.reason}</span>
            <span style={{ fontSize: '0.68rem', color: '#475569' }}>{m.by}</span>
            <span style={{ fontSize: '0.65rem', color: '#334155' }}>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {new Date(m.at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {/* ADD / EDIT FORM — only show for new items */}
        {showForm && !editingItem && (
          <div className="panel">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F97316', marginBottom: '1.2rem' }}>
              {editingItem ? `Editing — ${editingItem.name}` : 'New Stock Item'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">ITEM NAME</span><input className="input" placeholder="e.g. Beef Patties" value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><span className="label">CATEGORY</span><input className="input" placeholder="e.g. Mains" value={form.category} onChange={e => f('category', e.target.value)} /></div>
              <div>
                <span className="label">UNIT</span>
                <select className="input" value={form.unit} onChange={e => f('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">CURRENT QTY</span><input className="input" type="number" value={form.quantity} onChange={e => f('quantity', e.target.value)} /></div>
              <div><span className="label">MIN THRESHOLD</span><input className="input" type="number" value={form.minThreshold} onChange={e => f('minThreshold', e.target.value)} /></div>
              <div><span className="label">COST PRICE (€)</span><input className="input" type="number" step="0.01" value={form.costPrice} onChange={e => f('costPrice', e.target.value)} /></div>
              <div>
                <span className="label">DELIVERY DAY</span>
                <select className="input" value={form.deliveryDay} onChange={e => f('deliveryDay', e.target.value)}>
                  {DELIVERY_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">SUPPLIER</span><input className="input" placeholder="Supplier name" value={form.supplier} onChange={e => f('supplier', e.target.value)} /></div>
<div><span className="label">SUPPLIER PHONE</span><input className="input" placeholder="01 234 5678" value={form.supplierPhone || ''} onChange={e => f('supplierPhone', e.target.value)} /></div>
<div><span className="label">SUPPLIER EMAIL</span><input className="input" placeholder="orders@supplier.com" value={form.supplierEmail || ''} onChange={e => f('supplierEmail', e.target.value)} /></div>
              <div>
                <span className="label">LINK TO MENU ITEM (optional — for auto-deduct)</span>
                <select className="input" value={form.menuItemId} onChange={e => f('menuItemId', e.target.value)}>
                  <option value="">Not linked</option>
                  {allMenuItems.map(m => <option key={m.id} value={m.id}>{m.cat} — {m.name}</option>)}
                </select>
              </div>
            </div>
            {form.menuItemId && (
              <div style={{ marginBottom: '0.8rem', maxWidth: 220 }}>
                <span className="label">UNITS USED PER SALE</span>
                <input className="input" type="number" step="0.01" placeholder="e.g. 1 or 0.2" value={form.portionPerSale} onChange={e => f('portionPerSale', e.target.value)} />
                <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: '0.3rem' }}>e.g. 1 burger = 1 portion · 1 glass wine = 0.2 bottles</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingItem ? 'Save Changes' : 'Add Item'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingItem(null) }}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}