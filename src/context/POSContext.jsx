import { printDocket as qzPrint } from '../utils/qzPrint'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../lib/database'
import { supabase } from '../lib/supabase'

const POSContext = createContext()

const DEFAULT_MENU = {
  Starters: [
    { id: 's1', name: 'Soup of the Day',    price: 6.50,  description: 'Freshly made daily',                allergens: 'Gluten, Dairy',       available: true },
    { id: 's2', name: 'Garlic Bread',        price: 4.50,  description: 'Toasted with herb butter',           allergens: 'Gluten, Dairy',       available: true },
    { id: 's3', name: 'Chicken Wings',       price: 8.00,  description: 'Crispy with dipping sauce',          allergens: 'None',                available: true },
  ],
  Mains: [
    { id: 'm1', name: 'Beef Burger',         price: 14.00, description: 'Beef patty, lettuce, tomato, cheese',allergens: 'Gluten, Dairy',       available: true },
    { id: 'm2', name: 'Grilled Salmon',      price: 18.50, description: 'With seasonal vegetables',           allergens: 'Fish',                available: true },
    { id: 'm3', name: 'Pasta Carbonara',     price: 13.00, description: 'Cream, bacon, parmesan',             allergens: 'Gluten, Dairy, Eggs', available: true },
    { id: 'm4', name: 'Veg Stir Fry',        price: 12.00, description: 'Mixed vegetables, soy sauce, rice',  allergens: 'Soy',                 available: true },
  ],
  Desserts: [
    { id: 'd1', name: 'Cheesecake',          price: 6.00,  description: 'Classic New York style',             allergens: 'Dairy, Gluten, Eggs', available: true },
    { id: 'd2', name: 'Chocolate Brownie',   price: 5.50,  description: 'Warm with vanilla ice cream',        allergens: 'Dairy, Gluten, Eggs', available: true },
    { id: 'd3', name: 'Ice Cream',           price: 4.50,  description: 'Two scoops, choice of flavour',      allergens: 'Dairy',               available: true },
  ],
  Drinks: [
    { id: 'dr1', name: 'Coke',               price: 2.50,  description: 'Can',                                allergens: 'None',                available: true },
    { id: 'dr2', name: 'Still Water',        price: 2.00,  description: 'Bottled',                            allergens: 'None',                available: true },
    { id: 'dr3', name: 'House Wine (glass)', price: 6.50,  description: 'Red or white',                       allergens: 'Sulphites',           available: true },
    { id: 'dr4', name: 'Pint of Beer',       price: 5.50,  description: "Ask staff for today's selection",    allergens: 'Gluten',              available: true },
  ],
}

const SAMPLE_BOOKINGS = [
  { id: 1, name: 'John Murphy',  phone: '087 123 4567', email: 'john@email.com',  guests: 4, date: new Date().toISOString().split('T')[0], time: '19:00', duration: 90,  status: 'confirmed', notes: 'Anniversary dinner',          depositPaid: true,  depositAmount: 40, preferredTable: 5, favDishes: 'Grilled Salmon, Cheesecake', favDrinks: 'House Wine' },
  { id: 2, name: 'Sarah Kelly',  phone: '086 987 6543', email: 'sarah@email.com', guests: 2, date: new Date().toISOString().split('T')[0], time: '20:00', duration: 90,  status: 'pending',   notes: '',                            depositPaid: false, depositAmount: 0,  preferredTable: 3, favDishes: '',                               favDrinks: 'Sparkling Water' },
  { id: 3, name: 'Tom Brady',    phone: '085 456 7890', email: 'tom@email.com',   guests: 6, date: new Date().toISOString().split('T')[0], time: '18:30', duration: 120, status: 'confirmed', notes: 'Nut allergy — very important', depositPaid: true,  depositAmount: 60, preferredTable: 8, favDishes: 'Beef Burger',                     favDrinks: 'Pint of Beer' },
]

const SAMPLE_HISTORY = [
  { id: 101, table: 2, total: 47.50, closedAt: new Date().toISOString(), time: '12:30', placedBy: 'Emma Walsh',    items: [{ id: 'm1',  name: 'Beef Burger',         price: 14.00, qty: 2, category: 'Mains'    }, { id: 'dr4', name: 'Pint of Beer',        price: 5.50,  qty: 2, category: 'Drinks'   }, { id: 'd1',  name: 'Cheesecake',          price: 6.00,  qty: 2, category: 'Desserts' }] },
  { id: 102, table: 5, total: 63.00, closedAt: new Date().toISOString(), time: '13:00', placedBy: "James O'Brien", items: [{ id: 'm2',  name: 'Grilled Salmon',      price: 18.50, qty: 2, category: 'Mains'    }, { id: 's1',  name: 'Soup of the Day',    price: 6.50,  qty: 2, category: 'Starters' }, { id: 'dr3', name: 'House Wine (glass)', price: 6.50,  qty: 3, category: 'Drinks'   }] },
  { id: 103, table: 7, total: 28.00, closedAt: new Date().toISOString(), time: '13:30', placedBy: 'Emma Walsh',    items: [{ id: 'm3',  name: 'Pasta Carbonara',     price: 13.00, qty: 1, category: 'Mains'    }, { id: 's2',  name: 'Garlic Bread',       price: 4.50,  qty: 1, category: 'Starters' }, { id: 'dr1', name: 'Coke',               price: 2.50,  qty: 2, category: 'Drinks'   }, { id: 'd2',  name: 'Chocolate Brownie',  price: 5.50,  qty: 1, category: 'Desserts' }] },
  { id: 104, table: 1, total: 55.50, closedAt: new Date().toISOString(), time: '19:30', placedBy: 'Emma Walsh',    items: [{ id: 'm2',  name: 'Grilled Salmon',      price: 18.50, qty: 1, category: 'Mains'    }, { id: 'm1',  name: 'Beef Burger',        price: 14.00, qty: 1, category: 'Mains'    }, { id: 's3',  name: 'Chicken Wings',      price: 8.00,  qty: 1, category: 'Starters' }, { id: 'dr3', name: 'House Wine (glass)', price: 6.50,  qty: 2, category: 'Drinks'   }, { id: 'd3',  name: 'Ice Cream',          price: 4.50,  qty: 1, category: 'Desserts' }] },
  { id: 105, table: 3, total: 33.00, closedAt: new Date().toISOString(), time: '20:00', placedBy: "James O'Brien", items: [{ id: 'm4',  name: 'Veg Stir Fry',        price: 12.00, qty: 2, category: 'Mains'    }, { id: 'dr3', name: 'House Wine (glass)', price: 6.50,  qty: 1, category: 'Drinks'   }, { id: 'dr4', name: 'Pint of Beer',       price: 5.50,  qty: 1, category: 'Drinks'   }] },
]

