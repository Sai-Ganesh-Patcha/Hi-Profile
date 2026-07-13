import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingProvider } from './context/OnboardingContext'
import Home     from './pages/Home'
import Claim    from './pages/Claim'
import Register from './pages/Register'
import Login    from './pages/Login'
import Upload   from './pages/Upload'
import Profile  from './pages/Profile'
import Setup    from './pages/Setup'
import Select   from './pages/Select'
import TimelineView from './pages/TimelineView'
import TimelineLive from './pages/TimelineLive'
import BentoView from './pages/BentoView'
import Dashboard from './pages/Dashboard'
import VerifyPending from './pages/VerifyPending'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingProvider>
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/claim"    element={<Claim />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/verify-pending" element={<VerifyPending />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/upload"   element={<Upload />} />
          <Route path="/profile"  element={<Profile />} />
          <Route path="/setup"    element={<Setup />} />
          <Route path="/select"   element={<Select />} />
          <Route path="/timeline" element={<TimelineView />} />
          <Route path="/timeline-live" element={<TimelineLive />} />
          <Route path="/bento"    element={<BentoView />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </OnboardingProvider>
    </BrowserRouter>
  )
}
