import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()

  const [toastMsg, toastShow, toast] = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  // Real-time password requirement checks
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  })

  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    })
  }, [password])

  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast('Verification token is missing. Please request a new link.')
      return
    }
    if (!isPasswordValid) {
      toast('Please meet all password requirements')
      return
    }
    if (password !== confirmPassword) {
      toast("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/auth/reset-password?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast(data.error || 'Failed to reset password')
        return
      }

      toast('Password reset successful! Please log in with your new password. 🔑')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      console.error(err)
      toast('Network error. Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Shield/Lock Icon wrapper */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#EFF6FF', borderRadius: '50%', marginBottom: 24, color: '#3E66FB' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Reset Password</h1>
        <p style={{ color: '#666666', fontSize: '1rem', lineHeight: '1.5', marginBottom: 24 }}>
          Enter a strong, secure new password for your Hi-Profile account.
        </p>

        {!token ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: 12, borderRadius: 8, fontSize: '0.9rem', marginBottom: 20, textAlign: 'left' }}>
            <strong>Error:</strong> Reset token is missing. Please click the link sent in your email directly, or try requesting a new password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 48px 0 16px',
                  background: '#F6F6F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1rem',
                  color: '#000000',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8E8E93'
                }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Password requirements list */}
            {password.length > 0 && (
              <div style={{ textAlign: 'left', background: '#F9FBFD', padding: 12, borderRadius: 8, fontSize: '0.82rem', marginBottom: 14, color: '#555', border: '1px solid #EAF0F6' }}>
                <p style={{ fontWeight: 600, marginBottom: 6, color: '#333' }}>Password requirements:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span style={{ color: passwordChecks.length ? '#10B981' : '#EF4444' }}>
                    {passwordChecks.length ? '✓' : '✗'} 8+ characters
                  </span>
                  <span style={{ color: passwordChecks.lowercase ? '#10B981' : '#EF4444' }}>
                    {passwordChecks.lowercase ? '✓' : '✗'} Lowercase letter
                  </span>
                  <span style={{ color: passwordChecks.uppercase ? '#10B981' : '#EF4444' }}>
                    {passwordChecks.uppercase ? '✓' : '✗'} Uppercase letter
                  </span>
                  <span style={{ color: passwordChecks.number ? '#10B981' : '#EF4444' }}>
                    {passwordChecks.number ? '✓' : '✗'} One number
                  </span>
                  <span style={{ color: passwordChecks.special ? '#10B981' : '#EF4444' }} style={{ gridColumn: 'span 2', color: passwordChecks.special ? '#10B981' : '#EF4444' }}>
                    {passwordChecks.special ? '✓' : '✗'} One special character
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Password Input */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 16px',
                  background: '#F6F6F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1rem',
                  color: '#000000',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                background: '#3E66FB',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 20,
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 12 }}>
          Back to <span onClick={() => navigate('/login')} style={{ color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}>Log In</span>
        </p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
