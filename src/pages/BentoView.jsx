import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'

function AvatarDisplay({ avatar }) {
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ transform: avatar.transform, width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span className="bento-banner-avatar-emoji" style={{ fontSize: '4.5rem', lineHeight: '100px' }}>{avatar.data}</span>
  }
  return <img src="/assets/images/foxy_avatar.png" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export default function BentoView() {
  const { theme, setTheme, avatar, profileName, profileBio, location, socialLinks, profileCardFont } = useOnboarding()
  const navigate = useNavigate()
  
  // Custom states for interactivity
  const [toastMsg, toastShow, toast] = useToast()
  const [followed, setFollowed] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(theme === 'dark')
  const [gridSpacing, setGridSpacing] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState(null)
  const imageInputRef = useRef(null)

  // Sync state with global theme
  useEffect(() => {
    setIsDark(theme === 'dark')
  }, [theme])

  const name = profileName || 'Foxy Man'
  const bio = profileBio || 'Nice to meet you, I\'m a designer!'
  const userLocation = location || 'Salur, Andhra Pradesh, India'

  const getUsername = (platformId, fallback) => {
    if (socialLinks && socialLinks[platformId]) {
      return socialLinks[platformId];
    }
    return fallback;
  }

  // Dynamic blocks state
  const [gridBlocks, setGridBlocks] = useState([
    { id: 'loc-block', type: 'location', content: userLocation },
    { id: 'git-block', type: 'github', username: getUsername('github', 'santoshpl') },
    { id: 'img-block', type: 'image', url: '/assets/images/featured_brand_mockup.png' },
    { id: 'beh-block', type: 'behance', title: getUsername('dribbble', 'PurpleLane') + ' Design' },
    { id: 'yt-block', type: 'youtube', title: getUsername('youtube', 'PurpleLane') }
  ])

  // Dialog State
  const [activeDialog, setActiveDialog] = useState(null) // 'emoji' | 'link' | 'text' | 'checklist'
  const [dialogInput1, setDialogInput1] = useState('')
  const [dialogInput2, setDialogInput2] = useState('')

  const openDialog = (type) => {
    setDialogInput1('')
    setDialogInput2('')
    setActiveDialog(type)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setEditingBlockId(null)
  }

  const handleEditBlock = (block) => {
    setEditingBlockId(block.id)
    if (block.type === 'custom-emoji') {
      setDialogInput1(block.emoji)
      setActiveDialog('emoji')
    } else if (block.type === 'custom-text') {
      setDialogInput1(block.text)
      setActiveDialog('text')
    } else if (block.type === 'custom-link') {
      setDialogInput1(block.title)
      setDialogInput2(block.url)
      setActiveDialog('link')
    } else if (block.type === 'custom-checklist') {
      setDialogInput1(block.title)
      setDialogInput2(block.items.join(', '))
      setActiveDialog('checklist')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const blockId = `custom-block-${Date.now()}`
      const newBlock = { id: blockId, type: 'image', url: ev.target.result }
      setGridBlocks([...gridBlocks, newBlock])
      toast('Custom image block added!')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDialogSubmit = () => {
    if (!dialogInput1.trim()) {
      toast('Please enter the required field')
      return
    }

    if (editingBlockId) {
      setGridBlocks(gridBlocks.map(block => {
        if (block.id === editingBlockId) {
          if (block.type === 'custom-emoji') {
            return { ...block, emoji: dialogInput1 }
          } else if (block.type === 'custom-text') {
            return { ...block, text: dialogInput1 }
          } else if (block.type === 'custom-link') {
            const url = dialogInput2.trim() || 'https://hiprofile.bio'
            return { ...block, title: dialogInput1, url: url }
          } else if (block.type === 'custom-checklist') {
            const items = dialogInput2.split(',').map(i => i.trim()).filter(Boolean)
            return { ...block, title: dialogInput1, items: items.length ? items : ['First Item'] }
          }
        }
        return block
      }))
      toast('Block updated!')
      closeDialog()
      return
    }

    let newBlock = null;
    const blockId = `custom-block-${Date.now()}`;

    if (activeDialog === 'emoji') {
      newBlock = { id: blockId, type: 'custom-emoji', emoji: dialogInput1 };
    } else if (activeDialog === 'text') {
      newBlock = { id: blockId, type: 'custom-text', text: dialogInput1 };
    } else if (activeDialog === 'link') {
      const url = dialogInput2.trim() || 'https://hiprofile.bio';
      newBlock = { id: blockId, type: 'custom-link', title: dialogInput1, url: url };
    } else if (activeDialog === 'checklist') {
      const items = dialogInput2.split(',').map(i => i.trim()).filter(Boolean);
      newBlock = { id: blockId, type: 'custom-checklist', title: dialogInput1, items: items.length ? items : ['First Item'] };
    }

    if (newBlock) {
      setGridBlocks([...gridBlocks, newBlock])
      toast('New block added to grid!')
    }
    closeDialog()
  }

  // Preset additions
  const handleAddImageBlock = () => {
    const images = [
      '/assets/images/fintech_dashboard.png',
      '/assets/images/ecommerce_app.png',
      '/assets/images/design_system.png',
      '/assets/images/ar_glass.png'
    ];
    const imgUrl = images[gridBlocks.filter(b => b.type === 'image').length % images.length];
    const blockId = `custom-block-${Date.now()}`;
    const newBlock = { id: blockId, type: 'image', url: imgUrl };
    setGridBlocks([...gridBlocks, newBlock])
    toast('Project Image card added!')
  }

  const handleAddAIBlock = () => {
    const blockId = `custom-block-${Date.now()}`;
    const AIQuotes = [
      "✨ Simplicity is the ultimate sophistication.",
      "🎨 Design is not just what it looks like and feels like. Design is how it works.",
      "🚀 Pixel perfect designs built with love & coffee.",
      "💡 Creativity is intelligence having fun."
    ];
    const quote = AIQuotes[Math.floor(Math.random() * AIQuotes.length)];
    const newBlock = { id: blockId, type: 'custom-text', text: quote };
    setGridBlocks([...gridBlocks, newBlock])
    toast('AI Quote block generated!')
  }

  const handleToggleGridSpacing = () => {
    setGridSpacing(!gridSpacing)
    toast(gridSpacing ? 'Grid spacing set to Normal' : 'Grid spacing set to Compact')
  }

  // Copy Profile Link
  const handleCopyLink = () => {
    const url = `hiprofile.bio/${getUsername('github', 'foxyman')}`
    navigator.clipboard.writeText(url)
    toast('Profile link copied to clipboard!')
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setIsDark(nextTheme === 'dark')
    toast(`Switched to ${nextTheme} theme!`)
  }

  return (
    <div className={`bento-profile-wrapper ${isDark ? 'dark-mode-active' : ''}`} style={{ fontFamily: profileCardFont || 'var(--font-body)', minHeight: '100vh', paddingBottom: '120px', transition: 'background-color 0.3s' }}>
      <input type="file" ref={imageInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      {/* 1. Header Navbar */}
      <header className="bento-nav-header">
        <div className="bento-nav-url" onClick={handleCopyLink} title="Copy profile URL" style={{ cursor: 'pointer' }}>
          <span>🔗</span> hiprofile.com/{getUsername('github', 'foxyman')}
        </div>
        <div className="bento-nav-actions">
          <button className="btn-bento-dashboard" id="btn-bento-dashboard-go" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
          <button className="btn-bento-share" onClick={handleCopyLink} title="Copy Profile URL">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Viewport Frame wrapper for Mobile simulator */}
      <div className={isMobile ? 'mobile-simulator-frame' : ''}>
        {isMobile && <div className="mobile-notch" />}

        {/* Main Center content */}
        <div className="bento-content-container">
          
          {/* A. Peach Top Banner Card */}
          <section className="bento-banner-card-new">
            <div className="bento-banner-left">
              <div className="bento-banner-intro">Hello! I am</div>
              <h1 className="bento-banner-heading">
                <span className="accent-purple">{name}</span><br />
                <span className="text-dark">&amp; Creator</span>
              </h1>
            </div>
            <div className="bento-banner-right-placeholder" style={{ padding: 0, overflow: 'hidden' }}>
              <img src="/assets/images/designer_banner.png" alt="Designer Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </section>

          {/* B. Overlapping White Profile Card */}
          <section className="bento-profile-details-card">
            <div className="bento-avatar-overlap">
              <AvatarDisplay avatar={avatar} />
            </div>
            <h2 className="bento-details-name">{name}</h2>
            <p className="bento-details-bio">{bio}</p>
            
            {/* Social Icons row */}
            <div className="bento-placeholder-socials" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              {Object.keys(socialLinks || {}).map(key => {
                const usernameVal = socialLinks[key];
                if (!usernameVal) return null;
                
                let link = '#';
                if (key === 'twitter') link = `https://twitter.com/${usernameVal}`;
                else if (key === 'instagram') link = `https://instagram.com/${usernameVal}`;
                else if (key === 'linkedin') link = `https://linkedin.com/in/${usernameVal}`;
                else if (key === 'github') link = `https://github.com/${usernameVal}`;
                else if (key === 'youtube') link = `https://youtube.com/@${usernameVal}`;
                
                const brandColor = getSocialBrandColor(key);
                return (
                  <a key={key} href={link} target="_blank" rel="noopener noreferrer" 
                     className="db-preview-social-circle" 
                     style={{ 
                       width: 40, 
                       height: 40, 
                       background: isDark ? '#1E293B' : '#F3F4F6', 
                       color: isDark ? '#94A3B8' : '#4B5563',
                       borderRadius: '50%', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       textDecoration: 'none', 
                       transition: 'all 0.2s',
                       border: `1.5px solid ${isDark ? '#334155' : '#E5E7EB'}`
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.color = '#FFFFFF';
                       e.currentTarget.style.background = brandColor;
                       e.currentTarget.style.borderColor = brandColor;
                       e.currentTarget.style.transform = 'translateY(-2px)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.color = isDark ? '#94A3B8' : '#4B5563';
                       e.currentTarget.style.background = isDark ? '#1E293B' : '#F3F4F6';
                       e.currentTarget.style.borderColor = isDark ? '#334155' : '#E5E7EB';
                       e.currentTarget.style.transform = 'translateY(0)';
                     }}
                     title={`${key}: @${usernameVal}`}>
                    {getSocialIcon(key, 20, 'currentColor')}
                  </a>
                );
              })}
              {Object.keys(socialLinks || {}).filter(k => socialLinks[k]).length === 0 && (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>No social handles linked yet</p>
              )}
            </div>
          </section>

          {/* C. Bento Cards Grid */}
          <section className="bento-grid-layout-new" style={{ gap: gridSpacing ? '12px' : '24px' }}>
            {gridBlocks.map(block => {
              if (block.type === 'location') {
                return (
                  <div key={block.id} className="bento-card-base bento-loc-card-new">
                    <div className="bento-loc-dot-new" />
                    <div className="bento-loc-text-new">{block.content}</div>
                  </div>
                )
              }
              if (block.type === 'github') {
                return (
                  <div key={block.id} className="bento-card-base bento-git-card-new">
                    <div className="bento-git-left-new">
                      <div className="bento-git-icon-new">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                      </div>
                      <div className="bento-git-details-new">
                        <div className="bento-git-title-new">{block.username}</div>
                        <div className="bento-git-sub-new">github.com</div>
                      </div>
                    </div>
                    <div className="bento-git-divider-new" />
                    <div className="bento-git-right-new" style={{ padding: 0, overflow: 'hidden' }}>
                      <img src="/assets/images/github_preview.png" alt="GitHub contributions" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )
              }
              if (block.type === 'image') {
                return (
                  <div key={block.id} className="bento-card-base bento-img-card-new" style={{ padding: 0 }}>
                    <img src={block.url || '/assets/images/featured_brand_mockup.png'} alt="Project Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )
              }
              if (block.type === 'behance') {
                return (
                  <div key={block.id} className="bento-card-base bento-beh-card-new">
                    <div className="bento-beh-header-new">
                      <div className="bento-beh-brand-new">
                        <div className="bento-beh-icon-new">Bē</div>
                        <div className="bento-beh-text-new">
                          <div className="bento-beh-title-new">{block.title}</div>
                          <div className="bento-beh-sub-new">behance.net</div>
                        </div>
                      </div>
                      <button
                        className={`btn-bento-follow-new ${followed ? 'following' : ''}`}
                        onClick={() => {
                          setFollowed(!followed)
                          toast(followed ? 'Unfollowed on Behance' : 'Following on Behance!')
                        }}
                      >
                        {followed ? '✓ Following' : '＋ Follow 158'}
                      </button>
                    </div>
                    <div className="bento-beh-bottom-card" style={{ background: '#111625', borderRadius: '16px' }}>
                      MEDSwift UI/UX Case Study
                    </div>
                  </div>
                )
              }
              if (block.type === 'youtube') {
                return (
                  <div key={block.id} className="bento-card-base bento-yt-card-new">
                    <div className="bento-yt-left-new">
                      <div className="bento-yt-brand-new">
                        <div className="bento-yt-icon-new">▶</div>
                        <div className="bento-yt-text-new">
                          <div className="bento-yt-title-new">{block.title}</div>
                          <div className="bento-yt-sub-new">youtube.com</div>
                        </div>
                      </div>
                      <button
                        className={`btn-bento-sub-new ${subscribed ? 'subscribed' : ''}`}
                        onClick={() => {
                          setSubscribed(!subscribed)
                          toast(subscribed ? 'Unsubscribed on YouTube' : 'Subscribe 694')
                        }}
                      >
                        {subscribed ? '✓ Subscribed' : 'Subscribe 694'}
                      </button>
                    </div>
                    <div className="bento-yt-right-new">
                      <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/fintech_dashboard.png) center/cover' }} />
                      <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/ecommerce_app.png) center/cover' }} />
                      <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/design_system.png) center/cover' }} />
                      <div className="yt-grid-item-new" style={{ background: 'url(/assets/images/ar_glass.png) center/cover' }} />
                    </div>
                  </div>
                )
              }
              if (block.type === 'custom-emoji') {
                return (
                  <div key={block.id} className="bento-card-base bento-block-emoji" style={{ gridColumn: 'span 3', position: 'relative' }}>
                    <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                    {block.emoji}
                  </div>
                )
              }
              if (block.type === 'custom-text') {
                return (
                  <div key={block.id} className="bento-card-base bento-block-text" style={{ gridColumn: 'span 6', position: 'relative' }}>
                    <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                    {block.text}
                  </div>
                )
              }
              if (block.type === 'custom-link') {
                const brandColor = getSocialBrandColor(block.title);
                return (
                  <a key={block.id} href={block.url} target="_blank" rel="noopener noreferrer" className="bento-card-base bento-block-link" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', minHeight: '140px', position: 'relative' }}>
                    <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${brandColor}15`,
                        color: brandColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0
                      }}>
                        {getSocialIcon(block.title, 20, brandColor)}
                      </div>
                      <span style={{ fontSize: '1.1rem', color: isDark ? '#94A3B8' : '#9CA3AF' }}>↗</span>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <div className="bento-block-link-title" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{block.title}</div>
                      <div className="bento-block-link-url" style={{ marginTop: 4, fontSize: '0.8rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {block.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </div>
                    </div>
                  </a>
                )
              }
              if (block.type === 'custom-checklist') {
                return (
                  <div key={block.id} className="bento-card-base bento-block-checklist" style={{ gridColumn: 'span 6', position: 'relative' }}>
                    <button className="edit-block-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditBlock(block); }} title="Edit Block">✏️</button>
                    <h4 className="checklist-title">{block.title}</h4>
                    {block.items.map((item, idx) => (
                      <div key={idx} className="checklist-item">
                        <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )
              }
              return null
            })}

            {/* Dotted "+" Card */}
            <div className="bento-add-block-btn" onClick={() => openDialog('select-tool')} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '1.8rem' }}>＋</span>
              <span>Click here to add a block</span>
            </div>
          </section>

        </div>
      </div>

      {/* 4. Bottom Toolbar palette */}
      <div className="bento-bottom-actions">
        <div className="bento-quick-left">
          <button className="btn-bento-quick" id="btn-bento-theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button className="btn-bento-quick btn-quick-share-text" onClick={handleCopyLink} title="Share Profile">
            <span>📤</span> Share my page
          </button>
          <button className="btn-bento-quick" onClick={() => toast('No new messages 💬')} title="Inbox">
            💬
          </button>
          <button className="btn-bento-quick" onClick={() => navigate('/')} title="Explore Home">
            🧭
          </button>
        </div>
      </div>

      {/* Custom dialog modal overlay */}
      {activeDialog && (
        <div className="bento-dialog-overlay" onClick={closeDialog}>
          <div className="bento-dialog-card" onClick={e => e.stopPropagation()} style={activeDialog === 'select-tool' ? { maxWidth: '500px' } : {}}>
            <h3 className="bento-dialog-title" style={{ fontFamily: 'var(--font-heading)' }}>
              {activeDialog === 'select-tool' && 'Add Block / Tool'}
              {activeDialog === 'emoji' && (editingBlockId ? 'Edit Emoji Block' : 'Add Emoji Block')}
              {activeDialog === 'link' && (editingBlockId ? 'Edit Link Block' : 'Add Link Block')}
              {activeDialog === 'text' && (editingBlockId ? 'Edit Text Block' : 'Add Text Block')}
              {activeDialog === 'checklist' && (editingBlockId ? 'Edit Checklist Block' : 'Add Checklist Block')}
            </h3>
            
            {activeDialog === 'select-tool' && (
              <div className="bento-tool-select-grid">
                <button className="tool-select-item" onClick={() => openDialog('emoji')} title="Add Emoji Block">
                  <span className="tool-select-icon">😊</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Emoji</span>
                    <span className="tool-select-desc">Add visual emoji block</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('link')} title="Add Link Block">
                  <span className="tool-select-icon">🔗</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Link</span>
                    <span className="tool-select-desc">Add custom redirect URL</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('text')} title="Add Text Block">
                  <span className="tool-select-icon">Ｔ</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Text</span>
                    <span className="tool-select-desc">Add paragraph text card</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => openDialog('checklist')} title="Add Checklist Block">
                  <span className="tool-select-icon">📋</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Checklist</span>
                    <span className="tool-select-desc">Create task checkbox list</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { imageInputRef.current?.click(); closeDialog(); }} title="Add Image Card">
                  <span className="tool-select-icon">🖼️</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Image Card</span>
                    <span className="tool-select-desc">Upload custom image file</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleToggleGridSpacing(); closeDialog(); }} title="Toggle Spacing">
                  <span className="tool-select-icon">田</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Grid Spacing</span>
                    <span className="tool-select-desc">Toggle layout gaps</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { setIsMobile(!isMobile); closeDialog(); }} title="Toggle Mobile Preview">
                  <span className="tool-select-icon">📱</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">Mobile Preview</span>
                    <span className="tool-select-desc">Toggle simulator mockup</span>
                  </div>
                </button>
                <button className="tool-select-item" onClick={() => { handleAddAIBlock(); closeDialog(); }} title="Add AI Block">
                  <span className="tool-select-icon">✨</span>
                  <div className="tool-select-details">
                    <span className="tool-select-name">AI Quote</span>
                    <span className="tool-select-desc">Generate AI quote card</span>
                  </div>
                </button>
              </div>
            )}

            {activeDialog === 'emoji' && (
              <input
                type="text"
                id="bento-dialog-input-1"
                maxLength="2"
                className="bento-dialog-input"
                placeholder="Enter an emoji (e.g. 🚀)"
                value={dialogInput1}
                onChange={e => setDialogInput1(e.target.value)}
              />
            )}
            {activeDialog === 'text' && (
              <textarea
                id="bento-dialog-input-1"
                className="bento-dialog-input"
                style={{ height: '100px', padding: '12px', resize: 'none' }}
                placeholder="Enter your message..."
                value={dialogInput1}
                onChange={e => setDialogInput1(e.target.value)}
              />
            )}
            {activeDialog === 'link' && (
              <>
                <input
                  type="text"
                  id="bento-dialog-input-1"
                  className="bento-dialog-input"
                  placeholder="Link Title (e.g. My Website)"
                  value={dialogInput1}
                  onChange={e => setDialogInput1(e.target.value)}
                />
                <input
                  type="text"
                  id="bento-dialog-input-2"
                  className="bento-dialog-input"
                  placeholder="URL (e.g. https://example.com)"
                  value={dialogInput2}
                  onChange={e => setDialogInput2(e.target.value)}
                />
              </>
            )}
            {activeDialog === 'checklist' && (
              <>
                <input
                  type="text"
                  id="bento-dialog-input-1"
                  className="bento-dialog-input"
                  placeholder="Checklist Title (e.g. Daily Stack)"
                  value={dialogInput1}
                  onChange={e => setDialogInput1(e.target.value)}
                />
                <input
                  type="text"
                  id="bento-dialog-input-2"
                  className="bento-dialog-input"
                  placeholder="Items (comma-separated, e.g. React, Node, CSS)"
                  value={dialogInput2}
                  onChange={e => setDialogInput2(e.target.value)}
                />
              </>
            )}

            <div className="bento-dialog-actions">
              <button className="btn-bento-dialog-cancel" id="btn-bento-dialog-cancel" onClick={closeDialog}>Cancel</button>
              {activeDialog !== 'select-tool' && (
                <button className="btn-bento-dialog-submit" id="btn-bento-dialog-submit" onClick={handleDialogSubmit}>
                  {editingBlockId ? 'Save Changes' : 'Add Block'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}
