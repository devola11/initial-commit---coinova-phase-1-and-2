import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'

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

function InfoCard({ title, email, description, responseTime }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h3 className="text-black font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-2">{description}</p>
      <a href={`mailto:${email}`} className="text-[#0052FF] text-sm font-medium no-underline hover:underline">{email}</a>
      {responseTime && <p className="text-gray-400 text-xs mt-2">Response time: {responseTime}</p>}
    </div>
  )
}

const SUBJECTS = [
  'General inquiry',
  'Investment issue',
  'Technical problem',
  'Feature request',
  'Other',
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0052FF] transition-colors bg-white'

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Contact Us</h1>
        <p className="text-gray-500 text-sm mb-10">We're here to help</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left - Info cards */}
          <div className="space-y-4">
            <InfoCard title="General Support" email="support@coinova.app"
              description="For general questions and account help" responseTime="Within 24 hours" />
            <InfoCard title="Investment Issues" email="investments@coinova.app"
              description="For deposit and withdrawal questions" responseTime="Within 12 hours" />
            <InfoCard title="Technical Support" email="tech@coinova.app"
              description="For bugs and technical issues" responseTime="Within 24 hours" />
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-black font-semibold mb-3">Social Media</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Twitter/X:</span>
                  <span className="text-[#0052FF] font-medium">@coinova_app</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Telegram:</span>
                  <span className="text-[#0052FF] font-medium">t.me/coinova</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">WhatsApp:</span>
                  <span className="text-[#0052FF] font-medium">Chat with us</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Contact form */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-black font-semibold mb-4">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name" className={inputCls} />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Email</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className={inputCls} />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Subject</label>
                <select value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputCls}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-600 text-xs font-medium mb-1 block">Message</label>
                <textarea required rows={5} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help?" className={inputCls + ' resize-none'} />
              </div>
              <button type="submit"
                className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0040CC] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
                Send message
              </button>
            </form>
            {sent && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
                Message sent! We'll reply within 24 hours.
              </div>
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
