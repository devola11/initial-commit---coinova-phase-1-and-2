import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PortfolioProvider } from './context/PortfolioContext'
import { useTheme } from './hooks/useTheme'
import AppLock from './components/AppLock'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Markets from './pages/Markets'
import Invest from './pages/Invest'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import Airdrops from './pages/Airdrops'
import CoinDetail from './pages/CoinDetail'
import Watchlist from './pages/Watchlist'
import Convert from './pages/Convert'
import Trending from './pages/Trending'
import Staking from './pages/Staking'
import Learn from './pages/Learn'
import Analytics from './pages/Analytics'
import KYC from './pages/KYC'
import CNCToken from './pages/CNCToken'
import InstallBanner from './components/InstallBanner'
import Footer from './components/Footer'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import MyTickets from './pages/MyTickets'
import SupportButton from './components/SupportButton'

function AppLayout() {
  return (
    <div className="min-h-screen bg-root-bg flex flex-col">
      <Navbar />
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
                path="/coin/:coinId"
                element={
                  <ProtectedRoute>
                    <CoinDetail />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
          <InstallBanner />
          </AppLock>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
