import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'

/* ─── tiny SVG icon helpers ─── */
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
)
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)
const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
)
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
)
const IconLogOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
)
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
)
const IconCreditCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
)
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
)

/* helper for avatar rendering */
function AvatarImg({ avatar, size = 96, className = '' }) {
  const style = { width: size, height: size, borderRadius: '50%', objectFit: 'cover' }
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" className={className} style={{ ...style, transform: avatar.transform }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, background: avatar.bg || '#E5E7EB' }}>{avatar.data}</span>
  }
  return <img src="/assets/images/foxy_avatar.png" alt="avatar" className={className} style={style} />
}

/* ───────── SOCIAL PLATFORMS CONFIG ───────── */
const SOCIAL_PLATFORMS = [
  { id: 'github', label: 'GitHub' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'dribbble', label: 'Dribbble' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'behance', label: 'Behance' },
  { id: 'website', label: 'Website' },
]

/* ═══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate()
  const {
    avatar, setAvatar,
    profileName, setProfileName,
    profileBio, setProfileBio,
    socialLinks, setSocialLinks,
    selectedTemplate, setSelectedTemplate,
    location: userLocation, setLocation,
    claimedUsername,
    accentColor,
    profileCardFont,
  } = useOnboarding()

  const [toastMsg, toastShow, toast] = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [settingsSubTab, setSettingsSubTab] = useState('account')
  const fileInputRef = useRef(null)

  /* Local editing state (Edit Profile tab) */
  const [editName, setEditName] = useState(profileName || '')
  const [editBio, setEditBio] = useState(profileBio || '')
  const [editLocation, setEditLocation] = useState(userLocation || '')
  const [editSocials, setEditSocials] = useState({ ...socialLinks })

  /* Display helpers */
  const displayName = profileName || 'Foxy Man'
  const displayBio = profileBio || 'Nice to meet you, I\'m a designer!'
  const displayLocation = userLocation || 'San Francisco, CA'
  const profileUrl = `hiprofile.com/${claimedUsername || displayName.toLowerCase().replace(/\s+/g, '')}`

  /* Notification toggles */
  const [notifs, setNotifs] = useState({ profileViews: true, newFollowers: true, messages: false, marketing: false })

  /* ── Actions ── */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${profileUrl}`).then(() => toast('Link copied to clipboard!'))
  }

  const handleSaveProfile = () => {
    setProfileName(editName)
    setProfileBio(editBio)
    setLocation(editLocation)
    setSocialLinks(editSocials)
    toast('Profile saved successfully!')
    setActiveTab('profile')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar({ type: 'file', data: reader.result, transform: '', bg: '' })
      toast('Avatar updated!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatar({ type: null, data: null, transform: '', bg: '' })
    toast('Avatar removed')
  }

  /* Preview selected template route */
  const templateRoutes = { bento: '/bento', timeline: '/timeline-live' }
  const handlePreview = () => {
    navigate(templateRoutes[selectedTemplate] || '/bento')
  }

  /* ────── SIDEBAR MENU ────── */
  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <IconUser /> },
    { id: 'edit', label: 'Edit Profile', icon: <IconEdit /> },
    { id: 'share', label: 'Share', icon: <IconShare /> },
    { id: 'settings', label: 'Settings', icon: <IconSettings /> },
  ]

  /* ────────────────────────────────────────────────────
     TAB CONTENT RENDERERS
     ──────────────────────────────────────────────────── */

  /* ═══ MY PROFILE TAB ═══ */
  const renderProfileTab = () => (
    <div className="db-profile-grid">
      {/* Left: Preview Card */}
      <div className="db-profile-sidebar">
        <div className="db-card-container db-preview-card-card">
          <div className="db-preview-avatar" style={{ background: avatar?.bg || '#E5E7EB' }}>
            <AvatarImg avatar={avatar} size={96} />
          </div>
          <div className="db-preview-name-row">
            <span className="db-preview-name">{displayName}</span>
            <span style={{ color: '#3B82F6' }}>✓</span>
          </div>
          <p className="db-preview-role">Product Designer</p>
          <p className="db-preview-location">📍 {displayLocation}</p>
          <p className="db-preview-bio">{displayBio}</p>

          <div className="db-preview-socials">
            {SOCIAL_PLATFORMS.filter(p => socialLinks?.[p.id]).map(p => (
              <a key={p.id} href="#" className="db-preview-social-circle" title={p.label}
                 style={{ color: getSocialBrandColor(p.id) || '#4B5563' }}>
                {getSocialIcon(p.id, 16)}
              </a>
            ))}
          </div>

          <div className="db-clipboard-row" onClick={handleCopyLink} title="Copy profile link">
            <span className="db-clipboard-text">{profileUrl}</span>
            <IconCopy />
          </div>
        </div>
      </div>

      {/* Right: Quick Stats + Actions */}
      <div className="db-card-container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6, color: '#111' }}>Quick Stats</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Overview of your profile performance.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Profile Views', value: '1,248', change: '+12%' },
            { label: 'Link Clicks', value: '386', change: '+8%' },
            { label: 'Followers', value: '72', change: '+5%' },
          ].map(s => (
            <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111' }}>{s.value}</div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>{s.change}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="db-btn db-btn-primary" onClick={handlePreview}>
            <IconEye /> Preview Profile
          </button>
          <button className="db-btn db-btn-secondary" onClick={() => setActiveTab('edit')}>
            <IconEdit /> Edit Profile
          </button>
        </div>
      </div>
    </div>
  )

  /* ═══ EDIT PROFILE TAB ═══ */
  const renderEditTab = () => (
    <div className="db-edit-grid">
      {/* Left: Avatar uploader */}
      <div className="db-card-container db-avatar-uploader-card" style={{ padding: '32px 24px' }}>
        <div className="db-uploader-circle">
          <AvatarImg avatar={avatar} size={128} />
        </div>
        <div className="db-uploader-buttons">
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <button className="db-btn-action db-btn-change" onClick={() => fileInputRef.current?.click()}>Change</button>
          <button className="db-btn-action db-btn-remove" onClick={handleRemoveAvatar}>Remove</button>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#9CA3AF', fontWeight: 500 }}>Recommended: 400×400px, JPG or PNG.</p>
      </div>

      {/* Right: Form */}
      <div className="db-card-container">
        <div className="db-form-section">
          <div className="db-form-group-row">
            <div>
              <label className="db-form-label">Display Name</label>
              <input className="db-form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="db-form-label">Location</label>
              <input className="db-form-input" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="City, Country" />
            </div>
          </div>

          <div>
            <label className="db-form-label">Bio</label>
            <textarea className="db-form-input" rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell people about yourself" style={{ resize: 'vertical' }} />
          </div>

          {/* Template selection */}
          <div>
            <label className="db-form-label" style={{ marginBottom: 12 }}>Profile Style</label>
            {[
              { id: 'bento', label: 'Bento Grid', icon: '⊞' },
              { id: 'timeline', label: 'Timeline', icon: '⏳' },
            ].map(t => (
              <div key={t.id}
                className={`db-style-card ${selectedTemplate === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}>
                <div className="db-style-card-left">
                  <div className="db-style-icon-box">{t.icon}</div>
                  <span className="db-style-label">{t.label}</span>
                </div>
                <div className="db-radio-circle">
                  {selectedTemplate === t.id && <div className="db-radio-dot" />}
                </div>
              </div>
            ))}
          </div>

          {/* Social links */}
          <div>
            <label className="db-form-label" style={{ marginBottom: 12 }}>Social Links</label>
            {SOCIAL_PLATFORMS.map(p => (
              <div key={p.id} className="db-social-input-row">
                <div className="db-social-input-left">
                  <div className="db-social-input-logo" style={{ color: getSocialBrandColor(p.id) }}>
                    {getSocialIcon(p.id, 20)}
                  </div>
                  <span className="db-social-platform-name">{p.label}</span>
                  <input className="db-social-text-input" value={editSocials[p.id] || ''} placeholder={`Your ${p.label} URL`}
                    onChange={e => setEditSocials(prev => ({ ...prev, [p.id]: e.target.value }))} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="db-btn db-btn-primary" onClick={handleSaveProfile}>Save Changes</button>
            <button className="db-btn db-btn-secondary" onClick={() => setActiveTab('profile')}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ═══ SHARE TAB ═══ */
  const renderShareTab = () => (
    <div className="db-share-grid">
      <div className="db-share-card-container">
        {/* Profile link card */}
        <div className="db-share-subcard">
          <div className="db-share-subcard-left">
            <div className="db-share-avatar" style={{ background: avatar?.bg || '#E5E7EB', overflow: 'hidden' }}>
              <AvatarImg avatar={avatar} size={44} />
            </div>
            <div className="db-share-details">
              <span className="db-share-name">{displayName}</span>
              <span className="db-share-url-text">{profileUrl}</span>
            </div>
          </div>
          <button className="db-btn db-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleCopyLink}>
            <IconCopy /> Copy Link
          </button>
        </div>

        {/* Social share buttons */}
        <div className="db-card-container" style={{ marginTop: 0 }}>
          <label className="db-form-label" style={{ marginBottom: 16 }}>Share on Social Media</label>
          <div className="db-share-social-grid">
            {[
              { label: 'Twitter', bg: '#1DA1F2', icon: '𝕏' },
              { label: 'LinkedIn', bg: '#0A66C2', icon: 'in' },
              { label: 'Facebook', bg: '#1877F2', icon: 'f' },
              { label: 'WhatsApp', bg: '#25D366', icon: '💬' },
              { label: 'Email', bg: '#6B7280', icon: '✉' },
            ].map(s => (
              <button key={s.label} className="db-share-social-btn" onClick={() => toast(`Opening ${s.label}...`)}>
                <div className="db-share-social-icon-circle" style={{ background: s.bg, fontSize: '1.1rem', fontWeight: 800 }}>
                  {s.icon}
                </div>
                <span className="db-share-social-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code placeholder */}
      <div className="db-card-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <h3 style={{ fontWeight: 800, color: '#111', fontSize: '1.05rem' }}>QR Code</h3>
        <div style={{ width: 180, height: 180, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 140, height: 140, background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='30' height='30' fill='%23111'/%3E%3Crect x='60' y='10' width='30' height='30' fill='%23111'/%3E%3Crect x='10' y='60' width='30' height='30' fill='%23111'/%3E%3Crect x='45' y='45' width='10' height='10' fill='%23111'/%3E%3Crect x='60' y='60' width='10' height='10' fill='%23111'/%3E%3Crect x='80' y='60' width='10' height='10' fill='%23111'/%3E%3Crect x='60' y='80' width='10' height='10' fill='%23111'/%3E%3Crect x='80' y='80' width='10' height='10' fill='%23111'/%3E%3C/svg%3E") center/contain no-repeat`, borderRadius: 12 }} />
        </div>
        <p style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500, maxWidth: 220 }}>Scan to visit your profile directly on mobile.</p>
        <button className="db-btn db-btn-secondary" onClick={() => toast('QR Code downloaded!')}>Download QR</button>
      </div>
    </div>
  )

  /* ═══ SETTINGS TAB ═══ */
  const renderSettingsTab = () => {
    const settingsMenu = [
      { id: 'account', label: 'Account', icon: <IconUser /> },
      { id: 'notifications', label: 'Notifications', icon: <IconBell /> },
      { id: 'billing', label: 'Billing', icon: <IconCreditCard /> },
      { id: 'domains', label: 'Domains', icon: <IconGlobe /> },
    ]

    return (
      <div className="db-settings-wrapper">
        {/* Sub-menu */}
        <div className="db-settings-sub-menu">
          {settingsMenu.map(m => (
            <button key={m.id}
              className={`db-settings-sub-btn ${settingsSubTab === m.id ? 'active' : ''}`}
              onClick={() => setSettingsSubTab(m.id)}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Sub-tab content */}
        <div className="db-card-container">
          {settingsSubTab === 'account' && (
            <div className="db-form-section">
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111' }}>Account Settings</h3>
              <div className="db-form-group-row">
                <div>
                  <label className="db-form-label">Email</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="db-form-input" defaultValue="user@hiprofile.com" readOnly style={{ flex: 1 }} />
                    <span className="db-verified-indicator">Verified</span>
                  </div>
                </div>
                <div>
                  <label className="db-form-label">Username</label>
                  <input className="db-form-input" defaultValue={claimedUsername || displayName.toLowerCase().replace(/\s+/g, '')} readOnly />
                </div>
              </div>
              <div>
                <label className="db-form-label">Current Plan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>Free</span>
                  <span className="db-plan-badge">Free Tier</span>
                </div>
              </div>
              <div style={{ borderTop: '1.5px solid #F3F4F6', paddingTop: 20, marginTop: 8 }}>
                <button className="db-btn db-btn-secondary" style={{ color: '#FF3366', borderColor: '#FFD2D2' }}
                  onClick={() => toast('Account deletion requires confirmation email.')}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {settingsSubTab === 'notifications' && (
            <div className="db-form-section">
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111' }}>Notification Preferences</h3>
              {[
                { key: 'profileViews', title: 'Profile Views', desc: 'Get notified when someone views your profile.' },
                { key: 'newFollowers', title: 'New Followers', desc: 'Receive alerts for new followers.' },
                { key: 'messages', title: 'Direct Messages', desc: 'Get notified for incoming messages.' },
                { key: 'marketing', title: 'Marketing Emails', desc: 'Tips, product updates and announcements.' },
              ].map(n => (
                <div key={n.key} className="db-notification-item">
                  <div className="db-notification-left">
                    <span className="db-notification-title">{n.title}</span>
                    <span className="db-notification-desc">{n.desc}</span>
                  </div>
                  <label className="db-toggle-switch-wrapper">
                    <input type="checkbox" checked={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))} />
                    <span className="db-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {settingsSubTab === 'billing' && (
            <div className="db-form-section">
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111' }}>Billing &amp; Plans</h3>
              <div className="db-billing-plans-grid">
                {[
                  { name: 'Free', price: '$0', sub: '/forever', features: ['1 Profile Page', 'Basic Templates', 'Community Support'], active: true },
                  { name: 'Pro', price: '$9', sub: '/month', features: ['Unlimited Pages', 'All Templates', 'Priority Support', 'Custom Domain'], badge: 'Popular' },
                  { name: 'Team', price: '$29', sub: '/month', features: ['Everything in Pro', 'Team Management', '5 Members', 'Analytics Dashboard'] },
                ].map(plan => (
                  <div key={plan.name} className={`db-plan-card ${plan.active ? 'active' : ''}`}>
                    {plan.badge && <div className="db-plan-badge-top">{plan.badge}</div>}
                    <div>
                      <div className="db-plan-name">{plan.name}</div>
                      <div className="db-plan-price">{plan.price}<span className="db-plan-price-sub">{plan.sub}</span></div>
                      <ul className="db-plan-features-list">
                        {plan.features.map(f => (
                          <li key={f} className="db-plan-feature-item">
                            <span className="db-plan-feature-check"><IconCheck /></span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button className={`db-plan-btn ${plan.active ? 'active' : ''}`}
                      onClick={() => toast(plan.active ? 'This is your current plan.' : `Upgrade to ${plan.name} coming soon!`)}>
                      {plan.active ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 32 }}>
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#111', marginBottom: 4 }}>Billing History</h4>
                <div className="db-billing-history-list">
                  <div className="db-billing-history-item">
                    <div className="db-billing-date-info">
                      <span className="db-billing-date-title">Free Plan</span>
                      <span className="db-billing-date-sub">Started Jul 2026</span>
                    </div>
                    <div className="db-billing-amount-info">
                      <span className="db-billing-amount-value">$0.00</span>
                      <span className="db-paid-badge">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsSubTab === 'domains' && (
            <div className="db-form-section">
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111' }}>Custom Domain</h3>
              <div className="db-warning-banner">
                ⚡ Custom domains are available on the Pro plan and above.
              </div>
              <div>
                <label className="db-form-label">Your Domain</label>
                <input className="db-form-input" placeholder="portfolio.yourdomain.com" />
              </div>
              <div>
                <label className="db-form-label" style={{ marginBottom: 10 }}>DNS Configuration</label>
                <div className="db-dns-list-box">
                  <div className="db-dns-row">
                    <div className="db-dns-row-left">
                      <span className="db-dns-badge-type">CNAME</span>
                      <span className="db-dns-host-label">Host</span>
                      <span className="db-dns-host-value">@</span>
                    </div>
                    <span className="db-dns-copy-icon" onClick={() => { navigator.clipboard.writeText('proxy.hiprofile.com'); toast('Copied!') }}>
                      <IconCopy />
                    </span>
                  </div>
                  <div className="db-dns-row">
                    <div className="db-dns-row-left">
                      <span className="db-dns-badge-type">TXT</span>
                      <span className="db-dns-host-label">Value</span>
                      <span className="db-dns-host-value">hiprofile-verify=abc123</span>
                    </div>
                    <span className="db-dns-copy-icon" onClick={() => { navigator.clipboard.writeText('hiprofile-verify=abc123'); toast('Copied!') }}>
                      <IconCopy />
                    </span>
                  </div>
                </div>
              </div>
              <button className="db-btn db-btn-primary" onClick={() => toast('Domain verification coming soon!')}>
                Verify Domain
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ──────────── TAB TITLES ──────────── */
  const tabMeta = {
    profile: { title: 'My Profile', subtitle: 'View and manage your public profile.' },
    edit: { title: 'Edit Profile', subtitle: 'Update your personal information and links.' },
    share: { title: 'Share Profile', subtitle: 'Share your profile with the world.' },
    settings: { title: 'Settings', subtitle: 'Manage your account preferences.' },
  }

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className="db-wrapper">
      <Toast message={toastMsg} show={toastShow} />

      {/* ──── SIDEBAR ──── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <div className="db-logo-row">
            <span style={{ fontSize: '1.4rem' }}>⚡</span> HiProfile
          </div>

          <a href="#" className="db-user-mini-card" onClick={e => { e.preventDefault(); setActiveTab('profile') }}>
            <div className="db-user-mini-avatar">
              <AvatarImg avatar={avatar} size={40} className="db-user-mini-avatar-img" />
            </div>
            <div className="db-user-mini-info">
              <span className="db-user-mini-name">{displayName}</span>
              <span className="db-user-mini-url">{profileUrl}</span>
            </div>
          </a>

          <ul className="db-menu-list">
            {menuItems.map(m => (
              <li key={m.id}>
                <button
                  className={`db-menu-item ${activeTab === m.id ? 'active' : ''}`}
                  id={`db-menu-${m.id}`}
                  onClick={() => setActiveTab(m.id)}>
                  {m.icon} {m.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="db-sidebar-bottom">
          <button className="db-logout-btn" onClick={() => { navigate('/') }}>
            <div className="db-logout-user-row">
              <div className="db-logout-avatar">
                <AvatarImg avatar={avatar} size={32} />
              </div>
              <span className="db-logout-name">{displayName}</span>
            </div>
            <span className="db-logout-icon"><IconLogOut /></span>
          </button>
        </div>
      </aside>

      {/* ──── MAIN WORKSPACE ──── */}
      <main className="db-main-workspace">
        <div className="db-header">
          <div className="db-header-left">
            <h1 className="db-header-title">{tabMeta[activeTab]?.title}</h1>
            <p className="db-header-subtitle">{tabMeta[activeTab]?.subtitle}</p>
          </div>
          <div className="db-header-actions">
            <button className="db-btn db-btn-secondary" onClick={handlePreview}>
              <IconEye /> Preview
            </button>
            <button className="db-btn db-btn-primary" onClick={handleCopyLink}>
              <IconShare /> Share Link
            </button>
          </div>
        </div>

        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'edit' && renderEditTab()}
        {activeTab === 'share' && renderShareTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>
    </div>
  )
}
