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

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 14, 2026</p>

        <Section title="1. Information We Collect">
          <p>We collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address (required for account)</li>
            <li>Display name (optional)</li>
            <li>Country and language preferences</li>
            <li>Portfolio and transaction data</li>
            <li>Device and browser information</li>
            <li>IP address and usage analytics</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and improve our services</li>
            <li>Send important account notifications</li>
            <li>Analyze platform usage and performance</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and abuse</li>
          </ul>
        </Section>

        <Section title="3. Data Storage">
          <p>Your data is stored securely using Supabase, a PostgreSQL database with enterprise-grade security. Data is encrypted at rest and in transit.</p>
        </Section>

        <Section title="4. Third Party Services">
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> - database and authentication</li>
            <li><strong>CoinGecko</strong> - cryptocurrency price data</li>
            <li><strong>Vercel</strong> - hosting and deployment</li>
            <li><strong>Alternative.me</strong> - market sentiment data</li>
          </ul>
          <p>These services have their own privacy policies.</p>
        </Section>

        <Section title="5. Cookies">
          <p>We use localStorage and cookies to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keep you logged in</li>
            <li>Remember your preferences</li>
            <li>Improve your experience</li>
          </ul>
          <p>You can clear these in your browser settings.</p>
        </Section>

        <Section title="6. Data Sharing">
          <p>We do not sell your personal data to third parties. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Service providers who help operate our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
          </ul>
          <p>Contact us at <a href="mailto:support@coinova.app" className="text-[#0052FF] no-underline hover:underline">support@coinova.app</a> to exercise these rights.</p>
        </Section>

        <Section title="8. Security">
          <p>We implement industry-standard security measures including encryption, secure authentication, and regular security audits.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>Coinova is not intended for users under 18 years of age. We do not knowingly collect data from minors.</p>
        </Section>

        <Section title="10. Contact">
          <p>Privacy questions: <a href="mailto:privacy@coinova.app" className="text-[#0052FF] no-underline hover:underline">privacy@coinova.app</a></p>
        </Section>

        <div className="pt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-[#0052FF] no-underline hover:underline">Terms of Service</Link>
          <Link to="/faq" className="text-[#0052FF] no-underline hover:underline">FAQ</Link>
          <Link to="/contact" className="text-[#0052FF] no-underline hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
