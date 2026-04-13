import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import useBreakpoint from '../../hooks/useBreakpoint'

const ALLERGEN_OPTIONS = ['Gluten', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Nuts', 'Soy', 'Sulphites', 'None']
const EMPTY_ITEM = { name: '', price: '', description: '', allergens: '' }

export default function MenuView() {
  const { menu, addCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability } = usePOS()
  const { isMobile } = useBreakpoint()

  const [activeCategory,    setActiveCategory]    = useState(Object.keys(menu)[0])
  const [newCategoryName,   setNewCategoryName]   = useState('')
  const [showAddCategory,   setShowAddCategory]   = useState(false)
  const [editingItem,       setEditingItem]       = useState(null)
  const [showAddItem,       setShowAddItem]       = useState(false)
  const [form,              setForm]              = useState(EMPTY_ITEM)
  const [selectedAllergens, setSelectedAllergens] = useState([])
  const [modifierView,      setModifierView]      = useState(null)
  const [newGroupName,      setNewGroupName]      = useState('')
  const [newGroupRequired,  setNewGroupRequired]  = useState(false)
  const [newOptionName,     setNewOptionName]     = useState('')
  const [newOptionPrice,    setNewOptionPrice]    = useState('')

  const resetForm = () => { setForm(EMPTY_ITEM); setSelectedAllergens([]); setEditingItem(null); setShowAddItem(false) }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ name: item.name, price: item.price, description: item.description, allergens: item.allergens })
    setSelectedAllergens(item.allergens ? item.allergens.split(', ') : [])
    setShowAddItem(false)
    setModifierView(null)
  }

  const openAdd = () => { resetForm(); setShowAddItem(true); setModifierView(null) }

  const toggleAllergen = (a) => setSelectedAllergens(prev =>
    prev.includes(a) ? prev.filter(x => x !== a) : [...prev.filter(x => x !== 'None'), a]
  )

  const handleSave = () => {
    if (!form.name || !form.price) return
    const item = { ...form, price: parseFloat(form.price), allergens: selectedAllergens.length ? selectedAllergens.join(', ') : 'None' }
    if (editingItem) updateMenuItem(activeCategory, { ...editingItem, ...item })
    else addMenuItem(activeCategory, item)
    resetForm()
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    addCategory(newCategoryName.trim())
    setActiveCategory(newCategoryName.trim())
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  const getItem = (id) => (menu[activeCategory] || []).find(i => i.id === id)

  const addModifierGroup = (itemId) => {
    if (!newGroupName.trim()) return
    const item  = getItem(itemId); if (!item) return
    const group = { id: Date.now().toString(), name: newGroupName.trim(), required: newGroupRequired, options: [] }
    updateMenuItem(activeCategory, { ...item, modifiers: [...(item.modifiers || []), group] })
    setNewGroupName(''); setNewGroupRequired(false)
  }

  const deleteModifierGroup = (itemId, groupId) => {
    const item = getItem(itemId)
    updateMenuItem(activeCategory, { ...item, modifiers: (item.modifiers || []).filter(g => g.id !== groupId) })
  }

  const addModifierOption = (itemId, groupId) => {
    if (!newOptionName.trim()) return
    const item   = getItem(itemId)
    const option = { id: Date.now().toString(), name: newOptionName.trim(), price: parseFloat(newOptionPrice) || 0 }
    const modifiers = (item.modifiers || []).map(g => g.id === groupId ? { ...g, options: [...g.options, option] } : g)
    updateMenuItem(activeCategory, { ...item, modifiers })
    setNewOptionName(''); setNewOptionPrice('')
  }

  const deleteModifierOption = (itemId, groupId, optionId) => {
    const item      = getItem(itemId)
    const modifiers = (item.modifiers || []).map(g => g.id === groupId ? { ...g, options: g.options.filter(o => o.id !== optionId) } : g)
    updateMenuItem(activeCategory, { ...item, modifiers })
  }

  const toggleGroupRequired = (itemId, groupId) => {
    const item      = getItem(itemId)
    const modifiers = (item.modifiers || []).map(g => g.id === groupId ? { ...g, required: !g.required } : g)
    updateMenuItem(activeCategory, { ...item, modifiers })
  }

  const categories = Object.keys(menu)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: isMobile ? '1rem' : '2rem' }}>
      <style>{`
        .btn{border:none;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;transition:all 0.15s}
        .btn:hover{opacity:0.85}
        .btn-primary{background:#F97316;color:#000}
        .btn-ghost{background:#13131A;color:#94A3B8;border:1px solid #1E1E2E}
        .btn-danger{background:#EF444422;color:#EF4444;border:1px solid #EF444433}
        .btn-purple{background:#8B5CF622;color:#8B5CF6;border:1px solid #8B5CF644}
        .btn-sm{padding:0.3rem 0.7rem;font-size:0.68rem}
        .tab{padding:0.4rem 0.9rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.72rem;font-weight:700;transition:all 0.15s;white-space:nowrap}
        .tab.active{background:#F9731622;border-color:#F97316;color:#F97316}
        .item-row{border-radius:10px;background:#13131A;border:1px solid #1E1E2E;margin-bottom:0.5rem;transition:border-color 0.15s;overflow:hidden}
        .item-row:hover{border-color:#3B3B52}
        .input{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.55rem 0.8rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.78rem;width:100%;outline:none;transition:border-color 0.15s;box-sizing:border-box}
        .input:focus{border-color:#F97316}
        .allergen-tag{padding:0.3rem 0.65rem;border-radius:6px;border:1px solid #1E1E2E;background:transparent;color:#64748B;cursor:pointer;font-family:'Courier New',monospace;font-size:0.68rem;transition:all 0.15s}
        .allergen-tag.selected{background:#F9731622;border-color:#F97316;color:#F97316}
        .toggle{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;transition:background 0.2s;position:relative;flex-shrink:0}
        .toggle::after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:white;top:3px;transition:left 0.2s}
        .toggle.on{background:#10B981}.toggle.on::after{left:19px}
        .toggle.off{background:#334155}.toggle.off::after{left:3px}
        .panel{background:#13131A;border:1px solid #1E1E2E;border-radius:12px;padding:1.2rem;margin-top:1.5rem}
        .label{font-size:0.6rem;letter-spacing:0.12em;color:#475569;margin-bottom:0.4rem;display:block}
        .mod-group{background:#0D0D14;border:1px solid #1E1E2E;border-radius:10px;padding:0.8rem;margin-bottom:0.6rem}
        .mod-option{display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0.5rem;border-radius:6px;background:#13131A;border:1px solid #1E1E2E;margin-bottom:0.3rem;font-size:0.72rem}
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#475569', marginBottom: '0.3rem' }}>MENU MANAGEMENT</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Menu</h1>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
        </div>

        {/* Category tabs — horizontally scrollable on mobile */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.3rem', marginBottom: '1.2rem', alignItems: 'center' }}>
          {categories.map(cat => (
            <button key={cat} className={`tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => { setActiveCategory(cat); resetForm(); setModifierView(null) }}>
              {cat} <span style={{ opacity: 0.5, marginLeft: 4 }}>{menu[cat].length}</span>
            </button>
          ))}
          {showAddCategory ? (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
              <input className="input" style={{ width: 130 }} placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCategory(false)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setShowAddCategory(true)}>+ Category</button>
          )}
        </div>

        {/* Category header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#475569' }}>{menu[activeCategory]?.length || 0} ITEMS</div>
          {categories.length > 1 && (
            <button className="btn btn-danger btn-sm" onClick={() => { deleteCategory(activeCategory); setActiveCategory(categories.find(c => c !== activeCategory)) }}>
              Delete Category
            </button>
          )}
        </div>

        {/* Item list */}
        {menu[activeCategory]?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#334155', fontSize: '0.8rem' }}>No items yet — add one above</div>
        )}

        {menu[activeCategory]?.map(item => (
          <div key={item.id}>
            <div className="item-row" style={{ opacity: item.available ? 1 : 0.45 }}>
              {/* Item info + actions */}
              <div style={{ padding: '0.8rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>{item.name}</span>
                      {!item.available && <span style={{ fontSize: '0.6rem', background: '#EF444422', color: '#EF4444', border: '1px solid #EF444433', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>UNAVAILABLE</span>}
                      {item.modifiers?.length > 0 && <span style={{ fontSize: '0.6rem', background: '#8B5CF622', color: '#8B5CF6', border: '1px solid #8B5CF644', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>⚙ {item.modifiers.length} mod{item.modifiers.length !== 1 ? 's' : ''}</span>}
                    </div>
                    {item.description && <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.2rem' }}>{item.description}</div>}
                    {item.allergens && item.allergens !== 'None' && <div style={{ fontSize: '0.65rem', color: '#F59E0B' }}>⚠ {item.allergens}</div>}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F97316', whiteSpace: 'nowrap', flexShrink: 0 }}>€{parseFloat(item.price).toFixed(2)}</span>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className={`toggle ${item.available ? 'on' : 'off'}`} onClick={() => toggleItemAvailability(activeCategory, item.id)} />
                  <span style={{ fontSize: '0.6rem', color: '#475569' }}>{item.available ? 'Available' : 'Off'}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-purple btn-sm" onClick={() => setModifierView(modifierView === item.id ? null : item.id)}>⚙ Mods</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMenuItem(activeCategory, item.id)}>✕</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modifier editor */}
            {modifierView === item.id && (
              <div style={{ background: '#0A0A0F', border: '1px solid #8B5CF644', borderRadius: 10, padding: '1rem', marginBottom: '0.5rem', marginTop: '-0.3rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: '0.8rem', fontWeight: 700 }}>⚙ MODIFIERS — {item.name}</div>

                {(item.modifiers || []).map(group => (
                  <div className="mod-group" key={group.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1' }}>{group.name}</span>
                        <button onClick={() => toggleGroupRequired(item.id, group.id)}
                          style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px', borderRadius: 4, border: 'none', cursor: 'pointer', background: group.required ? '#F9731622' : '#1E293B', color: group.required ? '#F97316' : '#475569' }}>
                          {group.required ? 'REQUIRED' : 'OPTIONAL'}
                        </button>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteModifierGroup(item.id, group.id)}>✕ Group</button>
                    </div>

                    {group.options.map(opt => (
                      <div className="mod-option" key={opt.id}>
                        <span style={{ color: '#94A3B8' }}>{opt.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: opt.price > 0 ? '#10B981' : opt.price < 0 ? '#EF4444' : '#475569', fontWeight: 700 }}>
                            {opt.price > 0 ? `+€${opt.price.toFixed(2)}` : opt.price < 0 ? `-€${Math.abs(opt.price).toFixed(2)}` : 'no charge'}
                          </span>
                          <button className="btn btn-danger btn-sm" style={{ padding: '1px 5px', fontSize: '0.6rem' }} onClick={() => deleteModifierOption(item.id, group.id, opt.id)}>✕</button>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <input className="input" style={{ flex: '1 1 120px', minWidth: 0 }} placeholder="Option name" value={newOptionName} onChange={e => setNewOptionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModifierOption(item.id, group.id)} />
                      <input className="input" style={{ width: 70, flexShrink: 0 }} type="number" step="0.50" placeholder="+/- €" value={newOptionPrice} onChange={e => setNewOptionPrice(e.target.value)} />
                      <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => addModifierOption(item.id, group.id)}>Add</button>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #1E1E2E', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>NEW MODIFIER GROUP</div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input" style={{ flex: '1 1 140px', minWidth: 0 }} placeholder="Group name (e.g. Protein)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#475569', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" checked={newGroupRequired} onChange={e => setNewGroupRequired(e.target.checked)} style={{ accentColor: '#F97316' }} />
                      Required
                    </label>
                    <button className="btn btn-purple btn-sm" style={{ flexShrink: 0 }} onClick={() => addModifierGroup(item.id)}>+ Group</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add / Edit form */}
        {(showAddItem || editingItem) && (
          <div className="panel" style={{ borderColor: '#F9731644' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316', marginBottom: '1rem' }}>
              {editingItem ? `Editing — ${editingItem.name}` : `New Item in ${activeCategory}`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div><span className="label">ITEM NAME</span><input className="input" placeholder="e.g. Caesar Salad" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><span className="label">PRICE (€)</span><input className="input" type="number" step="0.50" placeholder="0.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <span className="label">DESCRIPTION</span>
              <input className="input" placeholder="Short description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="label">ALLERGENS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ALLERGEN_OPTIONS.map(a => (
                  <button key={a} className={`allergen-tag ${selectedAllergens.includes(a) ? 'selected' : ''}`} onClick={() => toggleAllergen(a)}>{a}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingItem ? 'Save Changes' : 'Add Item'}</button>
              <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}