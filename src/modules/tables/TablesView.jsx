import { useEffect, useRef, useState } from 'react'
import { usePOS, getAutoTableStatus, getItemCourse } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const DEFAULT_SIZE = 90
const SIZES = {
  small:  { w: 70,  h: 70,  label: 'Small'  },
  medium: { w: 90,  h: 90,  label: 'Medium' },
  large:  { w: 110, h: 110, label: 'Large'  },
  xl:     { w: 130, h: 130, label: 'XL'     },
}
const RECT_SIZES = {
  small:  { w: 110, h: 70,  label: 'Small'  },
  medium: { w: 140, h: 90,  label: 'Medium' },
  large:  { w: 180, h: 100, label: 'Large'  },
  xl:     { w: 220, h: 110, label: 'XL'     },
}
const CANVAS_W  = 1600
const CANVAS_H  = 800
const GRID_SIZE = 40

const STATUS_CONFIG = {
  free:     { color: '#10B981', bg: '#10B98130', border: '#10B98166', label: 'Free'     },
  occupied: { color: '#F97316', bg: '#F9731630', border: '#F9731666', label: 'Occupied' },
  reserved: { color: '#3B82F6', bg: '#3B82F630', border: '#3B82F666', label: 'Reserved' },
}

function TableTimer({ placedAt }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!placedAt) return
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [placedAt])
  if (!placedAt) return null
  const color = elapsed >= 60 ? '#EF4444' : elapsed >= 30 ? '#F59E0B' : '#94A3B8'
  return (
    <div style={{ fontSize: '0.45rem', color, fontWeight: 700, marginTop: '0.1rem' }}>
      {elapsed}m
    </div>
  )
}

