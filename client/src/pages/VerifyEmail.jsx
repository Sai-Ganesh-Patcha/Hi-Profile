import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const verifyAttempted = useRef(false)

  useEffect(() => {
    if (verifyAttempted.current) return
    verifyAttempted.current = true

    const doVerify = async () => {
      if (!token) {
        setStatus('error')
        setErrorMessage('Verification token is missing from the link.')
        return
      }

      try {
        const response = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(data.error || 'The verification link is invalid or has expired.')
        }
      } catch (err) {
        console.error(err)
        setStatus('error')
        setErrorMessage('Failed to connect to the verification service. Please check your network.')
      }
    }

    doVerify()
  }, [token])

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {status === 'verifying' && (
          <div>
            <div className="spinner" style={{ width: 48, height: 48, border: '4px solid #E5E5EA', borderTop: '4px solid #3E66FB', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Verifying Account</h1>
            <p style={{ color: '#666666', fontSize: '1rem' }}>Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#D1FAE5', borderRadius: '50%', marginBottom: 24, color: '#10B981' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Verification Successful!</h1>
            <p style={{ color: '#666666', fontSize: '1rem', lineHeight: '1.5', marginBottom: 28 }}>
              Your email has been verified. You can now log in to your account and start creating your profile.
            </p>
            <button
              onClick={() => navigate('/login')}
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
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: '#FEE2E2', borderRadius: '50%', marginBottom: 24, color: '#EF4444' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#111111', marginBottom: 12 }}>Verification Failed</h1>
            <p style={{ color: '#EF4444', fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>
              {errorMessage}
            </p>
            <p style={{ color: '#666666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: 28 }}>
              The link might be expired, broken, or already used. Please register again or request a new verification link.
            </p>
            <button
              onClick={() => navigate('/claim')}
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
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Start Registration Over
            </button>
          </div>
        )}
      </div>
      
      {/* Dynamic spinner keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
