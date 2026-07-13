import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast('Please enter your email')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast(data.error || 'Failed to process password reset request')
        return
      }

      setSuccess(true)
      toast('Reset request submitted successfully!')
    } catch (err) {
      console.error(err)
      toast('Network error. Failed to process request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Key Icon wrapper */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#EFF6FF', borderRadius: '50%', marginBottom: 24, color: '#3E66FB' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>

        {!success ? (
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Forgot Password</h1>
            <p style={{ color: '#666666', fontSize: '1rem', lineHeight: '1.5', marginBottom: 24 }}>
              Enter the email address associated with your account, and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                    boxSizing: 'border-box',
                    textAlign: 'center'
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
                {loading ? 'Submitting...' : 'Send Password Reset Link'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Link Sent</h1>
            <p style={{ color: '#666666', fontSize: '1.05rem', lineHeight: '1.5', marginBottom: 24 }}>
              If an account is associated with <strong style={{ color: '#111' }}>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: 28 }}>
              Please check your inbox (and spam/promotions folders). Links expire in 1 hour.
            </p>
          </div>
        )}

        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: 12 }}>
          Remember your password? <span onClick={() => navigate('/login')} style={{ color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}>Log In</span>
        </p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
