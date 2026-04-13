import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { usePOS, ROLE_CONFIG } from './context/POSContext'
import TablesView from './modules/tables/TablesView'
import OrdersView from './modules/orders/OrdersView'
import MenuView from './modules/menu/MenuView'
import KDSView from './modules/kds/KDSView'
import BarView from './modules/bar/BarView'
import BookingsView from './modules/bookings/BookingsView'
import ReportsView from './modules/reports/ReportsView'
import PaymentModal from './modules/payments/PaymentModal'
import LoginScreen from './modules/staff/LoginScreen'
import StaffView from './modules/staff/StaffView'
import StockView from './modules/stock/StockView'
import CustomersView from './modules/customers/CustomersView'
import DashboardView from './modules/dashboard/DashboardView'
import SettingsView from './modules/settings/SettingsView'
import useBreakpoint from './hooks/useBreakpoint'
import EODView from './modules/eod/EODView'

const ALL_LINKS = [
  { to: '/dashboard',       label: '🏠 Dashboard'   },
  { to: '/tables',          label: '🍽️ Tables'       },
  { to: '/orders',          label: '📋 Orders'       },
  { to: '/kds',             label: '👨‍🍳 Kitchen'      },
  { to: '/bar',             label: '🍺 Bar'          },
  { to: '/menu',            label: '📖 Menu'         },
  { to: '/bookings',        label: '📅 Bookings'     },
  { to: '/reports',         label: '📊 Reports'      },
  { to: '/stock',           label: '📦 Stock'        },
  { to: '/staff',           label: '👥 Staff'        },
  { to: '/staff-analytics', label: '📈 Performance'  },
  { to: '/customers',       label: '💳 Customers'    },
  { to: '/settings',        label: '⚙️ Settings'     },
  { to: '/eod',             label: '📋 EOD Report'   },
]

function Nav() {
  const { pathname } = useLocation()
  const { currentUser, logout, canAccess } = usePOS()
  const role = ROLE_CONFIG[currentUser?.role]
  const { isMobile, isTablet } = useBreakpoint()
  const visibleLinks = ALL_LINKS.filter(l => canAccess(l.to))

  const ICONS = {
    '/dashboard': '🏠', '/tables': '🍽️', '/orders': '📋', '/kds': '👨‍🍳', '/bar': '🍺',
    '/menu': '📖', '/bookings': '📅', '/reports': '📊', '/stock': '📦',
    '/staff': '👥', '/customers': '💳', '/settings': '⚙️', '/dev/map': '🗺️',
  }

  if (isMobile || isTablet) {
    return (
      <>
        <div style={{ background: '#13131A', borderBottom: '1px solid #1E1E2E', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Courier New', monospace" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F97316' }}>🍽️</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1' }}>{currentUser?.name}</span>
            <span style={{ fontSize: '0.6rem', color: role?.color }}>· {role?.label}</span>
          </div>
          <button onClick={logout} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.65rem', fontWeight: 700 }}>
            Out
          </button>
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0F0F17', borderTop: '1px solid #1E1E2E', display: 'flex', zIndex: 500, overflowX: 'auto', fontFamily: "'Courier New', monospace" }}>
          {visibleLinks.map(l => {
            const active = pathname === l.to
            return (
              <Link key={l.to} to={l.to} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.8rem', textDecoration: 'none', minWidth: 60, borderTop: `2px solid ${active ? '#F97316' : 'transparent'}`, background: active ? '#F9731611' : 'transparent', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{ICONS[l.to] || '●'}</span>
                <span style={{ fontSize: '0.5rem', color: active ? '#F97316' : '#475569', marginTop: '0.2rem', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {l.label.replace(/^\S+\s/, '')}
                </span>
              </Link>
            )
          })}
        </div>
        <div style={{ height: 64 }} />
      </>
    )
  }

  return (
    <nav style={{ background: '#13131A', borderBottom: '1px solid #1E1E2E', padding: '0.65rem 1.5rem', display: 'flex', gap: '0.4rem', fontFamily: "'Courier New', monospace", flexWrap: 'wrap', alignItems: 'center' }}>
      {visibleLinks.map(l => (
        <Link key={l.to} to={l.to} style={{ padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', border: '1px solid', borderColor: pathname === l.to ? '#F97316' : '#1E1E2E', color: pathname === l.to ? '#F97316' : '#64748B', background: pathname === l.to ? '#F9731622' : 'transparent', transition: 'all 0.15s' }}>
          {l.label}
        </Link>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#CBD5E1', fontWeight: 700 }}>{currentUser?.name}</div>
          <div style={{ fontSize: '0.58rem', color: role?.color }}>{role?.label}</div>
        </div>
        <button onClick={logout} style={{ border: '1px solid #1E1E2E', background: 'transparent', color: '#64748B', borderRadius: 6, padding: '0.3rem 0.65rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.68rem', fontWeight: 700 }}>
          Log out
        </button>
      </div>
    </nav>
  )
}

function ProtectedRoute({ path, element }) {
  const { canAccess } = usePOS()
  return canAccess(path) ? element : <Navigate to="/" replace />
}

function AppRoutes() {
  const { currentUser } = usePOS()
  if (!currentUser) return <LoginScreen />
  const defaultRoute = ROLE_CONFIG[currentUser.role]?.routes[0] === '*'
    ? '/dashboard'
    : ROLE_CONFIG[currentUser.role]?.routes[0] || '/dashboard'

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"          element={<Navigate to={defaultRoute} replace />} />
        <Route path="/dashboard" element={<ProtectedRoute path="/dashboard" element={<DashboardView />}  />} />
        <Route path="/tables"    element={<ProtectedRoute path="/tables"    element={<TablesView />}     />} />
        <Route path="/orders"    element={<ProtectedRoute path="/orders"    element={<OrdersView />}     />} />
        <Route path="/kds"       element={<ProtectedRoute path="/kds"       element={<KDSView />}        />} />
        <Route path="/bar"       element={<ProtectedRoute path="/bar"       element={<BarView />}        />} />
        <Route path="/menu"      element={<ProtectedRoute path="/menu"      element={<MenuView />}       />} />
        <Route path="/bookings"  element={<ProtectedRoute path="/bookings"  element={<BookingsView />}  />} />
        <Route path="/reports"   element={<ProtectedRoute path="/reports"   element={<ReportsView />}    />} />
        <Route path="/stock"     element={<ProtectedRoute path="/stock"     element={<StockView />}      />} />
        <Route path="/staff"     element={<ProtectedRoute path="/staff"     element={<StaffView />}      />} />
        <Route path="/customers" element={<ProtectedRoute path="/customers" element={<CustomersView />}  />} />
        <Route path="/eod" element={<ProtectedRoute path="/eod" element={<EODView />} />} />
        <Route path="/settings"  element={<ProtectedRoute path="/settings"  element={<SettingsView />}   />} />
      </Routes>
      <PaymentModal />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}