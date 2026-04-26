import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.jpeg'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY

const CATEGORIES = [
  'Account & Security',
  'Deposits & Withdrawals',
  'Trading Issues',
  'KYC Verification',
  'CNC Token',
  'Technical Problem',
  'Bug Report',
  'Feature Request',
  'Other',
]

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src={logo} alt="Coinova" className="h-8 rounded" />
            <span className="text-xl font-extrabold text-black tracking-tight">Coinova</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 rounded-full transition-colors no-underline">Sign in</Link>
            <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0052FF] hover:bg-[#0040CC] rounded-full no-underline transition-colors">Get started</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function InfoCard({ title, description, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h3 className="text-black font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-2">{description}</p>
      {children}
    </div>
  )
}

async function generateTicketNumber() {
  const { count } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
  const num = String((count || 0) + 1).padStart(4, '0')
  return `COIN-2026-${num}`
}

export default function Contact() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Account & Security',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [ticketNum, setTicketNum] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const ticketNumber = await generateTicketNumber()

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Coinova ${ticketNumber}: ${formData.subject}`,
          from_name: formData.name,
          email: formData.email,
          message: `Ticket: ${ticketNumber}
Category: ${formData.category}

From: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}`,
          replyto: formData.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await supabase.from('support_tickets').insert({
          ticket_number: ticketNumber,
          user_id: user?.id || null,
          user_email: formData.email,
          user_name: formData.name,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: 'open',
        })

        setTicketNum(ticketNumber)
        setShowSuccess(true)
        setFormData({
          name: '',
          email: '',
          category: 'Account & Security',
          subject: '',
          message: '',
        })
      } else {
        setError(data.message || 'Failed to send.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    }

    setSubmitting(false)
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0052FF] transition-colors bg-white'

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Contact Us</h1>
        <p className="text-gray-500 text-sm mb-10">We're here to help - typical reply within 24 hours.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left - Info cards */}
          <div className="space-y-4">
            <InfoCard
              title="Email Support"
              description="Reach our team directly for any issue"
            >
              <a
                href="mailto:coinovasupport@gmail.com"
                className="text-[#0052FF] text-sm font-medium no-underline hover:underline"
              >
                coinovasupport@gmail.com
              </a>
              <p className="text-gray-400 text-xs mt-2">Response time: Within 24 hours</p>
            </InfoCard>

            <InfoCard
              title="Help Center"
              description="Find answers to common questions before you reach out"
            >
              <Link
                to="/faq"
                className="text-[#0052FF] text-sm font-medium no-underline hover:underline"
              >
                Browse FAQ
              </Link>
            </InfoCard>

            <InfoCard
              title="My Tickets"
              description="Track previous support requests and admin responses"
            >
              <Link
                to="/my-tickets"
                className="text-[#0052FF] text-sm font-medium no-underline hover:underline"
              >
                View my tickets
              </Link>
            </InfoCard>
          </div>

          {/* Right - Contact form */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-black font-semibold mb-4">Send us a message</h3>

            {showSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#05B169]/15 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="text-black font-semibold mb-1">Ticket #{ticketNum} created!</div>
                <p className="text-gray-600 text-sm mb-4">
                  We will respond within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-black text-sm font-semibold bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    Send another
                  </button>
                  <Link
                    to="/my-tickets"
                    className="flex-1 py-2.5 rounded-lg bg-[#0052FF] hover:bg-[#0040CC] text-white text-sm font-semibold no-underline text-center transition-colors"
                  >
                    View my tickets
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help?"
                    className={inputCls + ' resize-none'}
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0040CC] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-10 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-[#0052FF] no-underline hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="text-[#0052FF] no-underline hover:underline">Privacy Policy</Link>
          <Link to="/faq" className="text-[#0052FF] no-underline hover:underline">FAQ</Link>
        </div>
      </div>
    </div>
  )
}