// ─── Modifier Picker ──────────────────────────────────────────────────────────
function ModifierPicker({ item, onConfirm, onCancel }) {
  const [selections,         setSelections]         = useState({})
  const [optionalSelections, setOptionalSelections] = useState({})
  const modifiers      = item.modifiers || []
  const requiredGroups = modifiers.filter(g => g.required)
  const optionalGroups = modifiers.filter(g => !g.required)
  const allRequiredMet = requiredGroups.every(g => selections[g.id])
  const totalExtra     = [...Object.values(selections), ...Object.values(optionalSelections).flat()].reduce((s, o) => s + (o?.price || 0), 0)

  const handleConfirm = () => {
    const chosen = [
      ...Object.entries(selections).map(([gid, opt]) => ({ groupName: modifiers.find(g => g.id === gid).name, optionName: opt.name, price: opt.price, required: true })),
      ...Object.entries(optionalSelections).flatMap(([gid, opts]) => opts.map(opt => ({ groupName: modifiers.find(g => g.id === gid).name, optionName: opt.name, price: opt.price, required: false }))),
    ]
    onConfirm(chosen, totalExtra)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ background: '#0F0F17', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 400, fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
        <style>{`.mopt{padding:0.5rem 0.8rem;border-radius:8px;border:1px solid #1E1E2E;background:#13131A;color:#94A3B8;cursor:pointer;font-family:'Courier New',monospace;font-size:0.75rem;width:100%;margin-bottom:0.3rem;text-align:left}.mopt.sel{border-color:#F97316;background:#F9731622;color:#F97316}`}</style>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#475569', marginBottom: '0.3rem' }}>CUSTOMISE</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem' }}>{item.name}</div>
        {requiredGroups.map(group => (
          <div key={group.id} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#F97316', fontWeight: 700, marginBottom: '0.5rem' }}>
              {group.name.toUpperCase()} <span style={{ fontSize: '0.58rem', background: '#F9731622', padding: '1px 5px', borderRadius: 3 }}>REQUIRED</span>
            </div>
            {group.options.map(opt => (
              <button key={opt.id} className={`mopt ${selections[group.id]?.id === opt.id ? 'sel' : ''}`} onClick={() => setSelections(p => ({ ...p, [group.id]: opt }))}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{opt.name}</span>
                  <span style={{ color: opt.price > 0 ? '#10B981' : '#475569' }}>{opt.price > 0 ? `+€${opt.price.toFixed(2)}` : ''}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
        {optionalGroups.map(group => (
          <div key={group.id} style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginBottom: '0.5rem' }}>
              {group.name.toUpperCase()} <span style={{ fontSize: '0.58rem', background: '#1E293B', padding: '1px 5px', borderRadius: 3 }}>OPTIONAL</span>
            </div>
            {group.options.map(opt => {
              const selected = (optionalSelections[group.id] || []).some(o => o.id === opt.id)
              return (
                <button key={opt.id} className={`mopt ${selected ? 'sel' : ''}`} onClick={() => setOptionalSelections(p => {
                  const cur = p[group.id] || []
                  return { ...p, [group.id]: selected ? cur.filter(o => o.id !== opt.id) : [...cur, opt] }
                })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{opt.name}</span>
                    <span style={{ color: opt.price > 0 ? '#10B981' : '#475569' }}>{opt.price > 0 ? `+€${opt.price.toFixed(2)}` : ''}</span>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={handleConfirm} disabled={!allRequiredMet}
            style={{ flex: 1, border: 'none', borderRadius: 8, padding: '0.65rem', background: allRequiredMet ? '#F97316' : '#1E1E2E', color: allRequiredMet ? '#000' : '#334155', fontFamily: "'Courier New', monospace", fontWeight: 700, cursor: allRequiredMet ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>
            Add {totalExtra > 0 ? `(+€${totalExtra.toFixed(2)})` : ''}
          </button>
          <button onClick={onCancel} style={{ border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.65rem 1rem', background: '#13131A', color: '#94A3B8', fontFamily: "'Courier New', monospace", fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Item Picker ──────────────────────────────────────────────────────────────
function ItemPicker({ tableId, existingOrder, onClose }) {
  const { menu, placeOrder, updateOrder, orders, currentUser, customers } = usePOS()
  const { isMobile: pickerMobile } = useBreakpoint()

  const existing    = existingOrder || orders.find(o => o.table === tableId)
  const [activeCategory,   setActiveCategory]   = useState(Object.keys(menu)[0])
  const [currentItems,     setCurrentItems]     = useState(existing?.items?.map(i => ({ ...i, _key: i.id + JSON.stringify(i.modifiers || []) })) || [])
  const [modifierItem,     setModifierItem]     = useState(null)
  const [linkedCustomerId, setLinkedCustomerId] = useState(existing?.customerId || null)

  const total = currentItems.reduce((s, i) => s + (i.price + (i.modifierTotal || 0)) * i.qty, 0)

  const handleAddItem = (item) => { if (item.modifiers?.length > 0) { setModifierItem(item); return } addItemDirect(item, [], 0) }

  const addItemDirect = (item, modifiers, modifierTotal, note = '') => {
    setCurrentItems(prev => {
      const key    = item.id + JSON.stringify(modifiers)
      const exists = prev.find(i => i._key === key)
      if (exists) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1, modifiers, modifierTotal, note, _key: key }]
    })
  }

  const removeItem = (key) => {
    setCurrentItems(prev => {
      const exists = prev.find(i => i._key === key)
      if (!exists) return prev
      if (exists.qty === 1) return prev.filter(i => i._key !== key)
      return prev.map(i => i._key === key ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  const handleSave = () => {
    if (currentItems.length === 0) return
    const itemsWithAllergens = currentItems.map(i => {
      const menuItem = Object.values(menu).flat().find(m => m.id === i.id)
      return { ...i, allergens: menuItem?.allergens || 'None' }
    })
    if (existing) {
      updateOrder({ ...existing, items: itemsWithAllergens, total, customerId: linkedCustomerId })
    } else {
      placeOrder({ id: Date.now(), table: tableId, items: itemsWithAllergens, total, status: 'pending', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), customerId: linkedCustomerId })
    }
    onClose()
  }

  const orderAllergens = [...new Set(currentItems.flatMap(i => {
    const m = Object.values(menu).flat().find(m => m.id === i.id)
    return m?.allergens && m.allergens !== 'None' ? m.allergens.split(', ') : []
  }))]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0A0F', zIndex: 900, display: 'flex', flexDirection: 'column', fontFamily: "'Courier New', monospace", color: '#E2E8F0' }}>
      <style>{`
        .ip-btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .ip-btn:hover{opacity:0.85}
        .ip-primary{background:#F97316;color:#000}
        .ip-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .ip-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .ip-tab{padding:0.4rem 0.9rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
        .ip-tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .ip-item{display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0.8rem;border-radius:8px;background:#0D0D14;border:1px solid #1E1E2E;margin-bottom:0.4rem;transition:border-color 0.15s}
        .ip-item:hover{border-color:#3B3B52}
        .qty-btn{width:26px;height:26px;border-radius:50%;border:1px solid #3B3B52;background:#13131A;color:#E2E8F0;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .qty-btn:hover{background:#F97316;border-color:#F97316;color:#000}
        .ip-input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.4rem 0.6rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.75rem;outline:none;box-sizing:border-box}
        .ip-input:focus{border-color:#F97316}
      `}</style>

      {modifierItem && (
        <ModifierPicker item={modifierItem} onConfirm={(mods, extra, note) => { addItemDirect(modifierItem, mods, extra, note); setModifierItem(null) }} onCancel={() => setModifierItem(null)} />
      )}

      <div style={{ background: '#13131A', borderBottom: '1px solid #1E1E2E', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button className="ip-btn ip-ghost ip-sm" onClick={onClose}>✕ Exit</button>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em' }}>{existing ? 'EDIT ORDER' : 'NEW ORDER'}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>Table {tableId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {(() => {
            const linked = customers.find(c => c.id === linkedCustomerId)
            return linked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F9731611', border: '1px solid #F9731633', borderRadius: 8, padding: '0.3rem 0.7rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#F97316', fontWeight: 700 }}>🏆 {linked.name}</span>
                <button className="ip-btn ip-ghost ip-sm" style={{ padding: '0.1rem 0.4rem' }} onClick={() => setLinkedCustomerId(null)}>✕</button>
              </div>
            ) : (
              <select className="ip-input" value="" onChange={e => setLinkedCustomerId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">👤 Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )
          })()}
          <button className="ip-btn ip-primary" disabled={currentItems.length === 0} style={{ opacity: currentItems.length ? 1 : 0.4 }} onClick={handleSave}>
            {existing ? '✓ Save' : '✓ Place Order'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: pickerMobile ? '1fr' : '1fr 300px', gridTemplateRows: pickerMobile ? '1fr auto' : '1fr', overflow: 'hidden' }}>
        <div style={{ overflow: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {Object.keys(menu).map(cat => (
              <button key={cat} className={`ip-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
          {(menu[activeCategory] || []).map(item => {
            const inOrder  = currentItems.filter(i => i.id === item.id)
            const totalQty = inOrder.reduce((s, i) => s + i.qty, 0)
            const hasMods  = item.modifiers?.length > 0
            return (
              <div className="ip-item" key={item.id} style={{ opacity: item.available ? 1 : 0.45, pointerEvents: item.available ? 'auto' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</span>
                    {!item.available && <span style={{ fontSize: '0.58rem', background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>86'd</span>}
                    {hasMods && <span style={{ fontSize: '0.58rem', color: '#8B5CF6', background: '#8B5CF622', border: '1px solid #8B5CF644', borderRadius: 4, padding: '1px 5px' }}>customisable</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#F97316', marginTop: '0.1rem' }}>€{item.price.toFixed(2)}</div>
                  {item.allergens && item.allergens !== 'None' && (
                    <span title={item.allergens} style={{ fontSize: '0.62rem', color: '#F59E0B', cursor: 'help', marginTop: '0.1rem', display: 'inline-block' }}>⚠</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {totalQty > 0 && !hasMods && (
                    <>
                      <button className="qty-btn" onClick={() => removeItem(currentItems.find(i => i.id === item.id)?._key)}>−</button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{totalQty}</span>
                    </>
                  )}
                  <button className="qty-btn" onClick={() => handleAddItem(item)}>+</button>
                  {totalQty > 0 && !hasMods && (
                    <input
                      placeholder="note..."
                      value={currentItems.find(i => i.id === item.id)?.note || ''}
                      onChange={e => setCurrentItems(prev => prev.map(i => i.id === item.id ? { ...i, note: e.target.value } : i))}
                      onClick={e => e.stopPropagation()}
                      style={{ width: pickerMobile ? 60 : 80, background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 6, padding: '0.2rem 0.4rem', color: '#F59E0B', fontFamily: "'Courier New', monospace", fontSize: '0.6rem', outline: 'none' }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderLeft: pickerMobile ? 'none' : '1px solid #1E1E2E', borderTop: pickerMobile ? '1px solid #1E1E2E' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: pickerMobile ? 220 : 'none', background: '#0A0A0F' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #1E1E2E', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em' }}>ORDER SUMMARY</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem' }}>
            {currentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: '#334155' }}>No items yet</div>
            ) : currentItems.map(i => (
              <div key={i._key} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{i.name} ×{i.qty}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>€{((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</span>
                    <button className="qty-btn" style={{ width: 20, height: 20, fontSize: '0.7rem' }} onClick={() => removeItem(i._key)}>−</button>
                  </div>
                </div>
                {i.modifiers?.length > 0 && <div style={{ fontSize: '0.62rem', color: '#8B5CF6', marginTop: '0.1rem' }}>{i.modifiers.map(m => m.optionName).join(', ')}</div>}
                {i.note && <div style={{ fontSize: '0.6rem', color: '#F59E0B', marginTop: '0.1rem' }}>📝 {i.note}</div>}
              </div>
            ))}
          </div>
          {orderAllergens.length > 0 && (
            <div style={{ margin: '0 0.8rem', background: '#F59E0B22', border: '1px solid #F59E0B44', borderRadius: 8, padding: '0.5rem 0.7rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.2rem' }}>⚠ ALLERGENS</div>
              <div style={{ fontSize: '0.65rem', color: '#F59E0B' }}>{orderAllergens.join(' · ')}</div>
            </div>
          )}
          <div style={{ padding: '0.8rem', borderTop: '1px solid #1E1E2E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Table Popup ──────────────────────────────────────────────────────────────
function TablePopup({ table, status, order, booking, onClose, onOpenPicker, onOpenEditPicker }) {
  const { closeOrder, openPayment, updateBookingStatus, fireCourse, serveCourse, orderHistory, staff, currentUser } = usePOS()

  const shiftStart = (() => {
    const member = staff.find(s => s.id === currentUser?.id)
    const lastIn  = member?.clockRecords?.filter(r => r.in)?.slice(-1)[0]?.in
    return lastIn ? new Date(lastIn) : new Date(new Date().setHours(0, 0, 0, 0))
  })()

  const tableHistory = orderHistory
    .filter(o => o.table === table.id && o.closedAt && new Date(o.closedAt) >= shiftStart)
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 5)
  const sc           = STATUS_CONFIG[status]
  const courses      = order?.courses      || {}
  const servedCourses= order?.servedCourses || {}
  const kitchenReady = order?.status === 'ready'

  // Work out what stage the table is at
  const getTableStage = () => {
    if (!order) return null

    const hasFoodItems = order.items?.some(i => i.id?.startsWith('s') || i.id?.startsWith('m') || i.id?.startsWith('d'))

    // Check each course in order
    for (const course of ['starters', 'mains', 'desserts']) {
      const hasCourse  = courses[course] && courses[course] !== 'none'
      if (!hasCourse) continue
      const isFired    = courses[course] === 'fired'
      const isServed   = servedCourses[course]
      const isWaiting  = courses[course] === 'waiting'

      if (isWaiting) return { stage: 'waiting', course, label: `Waiting to fire ${course}`, color: '#475569', icon: '⏳' }
      if (isFired && !isServed && kitchenReady) return { stage: 'collect', course, label: `🍽️ COLLECT ${course.toUpperCase()} — READY!`, color: '#10B981', icon: '🍽️', pulse: true }
      if (isFired && !isServed && !kitchenReady) return { stage: 'cooking', course, label: `Kitchen cooking ${course}`, color: '#3B82F6', icon: '👨‍🍳' }
      if (isFired && isServed) continue
    }

    // Check if any courses still waiting or in progress
    const hasWaiting = Object.values(courses).some(v => v === 'waiting')
    if (hasWaiting) return { stage: 'waiting', course: null, label: 'Waiting to fire next course', color: '#475569', icon: '⏳' }

    // All courses served
    const allFiredCourses = Object.entries(courses).filter(([, v]) => v === 'fired').map(([k]) => k)
    const allServed = allFiredCourses.every(c => servedCourses[c])
    if (allServed && allFiredCourses.length > 0) return { stage: 'done', label: 'All courses served', color: '#F97316', icon: '✅' }

    return { stage: 'ordered', label: 'Order placed — waiting', color: '#475569', icon: '⏳' }
  }

  const stage = getTableStage()
  const canFireMains    = courses.mains    === 'waiting'
  const canFireDesserts = courses.desserts === 'waiting'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 800, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#0F0F17', border: `1px solid ${sc.border}`, borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 380, fontFamily: "'Courier New', monospace", color: '#E2E8F0', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <style>{`
          .tp-btn{border:none;border-radius:10px;padding:0.7rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.8rem;font-weight:700;transition:all 0.15s;width:100%;text-align:left;margin-bottom:0.4rem;display:block}
          .tp-btn:hover{opacity:0.85;transform:translateY(-1px)}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        `}</style>

        {/* Table header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>Table {table.id}</div>
            <div style={{ fontSize: '0.65rem', color: sc.color, fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.15rem' }}>● {sc.label.toUpperCase()}</div>
            <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.1rem' }}>{table.seats} seats · {table.shape}</div>
          </div>
          <button onClick={onClose} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem' }}>✕</button>
        </div>

        {/* FREE */}
        {status === 'free' && (
          <>
            <button className="tp-btn" style={{ background: '#10B98122', color: '#10B981', border: '1px solid #10B98144' }} onClick={() => { onClose(); onOpenPicker() }}>
              🍽️ New Order
            </button>
            {tableHistory.length > 0 && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #1E1E2E', paddingTop: '0.7rem' }}>
                <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>LAST ORDER THIS SHIFT</div>
                {tableHistory.slice(0, 2).map(o => (
                  <div key={o.id} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#475569' }}>{new Date(o.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>€{o.total.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#334155' }}>
                      {(o.items || []).slice(0, 3).map(i => `${i.name} ×${i.qty}`).join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* RESERVED */}
        {status === 'reserved' && booking && (
          <>
            <div style={{ background: '#3B82F611', border: '1px solid #3B82F633', borderRadius: 10, padding: '0.8rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.3rem' }}>{booking.name}</div>
              <div style={{ fontSize: '0.68rem', color: '#475569' }}>{booking.time} · {booking.guests} guests · {booking.duration || 90}min</div>
              {booking.notes && <div style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: '0.3rem' }}>⚠ {booking.notes}</div>}
            </div>
            <button className="tp-btn" style={{ background: '#3B82F622', color: '#3B82F6', border: '1px solid #3B82F644' }} onClick={() => { updateBookingStatus(booking.id, 'seated'); onClose(); onOpenPicker() }}>
              🪑 Seat & Start Order
            </button>
            <button className="tp-btn" style={{ background: '#13131A', color: '#94A3B8', border: '1px solid #1E1E2E' }} onClick={onClose}>Close</button>
          </>
        )}

        {/* OCCUPIED */}
        {status === 'occupied' && order && (
          <>
            {/* ── LIVE STATUS BANNER ── */}
            {stage && (
              <div style={{
                background: stage.color + '22',
                border: `2px solid ${stage.color}55`,
                borderRadius: 12,
                padding: '0.8rem 1rem',
                marginBottom: '1rem',
                animation: stage.pulse ? 'pulse 1.5s infinite' : 'none',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{stage.icon}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: stage.color }}>{stage.label}</div>
                {stage.stage === 'collect' && (
                  <button
                    onClick={() => serveCourse(order.id, stage.course)}
                    style={{ marginTop: '0.6rem', border: 'none', background: stage.color, color: '#000', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.78rem', fontWeight: 700, width: '100%' }}>
                    ✓ Served to Table
                  </button>
                )}
              </div>
            )}

            {/* ── COURSE TIMELINE ── */}
            <div style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.7rem 0.8rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>COURSE STATUS</div>
              {['starters', 'mains', 'desserts'].map(course => {
                const courseStatus = courses[course]
                if (!courseStatus || courseStatus === 'none') return null
                const isServed  = servedCourses[course]
                const isFired   = courseStatus === 'fired'
                const isWaiting = courseStatus === 'waiting'
                const icons     = { starters: '🥗', mains: '🍽️', desserts: '🍰' }
                const colors    = { starters: '#10B981', mains: '#F97316', desserts: '#8B5CF6' }
                const c         = colors[course]

                const stateLabel = isServed ? '✅ Served' : isFired && kitchenReady ? '🍽️ Ready' : isFired ? '👨‍🍳 Cooking' : '⏳ Waiting'
                const stateColor = isServed ? '#334155' : isFired && kitchenReady ? '#10B981' : isFired ? '#3B82F6' : '#334155'

                return (
                  <div key={course} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', opacity: isServed ? 0.45 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem' }}>{icons[course]}</span>
                      <span style={{ fontSize: '0.72rem', color: isServed ? '#334155' : c, fontWeight: 600 }}>
                        {course.charAt(0).toUpperCase() + course.slice(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.62rem', color: stateColor, fontWeight: 700 }}>{stateLabel}</span>
                      {isWaiting && (
                        <button onClick={() => fireCourse(order.id, course)}
                          style={{ border: `1px solid ${c}55`, background: c + '22', color: c, borderRadius: 6, padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.6rem', fontWeight: 700 }}>
                          🔥 Fire
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── ORDER ITEMS ── */}
            <div style={{ background: '#0D0D14', borderRadius: 10, padding: '0.8rem', marginBottom: '1rem', maxHeight: 140, overflowY: 'auto' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{item.name} ×{item.qty}</span>
                    <span style={{ fontSize: '0.73rem', color: '#CBD5E1' }}>€{((item.price + (item.modifierTotal || 0)) * item.qty).toFixed(2)}</span>
                  </div>
                  {item.modifiers?.length > 0 && <div style={{ fontSize: '0.6rem', color: '#8B5CF6' }}>{item.modifiers.map(m => m.optionName).join(', ')}</div>}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* ── ACTIONS ── */}
            <button className="tp-btn" style={{ background: '#F9731622', color: '#F97316', border: '1px solid #F9731644' }} onClick={() => { onClose(); onOpenEditPicker(order) }}>✏️ Edit Order</button>
            <button className="tp-btn" style={{ background: '#10B98122', color: '#10B981', border: '1px solid #10B98144' }} onClick={() => { onClose(); openPayment(order.id) }}>💳 Pay — €{order.total.toFixed(2)}</button>
            <button className="tp-btn" style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433' }} onClick={() => { closeOrder(order.id); onClose() }}>🗑 Cancel Order</button>

            {/* Shift history for this table */}
            {tableHistory.length > 0 && (
              <div style={{ marginTop: '0.8rem', borderTop: '1px solid #1E1E2E', paddingTop: '0.8rem' }}>
                <div style={{ fontSize: '0.58rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>THIS TABLE — SHIFT HISTORY</div>
                {tableHistory.map(o => (
                  <div key={o.id} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#475569' }}>{new Date(o.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>€{o.total.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#334155' }}>
                      {(o.items || []).slice(0, 3).map(i => `${i.name} ×${i.qty}`).join(' · ')}
                      {(o.items || []).length > 3 ? ` +${o.items.length - 3} more` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Floor Editor ─────────────────────────────────────────────────────────────
function FloorEditor({ onClose }) {
  const { floors, addFloor, updateFloor, deleteFloor } = usePOS()
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editColor, setEditColor] = useState('#3B82F6')
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState('#8B5CF6')

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6']

  const startEdit = (floor) => { setEditingId(floor.id); setEditName(floor.name); setEditColor(floor.color) }
  const saveEdit  = () => { if (!editName.trim()) return; updateFloor({ id: editingId, name: editName.trim(), color: editColor }); setEditingId(null) }
  const handleAdd = () => { if (!newName.trim()) return; addFloor({ name: newName.trim(), color: newColor }); setNewName('') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 850, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#0F0F17', border: '1px solid #1E1E2E', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420, fontFamily: "'Courier New', monospace", color: '#E2E8F0' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Manage Floors</div>
          <button onClick={onClose} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem' }}>✕</button>
        </div>

        {floors.map(floor => (
          <div key={floor.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, marginBottom: '0.4rem' }}>
            {editingId === floor.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ flex: 1, background: '#0D0D14', border: '1px solid #F97316', borderRadius: 6, padding: '0.3rem 0.5rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {COLORS.map(c => <div key={c} onClick={() => setEditColor(c)} style={{ width: 16, height: 16, borderRadius: '50%', background: c, cursor: 'pointer', border: editColor === c ? '2px solid #fff' : '2px solid transparent' }} />)}
                </div>
                <button onClick={saveEdit} style={{ border: 'none', background: '#F97316', color: '#000', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem', fontWeight: 700 }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#64748B', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem' }}>✕</button>
              </>
            ) : (
              <>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: floor.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>{floor.name}</span>
                <button onClick={() => startEdit(floor)} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem' }}>Edit</button>
                {floors.length > 1 && (
                  <button onClick={() => deleteFloor(floor.id)} style={{ border: '1px solid #EF444433', background: '#EF444411', color: '#EF4444', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem' }}>✕</button>
                )}
              </>
            )}
          </div>
        ))}

        <div style={{ borderTop: '1px solid #1E1E2E', paddingTop: '1rem', marginTop: '0.8rem' }}>
          <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>ADD NEW FLOOR</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Floor name" onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 8, padding: '0.45rem 0.7rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none' }} />
            <button onClick={handleAdd} style={{ border: 'none', background: '#F97316', color: '#000', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', fontWeight: 700 }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {COLORS.map(c => <div key={c} onClick={() => setNewColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: newColor === c ? '2px solid #fff' : '2px solid transparent' }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Floor Canvas ─────────────────────────────────────────────────────────────
function FloorCanvas({ floorId, editMode, onSelectTable, scale = 1 }) {
  const { tables, orders, bookings, updateTablePosition, removeTable, updateTableData } = usePOS()
  const canvasRef  = useRef(null)
  const [dragging, setDragging]  = useState(null)
  const [editTable,setEditTable] = useState(null)

  const floorTables = tables.filter(t => t.floorId === floorId)
  const snapToGrid  = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE

  const onMouseDown = (e, tableId) => {
    if (!editMode) return
    e.preventDefault(); e.stopPropagation()
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const tbl = tables.find(t => t.id === tableId)
    setDragging({ id: tableId, offsetX: (e.clientX - canvasRect.left) / scale - (tbl?.x || 0), offsetY: (e.clientY - canvasRect.top) / scale - (tbl?.y || 0) })
  }

  const onMouseMove = (e) => {
    if (!dragging || !editMode) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const tbl  = tables.find(t => t.id === dragging.id)
    const tw   = tbl?.width  || DEFAULT_SIZE
    const th   = tbl?.height || DEFAULT_SIZE
    const x = snapToGrid(Math.max(0, Math.min((e.clientX - rect.left) / scale - dragging.offsetX, canvasW - tw)))
    const y = snapToGrid(Math.max(0, Math.min((e.clientY - rect.top)  / scale - dragging.offsetY, canvasH - th)))
    updateTablePosition(dragging.id, x, y)
  }

  const onMouseUp = () => setDragging(null)

  const onTouchStart = (e, tableId) => {
    if (!editMode) return
    e.preventDefault()
    const touch = e.touches[0]
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const tbl = tables.find(t => t.id === tableId)
    setDragging({ id: tableId, offsetX: (touch.clientX - canvasRect.left) / scale - (tbl?.x || 0), offsetY: (touch.clientY - canvasRect.top) / scale - (tbl?.y || 0) })
  }

  const onTouchMove = (e) => {
    if (!dragging || !editMode) return
    const touch  = e.touches[0]
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const tbl  = tables.find(t => t.id === dragging.id)
    const tw   = tbl?.width  || DEFAULT_SIZE
    const th   = tbl?.height || DEFAULT_SIZE
    const x = snapToGrid(Math.max(0, Math.min((touch.clientX - rect.left) / scale - dragging.offsetX, canvasW - tw)))
    const y = snapToGrid(Math.max(0, Math.min((touch.clientY - rect.top)  / scale - dragging.offsetY, canvasH - th)))
    updateTablePosition(dragging.id, x, y)
  }

  const onTouchEnd = () => setDragging(null)

  const getBookingForTable = (tableId) => bookings.find(b => {
    if (b.preferredTable !== tableId || b.status === 'cancelled') return false
    const today = new Date().toISOString().split('T')[0]
    if (b.date !== today) return false
    const now = new Date()
    const [h, m] = b.time.split(':').map(Number)
    const start = new Date(); start.setHours(h, m, 0, 0)
    const warn  = new Date(start.getTime() - 60 * 60000)
    const end   = new Date(start.getTime() + (b.duration || 90) * 60000)
    return now >= warn && now < end
  })

  return (
    <>
      {editTable && editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '1rem' }} onClick={() => setEditTable(null)}>
          <div style={{ background: '#0F0F17', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.3rem', width: '100%', maxWidth: 300, fontFamily: "'Courier New', monospace", color: '#E2E8F0', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>Table {editTable.id}</div>

            {/* SHAPE */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.58rem', color: '#475569', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>SHAPE</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[
                  { key: 'square', icon: '⬛', label: 'Square'    },
                  { key: 'round',  icon: '⭕', label: 'Round'     },
                  { key: 'rect',   icon: '▬',  label: 'Rectangle' },
                ].map(s => (
                  <button key={s.key} onClick={() => {
                    const sizeKey = editTable.sizeKey || 'medium'
                    const dims    = s.key === 'rect' ? RECT_SIZES[sizeKey] : SIZES[sizeKey]
                    const updated = { ...editTable, shape: s.key, width: dims.w, height: dims.h }
                    updateTableData(updated)
                    setEditTable(updated)
                  }}
                    style={{ flex: 1, border: '1px solid', borderColor: editTable.shape === s.key ? '#F97316' : '#1E1E2E', background: editTable.shape === s.key ? '#F9731622' : '#13131A', color: editTable.shape === s.key ? '#F97316' : '#64748B', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem', fontWeight: 700 }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SIZE */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.58rem', color: '#475569', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>SIZE</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {Object.entries(editTable.shape === 'rect' ? RECT_SIZES : SIZES).map(([key, dims]) => {
                  const current = editTable.sizeKey || 'medium'
                  return (
                    <button key={key} onClick={() => {
                      const updated = { ...editTable, sizeKey: key, width: dims.w, height: dims.h }
                      updateTableData(updated)
                      setEditTable(updated)
                    }}
                      style={{ flex: 1, border: '1px solid', borderColor: current === key ? '#10B981' : '#1E1E2E', background: current === key ? '#10B98122' : '#13131A', color: current === key ? '#10B981' : '#64748B', borderRadius: 6, padding: '0.3rem 0.4rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700, textAlign: 'center' }}>
                      {dims.label}<br />
                      <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{dims.w}×{dims.h}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SEATS */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.58rem', color: '#475569', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>SEATS</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[2, 4, 6, 8, 10].map(n => (
                  <button key={n} onClick={() => { updateTableData({ ...editTable, seats: n }); setEditTable(p => ({ ...p, seats: n })) }}
                    style={{ border: '1px solid', borderColor: editTable.seats === n ? '#F97316' : '#1E1E2E', background: editTable.seats === n ? '#F9731622' : '#13131A', color: editTable.seats === n ? '#F97316' : '#64748B', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700 }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* REMOVE */}
            <button onClick={() => { removeTable(editTable.id); setEditTable(null) }}
              style={{ border: '1px solid #EF444433', background: '#EF444411', color: '#EF4444', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700, width: '100%' }}>
              🗑 Remove Table
            </button>
          </div>
        </div>
      )}

      <div style={{ width: '100%', overflow: 'hidden', height: CANVAS_H * scale, borderRadius: 10 }}>
        <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div
          ref={canvasRef}
          style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, background: `linear-gradient(to right, #1E1E2E 1px, transparent 1px), linear-gradient(to bottom, #1E1E2E 1px, transparent 1px), #0D0D14`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`, borderRadius: 10, border: '1px solid #1E1E2E', cursor: editMode ? 'crosshair' : 'default', userSelect: 'none', touchAction: dragging ? 'none' : 'pan-x pan-y' }}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
          {floorTables.map(table => {
            const status   = getAutoTableStatus(table.id, orders, bookings)
            const sc       = STATUS_CONFIG[status]
            const order    = orders.find(o => o.table === table.id)
            const booking  = getBookingForTable(table.id)
            const isDrag   = dragging?.id === table.id
            const tw       = table.width  || DEFAULT_SIZE
            const th       = table.height || DEFAULT_SIZE
            const br       = table.shape === 'round' ? '50%' : table.shape === 'rect' ? 8 : 12
            const hasFirableCourse = order?.courses && (order.courses.mains === 'waiting' || order.courses.desserts === 'waiting')
            const isReadyToCollect = order?.status === 'ready'

            return (
              <div key={table.id}
                style={{ position: 'absolute', left: table.x, top: table.y, width: tw, height: th, background: sc.bg, border: `2px solid ${isDrag ? '#F97316' : sc.border}`, borderRadius: br, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: editMode ? 'grab' : 'pointer', transition: isDrag ? 'none' : 'box-shadow 0.15s', boxShadow: isDrag ? `0 0 0 3px #F97316` : `0 2px 8px rgba(0,0,0,0.4)`, zIndex: isDrag ? 10 : 1 }}
                onMouseDown={e => editMode ? onMouseDown(e, table.id) : null}
                onTouchStart={e => editMode ? onTouchStart(e, table.id) : null}
                onClick={() => { if (dragging) return; if (editMode) { setEditTable(table) } else { onSelectTable(table.id) } }}
                onMouseEnter={e => { if (!editMode) e.currentTarget.style.filter = 'brightness(1.25)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
              >
                {isReadyToCollect && !editMode && (
                  <div style={{ position: 'absolute', top: -4, left: -4, width: 16, height: 16, borderRadius: '50%', background: '#10B981', border: '2px solid #0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', zIndex: 3, animation: 'pulse 1.5s infinite' }}>
                    🍽️
                  </div>
                )}
                {hasFirableCourse && !editMode && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#F97316', border: '2px solid #0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', zIndex: 3 }}>
                    🔥
                  </div>
                )}
                <div style={{ fontSize: '0.55rem', color: '#475569', letterSpacing: '0.08em' }}>T</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: sc.color, lineHeight: 1 }}>{table.id}</div>
                <div style={{ fontSize: '0.5rem', color: sc.color, fontWeight: 700, letterSpacing: '0.06em' }}>{sc.label.toUpperCase()}</div>
                {booking && !order && <div style={{ fontSize: '0.45rem', color: '#3B82F6', marginTop: '0.15rem', textAlign: 'center', lineHeight: 1.2 }}>📅{booking.time}</div>}
                {order && (
                  <>
                    <div style={{ fontSize: '0.5rem', color: '#F97316', fontWeight: 700, marginTop: '0.1rem' }}>€{order.total.toFixed(0)}</div>
                    <TableTimer placedAt={order.placedAt} />
                  </>
                )}
                {editMode && <div style={{ position: 'absolute', top: 3, right: 4, fontSize: '0.5rem', color: '#334155' }}>{table.seats}p</div>}
              </div>
            )
          })}

          {editMode && floorTables.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '0.8rem', fontFamily: "'Courier New', monospace" }}>
              No tables on this floor — click "+ Add Table" to place one
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
function TableListView({ floors, tables, orders, bookings, onSelectTable }) {
  return (
    <div>
      {floors.map(floor => {
        const floorTables = tables.filter(t => t.floorId === floor.id)
        if (floorTables.length === 0) return null
        return (
          <div key={floor.id} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: floor.color }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: floor.color, letterSpacing: '0.1em' }}>{floor.name.toUpperCase()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
              {floorTables.map(table => {
                const status  = getAutoTableStatus(table.id, orders, bookings)
                const sc      = STATUS_CONFIG[status]
                const order   = orders.find(o => o.table === table.id)
                const booking = bookings.find(b => {
                  if (b.preferredTable !== table.id || b.status === 'cancelled') return false
                  const today = new Date().toISOString().split('T')[0]
                  if (b.date !== today) return false
                  const now = new Date()
                  const [h, m] = b.time.split(':').map(Number)
                  const start = new Date(); start.setHours(h, m, 0, 0)
                  const warn  = new Date(start.getTime() - 60 * 60000)
                  const end   = new Date(start.getTime() + (b.duration || 90) * 60000)
                  return now >= warn && now < end
                })
                const hasFire  = order?.courses && (order.courses.mains === 'waiting' || order.courses.desserts === 'waiting')
                const isReady  = order?.status === 'ready'

                return (
                  <div key={table.id} onClick={() => onSelectTable(table.id)}
                    style={{ background: sc.bg, border: `2px solid ${sc.border}`, borderRadius: 12, padding: '0.8rem 1rem', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', gap: '0.2rem' }}>
                      {isReady && <span style={{ fontSize: '0.7rem', animation: 'pulse 1.5s infinite' }}>🍽️</span>}
                      {hasFire && <span style={{ fontSize: '0.65rem' }}>🔥</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#475569' }}>T</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: sc.color, lineHeight: 1 }}>{table.id}</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: sc.color, letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                      {sc.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#475569' }}>{table.seats} seats</div>
                    {order && (
                      <div style={{ marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>€{order.total.toFixed(0)}</span>
                        <TableTimer placedAt={order.placedAt} />
                      </div>
                    )}
                    {booking && !order && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.62rem', color: '#3B82F6' }}>📅 {booking.time} · {booking.name.split(' ')[0]}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
// ─── Main TablesView ──────────────────────────────────────────────────────────
export default function TablesView() {
  const { tables, floors, orders, bookings, addTableToFloor } = usePOS()
  const { isMobile, isTablet } = useBreakpoint()
  const canvasScale = isMobile ? 0.32 : isTablet ? 0.55 : 0.88
  const [, setTick]       = useState(0)
  const [activeFloor,     setActiveFloor]     = useState(null)
  const [editMode,        setEditMode]        = useState(false)
  const [selectedTable,   setSelectedTable]   = useState(null)
  const [pickerTable,     setPickerTable]     = useState(null)
  const [editingOrder,    setEditingOrder]    = useState(null)
  const [showFloorEditor, setShowFloorEditor] = useState(false)
  const [viewMode,        setViewMode]        = useState(isMobile ? 'list' : 'canvas')
  


  useEffect(() => { if (floors.length > 0 && !activeFloor) setActiveFloor(floors[0].id) }, [floors])
  useEffect(() => { if (activeFloor && !floors.find(f => f.id === activeFloor)) setActiveFloor(floors[0]?.id || null) }, [floors])
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 60000); return () => clearInterval(t) }, [])

  const getBookingForTable = (tableId) => bookings.find(b => {
    if (b.preferredTable !== tableId || b.status === 'cancelled') return false
    const today = new Date().toISOString().split('T')[0]
    if (b.date !== today) return false
    const now = new Date()
    const [h, m] = b.time.split(':').map(Number)
    const start = new Date(); start.setHours(h, m, 0, 0)
    const warn  = new Date(start.getTime() - 60 * 60000)
    const end   = new Date(start.getTime() + (b.duration || 90) * 60000)
    return now >= warn && now < end
  })

  const counts = {
    free:     tables.filter(t => getAutoTableStatus(t.id, orders, bookings) === 'free').length,
    occupied: tables.filter(t => getAutoTableStatus(t.id, orders, bookings) === 'occupied').length,
    reserved: tables.filter(t => getAutoTableStatus(t.id, orders, bookings) === 'reserved').length,
  }

  const selectedTableObj = selectedTable ? tables.find(t => t.id === selectedTable) : null
  const selectedStatus   = selectedTable ? getAutoTableStatus(selectedTable, orders, bookings) : null
  const selectedOrder    = selectedTable ? orders.find(o => o.table === selectedTable) : null
  const selectedBooking  = selectedTable ? getBookingForTable(selectedTable) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '1.5rem' }}>

      {(pickerTable !== null || editingOrder !== null) && (
        <ItemPicker tableId={pickerTable ?? editingOrder?.table} existingOrder={editingOrder} onClose={() => { setPickerTable(null); setEditingOrder(null) }} />
      )}

      {selectedTable && selectedTableObj && !editMode && (
        <TablePopup
          table={selectedTableObj} status={selectedStatus} order={selectedOrder} booking={selectedBooking}
          onClose={() => setSelectedTable(null)}
          onOpenPicker={() => setPickerTable(selectedTable)}
          onOpenEditPicker={(order) => setEditingOrder(order)}
        />
      )}

      {showFloorEditor && <FloorEditor onClose={() => setShowFloorEditor(false)} />}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>FLOOR PLAN</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Tables</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isMobile && Object.entries(counts).map(([status, count]) => {
              const sc = STATUS_CONFIG[status]
              return (
                <div key={status} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: '0.4rem 0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: sc.color }}>{count}</div>
                  <div style={{ fontSize: '0.55rem', color: '#475569', letterSpacing: '0.06em' }}>{sc.label.toUpperCase()}</div>
                </div>
              )
            })}
            {!isMobile && <div style={{ width: 1, height: 32, background: '#1E1E2E' }} />}
            <button onClick={() => setEditMode(m => !m)}
              style={{ border: '1px solid', borderColor: editMode ? '#F97316' : '#1E1E2E', background: editMode ? '#F9731622' : '#13131A', color: editMode ? '#F97316' : '#64748B', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700 }}>
              {editMode ? '✓ Done Editing' : '✏️ Edit Layout'}
            </button>
            {editMode && (
              <>
                <button onClick={() => addTableToFloor(activeFloor)}
                  style={{ border: 'none', background: '#10B981', color: '#000', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700 }}>
                  + Table
                </button>
                <button onClick={() => setShowFloorEditor(true)}
                  style={{ border: '1px solid #1E1E2E', background: '#13131A', color: '#94A3B8', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700 }}>
                  ⚙️ Floors
                </button>
              </>
            )}
          </div>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {Object.entries(counts).map(([status, count]) => {
              const sc = STATUS_CONFIG[status]
              return (
                <div key={status} style={{ flex: 1, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: '0.4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: sc.color }}>{count}</div>
                  <div style={{ fontSize: '0.5rem', color: '#475569', letterSpacing: '0.06em' }}>{sc.label.toUpperCase()}</div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {floors.map(floor => {
            const isActive      = activeFloor === floor.id
            const floorOccupied = tables.filter(t => t.floorId === floor.id && getAutoTableStatus(t.id, orders, bookings) === 'occupied').length
            const floorFirable  = tables.filter(t => t.floorId === floor.id).some(t => {
              const o = orders.find(ord => ord.table === t.id)
              return o?.courses && (o.courses.mains === 'waiting' || o.courses.desserts === 'waiting')
            })
            return (
              <button key={floor.id} onClick={() => setActiveFloor(floor.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid', borderColor: isActive ? floor.color : '#1E1E2E', background: isActive ? floor.color + '22' : '#13131A', color: isActive ? floor.color : '#64748B', borderRadius: 8, padding: '0.45rem 1rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s' }}>
                <span>{floor.name}</span>
                <span style={{ fontSize: '0.6rem', background: isActive ? floor.color + '33' : '#1E1E2E', borderRadius: 4, padding: '1px 5px' }}>{tables.filter(t => t.floorId === floor.id).length} tables</span>
                {floorOccupied > 0 && <span style={{ fontSize: '0.6rem', background: '#F9731622', color: '#F97316', borderRadius: 4, padding: '1px 5px' }}>{floorOccupied} occupied</span>}
                {floorFirable && <span style={{ fontSize: '0.65rem' }}>🔥</span>}
              </button>
            )
          })}
          {!editMode && (
            <button onClick={() => { setEditMode(true); setShowFloorEditor(true) }}
              style={{ border: '1px dashed #334155', background: 'transparent', color: '#334155', borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem', fontWeight: 700 }}>
              + Add Floor
            </button>
          )}
        </div>

        {editMode && (
          <div style={{ background: '#F9731611', border: '1px solid #F9731633', borderRadius: 8, padding: '0.5rem 0.9rem', marginBottom: '1rem', fontSize: '0.68rem', color: '#F97316' }}>
            ✏️ Edit mode — drag tables to reposition · click a table to change shape/size/seats · snaps to grid
          </div>
        )}

        {/* View toggle */}
        {!editMode && (
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
            <button onClick={() => setViewMode('canvas')}
              style={{ border: '1px solid', borderColor: viewMode === 'canvas' ? '#F97316' : '#1E1E2E', background: viewMode === 'canvas' ? '#F9731622' : '#13131A', color: viewMode === 'canvas' ? '#F97316' : '#64748B', borderRadius: 8, padding: '0.35rem 0.8rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', fontWeight: 700 }}>
              🗺️ Canvas
            </button>
            <button onClick={() => setViewMode('list')}
              style={{ border: '1px solid', borderColor: viewMode === 'list' ? '#F97316' : '#1E1E2E', background: viewMode === 'list' ? '#F9731622' : '#13131A', color: viewMode === 'list' ? '#F97316' : '#64748B', borderRadius: 8, padding: '0.35rem 0.8rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.7rem', fontWeight: 700 }}>
              📋 List
            </button>
          </div>
        )}

        {(viewMode === 'canvas' || editMode) && activeFloor && (
          <FloorCanvas floorId={activeFloor} editMode={editMode} onSelectTable={setSelectedTable} scale={canvasScale} />
        )}

        {viewMode === 'list' && !editMode && (
          <TableListView
            floors={floors}
            tables={tables}
            orders={orders}
            bookings={bookings}
            onSelectTable={setSelectedTable}
          />
        )}
      </div>
    </div>
  )
}