import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

export default function Claim() {
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const { setClaimedUsername } = useOnboarding()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const val = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!val) { 
      toast('Please enter a username')
      return 
    }
    if (val.length < 3) {
      toast('Username must be at least 3 characters')
      return
    }

    setChecking(true)
    try {
      // 1. Check availability
      const checkRes = await fetch(`http://localhost:3001/api/auth/username-check?username=${val}`)
      const checkData = await checkRes.json()

      if (!checkRes.ok || !checkData.success) {
        toast(checkData.error || 'Failed to check username availability')
        return
      }

      if (!checkData.available) {
        toast(checkData.reason || 'Username is already taken')
        return
      }

      // 2. Reserve username
      const reserveRes = await fetch(`http://localhost:3001/api/auth/username-reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: val })
      })
      const reserveData = await reserveRes.json()

      if (!reserveRes.ok || !reserveData.success) {
        toast(reserveData.error || 'Failed to reserve username')
        return
      }

      // 3. On success, store and navigate
      setClaimedUsername(val)
      toast('Username claimed successfully! 🎉')
      setTimeout(() => {
        navigate(`/register?username=${val}`)
      }, 1000)

    } catch (err) {
      console.error(err)
      toast('Network error checking availability. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 50%, #F9FAFC 0%, #F3F5FA 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '520px', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}>
            <img src="/assets/images/logo-blue.png" alt="hiprofile logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text" style={{ color: '#3B82F6', fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>hiprofile</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: '10px' }}>Claim Your Profile</h1>
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '32px' }}>Enter your desired username to get started</p>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-wrapper" style={{ marginBottom: '16px', background: '#fff', border: '1.5px solid #E2E2E8', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 16px', height: '52px' }}>
            <span style={{ color: '#888', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap' }}>hiprofile.bio/</span>
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={checking}
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '1rem', background: 'transparent', color: '#111' }}
              aria-label="Username"
            />
          </div>
          <button type="submit" className="btn-claim" disabled={checking} style={{ width: '100%', height: '52px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem', cursor: checking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: checking ? 0.7 : 1 }}>
            <span>{checking ? 'Checking availability...' : 'Claim your profile'}</span>{!checking && <span>→</span>}
          </button>
        </form>
        <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '16px' }}>Free forever · No credit card required</p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
