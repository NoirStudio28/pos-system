import { useState } from 'react'
import { usePOS } from '../../context/POSContext'

export default function LoginScreen() {
  const { login } = usePOS()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!username || !password) { setError('Enter username and password'); return }
    setLoading(true)
    setTimeout(() => {
      const ok = login(username, password)
      if (!ok) { setError('Invalid username or password'); setLoading(false) }
    }, 300)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '1rem',
    }}>
      <style>{`
        .input { background: #0D0D14; border: 1px solid #2D2D3F; border-radius: 8px; padding: 0.7rem 0.9rem; color: #E2E8F0; font-family: 'Courier New', monospace; font-size: 0.85rem; width: 100%; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
        .input:focus { border-color: #F97316; }
        .btn { border: none; border-radius: 10px; padding: 0.75rem 1rem; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: 700; transition: all 0.15s; width: 100%; }
        .btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary { background: #F97316; color: #000; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍽️</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>POS System</h1>
          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem', letterSpacing: '0.15em' }}>STAFF LOGIN</div>
        </div>

        <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.8rem' }}>
          <div style={{ marginBottom: '0.9rem' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>USERNAME</label>
            <input className="input" placeholder="Enter username" value={username} onChange={e => { setUsername(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>PASSWORD</label>
            <input className="input" type="password" placeholder="Enter password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div style={{ fontSize: '0.72rem', color: '#EF4444', marginBottom: '0.8rem', textAlign: 'center' }}>{error}</div>}
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In →'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.58rem', color: '#334155', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>DEMO LOGINS</div>
          {[
            { role: 'Admin', u: 'admin', p: 'admin123' },
            { role: 'Manager', u: 'sarah', p: 'sarah123' },
            { role: 'Waiter', u: 'emma', p: 'emma123' },
            { role: 'Kitchen', u: 'marco', p: 'marco123' },
            { role: 'Cashier', u: 'tom', p: 'tom123' },
          ].map(d => (
            <div
              key={d.u}
              onClick={() => { setUsername(d.u); setPassword(d.p); setError('') }}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569', marginBottom: '0.3rem', cursor: 'pointer', padding: '0.2rem 0.3rem', borderRadius: 4, transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E1E2E'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#64748B' }}>{d.role}</span>
              <span>{d.u} / {d.p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}