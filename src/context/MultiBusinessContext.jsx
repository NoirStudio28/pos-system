import { createContext, useContext, useState } from 'react'

const MultiBusinessContext = createContext()

export const PLAN_CONFIG = {
  basic: {
    label:    'Basic',
    color:    '#64748B',
    price:    29,
    features: {
      tables: true, orders: true, payments: true, reports: true,
      kitchen: false, bar: false, bookings: false, stock: false,
      staff: false, customers: false, dashboard: false,
    },
  },
  pro: {
    label:    'Pro',
    color:    '#3B82F6',
    price:    79,
    features: {
      tables: true, orders: true, payments: true, reports: true,
      kitchen: true, bar: true, bookings: true, stock: true,
      staff: true, customers: false, dashboard: true,
    },
  },
  enterprise: {
    label:    'Enterprise',
    color:    '#F59E0B',
    price:    149,
    features: {
      tables: true, orders: true, payments: true, reports: true,
      kitchen: true, bar: true, bookings: true, stock: true,
      staff: true, customers: true, dashboard: true,
    },
  },
}

export const BUSINESS_TYPES = [
  { id: 'restaurant',  label: 'Restaurant',  icon: '🍽️' },
  { id: 'cafe',        label: 'Cafe',        icon: '☕' },
  { id: 'hotel',       label: 'Hotel',       icon: '🏨' },
  { id: 'bar',         label: 'Bar / Pub',   icon: '🍺' },
  { id: 'warehouse',   label: 'Warehouse',   icon: '📦' },
  { id: 'supermarket', label: 'Supermarket', icon: '🛒' },
  { id: 'custom',      label: 'Custom',      icon: '⚙️' },
]

const DEFAULT_BUSINESS_DATA = {
  menu:         {},
  floors:       [],
  tables:       [],
  staff:        [],
  bookings:     [],
  stock:        [],
  customers:    [],
  orderHistory: [],
  giftCards:    {},
  settings: {
    restaurantName:       '',
    address:              '',
    phone:                '',
    email:                '',
    currency:             '€',
    defaultServiceCharge: 10,
    tableCount:           10,
    receiptFooter:        'Thank you for your visit!',
    pointsPerEuro:        1,
    pointsRedeemRate:     100,
    stampTarget:          10,
    stampRewardValue:     15,
    tierSilverMin:        200,
    tierGoldMin:          500,
  },
}

const SAMPLE_BUSINESSES = [
  {
    id:          'biz-001',
    name:        'The Harbour Restaurant',
    type:        'restaurant',
    color:       '#F97316',
    plan:        'enterprise',
    active:      true,
    createdAt:   new Date().toISOString(),
    data:        { ...DEFAULT_BUSINESS_DATA, settings: { ...DEFAULT_BUSINESS_DATA.settings, restaurantName: 'The Harbour Restaurant', currency: '€' } },
  },
  {
    id:          'biz-002',
    name:        'Central Cafe',
    type:        'cafe',
    color:       '#10B981',
    plan:        'pro',
    active:      true,
    createdAt:   new Date().toISOString(),
    data:        { ...DEFAULT_BUSINESS_DATA, settings: { ...DEFAULT_BUSINESS_DATA.settings, restaurantName: 'Central Cafe', currency: '€' } },
  },
  {
    id:          'biz-003',
    name:        'Grand Hotel',
    type:        'hotel',
    color:       '#8B5CF6',
    plan:        'basic',
    active:      true,
    createdAt:   new Date().toISOString(),
    data:        { ...DEFAULT_BUSINESS_DATA, settings: { ...DEFAULT_BUSINESS_DATA.settings, restaurantName: 'Grand Hotel', currency: '€' } },
  },
]

// Super admin credentials — change these to your own
export const SUPER_ADMIN = { username: 'superadmin', password: 'super123' }

export function MultiBusinessProvider({ children }) {
  const [businesses,       setBusinesses]       = useState(SAMPLE_BUSINESSES)
  const [activeBusinessId, setActiveBusinessId] = useState(null)
  const [superAdminUser,   setSuperAdminUser]   = useState(null)

  // ── Super admin auth ──
  const superLogin = (username, password) => {
    if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
      setSuperAdminUser({ username, role: 'superadmin' })
      return true
    }
    return false
  }
  const superLogout = () => { setSuperAdminUser(null); setActiveBusinessId(null) }

  // ── Business management ──
  const addBusiness = (biz) => {
    const newBiz = {
      ...biz,
      id:        'biz-' + Date.now(),
      createdAt: new Date().toISOString(),
      active:    true,
      data:      {
        ...DEFAULT_BUSINESS_DATA,
        settings: { ...DEFAULT_BUSINESS_DATA.settings, restaurantName: biz.name },
      },
    }
    setBusinesses(prev => [...prev, newBiz])
    return newBiz.id
  }

  const updateBusiness = (updated) =>
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b))

  const deleteBusiness = (id) => {
    setBusinesses(prev => prev.filter(b => b.id !== id))
    if (activeBusinessId === id) setActiveBusinessId(null)
  }

  const toggleBusinessActive = (id) =>
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b))

  const updateBusinessPlan = (id, plan) =>
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, plan } : b))

  // ── Business data update (called by POSContext per business) ──
  const updateBusinessData = (bizId, dataKey, value) =>
    setBusinesses(prev => prev.map(b =>
      b.id === bizId ? { ...b, data: { ...b.data, [dataKey]: value } } : b
    ))

  const getActiveBusiness = () => businesses.find(b => b.id === activeBusinessId) || null

  const getBusinessFeatures = (bizId) => {
    const biz = businesses.find(b => b.id === bizId)
    if (!biz) return {}
    return PLAN_CONFIG[biz.plan]?.features || {}
  }

  return (
    <MultiBusinessContext.Provider value={{
      businesses, activeBusinessId, superAdminUser,
      superLogin, superLogout,
      setActiveBusinessId,
      addBusiness, updateBusiness, deleteBusiness,
      toggleBusinessActive, updateBusinessPlan,
      updateBusinessData, getActiveBusiness, getBusinessFeatures,
    }}>
      {children}
    </MultiBusinessContext.Provider>
  )
}

export function useMultiBusiness() {
  return useContext(MultiBusinessContext)
}