import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

export default function Register() {
  const [params] = useSearchParams()
  const { claimedUsername } = useOnboarding()
  const username = params.get('username') || claimedUsername || ''
  const navigate = useNavigate()
  
  const [toastMsg, toastShow, toast] = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Real-time password requirements checks
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

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast('Please enter your full name')
      return
    }
    if (!email.trim()) {
      toast('Please enter your email address')
      return
    }
    if (!username.trim()) {
      toast('Username is missing. Claim one first.')
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
    if (!acceptTerms) {
      toast('You must accept the terms and conditions')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          email,
          password,
          confirmPassword,
          acceptTerms
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast(data.error || 'Registration failed')
        return
      }

      toast('Registration successful! Redirecting...')
      setTimeout(() => {
        navigate(`/verify-pending?email=${encodeURIComponent(email)}`)
      }, 1200)

    } catch (error) {
      console.error(error)
      toast('Network error registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/google'
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 44, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>hiprofile</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, color: '#8E8E93', marginBottom: 24, textAlign: 'center' }}>
          Claiming <span style={{ color: '#000000', fontWeight: 700 }}>hiprofile.bio/{username || 'username'}</span>
        </h2>

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              disabled={submitting}
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

          {/* Email */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={submitting}
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

          {/* Password */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={submitting}
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

          {/* Confirm Password */}
          <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={submitting}
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

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', marginBottom: 20 }}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              disabled={submitting}
              style={{ marginTop: 4, width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="terms" style={{ fontSize: '0.85rem', color: '#555', cursor: 'pointer', lineHeight: '1.4' }}>
              I agree to the Terms of Service and Privacy Policy and authorize my account creation.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
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
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              opacity: submitting ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
          <span style={{ color: '#8E8E93', fontSize: '0.82rem', margin: '0 12px', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={submitting}
          style={{
            width: '100%',
            height: 50,
            background: '#ffffff',
            color: '#1C1C1E',
            border: '1px solid #D1D1D6',
            borderRadius: 8,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </button>

        <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#3E66FB', fontWeight: 600, cursor: 'pointer' }}>Log In</span>
        </p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