const SAMPLE_STOCK = [
  { id: 1,  name: 'Beef Patties',      category: 'Mains',    unit: 'portions', quantity: 24, minThreshold: 10, costPrice: 3.50,  supplier: 'Meath Meats',    deliveryDay: 'Monday',    menuItemId: 'm1',  portionPerSale: 1    },
  { id: 2,  name: 'Salmon Fillets',    category: 'Mains',    unit: 'portions', quantity: 12, minThreshold: 6,  costPrice: 6.00,  supplier: 'Fresh Fish Co',  deliveryDay: 'Tuesday',   menuItemId: 'm2',  portionPerSale: 1    },
  { id: 3,  name: 'Pasta',             category: 'Mains',    unit: 'kg',       quantity: 5,  minThreshold: 2,  costPrice: 1.20,  supplier: 'Dunnes Trade',   deliveryDay: 'Wednesday', menuItemId: 'm3',  portionPerSale: 0.2  },
  { id: 4,  name: 'House Wine',        category: 'Drinks',   unit: 'bottles',  quantity: 18, minThreshold: 6,  costPrice: 8.00,  supplier: 'Wine Direct',    deliveryDay: 'Thursday',  menuItemId: 'dr3', portionPerSale: 0.2  },
  { id: 5,  name: 'Beer Kegs',         category: 'Drinks',   unit: 'kegs',     quantity: 3,  minThreshold: 1,  costPrice: 95.00, supplier: 'Diageo',         deliveryDay: 'Friday',    menuItemId: 'dr4', portionPerSale: 0.05 },
  { id: 6,  name: 'Coke Cans',         category: 'Drinks',   unit: 'cans',     quantity: 48, minThreshold: 12, costPrice: 0.60,  supplier: 'Centra Trade',   deliveryDay: 'Monday',    menuItemId: 'dr1', portionPerSale: 1    },
  { id: 7,  name: 'Cheesecake Slices', category: 'Desserts', unit: 'portions', quantity: 8,  minThreshold: 4,  costPrice: 1.80,  supplier: 'Baked Goods Co', deliveryDay: 'Daily',     menuItemId: 'd1',  portionPerSale: 1    },
  { id: 8,  name: 'Chicken Wings',     category: 'Starters', unit: 'portions', quantity: 20, minThreshold: 8,  costPrice: 2.50,  supplier: 'Meath Meats',    deliveryDay: 'Monday',    menuItemId: 's3',  portionPerSale: 1    },
  { id: 9,  name: 'Bread Rolls',       category: 'Starters', unit: 'units',    quantity: 40, minThreshold: 15, costPrice: 0.30,  supplier: 'Local Bakery',   deliveryDay: 'Daily',     menuItemId: null,  portionPerSale: 1    },
  { id: 10, name: 'Cooking Oil',       category: 'General',  unit: 'litres',   quantity: 6,  minThreshold: 2,  costPrice: 3.00,  supplier: 'Dunnes Trade',   deliveryDay: 'Wednesday', menuItemId: null,  portionPerSale: 0    },
]

export const DEFAULT_FLOORS = [
  { id: 'floor-indoor',  name: 'Indoor',  color: '#3B82F6' },
  { id: 'floor-outdoor', name: 'Outdoor', color: '#10B981' },
  { id: 'floor-terrace', name: 'Terrace', color: '#F59E0B' },
]

const DEFAULT_TABLES = [
  { id: 1,  floorId: 'floor-indoor',  x: 40,  y: 40,  shape: 'square', seats: 4 },
  { id: 2,  floorId: 'floor-indoor',  x: 160, y: 40,  shape: 'square', seats: 4 },
  { id: 3,  floorId: 'floor-indoor',  x: 280, y: 40,  shape: 'square', seats: 4 },
  { id: 4,  floorId: 'floor-indoor',  x: 400, y: 40,  shape: 'square', seats: 4 },
  { id: 5,  floorId: 'floor-indoor',  x: 520, y: 40,  shape: 'square', seats: 4 },
  { id: 6,  floorId: 'floor-indoor',  x: 40,  y: 180, shape: 'square', seats: 4 },
  { id: 7,  floorId: 'floor-indoor',  x: 160, y: 180, shape: 'square', seats: 4 },
  { id: 8,  floorId: 'floor-indoor',  x: 280, y: 180, shape: 'square', seats: 4 },
  { id: 9,  floorId: 'floor-indoor',  x: 400, y: 180, shape: 'square', seats: 4 },
  { id: 10, floorId: 'floor-indoor',  x: 520, y: 180, shape: 'square', seats: 4 },
  { id: 11, floorId: 'floor-outdoor', x: 40,  y: 40,  shape: 'round',  seats: 2 },
  { id: 12, floorId: 'floor-outdoor', x: 180, y: 40,  shape: 'round',  seats: 2 },
  { id: 13, floorId: 'floor-outdoor', x: 320, y: 40,  shape: 'round',  seats: 2 },
  { id: 14, floorId: 'floor-terrace', x: 40,  y: 40,  shape: 'square', seats: 6 },
  { id: 15, floorId: 'floor-terrace', x: 200, y: 40,  shape: 'square', seats: 6 },
]

export const ROLE_CONFIG = {
  admin:   { label: 'Admin',   color: '#EF4444', routes: ['*'] },
  manager: { label: 'Manager', color: '#F97316', routes: ['/dashboard', '/tables', '/orders', '/kds', '/bar', '/menu', '/bookings', '/reports', '/stock', '/customers', '/settings', '/staff', '/eod', '/history', '/staff-analytics', '/takeaway'] },
  waiter:  { label: 'Waiter',  color: '#3B82F6', routes: ['/tables', '/orders', '/bookings', '/history', '/takeaway'] },
  kitchen: { label: 'Kitchen', color: '#10B981', routes: ['/kds', '/bookings', '/history'] },
  cashier: { label: 'Cashier', color: '#8B5CF6', routes: ['/tables', '/orders', '/bar', '/history', '/takeaway'] },
}

export const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#CD7F32', min: 0   },
  silver: { label: 'Silver', color: '#94A3B8', min: 200 },
  gold:   { label: 'Gold',   color: '#F59E0B', min: 500 },
}

export const getTier = (totalSpend, silverMin = 200, goldMin = 500) => {
  if (totalSpend >= goldMin)   return 'gold'
  if (totalSpend >= silverMin) return 'silver'
  return 'bronze'
}

