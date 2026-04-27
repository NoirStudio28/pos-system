import { supabase } from './supabase'

// ── Tables ──
export const db = {
  tables: {
    getAll: () => supabase.from('tables').select('*').order('id'),
    upsert: (data) => supabase.from('tables').upsert(data),
    delete: (id) => supabase.from('tables').delete().eq('id', id),
  },
  floors: {
    getAll: () => supabase.from('floors').select('*').order('created_at'),
    upsert: (data) => supabase.from('floors').upsert(data),
    delete: (id) => supabase.from('floors').delete().eq('id', id),
  },
  menu: {
    getCategories: () => supabase.from('menu_categories').select('*').order('position'),
    getItems: () => supabase.from('menu_items').select('*').order('position'),
    upsertCategory: (data) => supabase.from('menu_categories').upsert(data),
    upsertItem: (data) => supabase.from('menu_items').upsert(data),
    deleteCategory: (id) => supabase.from('menu_categories').delete().eq('id', id),
    deleteItem: (id) => supabase.from('menu_items').delete().eq('id', id),
  },
  orders: {
    getAll: () => supabase.from('orders').select('*').order('created_at'),
    upsert: (data) => supabase.from('orders').upsert(data),
    delete: (id) => supabase.from('orders').delete().eq('id', id),
  },
  orderHistory: {
    getAll: () => supabase.from('order_history').select('*').order('closed_at', { ascending: false }),
    insert: (data) => supabase.from('order_history').insert(data),
  },
  staff: {
    getAll: () => supabase.from('staff').select('*').order('id'),
    upsert: (data) => supabase.from('staff').upsert(data),
    delete: (id) => supabase.from('staff').delete().eq('id', id),
  },
  bookings: {
    getAll: () => supabase.from('bookings').select('*').order('date'),
    upsert: (data) => supabase.from('bookings').upsert(data),
    delete: (id) => supabase.from('bookings').delete().eq('id', id),
  },
  stock: {
    getAll: () => supabase.from('stock').select('*').order('id'),
    upsert: (data) => supabase.from('stock').upsert(data),
    delete: (id) => supabase.from('stock').delete().eq('id', id),
  },
  stockMovements: {
    getAll: () => supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
    insert: (data) => supabase.from('stock_movements').insert(data),
  },
  customers: {
    getAll: () => supabase.from('customers').select('*').order('id'),
    upsert: (data) => supabase.from('customers').upsert(data),
    delete: (id) => supabase.from('customers').delete().eq('id', id),
  },
  settings: {
    get: () => supabase.from('settings').select('*').eq('id', 1).single(),
    upsert: (data) => supabase.from('settings').upsert({ id: 1, data, updated_at: new Date().toISOString() }),
  },
  giftCards: {
    getAll: () => supabase.from('gift_cards').select('*'),
    upsert: (data) => supabase.from('gift_cards').upsert(data),
  },
  modifierLibrary: {
    getAll: () => supabase.from('modifier_library').select('*').order('created_at'),
    upsert: (data) => supabase.from('modifier_library').upsert(data),
    delete: (id) => supabase.from('modifier_library').delete().eq('id', id),
  },
}