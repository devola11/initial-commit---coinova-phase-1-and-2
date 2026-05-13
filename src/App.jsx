import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PortfolioProvider } from './context/PortfolioContext'
import { useTheme } from './hooks/useTheme'
import AppLock from './components/AppLock'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import InstallBanner from './components/InstallBanner'
import Footer from './components/Footer'
import SupportButton from './components/SupportButton'
import CNCPromoBanner from './components/CNCPromoBanner'

// Critical / small pages: keep eager
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// Heavy / protected pages: lazy-load
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Markets = lazy(() => import('./pages/Markets'))
const Invest = lazy(() => import('./pages/Invest'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Learn = lazy(() => import('./pages/Learn'))
const CNCToken = lazy(() => import('./pages/CNCToken'))
const Admin = lazy(() => import('./pages/Admin'))
const KYC = lazy(() => import('./pages/KYC'))
const Settings = lazy(() => import('./pages/Settings'))
const SecurityActivity = lazy(() => import('./pages/SecurityActivity'))
const MyTickets = lazy(() => import('./pages/MyTickets'))
const MyWithdrawals = lazy(() => import('./pages/MyWithdrawals'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Airdrops = lazy(() => import('./pages/Airdrops'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const Convert = lazy(() => import('./pages/Convert'))
const Trending = lazy(() => import('./pages/Trending'))
const Staking = lazy(() => import('./pages/Staking'))
const CoinDetail = lazy(() => import('./pages/CoinDetail'))

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0B0D',
      }}
    >
      <div
        style={{
          border: '3px solid #1E2025',
          borderTopColor: '#0052FF',
          borderRadius: '50%',
          width: 40,
          height: 40,
          animation: 'cn-spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes cn-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-root-bg flex flex-col">
      <Navbar />
      <CNCPromoBanner />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <SupportButton />
    </div>
  )
}

export default function App() {
  useTheme()
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <AppLock>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/confirm" element={<AuthCallback />} />
            <Route path="/auth/v1/verify" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cnc" element={<CNCToken />} />

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
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn"
                element={
                  <ProtectedRoute>
                    <Learn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/convert"
                element={
                  <ProtectedRoute>
                    <Convert />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trending"
                element={
                  <ProtectedRoute>
                    <Trending />
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
                path="/staking"
                element={
                  <ProtectedRoute>
                    <Staking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/airdrops"
                element={
                  <ProtectedRoute>
                    <Airdrops />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <Watchlist />
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
                path="/kyc"
                element={
                  <ProtectedRoute>
                    <KYC />
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
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-withdrawals"
                element={
                  <ProtectedRoute>
                    <MyWithdrawals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coin/:coinId"
                element={
                  <ProtectedRoute>
                    <CoinDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/security/activity"
                element={
                  <ProtectedRoute>
                    <SecurityActivity />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <InstallBanner />
          </AppLock>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