const SAMPLE_CUSTOMERS = [
  { id: 1, name: 'John Murphy',  phone: '087 123 4567', email: 'john@email.com',  birthday: '1985-06-15', notes: 'Prefers window seat', points: 320, stamps: 7, totalSpend: 320, visits: 7,  visitHistory: [] },
  { id: 2, name: 'Sarah Kelly',  phone: '086 987 6543', email: 'sarah@email.com', birthday: '1990-03-22', notes: 'Vegetarian',          points: 85,  stamps: 2, totalSpend: 85,  visits: 2,  visitHistory: [] },
  { id: 3, name: 'Tom Brady',    phone: '085 456 7890', email: 'tom@email.com',   birthday: '1978-11-08', notes: 'VIP — gold member',   points: 640, stamps: 9, totalSpend: 640, visits: 14, visitHistory: [] },
]

const DEFAULT_SETTINGS = {
  plan: 'pro',
  activeModules: ['dashboard','tables','orders','kds','bar','menu','bookings','reports','stock','staff','staff-analytics','customers','eod','history','takeaway'],
  courses: [
    { id: 'starters', name: 'Starters', position: 1, menuCategories: ['Starters'] },
    { id: 'mains',    name: 'Mains',    position: 2, menuCategories: ['Mains']    },
    { id: 'desserts', name: 'Desserts', position: 3, menuCategories: ['Desserts'] },
  ],
  restaurantName:       'My Restaurant',
  address:              '123 Main Street',
  phone:                '01 234 5678',
  email:                'hello@myrestaurant.com',
  currency:             '€',
  defaultServiceCharge: 10,
  tableCount:           15,
  receiptFooter:        'Thank you for dining with us!',
  printing: {
    kitchen: { enabled: true, size: '80x80', copies: 2, fontSize: 'large' },
    bar:     { enabled: true, size: '80x70', copies: 1, fontSize: 'normal' },
    till:    { enabled: true, size: '80x80', copies: 1, fontSize: 'normal' },
    card:    { enabled: true, size: '57x40', copies: 2, fontSize: 'small' },
  },
  pointsPerEuro:        1,
  pointsRedeemRate:     100,
  stampTarget:          10,
  stampRewardValue:     15,
  tierSilverMin:        200,
  tierGoldMin:          500,
}

const SAMPLE_STAFF = [
  { id: 1, name: 'Admin User',    username: 'admin', password: 'admin123', role: 'admin',   section: 'All',     experience: 'Senior', active: true, clockRecords: [] },
  { id: 2, name: 'Emma Walsh',    username: 'emma',  password: 'emma123',  role: 'waiter',  section: 'Indoor',  experience: 'Senior', active: true, clockRecords: [] },
  { id: 3, name: "James O'Brien", username: 'james', password: 'james123', role: 'waiter',  section: 'Indoor',  experience: 'Mid',    active: true, clockRecords: [] },
  { id: 4, name: 'Chef Marco',    username: 'marco', password: 'marco123', role: 'kitchen', section: 'Kitchen', experience: 'Senior', active: true, clockRecords: [] },
  { id: 5, name: 'Sarah Mgr',     username: 'sarah', password: 'sarah123', role: 'manager', section: 'All',     experience: 'Senior', active: true, clockRecords: [] },
  { id: 6, name: 'Tom Cashier',   username: 'tom',   password: 'tom123',   role: 'cashier', section: 'Bar',     experience: 'Junior', active: true, clockRecords: [] },
]

export const getAutoTableStatus = (tableId, orders, bookings) => {
  const hasOrder = orders.some(o => o.table === tableId)
  if (hasOrder) return 'occupied'
  const now = new Date()
  const hasBookingSoon = bookings.some(b => {
    if (b.preferredTable !== tableId) return false
    if (b.status === 'cancelled' || b.status === 'seated') return false
    const today = now.toISOString().split('T')[0]
    if (b.date !== today) return false
    const [h, m] = b.time.split(':').map(Number)
    const start = new Date(); start.setHours(h, m, 0, 0)
    const end   = new Date(start.getTime() + (b.duration || 90) * 60000)
    const warn  = new Date(start.getTime() - 60 * 60000)
    return now >= warn && now < end
  })
  if (hasBookingSoon) return 'reserved'
  return 'free'
}

// Returns which display an item belongs to
export const getItemDestination = (itemId, menu) => {
  for (const [cat, items] of Object.entries(menu)) {
    if (items.find(i => i.id === itemId)) {
      const c = cat.toLowerCase()
      if (c.includes('drink') || c.includes('bar') || c.includes('beverage') || c.includes('wine') || c.includes('beer') || c.includes('cocktail') || c.includes('soft')) return 'bar'
      return 'kitchen'
    }
  }
  return 'kitchen'
}

// Returns which course food item belongs to
export const getItemCourse = (itemId, menu, courses) => {
  for (const [cat, items] of Object.entries(menu)) {
    if (items.find(i => i.id === itemId)) {
      if (courses?.length) {
        const match = courses.find(c => c.menuCategories?.some(mc => mc.toLowerCase() === cat.toLowerCase()))
        if (match) return match.id
      }
      const c = cat.toLowerCase()
      if (c.includes('starter') || c.includes('appetizer') || c.includes('soup')) return 'starters'
      if (c.includes('main'))    return 'mains'
      if (c.includes('dessert')) return 'desserts'
      return 'other'
    }
  }
  return 'other'
}

const buildCourses = (items, menu, customCourses) => {
  const activeCourses = customCourses?.length ? customCourses : [
    { id: 'starters', position: 1 },
    { id: 'mains',    position: 2 },
    { id: 'desserts', position: 3 },
  ]
  const sorted = [...activeCourses].sort((a, b) => a.position - b.position)
  const result = {}
  sorted.forEach(c => { result[c.id] = 'none' })
  items.filter(i => getItemDestination(i.id, menu) === 'kitchen').forEach(i => {
    const course = i._overrideCourse || getItemCourse(i.id, menu, customCourses)
    if (result[course] === 'none') {
      result[course] = sorted.findIndex(c => c.id === course) === 0 ? 'fired' : 'waiting'
    }
  })
  // If first course is none but second exists, fire second
  const first = sorted.find(c => result[c.id] !== 'none')
  if (first && result[first.id] === 'waiting') result[first.id] = 'fired'
  return result
}

