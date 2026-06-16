import { createContext, useContext, useState, useEffect } from 'react'

const OnboardingContext = createContext(null)

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export function OnboardingProvider({ children }) {
  const [claimedUsername, setClaimedUsername] = useState(() => load('claimedUsername', ''))
  const [avatar, setAvatar] = useState(() => load('hiprofile_avatar', { type: null, data: null, transform: '', bg: '' }))
  const [profileName, setProfileName] = useState(() => load('profileName', ''))
  const [profileBio, setProfileBio]   = useState(() => load('profileBio', ''))
  const [socialLinks, setSocialLinks] = useState({})
  const [selectedTemplate, setSelectedTemplate] = useState(() => load('selectedTemplate', 'bento'))

  useEffect(() => { localStorage.setItem('claimedUsername', JSON.stringify(claimedUsername)) }, [claimedUsername])
  useEffect(() => { localStorage.setItem('hiprofile_avatar', JSON.stringify(avatar)) }, [avatar])
  useEffect(() => { localStorage.setItem('profileName', JSON.stringify(profileName)) }, [profileName])
  useEffect(() => { localStorage.setItem('profileBio', JSON.stringify(profileBio)) }, [profileBio])
  useEffect(() => { localStorage.setItem('selectedTemplate', JSON.stringify(selectedTemplate)) }, [selectedTemplate])

  return (
    <OnboardingContext.Provider value={{
      claimedUsername, setClaimedUsername,
      avatar, setAvatar,
      profileName, setProfileName,
      profileBio, setProfileBio,
      socialLinks, setSocialLinks,
      selectedTemplate, setSelectedTemplate,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider')
  return ctx
}
