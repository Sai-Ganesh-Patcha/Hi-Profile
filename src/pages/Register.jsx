import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

export default function Register() {
  const [params] = useSearchParams()
  const { claimedUsername } = useOnboarding()
  const username = params.get('username') || claimedUsername || 'bhavani'
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()
  const [email, setEmail] = useState('')

  const handleRegister = (e) => {
    e.preventDefault()
    if (!email) {
      toast('Please enter your email')
      return
    }
    toast('Account created! Redirecting...')
    setTimeout(() => navigate('/login'), 1200)
  }

  const handleGoogle = () => {
    toast('Logging in with Google...')
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 410, textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Custom Logo Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 44 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 60, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Profile</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 600, color: '#A0A0A5', marginBottom: 36, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#000000', fontWeight: 700 }}>hiprofile.bio/{username}</span> is your now! 🥳
        </h2>

        <form onSubmit={handleRegister}>
          {/* Email Input wrapper */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 18 }}>
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                height: 54,
                padding: '0 16px 0 52px',
                background: '#F6F6F6',
                border: 'none',
                borderRadius: 8,
                fontSize: '1.05rem',
                color: '#000000',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Blue Log In button */}
          <button
            type="submit"
            style={{
              width: '100%',
              height: 54,
              background: '#3E66FB',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: 'pointer',
              marginBottom: 28,
              transition: 'background 0.2s'
            }}
          >
            Log In
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 28 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
          <span style={{ color: '#3A3A3C', fontSize: '0.88rem', margin: '0 16px', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%',
            height: 54,
            background: '#ffffff',
            color: '#1C1C1E',
            border: '1px solid #D1D1D6',
            borderRadius: 8,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </button>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