const printDocket = (type, order, paymentData = null) => {
  const s = settings
  const config = s.printing?.[type]
  if (!config?.enabled) return

  const now = new Date()
  const date = now.toLocaleDateString('en-IE')
  const time = now.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })
  const rName = s.restaurantName || 'My Restaurant'
  const fontSize = config.fontSize === 'large' ? '1rem' : config.fontSize === 'small' ? '0.65rem' : '0.8rem'
  const itemFontSize = config.fontSize === 'large' ? '1.1rem' : config.fontSize === 'small' ? '0.7rem' : '0.85rem'
  const width = config.size === '57x40' ? '57mm' : '80mm'
  const copies = config.copies || 1

  let content = ''

  const header = `
    <div style="border-bottom:1px dashed #000;padding-bottom:0.5rem;margin-bottom:0.5rem;text-align:center">
      <div style="font-size:1.2em;font-weight:bold">${rName}</div>
      <div>${date} · ${time}</div>
      <div style="font-size:1.1em;font-weight:bold">ORDER #${order.orderNum || order.id}</div>
    </div>
  `

  if (type === 'kitchen') {
    const foodItems = order.items.filter(i => getItemDestination(i.id, menu) === 'kitchen')
    const courseGroups = {}
    foodItems.forEach(i => {
      const course = i._overrideCourse || getItemCourse(i.id, menu, s.courses)
      if (!courseGroups[course]) courseGroups[course] = []
      courseGroups[course].push(i)
    })

    const courseSections = Object.entries(courseGroups).map(([course, items]) => `
      <div style="border-bottom:1px dashed #000;padding-bottom:0.5rem;margin-bottom:0.5rem">
        <div style="font-size:0.75em;font-weight:bold;letter-spacing:0.1em">${course.toUpperCase()}</div>
        ${items.map(item => `
          <div style="font-size:${itemFontSize};font-weight:bold">${item.qty}x ${item.name}</div>
          ${(item.modifiers || []).map(m => `<div style="font-size:0.8em;padding-left:0.5rem">› ${m.groupName}: ${m.optionName}</div>`).join('')}
          ${item.note ? `<div style="font-size:0.8em;padding-left:0.5rem">📝 ${item.note}</div>` : ''}
        `).join('')}
      </div>
    `).join('')

    const tableInfo = order.isTakeaway
      ? `🥡 ${order.takeawayName}${order.takeawayPhone ? ` · ${order.takeawayPhone}` : ''}${order.collectionTime ? ` · Collect: ${order.collectionTime}` : ''}`
      : `Table ${order.table}${order.covers > 0 ? ` · ${order.covers} covers` : ''}`

    for (let copy = 1; copy <= copies; copy++) {
      content += `
        ${copy > 1 ? '<div style="border-top:2px dashed #000;margin-top:1rem;padding-top:1rem"></div>' : ''}
        ${header}
        <div style="margin-bottom:0.5rem">
          <div><strong>${tableInfo}</strong></div>
          <div style="font-size:0.85em">by ${order.placedBy || 'Staff'}</div>
          ${copies > 1 ? `<div style="background:#000;color:#fff;padding:2px 6px;display:inline-block;font-size:0.8em;margin-top:0.3rem">COPY ${copy} OF ${copies}</div>` : ''}
        </div>
        ${courseSections}
      `
    }
  }

  if (type === 'bar') {
    const drinkItems = order.items.filter(i => getItemDestination(i.id, menu) === 'bar')
    const tableInfo = order.isTakeaway ? `🥡 ${order.takeawayName}` : `Table ${order.table}`
    content = `
      ${header}
      <div style="margin-bottom:0.5rem">
        <strong>${tableInfo}</strong>${order.round > 1 ? ` · Round ${order.round}` : ''} · ${order.placedBy || 'Staff'}
      </div>
      ${drinkItems.map(item => `
        <div style="font-size:${itemFontSize};font-weight:bold">${item.qty}x ${item.name}</div>
        ${(item.modifiers || []).map(m => `<div style="font-size:0.8em;padding-left:0.5rem">› ${m.groupName}: ${m.optionName}</div>`).join('')}
        ${item.note ? `<div style="font-size:0.8em;padding-left:0.5rem">📝 ${item.note}</div>` : ''}
      `).join('')}
    `
  }

  if (type === 'till' && paymentData) {
    const grouped = Object.values(order.items.reduce((acc, i) => {
      const key = i.name + JSON.stringify(i.modifiers || [])
      if (acc[key]) acc[key] = { ...acc[key], qty: acc[key].qty + i.qty }
      else acc[key] = { ...i }
      return acc
    }, {}))

    content = `
      <div style="border-bottom:1px dashed #000;padding-bottom:0.5rem;margin-bottom:0.5rem;text-align:center">
        <div style="font-size:1.2em;font-weight:bold">${rName}</div>
        <div>${s.address || ''}</div>
        <div>${s.phone || ''}</div>
        <div>${date} · ${time}</div>
        <div style="font-size:1.1em;font-weight:bold">${order.isTakeaway ? `🥡 ${order.takeawayName}` : `Table ${order.table}`} · ORDER #${order.orderNum || order.id}</div>
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:0.5rem;margin-bottom:0.5rem">
        ${grouped.map(i => `
          <div style="display:flex;justify-content:space-between">
            <span>${i.name} x${i.qty}</span>
            <span>€${((i.price + (i.modifierTotal || 0)) * i.qty).toFixed(2)}</span>
          </div>
          ${(i.modifiers || []).map(m => `<div style="font-size:0.8em;padding-left:0.5rem;display:flex;justify-content:space-between"><span>› ${m.groupName}: ${m.optionName}</span>${m.price !== 0 ? `<span>${m.price > 0 ? '+' : ''}€${m.price.toFixed(2)}</span>` : ''}</div>`).join('')}
        `).join('')}
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:0.5rem;margin-bottom:0.5rem">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>€${paymentData.subtotal.toFixed(2)}</span></div>
        ${paymentData.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount</span><span>-€${paymentData.discountAmount.toFixed(2)}</span></div>` : ''}
        ${paymentData.serviceChargeAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Service Charge</span><span>€${paymentData.serviceChargeAmount.toFixed(2)}</span></div>` : ''}
        ${paymentData.depositDeduction > 0 ? `<div style="display:flex;justify-content:space-between"><span>Deposit</span><span>-€${paymentData.depositDeduction.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:1.1em"><span>TOTAL</span><span>€${paymentData.finalTotal.toFixed(2)}</span></div>
        ${paymentData.tip > 0 ? `<div style="display:flex;justify-content:space-between"><span>Tip 🙏</span><span>€${paymentData.tip.toFixed(2)}</span></div>` : ''}
        ${paymentData.change > 0 ? `<div style="display:flex;justify-content:space-between"><span>Change</span><span>€${paymentData.change.toFixed(2)}</span></div>` : ''}
      </div>
      <div style="margin-bottom:0.5rem">
        ${paymentData.payments.map(p => `<div style="display:flex;justify-content:space-between"><span>${p.method}${p.note ? ` (${p.note})` : ''}</span><span>€${parseFloat(p.amount).toFixed(2)}</span></div>`).join('')}
      </div>
      <div style="text-align:center;font-size:0.85em">${s.receiptFooter || 'Thank you for dining with us!'}</div>
    `
  }

  if (type === 'card' && paymentData) {
    const cardPayments = paymentData.payments.filter(p => p.method === 'Card')
    for (let copy = 1; copy <= copies; copy++) {
      content += `
        ${copy > 1 ? '<div style="border-top:2px dashed #000;margin-top:1rem;padding-top:1rem"></div>' : ''}
        <div style="border-bottom:1px dashed #000;padding-bottom:0.4rem;margin-bottom:0.4rem;text-align:center">
          <div style="font-weight:bold">${rName}</div>
          <div>${date} · ${time}</div>
        </div>
        <div style="border-bottom:1px dashed #000;padding-bottom:0.4rem;margin-bottom:0.4rem">
          <div style="display:flex;justify-content:space-between">
            <span>${order.isTakeaway ? `🥡 ${order.takeawayName}` : `Table ${order.table}`}</span>
            <span>ORDER #${order.orderNum || order.id}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:1.2em">
            <span>TOTAL</span><span>€${cardPayments.length > 0 ? parseFloat(cardPayments[copy-1]?.amount || paymentData.finalTotal).toFixed(2) : paymentData.finalTotal.toFixed(2)}</span>
          </div>
          <div>Card Payment</div>
        </div>
        <div style="margin-top:1rem">
          <div style="border-bottom:1px solid #000;margin-bottom:0.3rem;padding-bottom:1.5rem">Signature: _______________</div>
          <div style="font-size:0.75em;text-align:center">${copy === 1 ? 'CUSTOMER COPY' : 'MERCHANT COPY'}</div>
        </div>
      `
    }
  }

  const html = `<html><head><title>Docket</title><style>
    body{font-family:monospace;width:${width};margin:0 auto;padding:0.5rem;color:#000;font-size:${fontSize}}
    *{box-sizing:border-box}
    @media print{body{width:${width}}}
  </style></head><body>${content}</body></html>`

  const printerName = settings.printing?.[type]?.printerName || null
  qzPrint(html, printerName)
}


export function POSProvider({ children }) {

  const usePersist = (key, defaultValue) => {
    const [state, setState] = useState(defaultValue)
    return [state, setState]
  }

  const [tables,          setTables]          = useState(DEFAULT_TABLES)
  const [floors,          setFloors]          = useState(DEFAULT_FLOORS)
  const [menu,            setMenu]            = useState(DEFAULT_MENU)
  const [bookings,        setBookings]        = useState(SAMPLE_BOOKINGS)
  const [orderHistory,    setOrderHistory]    = useState(SAMPLE_HISTORY)
  const [stock,           setStock]           = useState(SAMPLE_STOCK)
  const [staff,           setStaff]           = useState(SAMPLE_STAFF)
  const [customers,       setCustomers]       = useState(SAMPLE_CUSTOMERS)
  const [settings,        setSettings]        = useState(DEFAULT_SETTINGS)
  const [giftCards,       setGiftCards]       = useState({ 'GIFT50': 50.00, 'GIFT25': 25.00 })
  const [stockMovements,  setStockMovements]  = useState([])
  const [modifierLibrary, setModifierLibrary] = useState([])
  const [loaded,          setLoaded]          = useState(false)

  // ── Load all data from Supabase on startup ──
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          { data: floorsData },
          { data: tablesData },
          { data: staffData },
          { data: settingsData },
          { data: giftCardsData },
          { data: stockData },
          { data: stockMovementsData },
          { data: customersData },
          { data: bookingsData },
          { data: orderHistoryData },
          { data: modifierLibraryData },
          { data: categoriesData },
          { data: itemsData },
        ] = await Promise.all([
          db.floors.getAll(),
          db.tables.getAll(),
          db.staff.getAll(),
          db.settings.get(),
          db.giftCards.getAll(),
          db.stock.getAll(),
          db.stockMovements.getAll(),
          db.customers.getAll(),
          db.bookings.getAll(),
          db.orderHistory.getAll(),
          db.modifierLibrary.getAll(),
          db.menu.getCategories(),
          db.menu.getItems(),
        ])

        if (floorsData?.length)          setFloors(floorsData.map(f => ({ id: f.id, name: f.name, color: f.color })))
        if (tablesData?.length)          setTables(tablesData.map(t => ({ id: t.id, floorId: t.floor_id, x: t.x, y: t.y, shape: t.shape, seats: t.seats, width: t.width, height: t.height, sizeKey: t.size_key, note: t.note, status: t.status })))
        if (staffData?.length)           setStaff(staffData.map(s => ({ id: s.id, name: s.name, username: s.username, password: s.password, role: s.role, section: s.section, experience: s.experience, active: s.active, clockRecords: s.clock_records || [] })))
        if (settingsData?.data)          setSettings(settingsData.data)
        if (giftCardsData?.length)       setGiftCards(Object.fromEntries(giftCardsData.map(g => [g.code, g.balance])))
        if (stockData?.length)           setStock(stockData.map(s => ({ id: s.id, name: s.name, category: s.category, unit: s.unit, quantity: parseFloat(s.quantity), minThreshold: parseFloat(s.min_threshold), costPrice: parseFloat(s.cost_price), supplier: s.supplier, supplierPhone: s.supplier_phone, supplierEmail: s.supplier_email, deliveryDay: s.delivery_day, menuItemId: s.menu_item_id, portionPerSale: parseFloat(s.portion_per_sale) })))
        if (stockMovementsData?.length)  setStockMovements(stockMovementsData.map(m => ({ id: m.id, stockItemId: m.stock_item_id, stockItemName: m.stock_item_name, delta: parseFloat(m.delta), reason: m.reason, before: parseFloat(m.before_qty), after: parseFloat(m.after_qty), by: m.by_staff, at: m.created_at })))
        if (customersData?.length)       setCustomers(customersData.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, birthday: c.birthday, notes: c.notes, points: c.points, stamps: c.stamps, totalSpend: parseFloat(c.total_spend), visits: c.visits, visitHistory: c.visit_history || [] })))
        if (bookingsData?.length)        setBookings(bookingsData.map(b => ({ id: b.id, name: b.name, phone: b.phone, email: b.email, guests: b.guests, date: b.date, time: b.time, duration: b.duration, status: b.status, notes: b.notes, depositPaid: b.deposit_paid, depositAmount: parseFloat(b.deposit_amount), preferredTable: b.preferred_table, favDishes: b.fav_dishes, favDrinks: b.fav_drinks })))
        if (orderHistoryData?.length)    setOrderHistory(orderHistoryData.map(o => ({ id: o.id, table: o.table_id, items: o.items || [], total: parseFloat(o.total), status: o.status, payment: o.payment, placedBy: o.placed_by, closedAt: o.closed_at, covers: o.covers, isTakeaway: o.is_takeaway, takeawayName: o.takeaway_name, orderNum: o.order_num })))
        if (modifierLibraryData?.length) setModifierLibrary(modifierLibraryData.map(m => ({ id: m.id, name: m.name, required: m.required, options: m.options || [] })))

        if (categoriesData?.length && itemsData?.length) {
          const menuObj = {}
          categoriesData.forEach(cat => {
            menuObj[cat.name] = itemsData
              .filter(i => i.category_id === cat.id)
              .map(i => ({ id: i.id, name: i.name, price: parseFloat(i.price), description: i.description, allergens: i.allergens, available: i.available, modifiers: i.modifiers || [] }))
          })
          setMenu(menuObj)
        }

        setLoaded(true)
      } catch (err) {
        console.error('Failed to load from Supabase:', err)
        setLoaded(true)
      }
    }
    loadAll()
  }, [])

  const [orders,               setOrders]               = useState([])
  const [tabs, setTabs] = usePersist('tabs', [])
  const [activePaymentOrderId, setActivePaymentOrderId] = useState(null)
  const [currentUser,          setCurrentUser]          = useState(null)
  const [kitchenAlerts, setKitchenAlerts] = useState([])

  // ── Auth ──
  const login = (username, password) => {
    const member = staff.find(s => s.username === username && s.password === password && s.active)
    if (!member) return false
    setCurrentUser(member)
    return true
  }
  const logout    = () => setCurrentUser(null)
  const canAccess = (route) => {
    if (!currentUser) return false
    const allowed = ROLE_CONFIG[currentUser.role]?.routes || []
    return allowed.includes('*') || allowed.includes(route)
  }

  // ── Staff ──
  const clockIn       = (id) => setStaff(prev => prev.map(s => { if (s.id !== id || s.clockRecords.some(r => !r.out)) return s; return { ...s, clockRecords: [...s.clockRecords, { in: new Date().toISOString(), out: null }] } }))
  const clockOut      = (id) => setStaff(prev => prev.map(s => s.id !== id ? s : { ...s, clockRecords: s.clockRecords.map(r => !r.out ? { ...r, out: new Date().toISOString() } : r) }))
  const isClockedIn   = (id) => staff.find(s => s.id === id)?.clockRecords.some(r => !r.out) || false
  const getTotalHours = (id) => (staff.find(s => s.id === id)?.clockRecords || []).reduce((t, r) => {
    if (!r.out) return t + (Date.now() - new Date(r.in).getTime()) / 3600000
    return t + (new Date(r.out) - new Date(r.in)) / 3600000
  }, 0)
  const addStaff      = (m)  => setStaff(prev => [...prev, { ...m, id: Date.now(), clockRecords: [] }])
  const updateStaff   = (m)  => setStaff(prev => prev.map(s => s.id === m.id ? m : s))
  const deleteStaff   = (id) => setStaff(prev => prev.filter(s => s.id !== id))

  // ── Floors ──
  const addFloor    = (floor) => setFloors(prev => [...prev, { ...floor, id: 'floor-' + Date.now() }])
  const updateFloor = (floor) => setFloors(prev => prev.map(f => f.id === floor.id ? floor : f))
  const deleteFloor = (id)    => { setFloors(prev => prev.filter(f => f.id !== id)); setTables(prev => prev.filter(t => t.floorId !== id)) }

  // ── Tables ──
  const updateTableStatus   = (id, status) => setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  const updateTablePosition = (id, x, y)   => setTables(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
  const updateTableData     = (updated)     => setTables(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
  const addTableToFloor     = (floorId)     => {
    const newId = Math.max(...tables.map(t => t.id), 0) + 1
    setTables(prev => [...prev, { id: newId, floorId, x: 40, y: 40, shape: 'square', seats: 4 }])
  }
  const removeTable = (id) => setTables(prev => prev.filter(t => t.id !== id))

  // ── Customers ──
  const addCustomer    = (c)  => setCustomers(prev => [...prev, { ...c, id: Date.now(), points: 0, stamps: 0, totalSpend: 0, visits: 0, visitHistory: [] }])
  const updateCustomer = (c)  => setCustomers(prev => prev.map(x => x.id === c.id ? c : x))
  const deleteCustomer = (id) => setCustomers(prev => prev.filter(c => c.id !== id))

  const awardPoints = (customerId, orderTotal, orderId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c
      const earned    = Math.floor(orderTotal * settings.pointsPerEuro)
      const newStamps = c.stamps + 1
      return {
        ...c,
        points:       c.points + earned,
        stamps:       newStamps >= settings.stampTarget ? 0 : newStamps,
        totalSpend:   c.totalSpend + orderTotal,
        visits:       c.visits + 1,
        visitHistory: [...c.visitHistory, { orderId, total: orderTotal, date: new Date().toISOString(), pointsEarned: earned }],
      }
    }))
  }
  const redeemPoints = (customerId, points) => setCustomers(prev => prev.map(c => c.id !== customerId ? c : { ...c, points: Math.max(0, c.points - points) }))

  // ── Stock ──
  const deductStock = (items) => {
    const movements = []
    const now = new Date().toISOString()
    const userName = currentUser?.name || 'System'
    setStock(prev => {
      const updated = prev.map(s => {
        if (!s.menuItemId) return s
        const o = items.find(i => i.id === s.menuItemId)
        if (!o) return s
        const delta = -(o.qty * s.portionPerSale)
        const after = Math.max(0, s.quantity + delta)
        movements.push({
          id: Date.now() + Math.random(),
          stockItemId: s.id,
          stockItemName: s.name,
          delta: parseFloat(delta.toFixed(4)),
          reason: `Sale — ${o.name}`,
          before: s.quantity,
          after,
          by: userName,
          at: now,
        })
        return { ...s, quantity: after }
      })
      setTimeout(() => {
        if (movements.length > 0) setStockMovements(p => [...p, ...movements])
      }, 0)
      return updated
    })
  }

  const addStockItem    = (item)      => setStock(prev => [...prev, { ...item, id: Date.now() }])
  const updateStockItem = (item)      => setStock(prev => prev.map(s => s.id === item.id ? item : s))
  const deleteStockItem = (id)        => setStock(prev => prev.filter(s => s.id !== id))
  const adjustStock = (id, delta, reason = 'Manual adjustment') => {
  setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s))
  const item = stock.find(s => s.id === id)
  if (!item) return
  setStockMovements(prev => [...prev, {
    id: Date.now(),
    stockItemId: id,
    stockItemName: item.name,
    delta,
    reason,
    before: item.quantity,
    after: Math.max(0, item.quantity + delta),
    by: currentUser?.name || 'Unknown',
    at: new Date().toISOString(),
  }])
}

  // ── Orders ──
  const placeOrder = (order) => {
    const itemsMarked  = order.items.map(i => ({ ...i, isNew: false }))
    const courses = buildCourses(itemsMarked, menu, settings.courses)
    const hasDrinks    = itemsMarked.some(i => getItemDestination(i.id, menu) === 'bar')
    setOrders(prev => [...prev, {
      ...order,
      items:     itemsMarked,
      courses,
      barStatus: hasDrinks ? 'pending' : 'none',
      placedAt:  new Date().toISOString(),
      placedBy:  currentUser?.name || 'Unknown',
      modified:  false,
    }])
    updateTableStatus(order.table, 'occupied')
    deductStock(order.items)
    const hasFoodItems = order.items.some(i => getItemDestination(i.id, menu) === 'kitchen')
    const hasDrinkItems = order.items.some(i => getItemDestination(i.id, menu) === 'bar')
    if (hasFoodItems) setTimeout(() => printDocket('kitchen', { ...order, placedBy: currentUser?.name || 'Staff' }), 300)
    if (hasDrinkItems) setTimeout(() => printDocket('bar', { ...order, placedBy: currentUser?.name || 'Staff' }), 600)
  }

  const closeOrder = (id, paymentData = null) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const enrichedItems = order.items.map(item => {
      const category = Object.entries(menu).find(([, items]) => items.find(i => i.id === item.id))?.[0] || 'Other'
      return { ...item, category }
    })
  setOrderHistory(prev => [...prev, { ...order, items: enrichedItems, closedAt: new Date().toISOString(), payment: paymentData, placedBy: order.placedBy || currentUser?.name || 'Unknown', status: 'closed' }])    
       setOrders(prev => prev.filter(o => o.id !== id))
    const still = orders.filter(o => o.id !== id && o.table === order.table).length > 0
if (!still) updateTableStatus(order.table, 'free')
if (order.mergedTables?.length > 0) {
  order.mergedTables.forEach(tableId => updateTableStatus(tableId, 'free'))
}
    const customerId = order.customerId || paymentData?.customerId
    if (customerId) awardPoints(customerId, order.total, id)
    if (paymentData?.redeemedPoints && customerId) redeemPoints(customerId, paymentData.redeemedPoints)
  }

  const toggleOrderStatus  = (id) => setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: o.status === 'pending' ? 'ready' : 'pending' }))
  const advanceOrderStatus = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o
      const newStatus = o.status === 'pending' ? 'in-progress' : 'ready'
      return { ...o, status: newStatus }
    }))
  }
  const toggleUrgent       = (id) => setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, urgent: !o.urgent }))

  // ── Bar status ──
  const updateBarStatus = (orderId, barStatus) =>
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      const round = barStatus === 'pending' ? (o.round || 1) + 1 : o.round || 1
      return { ...o, barStatus, round: barStatus === 'done' ? round : o.round || 1 }
    }))


  const openTab = (name) => {
  const tab = { id: Date.now(), name, items: [], total: 0, barStatus: 'pending', isTab: true, round: 1, placedAt: new Date().toISOString(), placedBy: currentUser?.name || 'Unknown' }
  setTabs(prev => [...prev, tab])
}
const updateTab = (updatedTab) => setTabs(prev => prev.map(t => t.id === updatedTab.id ? updatedTab : t))
const closeTab = (id) => {
  const tab = tabs.find(t => t.id === id)
  if (!tab) return
  const orderId = Date.now()
  setOrders(prev => [...prev, { ...tab, id: orderId, table: null, isTab: true, status: 'ready', courses: {}, barStatus: 'done' }])
  setTabs(prev => prev.filter(t => t.id !== id))
  setActivePaymentOrderId(orderId)
}

  // ── Update order — detect new items ──
  const updateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== updatedOrder.id) return o
      const markedItems = updatedOrder.items.map(newItem => {
        const oldItem = o.items.find(i => i._key === newItem._key || (i.id === newItem.id && JSON.stringify(i.modifiers) === JSON.stringify(newItem.modifiers)))
        if (!oldItem)                  return { ...newItem, isNew: true }
        if (newItem.qty > oldItem.qty) return { ...newItem, isNew: true, _addedQty: newItem.qty - oldItem.qty }
        const noteChanged = newItem.note !== oldItem.note
const modsChanged = JSON.stringify(newItem.modifiers) !== JSON.stringify(oldItem.modifiers)
return { ...newItem, isNew: noteChanged || modsChanged }
      })
      const newCourses    = buildCourses(markedItems, menu, settings.courses)
      const mergedCourses = { ...newCourses }
      Object.keys(o.courses || {}).forEach(k => { if (o.courses[k] === 'fired') mergedCourses[k] = 'fired' })
      const hasNewItems   = markedItems.some(i => i.isNew)
      const hasDrinks     = markedItems.some(i => getItemDestination(i.id, menu) === 'bar')
      const newBarStatus  = hasDrinks ? (o.barStatus === 'none' ? 'pending' : o.barStatus) : 'none'
      // If new drinks added, reset bar status to pending
      const hasNewDrinks  = markedItems.some(i => i.isNew && getItemDestination(i.id, menu) === 'bar')
      return {
        ...updatedOrder,
        items:      markedItems,
        courses:    mergedCourses,
        round:      hasNewDrinks ? (o.round || 1) + 1 : o.round || 1,
        barStatus:  hasNewDrinks ? 'pending' : newBarStatus,
        modified:   hasNewItems,
        modifiedAt: hasNewItems ? new Date().toISOString() : o.modifiedAt,
      }
    }))
    updateTableStatus(updatedOrder.table, 'occupied')
  }

  const mergeTables = (primaryOrderId, secondaryTableId) => {
  setOrders(prev => {
    const primary   = prev.find(o => o.id === primaryOrderId)
    const secondary = prev.find(o => o.table === secondaryTableId)
    if (!primary || !secondary) return prev
    const mergedItems = [
      ...primary.items,
      ...secondary.items.map(i => ({ ...i, _key: i._key + '_merged', fromTable: secondaryTableId }))
    ]
    const newTotal = mergedItems.reduce((s, i) => s + (i.price + (i.modifierTotal || 0)) * i.qty, 0)
    return prev
      .filter(o => o.table !== secondaryTableId)
      .map(o => o.id !== primaryOrderId ? o : {
        ...o,
        items: mergedItems,
        total: newTotal,
        mergedTables: [...(o.mergedTables || []), secondaryTableId],
      })
  })
}

const moveItems = (fromOrderId, itemKeys, toTableId) => {
  setOrders(prev => {
    const fromOrder = prev.find(o => o.id === fromOrderId)
    if (!fromOrder) return prev
    const itemsToMove = fromOrder.items.filter(i => itemKeys.includes(i._key))
    const itemsToStay = fromOrder.items.filter(i => !itemKeys.includes(i._key))
    const moveTotal   = itemsToMove.reduce((s, i) => s + (i.price + (i.modifierTotal || 0)) * i.qty, 0)
    const stayTotal   = itemsToStay.reduce((s, i) => s + (i.price + (i.modifierTotal || 0)) * i.qty, 0)
    const toOrder     = prev.find(o => o.table === toTableId)
    if (toOrder) {
      return prev
        .map(o => {
          if (o.id === fromOrderId) return { ...o, items: itemsToStay, total: stayTotal }
          if (o.id === toOrder.id) return { ...o, items: [...o.items, ...itemsToMove.map(i => ({ ...i, _key: i._key + '_moved', isAddition: true, isNew: true }))], total: toOrder.total + moveTotal, modified: true, modifiedAt: new Date().toISOString() }
          return o
        })
        .filter(o => o.items.length > 0)
    } else {
      const newOrder = { ...fromOrder, id: Date.now(), table: toTableId, items: itemsToMove.map(i => ({ ...i, isAddition: false, isNew: true })), total: moveTotal, placedAt: new Date().toISOString(), modified: true, modifiedAt: new Date().toISOString() }
      return [
        ...prev
          .map(o => o.id === fromOrderId ? { ...o, items: itemsToStay, total: stayTotal } : o)
          .filter(o => o.items.length > 0),
        newOrder
      ]
    }
  })
}

  // ── Fire course ──
  const fireCourse = (orderId, course) => {
    setOrders(prev => prev.map(o => o.id !== orderId ? o : {
      ...o,
      courses:    { ...o.courses, [course]: 'fired' },
      status:     'in-progress',
      modified:   true,
      modifiedAt: new Date().toISOString(),
      items:      o.items.map(i => {
        const ic = getItemCourse(i.id, menu)
        if (ic === course && getItemDestination(i.id, menu) === 'kitchen') return { ...i, isNew: true }
        return i
      }),
    }))
  }

  const serveCourse = (orderId, course) => {
    setOrders(prev => prev.map(o => o.id !== orderId ? o : {
      ...o,
      servedCourses: { ...(o.servedCourses || {}), [course]: true },
      status: 'in-progress',
    }))
  }

  // ── Kitchen acknowledges ──
  const acknowledgeOrder = (id) => {
    setOrders(prev => prev.map(o => o.id !== id ? o : {
      ...o,
      modified: false,
      items:    o.items.map(i => ({ ...i, isNew: false, _addedQty: undefined })),
    }))
  }

  // ── Payments ──
  const openPayment    = (id)       => setActivePaymentOrderId(id)
  const closePayment   = ()         => setActivePaymentOrderId(null)
  const processPayment = (id, data) => {
    if (data.giftCardCode && data.giftCardRemainder > 0) setGiftCards(prev => ({ ...prev, [data.giftCardCode]: data.giftCardRemainder }))
    const order = orders.find(o => o.id === id)
    closeOrder(id, data)
    if (order) {
      setTimeout(() => printDocket('till', order, data), 300)
      const hasCard = data.payments?.some(p => p.method === 'Card')
      if (hasCard) setTimeout(() => printDocket('card', order, data), 600)
    }
  }
  const checkGiftCard = (code) => { const b = giftCards[code.toUpperCase()]; return b !== undefined ? b : null }

  // ── Bookings ──
  const addBooking          = (b)          => setBookings(prev => [...prev, { ...b, id: Date.now() }])
  const updateBooking       = (b)          => setBookings(prev => prev.map(x => x.id === b.id ? b : x))
  const deleteBooking       = (id)         => setBookings(prev => prev.filter(b => b.id !== id))
  const updateBookingStatus = (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    if (status === 'seated') { const b = bookings.find(x => x.id === id); if (b?.preferredTable) updateTableStatus(b.preferredTable, 'occupied') }
  }

  // ── Menu ──
  const addCategory            = (n)     => { if (!n || menu[n]) return; setMenu(prev => ({ ...prev, [n]: [] })) }
  const deleteCategory         = (n)     => setMenu(prev => { const u = { ...prev }; delete u[n]; return u })
  const addMenuItem            = (c, i)  => setMenu(prev => ({ ...prev, [c]: [...(prev[c] || []), { ...i, id: Date.now().toString(), available: true }] }))
  const updateMenuItem         = (c, i)  => setMenu(prev => ({ ...prev, [c]: prev[c].map(x => x.id === i.id ? i : x) }))
  const deleteMenuItem         = (c, id) => setMenu(prev => ({ ...prev, [c]: prev[c].filter(i => i.id !== id) }))
  const toggleItemAvailability = (c, id) => {
    const item = (menu[c] || []).find(i => i.id === id)
    if (!item) return
    setMenu(prev => ({ ...prev, [c]: prev[c].map(i => i.id === id ? { ...i, available: !i.available } : i) }))
    if (item.available) {
      // Going unavailable — fire an alert
      const alert = { id: Date.now(), itemName: item.name, category: c, time: new Date().toISOString() }
      setKitchenAlerts(prev => [...prev, alert])
    }
  }

  const dismissAlert = (id) => setKitchenAlerts(prev => prev.filter(a => a.id !== id))
  const dismissAllAlerts = () => setKitchenAlerts([])

  // ── Settings ──
  const updateSettings = (updated) => {
    setSettings(updated)
    if (updated.tableCount !== settings.tableCount) {
      const current = tables.length
      const target  = updated.tableCount
      if (target > current) {
        const newTables = Array.from({ length: target - current }, (_, i) => ({
          id: current + i + 1, floorId: floors[0]?.id || 'floor-indoor',
          x: ((current + i) % 5) * 140 + 30, y: Math.floor((current + i) / 5) * 140 + 30,
          shape: 'square', seats: 4,
        }))
        setTables(prev => [...prev, ...newTables])
      } else {
        setTables(prev => prev.filter(t => t.id <= target))
      }
    }
  }

  return (
    <POSContext.Provider value={{
      tables, floors, orders, orderHistory, menu, bookings, giftCards,
      activePaymentOrderId, staff, currentUser, stock, settings, customers,
      login, logout, canAccess,
      clockIn, clockOut, isClockedIn, getTotalHours,
      addStaff, updateStaff, deleteStaff,
      addFloor, updateFloor, deleteFloor,
      updateTableStatus, updateTablePosition, updateTableData, addTableToFloor, removeTable,
      placeOrder, closeOrder, toggleOrderStatus, advanceOrderStatus, toggleUrgent,
      updateOrder, mergeTables, moveItems, fireCourse, serveCourse, acknowledgeOrder, updateBarStatus,tabs, openTab, updateTab, closeTab,
      openPayment, closePayment, processPayment, checkGiftCard,
      addBooking, updateBooking, deleteBooking, updateBookingStatus,
      addCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
      kitchenAlerts, dismissAlert, dismissAllAlerts,
      addStockItem, updateStockItem, deleteStockItem, adjustStock, stockMovements,
      addCustomer, updateCustomer, deleteCustomer, awardPoints, redeemPoints,
      updateSettings,modifierLibrary, setModifierLibrary,
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  return useContext(POSContext)
}