import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function VerifyPending() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    if (!email) {
      toast('Email address is missing')
      return
    }
    setResending(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        toast(data.error || 'Failed to resend verification email')
        return
      }

      toast('Verification link resent successfully! Please check your inbox. ✉️')
    } catch (err) {
      console.error(err)
      toast('Network error. Failed to resend verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Email Icon wrapper */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#EFF6FF', borderRadius: '50%', marginBottom: 24, color: '#3E66FB' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Verify Your Email</h1>
        <p style={{ color: '#555555', fontSize: '1.05rem', lineHeight: '1.5', marginBottom: 20 }}>
          We've sent a verification link to your email address:
        </p>
        
        {email && (
          <div style={{ background: '#F3F4F6', padding: '10px 16px', borderRadius: 8, fontFamily: 'monospace', fontSize: '1rem', color: '#111827', display: 'inline-block', marginBottom: 24, wordBreak: 'break-all' }}>
            {email}
          </div>
        )}

        <p style={{ color: '#666666', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: 28 }}>
          Please click on the link in the email to activate your account. If you don't see it, check your spam or junk folder.
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
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
            cursor: resending ? 'not-allowed' : 'pointer',
            marginBottom: 20,
            opacity: resending ? 0.7 : 1,
            transition: 'background 0.2s'
          }}
        >
          {resending ? 'Resending Link...' : 'Resend Verification Email'}
        </button>

        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Wrong email? <span onClick={() => navigate('/claim')} style={{ color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}>Start Over</span>
        </p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
