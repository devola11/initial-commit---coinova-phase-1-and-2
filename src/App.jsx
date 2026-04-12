import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PortfolioProvider } from './context/PortfolioContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Markets from './pages/Markets'
import Invest from './pages/Invest'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

function AppLayout() {
  return (
    <div className="min-h-screen bg-root-bg">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected (with dark navbar layout) */}
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <Portfolio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/markets"
                element={
                  <ProtectedRoute>
                    <Markets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invest"
                element={
                  <ProtectedRoute>
                    <Invest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
