import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { loginUser } = useOnboarding()
  const [toastMsg, toastShow, toast] = useToast()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'OAUTH_NOT_CONFIGURED') {
        toast('OAuth integration is not configured on the server yet.')
      } else if (errorParam === 'USER_NOT_FOUND') {
        toast('No account found for this social login. Please register first!')
      } else if (errorParam === 'OAUTH_FAILED') {
        toast('Social login failed. Please try again.')
      } else {
        toast(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 423) {
          // Account locked out
          toast(data.error || 'Account locked temporarily. Please try again later.')
        } else if (response.status === 403 && data.requiresVerification) {
          // Unverified email
          toast('Email verification pending. Redirecting...')
          setTimeout(() => {
            navigate(`/verify-pending?email=${encodeURIComponent(email)}`)
          }, 1200)
        } else {
          toast(data.error || 'Invalid email or password')
        }
        return
      }

      // Login success
      loginUser(data.accessToken, data.user)
      toast('Login successful! 🎉')
      
      setTimeout(() => {
        if (data.user.profileCompletionStatus === 'completed') {
          navigate('/timeline')
        } else {
          navigate('/upload')
        }
      }, 1200)

    } catch (err) {
      console.error(err)
      toast('Network error login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/google'
  }

  const handleGitHub = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/github'
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      {/* Outer Blue Card */}
      <div className="login-blue-card">
        
        {/* White Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, marginBottom: 20 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', marginBottom: 36, letterSpacing: '-0.02em' }}>Log In to your Account</h1>

        {/* Inner White Card */}
        <div className="login-white-card">
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 16px 0 48px',
                  background: '#F6F6F6',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '1rem',
                  color: '#000000',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 48px 0 48px',
                  background: '#F6F6F6',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '1rem',
                  color: '#000000',
                  fontFamily: 'var(--font-body)',
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
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#8E8E93'
                }}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <span 
                onClick={() => navigate('/forgot-password')} 
                style={{ fontSize: '0.85rem', color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot Password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                background: '#3E66FB',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 20,
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
            <span style={{ color: '#8E8E93', fontSize: '0.82rem', margin: '0 12px', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
          </div>

          {/* Social Buttons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: '100%',
                height: 48,
                background: '#ffffff',
                color: '#1C1C1E',
                border: '1px solid #D1D1D6',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>

            {/* GitHub Button */}
            <button
              type="button"
              onClick={handleGitHub}
              disabled={loading}
              style={{
                width: '100%',
                height: 48,
                background: '#24292e',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </button>
          </div>
          
          <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginTop: 12 }}>
            Don't have an account? <span onClick={() => navigate('/claim')} style={{ color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}>Register</span>
          </p>
        </div>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
