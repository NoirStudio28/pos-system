import { useState } from 'react'
import { useMultiBusiness } from '../../context/MultiBusinessContext'

export default function SuperAdminLogin() {
  const { superLogin } = useMultiBusiness()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = () => {
    if (!username || !password) { setError('Enter credentials'); return }
    setLoading(true)
    setTimeout(() => {
      const ok = superLogin(username, password)
      if (!ok) { setError('Invalid credentials'); setLoading(false) }
    }, 300)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace", color: '#E2E8F0', padding: '1rem' }}>
      <style>{`.inp{background:#0D0D14;border:1px solid #2D2D3F;border-radius:8px;padding:0.7rem 0.9rem;color:#E2E8F0;font-family:'Courier New',monospace;font-size:0.85rem;width:100%;outline:none;box-sizing:border-box;transition:border-color 0.15s}.inp:focus{border-color:#8B5CF6}`}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#8B5CF6' }}>Super Admin</h1>
          <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.3rem', letterSpacing: '0.15em' }}>SYSTEM OWNER ACCESS ONLY</div>
        </div>

        <div style={{ background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 14, padding: '1.8rem' }}>
          <div style={{ marginBottom: '0.9rem' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>USERNAME</label>
            <input className="inp" placeholder="superadmin" value={username} onChange={e => { setUsername(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>PASSWORD</label>
            <input className="inp" type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div style={{ fontSize: '0.72rem', color: '#EF4444', marginBottom: '0.8rem', textAlign: 'center' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', border: 'none', background: '#8B5CF6', color: '#fff', borderRadius: 10, padding: '0.75rem', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.85rem', fontWeight: 700 }}>
            {loading ? 'Authenticating...' : '⚡ Access System'}
          </button>
        </div>

        <div style={{ marginTop: '1rem', background: '#13131A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '0.8rem', fontSize: '0.65rem', color: '#334155', textAlign: 'center' }}>
          Demo: superadmin / super123
        </div>
      </div>
    </div>
  )
}