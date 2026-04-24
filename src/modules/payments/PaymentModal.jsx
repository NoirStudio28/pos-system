import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const METHOD_COLORS = {
  Cash: '#10B981', Card: '#3B82F6', Voucher: '#8B5CF6', 'Gift Card': '#F59E0B',
}

function PaymentModalInner({ order, onClose }) {
  const { bookings, processPayment, checkGiftCard, customers, settings, tables } = usePOS()
  const { isMobile } = useBreakpoint()

  const [discountType,       setDiscountType]       = useState('%')
  const [discountValue,      setDiscountValue]      = useState('')
  const [serviceCharge,      setServiceCharge]      = useState(false)
  const [serviceChargePct,   setServiceChargePct]   = useState(settings?.defaultServiceCharge ?? 10)
  const [deductDeposit,      setDeductDeposit]      = useState(false)
  const [depositAmt,         setDepositAmt]         = useState('')
  const [paymentRows,        setPaymentRows]        = useState([])
  const [splitGuests,        setSplitGuests]        = useState(2)
  const [roundUpAmount,      setRoundUpAmount]      = useState('')
  const [giftCardCode,       setGiftCardCode]       = useState('')
  const [giftCardBalance,    setGiftCardBalance]    = useState(null)
  const [giftCardError,      setGiftCardError]      = useState('')
  const [showReceipt,        setShowReceipt]        = useState(false)
  const [paymentRecord,      setPaymentRecord]      = useState(null)
  const [redeemPts,          setRedeemPts]          = useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [activeTab,          setActiveTab]          = useState('adjustments')
  const [showSplitItems,    setShowSplitItems]    = useState(false)
const [splitAssignments,  setSplitAssignments]  = useState({})
const [guestCount,        setGuestCount]        = useState(2)
const [guestMethods,      setGuestMethods]      = useState({})

  const linkedBooking = bookings.find(b =>
    b.preferredTable === order.table && b.depositPaid && b.status !== 'cancelled'
  )

  const subtotal            = order.total
  const discountAmount      = (() => { const v = parseFloat(discountValue) || 0; return discountType === '%' ? Math.min(subtotal * v / 100, subtotal) : Math.min(v, subtotal) })()
  const afterDiscount       = subtotal - discountAmount
  const serviceChargeAmount = serviceCharge ? afterDiscount * serviceChargePct / 100 : 0
  const depositDeduction    = deductDeposit ? (parseFloat(depositAmt) || 0) : 0
  const pointsDiscount      = redeemPts / 100
  const finalTotal          = Math.max(0, afterDiscount + serviceChargeAmount - depositDeduction - pointsDiscount)
  const totalPaid           = paymentRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const remaining           = Math.max(0, finalTotal - totalPaid)
  const change              = Math.max(0, totalPaid - finalTotal)
  const roundUpTarget       = parseFloat(roundUpAmount) || 0
  const tipAmount           = roundUpTarget > finalTotal ? roundUpTarget - finalTotal : 0
  const resolvedCustomerId  = selectedCustomerId || order.customerId || null

  const getSplitTotals = () => {
    const totals = {}
    order.items.forEach(item => {
      const key = item._key
      const guest = splitAssignments[key]
      if (!guest) return
      const itemTotal = (item.price + (item.modifierTotal || 0)) * item.qty
      totals[guest] = (totals[guest] || 0) + itemTotal
    })
    return totals
  }

  const applySplitByItem = () => {
    const totals = getSplitTotals()
    if (Object.keys(totals).length === 0) return
    setPaymentRows(Object.entries(totals).map(([guest, amount], i) => ({
      id: Date.now() + i, method: guestMethods[guest] || 'Card', amount: amount.toFixed(2), note: guest
    })))
    setShowSplitItems(false)
  }

  const addRow    = (method) => setPaymentRows(prev => [...prev, { id: Date.now(), method, amount: remaining > 0 ? remaining.toFixed(2) : '0.00', note: '' }])
  const updateRow = (id, field, val) => setPaymentRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  const removeRow = (id) => setPaymentRows(prev => prev.filter(r => r.id !== id))

  const handleSplitGuests = () => {
    const per = (finalTotal / splitGuests).toFixed(2)
    setPaymentRows(Array.from({ length: splitGuests }, (_, i) => ({ id: Date.now() + i, method: 'Card', amount: per, note: `Guest ${i + 1}` })))
  }

  const handleLookupGiftCard = () => {
    setGiftCardError('')
    const bal = checkGiftCard(giftCardCode)
    if (bal === null) { setGiftCardError('Card not found'); setGiftCardBalance(null) }
    else if (bal === 0) { setGiftCardError('No balance remaining'); setGiftCardBalance(0) }
    else setGiftCardBalance(bal)
  }

  const handleUseGiftCard = () => {
    const use = Math.min(giftCardBalance, remaining)
    setPaymentRows(prev => [...prev, { id: Date.now(), method: 'Gift Card', amount: use.toFixed(2), note: giftCardCode.toUpperCase() }])
  }

  const handleProcess = () => {
    if (remaining > 0.01) return
    const giftCardPayments  = paymentRows.filter(r => r.method === 'Gift Card')
    const giftCardUsed      = giftCardPayments.reduce((s, r) => s + parseFloat(r.amount), 0)
    const giftCardRemainder = giftCardBalance !== null ? Math.max(0, giftCardBalance - giftCardUsed) : 0
    const record = {
      orderId: order.id, table: order.table, items: order.items,
      subtotal, discountType, discountValue: parseFloat(discountValue) || 0,
      discountAmount, serviceChargeAmount, depositDeduction,
      finalTotal, payments: paymentRows, tip: tipAmount,
      totalPaid, change,
      giftCardCode: giftCardCode.toUpperCase() || null,
      giftCardRemainder,
      customerId: resolvedCustomerId,
      paidAt: new Date().toISOString(),
    }
    setPaymentRecord(record)
    processPayment(order.id, { ...record, redeemedPoints: redeemPts, pointsDiscount })
    setShowReceipt(true)
  }

  const handlePrint = () => {
    if (!paymentRecord) return
    const itemRows = paymentRecord.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">€${(i.price * i.qty).toFixed(2)}</td></tr>`).join('')
    const pmtRows  = paymentRecord.payments.map(p => `<tr><td>${p.method}${p.note ? ` (${p.note})` : ''}</td><td style="text-align:right">€${parseFloat(p.amount).toFixed(2)}</td></tr>`).join('')
    const html = `<html><head><title>Receipt</title><style>body{font-family:monospace;padding:1.5rem;max-width:380px;margin:0 auto;color:#000}h1{font-size:1rem;text-align:center}.sub{text-align:center;font-size:0.72rem;color:#555;margin-bottom:1rem}table{width:100%;border-collapse:collapse;font-size:0.8rem;margin-bottom:0.5rem}td,th{padding:0.3rem 0.2rem}th{text-align:left;border-bottom:1px solid #000}.div{border-top:1px dashed #bbb;margin:0.5rem 0}.bold{font-weight:bold}.right{text-align:right}</style></head><body>
      <h1>RECEIPT</h1><div class="sub">Table ${paymentRecord.table} · ${new Date(paymentRecord.paidAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="div"></div>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">€</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="div"></div>
      <table>
        <tr><td>Subtotal</td><td class="right">€${paymentRecord.subtotal.toFixed(2)}</td></tr>
        ${paymentRecord.discountAmount > 0 ? `<tr><td>Discount</td><td class="right">-€${paymentRecord.discountAmount.toFixed(2)}</td></tr>` : ''}
        ${paymentRecord.serviceChargeAmount > 0 ? `<tr><td>Service Charge</td><td class="right">€${paymentRecord.serviceChargeAmount.toFixed(2)}</td></tr>` : ''}
        ${paymentRecord.depositDeduction > 0 ? `<tr><td>Deposit</td><td class="right">-€${paymentRecord.depositDeduction.toFixed(2)}</td></tr>` : ''}
        ${paymentRecord.pointsDiscount > 0 ? `<tr><td>Points Redeemed</td><td class="right">-€${paymentRecord.pointsDiscount.toFixed(2)}</td></tr>` : ''}
        <tr class="bold"><td>TOTAL</td><td class="right">€${paymentRecord.finalTotal.toFixed(2)}</td></tr>
        ${paymentRecord.tip > 0 ? `<tr><td>Tip — thank you!</td><td class="right">€${paymentRecord.tip.toFixed(2)}</td></tr>` : ''}
        ${paymentRecord.change > 0 ? `<tr><td>Change</td><td class="right">€${paymentRecord.change.toFixed(2)}</td></tr>` : ''}
      </table>
      <div class="div"></div><table>${pmtRows}</table>
      <div class="div"></div><div style="text-align:center;margin-top:1rem;font-size:0.75rem">${settings.receiptFooter || 'Thank you for dining with us!'}</div>
    </body></html>`
    const win = window.open('', '_blank'); win.document.write(html); win.document.close(); win.print()
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
    display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
    zIndex: 1000, padding: isMobile ? 0 : '1rem', overflowY: 'auto',
  }

  const modalStyle = {
    background: '#0F0F17', border: '1px solid #1E1E2E',
    borderRadius: isMobile ? '16px 16px 0 0' : 16,
    padding: isMobile ? '1.2rem 1rem' : '1.5rem',
    width: '100%', maxWidth: isMobile ? '100%' : 880,
    maxHeight: isMobile ? '95vh' : '92vh', overflowY: 'auto',
    fontFamily: "'Courier New', monospace", color: '#E2E8F0',
  }

  console.log('showReceipt:', showReceipt, 'paymentRecord:', !!paymentRecord)

  if (showReceipt && paymentRecord) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, maxWidth: isMobile ? '100%' : 440 }}>
          <style>{`.btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}.btn:hover{opacity:0.85}.btn-primary{background:#F97316;color:#000}.btn-print{background:#1E293B;color:#94A3B8;border:1px solid #334155}`}</style>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>Payment Complete</div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.3rem' }}>Table {paymentRecord.table}</div>
          </div>
          <div style={{ background: '#0D0D14', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
            {paymentRecord.items.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{i.name} ×{i.qty}</span>
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>€{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '0.7rem', paddingTop: '0.7rem' }}>
              {paymentRecord.discountAmount    > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontSize: '0.72rem', color: '#10B981' }}>Discount</span><span style={{ fontSize: '0.72rem', color: '#10B981' }}>-€{paymentRecord.discountAmount.toFixed(2)}</span></div>}
              {paymentRecord.serviceChargeAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Service Charge</span><span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>€{paymentRecord.serviceChargeAmount.toFixed(2)}</span></div>}
              {paymentRecord.depositDeduction  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontSize: '0.72rem', color: '#3B82F6' }}>Deposit deducted</span><span style={{ fontSize: '0.72rem', color: '#3B82F6' }}>-€{paymentRecord.depositDeduction.toFixed(2)}</span></div>}
              {paymentRecord.pointsDiscount    > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontSize: '0.72rem', color: '#F97316' }}>Points redeemed</span><span style={{ fontSize: '0.72rem', color: '#F97316' }}>-€{paymentRecord.pointsDiscount.toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700, color: '#F97316' }}>€{paymentRecord.finalTotal.toFixed(2)}</span></div>
              {paymentRecord.tip    > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>Tip 🙏</span><span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>€{paymentRecord.tip.toFixed(2)}</span></div>}
              {paymentRecord.change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>Change to give</span><span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700 }}>€{paymentRecord.change.toFixed(2)}</span></div>}
            </div>
          </div>
          {paymentRecord.giftCardRemainder > 0 && (
            <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B44', borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '1rem', fontSize: '0.72rem', color: '#F59E0B' }}>
              🎁 Gift card <strong>{paymentRecord.giftCardCode}</strong> — remaining: <strong>€{paymentRecord.giftCardRemainder.toFixed(2)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
  {(() => {
    const customer = customers.find(c => c.id === paymentRecord.customerId)
    const subject  = encodeURIComponent(`Receipt — Table ${paymentRecord.table} — €${paymentRecord.finalTotal.toFixed(2)}`)
    const body     = encodeURIComponent([
      `Receipt`,
      `Table ${paymentRecord.table} · ${new Date(paymentRecord.paidAt).toLocaleString('en-IE')}`,
      ``,
      ...paymentRecord.items.map(i => `${i.name} ×${i.qty}  €${((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}`),
      ``,
      paymentRecord.discountAmount > 0    ? `Discount: -€${paymentRecord.discountAmount.toFixed(2)}`       : null,
      paymentRecord.serviceChargeAmount > 0 ? `Service Charge: €${paymentRecord.serviceChargeAmount.toFixed(2)}` : null,
      paymentRecord.depositDeduction > 0  ? `Deposit: -€${paymentRecord.depositDeduction.toFixed(2)}`      : null,
      paymentRecord.pointsDiscount > 0    ? `Points Redeemed: -€${paymentRecord.pointsDiscount.toFixed(2)}` : null,
      `TOTAL: €${paymentRecord.finalTotal.toFixed(2)}`,
      paymentRecord.tip > 0    ? `Tip: €${paymentRecord.tip.toFixed(2)}`    : null,
      paymentRecord.change > 0 ? `Change: €${paymentRecord.change.toFixed(2)}` : null,
      ``,
      paymentRecord.payments.map(p => `${p.method}${p.note ? ` (${p.note})` : ''}: €${parseFloat(p.amount).toFixed(2)}`).join('\n'),
      ``,
      settings.receiptFooter || 'Thank you for dining with us!',
    ].filter(l => l !== null).join('\n'))
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-print" style={{ flex: 1 }} onClick={handlePrint}>🖨️ Print</button>
        <a href={`mailto:${customer?.email || ''}?subject=${subject}&body=${body}`}
          style={{ flex: 1, border: '1px solid #3B82F644', background: '#3B82F622', color: '#3B82F6', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          ✉️ Email{customer?.email ? ` ${customer.name.split(' ')[0]}` : ''}
        </a>
      </div>
    )
  })()}
  <button className="btn btn-primary" onClick={onClose}>Done ✓</button>
</div>
        </div>
      </div>
    )
  }

  // Mobile uses tabs instead of two columns
  const TABS = ['adjustments', 'payment']

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <style>{`
          .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
          .btn:hover{opacity:0.85}
          .btn-primary{background:#F97316;color:#000}
          .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
          .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
          .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
          .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.5rem 0.7rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;outline:none;box-sizing:border-box}
          .input:focus{border-color:#F97316}
          .label{font-size:0.58rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.35rem;display:block}
          .method-btn{border:1px solid #1E1E2E;border-radius:10px;padding:0.6rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.75rem;font-weight:700;transition:all 0.15s;background:#13131A;color:#64748B}
          .method-btn:hover{border-color:#3B3B52;color:#CBD5E1}
          .ttype{padding:0.3rem 0.65rem;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s}
          .ttype:first-child{border-radius:6px 0 0 6px}
          .ttype:last-child{border-radius:0 6px 6px 0}
          .ttype.active{background:#F9731622;border-color:#F97316;color:#F97316}
          .mob-tab{flex:1;border:none;padding:0.5rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s;background:transparent;border-bottom:2px solid transparent;color:#64748B}
          .mob-tab.active{color:#F97316;border-bottom-color:#F97316}
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.2rem' }}>PAYMENT</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
  T{order.table}{order.mergedTables?.length > 0 ? ` + T${order.mergedTables.join(' + T')}` : ''} — €{subtotal.toFixed(2)}
</h2>
{order.table && (() => {
  const tbl = tables?.find(t => t.id === order.table)
  return tbl?.note ? <div style={{ fontSize: '0.72rem', color: '#F59E0B', marginTop: '0.2rem' }}>{tbl.note}</div> : null
})()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Total pill */}
            <div style={{ background: '#F9731622', border: '1px solid #F9731644', borderRadius: 8, padding: '0.3rem 0.7rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.55rem', color: '#F97316', letterSpacing: '0.08em' }}>TOTAL</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F97316' }}>€{finalTotal.toFixed(2)}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Mobile tabs */}
        {isMobile && (
          <div style={{ display: 'flex', borderBottom: '1px solid #1E1E2E', marginBottom: '1rem' }}>
            <button className={`mob-tab ${activeTab === 'adjustments' ? 'active' : ''}`} onClick={() => setActiveTab('adjustments')}>Adjustments</button>
            <button className={`mob-tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
              Payment {remaining > 0.01 ? `(€${remaining.toFixed(2)} left)` : '✓'}
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

          {/* LEFT — Adjustments */}
          {(!isMobile || activeTab === 'adjustments') && (
            <div>
              {/* Items */}
              <div style={{ background: '#0D0D14', borderRadius: 10, padding: '0.8rem', marginBottom: '1rem' }}>
                <span className="label">ORDER ITEMS</span>
                {Object.values(order.items.reduce((acc, i) => {
  const key = i.name + JSON.stringify(i.modifiers || []) + (i.note || '')
  if (acc[key]) {
    acc[key] = { ...acc[key], qty: acc[key].qty + i.qty }
  } else {
    acc[key] = { ...i }
  }
  return acc
}, {})).map((i, idx) => (
  <div key={idx} style={{ marginBottom: '0.4rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{i.name} ×{i.qty}</span>
      <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>€{((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</span>
    </div>
    {i.modifiers?.length > 0 && i.modifiers.map((m, mi) => (
      <div key={mi} style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.65rem', color: '#8B5CF6' }}>{m.groupName}: {m.optionName}</span>
        {m.price !== 0 && <span style={{ fontSize: '0.65rem', color: m.price > 0 ? '#10B981' : '#EF4444' }}>{m.price > 0 ? `+€${m.price.toFixed(2)}` : `-€${Math.abs(m.price).toFixed(2)}`}</span>}
      </div>
    ))}
    {i.note && <div style={{ fontSize: '0.65rem', color: '#F59E0B' }}>📝 {i.note}</div>}
  </div>
))}
                <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Subtotal</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>€{subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount */}
              <div style={{ marginBottom: '0.8rem' }}>
                <span className="label">DISCOUNT</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <div>
                    <button className={`ttype ${discountType === '%' ? 'active' : ''}`} onClick={() => setDiscountType('%')}>%</button>
                    <button className={`ttype ${discountType === '€' ? 'active' : ''}`} onClick={() => setDiscountType('€')}>€</button>
                  </div>
                  <input className="input" style={{ width: 80 }} type="number" min="0" placeholder="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
                  {discountAmount > 0 && <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>-€{discountAmount.toFixed(2)}</span>}
                </div>
              </div>

              {/* Customer / Loyalty */}
              {(() => {
                const customer = customers.find(c => c.id === (selectedCustomerId || order.customerId))
                return (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <span className="label">CUSTOMER / LOYALTY</span>
                    {!customer ? (
                      <select className="input" value="" onChange={e => { setSelectedCustomerId(e.target.value ? Number(e.target.value) : null); setRedeemPts(0) }}>
                        <option value="">— Attach a customer —</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.points}pts</option>)}
                      </select>
                    ) : (
                      <div style={{ background: '#F9731611', border: '1px solid #F9731633', borderRadius: 10, padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F97316' }}>🏆 {customer.name}</div>
                            <div style={{ fontSize: '0.62rem', color: '#64748B' }}>{customer.points} pts = €{(customer.points / 100).toFixed(2)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.7rem', color: '#94A3B8' }}>
                              <input type="checkbox" checked={!!redeemPts} onChange={e => setRedeemPts(e.target.checked ? Math.min(customer.points, Math.floor(finalTotal * 100)) : 0)} style={{ accentColor: '#F97316' }} />
                              Redeem
                            </label>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedCustomerId(null); setRedeemPts(0) }}>✕</button>
                          </div>
                        </div>
                        {redeemPts > 0 && <div style={{ fontSize: '0.7rem', color: '#10B981' }}>−€{(redeemPts / 100).toFixed(2)} off</div>}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Service charge */}
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.58rem', letterSpacing: '0.12em', color: '#475569', marginBottom: '0.35rem' }}>
                  <input type="checkbox" checked={serviceCharge} onChange={e => setServiceCharge(e.target.checked)} style={{ accentColor: '#F97316' }} />
                  SERVICE CHARGE
                </label>
                {serviceCharge && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input className="input" style={{ width: 60 }} type="number" min="0" max="100" value={serviceChargePct} onChange={e => setServiceChargePct(parseFloat(e.target.value) || 0)} />
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>% = +€{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Deposit */}
              {linkedBooking && (
                <div style={{ background: '#3B82F611', border: '1px solid #3B82F633', borderRadius: 8, padding: '0.65rem 0.8rem', marginBottom: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: '#3B82F6', marginBottom: deductDeposit ? '0.4rem' : 0 }}>
                    <input type="checkbox" checked={deductDeposit} onChange={e => { setDeductDeposit(e.target.checked); setDepositAmt(linkedBooking.depositAmount?.toString() || '') }} style={{ accentColor: '#3B82F6' }} />
                    Deduct deposit — {linkedBooking.name}
                  </label>
                  {deductDeposit && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#475569' }}>€</span>
                      <input className="input" style={{ width: 80 }} type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {/* Tip */}
              <div style={{ marginBottom: '1rem' }}>
                <span className="label">ROUND-UP TIP</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>€</span>
                  <input className="input" style={{ width: 100 }} type="number" step="0.50" placeholder={finalTotal.toFixed(2)} value={roundUpAmount} onChange={e => setRoundUpAmount(e.target.value)} />
                  {tipAmount > 0 && <span style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 700 }}>tip €{tipAmount.toFixed(2)}</span>}
                </div>
              </div>

              {/* Totals summary */}
              <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '0.8rem' }}>
                {discountAmount      > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.72rem', color: '#10B981' }}>Discount</span><span style={{ fontSize: '0.72rem', color: '#10B981' }}>-€{discountAmount.toFixed(2)}</span></div>}
                {serviceChargeAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Service Charge</span><span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>+€{serviceChargeAmount.toFixed(2)}</span></div>}
                {depositDeduction    > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.72rem', color: '#3B82F6' }}>Deposit</span><span style={{ fontSize: '0.72rem', color: '#3B82F6' }}>-€{depositDeduction.toFixed(2)}</span></div>}
                {pointsDiscount      > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}><span style={{ fontSize: '0.72rem', color: '#F97316' }}>Points</span><span style={{ fontSize: '0.72rem', color: '#F97316' }}>-€{pointsDiscount.toFixed(2)}</span></div>}
                <div style={{ borderTop: '1px solid #1E1E2E', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>TOTAL</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F97316' }}>€{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {isMobile && (
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} onClick={() => setActiveTab('payment')}>
                  Continue to Payment →
                </button>
              )}
            </div>
          )}

          {/* RIGHT — Payment */}
          {(!isMobile || activeTab === 'payment') && (
            <div>
              <span className="label">ADD PAYMENT METHOD</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button className="method-btn" onClick={() => addRow('Cash')}>💵 Cash</button>
                <button className="method-btn" onClick={() => addRow('Card')}>💳 Card</button>
                <button className="method-btn" onClick={() => addRow('Voucher')}>🎫 Voucher</button>
              </div>

              {/* Split */}
              <div style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.7rem', marginBottom: '0.7rem' }}>
                <span className="label">SPLIT</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                    <input className="input" style={{ width: 55 }} type="number" min="2" max="20" value={splitGuests} onChange={e => setSplitGuests(parseInt(e.target.value) || 2)} />
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}>× €{(finalTotal / splitGuests).toFixed(2)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={handleSplitGuests}>Equal</button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setGuestCount(splitGuests); setShowSplitItems(true) }}>By Item</button>
                </div>
              </div>

              {/* Split by item modal */}
              {showSplitItems && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
                  <div style={{ background: '#0F0F17', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 480, fontFamily: "'Courier New', monospace", color: '#E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em' }}>SPLIT BY ITEM</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Assign items to guests</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#475569' }}>Guests:</span>
                          <input value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 2)} type="number" min="2" max="20"
                            style={{ width: 45, background: '#0D0D14', border: '1px solid #2D2D3F', borderRadius: 6, padding: '0.2rem 0.4rem', color: '#E2E8F0', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', outline: 'none', textAlign: 'center' }} />
                        </div>
                        <button onClick={() => setShowSplitItems(false)}
                          style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.72rem' }}>✕</button>
                      </div>
                    </div>

                    {/* Guest totals */}
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {Array.from({ length: guestCount }, (_, i) => {
                        const guestLabel = `Guest ${i + 1}`
                        const total = getSplitTotals()[guestLabel] || 0
                        return (
  <div key={i} style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.4rem 0.7rem', textAlign: 'center', minWidth: 80 }}>
    <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '0.2rem' }}>{guestLabel}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: total > 0 ? '#F97316' : '#334155', marginBottom: '0.3rem' }}>€{total.toFixed(2)}</div>
    <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
      {['Cash', 'Card', 'Voucher'].map(m => (
        <button key={m} onClick={() => setGuestMethods(p => ({ ...p, [guestLabel]: m }))}
          style={{ padding: '0.15rem 0.3rem', borderRadius: 4, border: '1px solid', borderColor: (guestMethods[guestLabel] || 'Card') === m ? '#F97316' : '#1E1E2E', background: (guestMethods[guestLabel] || 'Card') === m ? '#F9731622' : '#0D0D14', color: (guestMethods[guestLabel] || 'Card') === m ? '#F97316' : '#475569', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.55rem', fontWeight: 700 }}>
          {m === 'Cash' ? '💵' : m === 'Card' ? '💳' : '🎫'}
        </button>
      ))}
    </div>
  </div>
)
                      })}
                      {(() => {
                        const assigned = Object.values(getSplitTotals()).reduce((s, v) => s + v, 0)
                        const unassigned = finalTotal - assigned
                        return unassigned > 0.01 && (
                          <div style={{ background: '#EF444411', border: '1px solid #EF444433', borderRadius: 8, padding: '0.4rem 0.7rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#EF4444' }}>Unassigned</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EF4444' }}>€{unassigned.toFixed(2)}</div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Items */}
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>{item.name} ×{item.qty}</div>
                            {item.modifiers?.length > 0 && <div style={{ fontSize: '0.62rem', color: '#8B5CF6' }}>{item.modifiers.map(m => m.optionName).join(', ')}</div>}
                            {item.note && <div style={{ fontSize: '0.62rem', color: '#F59E0B' }}>📝 {item.note}</div>}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#F97316', fontWeight: 700 }}>€{((item.price + (item.modifierTotal || 0)) * item.qty).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <button onClick={() => setSplitAssignments(p => { const u = { ...p }; delete u[item._key]; return u })}
                            style={{ padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid', borderColor: !splitAssignments[item._key] ? '#F97316' : '#1E1E2E', background: !splitAssignments[item._key] ? '#F9731622' : '#13131A', color: !splitAssignments[item._key] ? '#F97316' : '#475569', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700 }}>
                            Shared
                          </button>
                          {Array.from({ length: guestCount }, (_, i) => {
                            const guestLabel = `Guest ${i + 1}`
                            const isSelected = splitAssignments[item._key] === guestLabel
                            return (
                              <button key={i} onClick={() => setSplitAssignments(p => ({ ...p, [item._key]: guestLabel }))}
                                style={{ padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid', borderColor: isSelected ? '#10B981' : '#1E1E2E', background: isSelected ? '#10B98122' : '#13131A', color: isSelected ? '#10B981' : '#475569', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700 }}>
                                G{i + 1}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <button onClick={applySplitByItem}
                      style={{ width: '100%', border: 'none', background: '#F97316', color: '#000', borderRadius: 8, padding: '0.65rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      ✓ Apply Split
                    </button>
                  </div>
                </div>
              )}

              {/* Gift card */}
              <div style={{ background: '#0D0D14', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.7rem', marginBottom: '1rem' }}>
                <span className="label">GIFT CARD (try: GIFT50 or GIFT25)</span>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <input className="input" style={{ flex: 1 }} placeholder="Enter code" value={giftCardCode} onChange={e => { setGiftCardCode(e.target.value); setGiftCardBalance(null); setGiftCardError('') }} />
                  <button className="btn btn-ghost btn-sm" onClick={handleLookupGiftCard}>Check</button>
                </div>
                {giftCardError && <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>{giftCardError}</div>}
                {giftCardBalance !== null && giftCardBalance > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>Balance: €{giftCardBalance.toFixed(2)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={handleUseGiftCard}>Use €{Math.min(giftCardBalance, remaining).toFixed(2)}</button>
                  </div>
                )}
              </div>

              {/* Payment rows */}
              {paymentRows.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <span className="label">PAYMENTS ENTERED</span>
                  {paymentRows.map(row => {
                    const color    = METHOD_COLORS[row.method] || '#64748B'
                    const rowAmt   = parseFloat(row.amount) || 0
                    const cashChange = row.method === 'Cash' && rowAmt > finalTotal ? rowAmt - finalTotal : 0
                    return (
                      <div key={row.id} style={{ marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color, background: color + '22', border: `1px solid ${color}44`, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{row.method}</span>
                          <input className="input" style={{ width: 85 }} type="number" step="0.01" value={row.amount} onChange={e => updateRow(row.id, 'amount', e.target.value)} />
                          <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Note" value={row.note} onChange={e => updateRow(row.id, 'note', e.target.value)} />
                          <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)}>✕</button>
                        </div>
                        {cashChange > 0.01 && <div style={{ fontSize: '0.68rem', color: '#F59E0B', marginTop: '0.2rem' }}>Change: €{cashChange.toFixed(2)}</div>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Status */}
              <div style={{ background: remaining < 0.01 ? '#10B98122' : '#0D0D14', border: `1px solid ${remaining < 0.01 ? '#10B98144' : '#1E1E2E'}`, borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '0.8rem' }}>
                {remaining > 0.01 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: '#F97316', fontWeight: 700 }}>Still to pay</span>
                    <span style={{ fontSize: '0.85rem', color: '#F97316', fontWeight: 700 }}>€{remaining.toFixed(2)}</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>✓ Fully covered</span>
                      <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>€{finalTotal.toFixed(2)}</span>
                    </div>
                    {change > 0.01 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>Cash change to give</span>
                        <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>€{change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button className="btn btn-ghost" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={() => {
  const grouped = Object.values(order.items.reduce((acc, i) => {
    const key = i.name + JSON.stringify(i.modifiers || []) + (i.note || '')
    if (acc[key]) acc[key] = { ...acc[key], qty: acc[key].qty + i.qty }
    else acc[key] = { ...i }
    return acc
  }, {}))
  const itemRows = grouped.map(i => `
    <tr>
      <td>${i.name}${i.modifiers?.length > 0 ? '<br/><span style="font-size:0.75em;color:#666">' + i.modifiers.map(m => m.groupName + ': ' + m.optionName).join(', ') + '</span>' : ''}${i.note ? '<br/><span style="font-size:0.75em;color:#888">📝 ' + i.note + '</span>' : ''}</td>
      <td style="text-align:center">×${i.qty}</td>
      <td style="text-align:right">€${((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</td>
    </tr>`).join('')
  const html = `<html><head><title>Bill</title><style>body{font-family:monospace;padding:1.5rem;max-width:380px;margin:0 auto}h1{font-size:1rem;text-align:center}.sub{text-align:center;font-size:0.72rem;color:#555;margin-bottom:1rem}table{width:100%;border-collapse:collapse;font-size:0.8rem}td,th{padding:0.3rem 0.2rem}th{text-align:left;border-bottom:1px solid #000}.div{border-top:1px dashed #bbb;margin:0.5rem 0}.bold{font-weight:bold}.right{text-align:right}</style></head><body>
    <h1>BILL</h1>
    <div style="text-align:center;font-size:0.7em;color:#999;font-style:italic;margin-bottom:0.5rem">— Preview copy —</div>
    <div class="sub">Table ${order.table} · ${order.covers > 0 ? order.covers + ' covers · ' : ''}${new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</div>
    <div class="div"></div>
    <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">€</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="div"></div>
    <table>
      ${discountAmount > 0 ? `<tr><td>Discount</td><td class="right">-€${discountAmount.toFixed(2)}</td></tr>` : ''}
      ${serviceChargeAmount > 0 ? `<tr><td>Service Charge</td><td class="right">€${serviceChargeAmount.toFixed(2)}</td></tr>` : ''}
      ${depositDeduction > 0 ? `<tr><td>Deposit</td><td class="right">-€${depositDeduction.toFixed(2)}</td></tr>` : ''}
      <tr class="bold"><td>TOTAL</td><td class="right">€${finalTotal.toFixed(2)}</td></tr>
    </table>
    <div class="div"></div>
    <div style="text-align:center;margin-top:1rem;font-size:0.75rem">${settings.receiptFooter || 'Thank you for dining with us!'}</div>
  </body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.print()
}}>🖨️ Print Bill Preview</button>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem', opacity: remaining > 0.01 ? 0.35 : 1 }}
                disabled={remaining > 0.01} onClick={handleProcess}>
                {remaining > 0.01 ? `€${remaining.toFixed(2)} remaining` : '✓ Process Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentModal() {
  const { activePaymentOrderId, closePayment, orders } = usePOS()
  const [frozenOrder, setFrozenOrder] = useState(null)
  const order = orders.find(o => o.id === activePaymentOrderId)

  if (order && (!frozenOrder || frozenOrder.id !== order.id)) {
    setFrozenOrder(order)
  }

  if (!activePaymentOrderId) return null
  if (!frozenOrder) return null
  return <PaymentModalInner order={frozenOrder} onClose={closePayment} />
}