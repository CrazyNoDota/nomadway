import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import AdminDashboard from './pages/AdminDashboard'
import { trackVisit } from './utils/analytics'

function App() {
  useEffect(() => {
    // Track page visit on initial load
    trackVisit(window.location.pathname)
  }, [])

  return (
    <>
      <div className="animated-bg" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-stats" element={<AdminDashboard />} />
      </Routes>
    </>
  )
}

export default App
