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

function Section({ title, children }) {
  return (
    <div className="py-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-black mb-3">{title}</h2>
      <div className="text-gray-600 text-sm leading-[1.8] space-y-3">{children}</div>
    </div>
  )
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 14, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing and using Coinova ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Coinova is a cryptocurrency portfolio tracking and investment simulation platform. We provide:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Real-time cryptocurrency price tracking</li>
            <li>Portfolio management tools</li>
            <li>Simulated investment features using demo funds</li>
            <li>Educational content about cryptocurrencies</li>
            <li>Market analysis and insights</li>
          </ul>
          <p><strong>Important:</strong> Coinova is a demonstration platform. All investments made on Coinova use simulated demo funds and do not involve real money unless explicitly stated in our investment features.</p>
        </Section>

        <Section title="3. Investment Disclaimer">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-800 mb-2">IMPORTANT RISK DISCLOSURE:</p>
            <ul className="list-disc pl-5 space-y-1 text-red-700">
              <li>Cryptocurrency investments are highly volatile</li>
              <li>Past performance does not guarantee future results</li>
              <li>You may lose some or all of your investment</li>
              <li>Coinova's investment features use real cryptocurrency wallet addresses for actual crypto transfers</li>
              <li>Only invest what you can afford to lose</li>
              <li>Coinova is not a licensed financial advisor</li>
              <li>Always do your own research (DYOR)</li>
            </ul>
          </div>
        </Section>

        <Section title="4. User Accounts">
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and password. Notify us immediately of any unauthorized use of your account.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the platform for any illegal purposes</li>
            <li>Attempt to hack or disrupt our services</li>
            <li>Create fake accounts or impersonate others</li>
            <li>Use automated bots or scrapers</li>
            <li>Engage in market manipulation</li>
          </ul>
        </Section>

        <Section title="6. Investment Features">
          <p>Our investment features allow users to send real cryptocurrency to our designated wallet addresses. By using these features:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You acknowledge sending real cryptocurrency</li>
            <li>Investments are subject to manual verification</li>
            <li>Processing time is up to 24 hours</li>
            <li>Coinova reserves the right to reject suspicious transactions</li>
          </ul>
        </Section>

        <Section title="7. Wallet Addresses">
          <p>Coinova's official wallet addresses are:</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-xs break-all">
            <div><span className="font-semibold text-black">BTC:</span> bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl</div>
            <div><span className="font-semibold text-black">ETH:</span> 0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458</div>
            <div><span className="font-semibold text-black">USDT TRC-20:</span> TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca</div>
          </div>
          <p className="text-red-600 font-medium">Warning: Only send crypto to these addresses. Coinova is not responsible for funds sent to incorrect addresses.</p>
        </Section>

        <Section title="8. Fees">
          <p>Coinova charges a 0.1% fee on all simulated trades within the platform. Investment processing fees may apply for external transfers.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>Coinova shall not be liable for any indirect, incidental, or consequential damages arising from your use of our platform.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these terms, contact us at: <a href="mailto:coinovasupport@gmail.com" className="text-[#0052FF] no-underline hover:underline">coinovasupport@gmail.com</a></p>
        </Section>

        <div className="pt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="text-[#0052FF] no-underline hover:underline">Privacy Policy</Link>
          <Link to="/faq" className="text-[#0052FF] no-underline hover:underline">FAQ</Link>
          <Link to="/contact" className="text-[#0052FF] no-underline hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
