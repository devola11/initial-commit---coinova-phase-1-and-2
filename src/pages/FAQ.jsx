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

function Accordion({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left bg-transparent border-none cursor-pointer">
        <span className="text-black font-semibold text-sm pr-4">{question}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="pb-4 text-gray-600 text-sm leading-[1.8]">{answer}</div>
      )}
    </div>
  )
}

const SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'What is Coinova?',
        a: 'Coinova is a cryptocurrency platform where you can track prices, manage a portfolio, learn about crypto, and invest in 250+ cryptocurrencies. New users start with $10,000 in demo funds to practice trading.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Get started" on the homepage, enter your email and password, verify your email, and you\'re ready to go!',
      },
      {
        q: 'Is Coinova free to use?',
        a: 'Yes! Coinova is completely free. You get $10,000 in demo funds when you sign up.',
      },
    ],
  },
  {
    title: 'Investing',
    items: [
      {
        q: 'How does investing on Coinova work?',
        a: 'You can invest real cryptocurrency by sending BTC, ETH, or USDT to our wallet addresses. We verify your transaction within 24 hours and credit your account.',
      },
      {
        q: 'What cryptocurrencies can I invest in?',
        a: 'You can invest in 250+ cryptocurrencies including Bitcoin, Ethereum, and popular meme coins like SHIB, PEPE, and DOGE.',
      },
      {
        q: 'How long does investment verification take?',
        a: 'Investments are verified within 24 hours. You\'ll see your balance update once verified.',
      },
      {
        q: 'What are the minimum investment amounts?',
        a: 'Minimum investment is $10 equivalent in any supported cryptocurrency.',
      },
      {
        q: 'What wallet addresses should I send crypto to?',
        a: 'BTC: bc1qmc3umarwy6hfgql8rsuc5njuv0dpxzmkdh0pvl\nETH: 0x52C50eb16a1a565e446EDBBE337B0D8e47bfb458\nUSDT TRC-20: TMKLBuSegAg4e1QvsjpsTgWrqKLfgx4gca',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        q: 'What is staking?',
        a: 'Staking lets you lock up your crypto to earn passive rewards. Rates range from 2% APY for Bitcoin to 12% APY for Shiba Inu.',
      },
      {
        q: 'What is Learn & Earn?',
        a: 'Complete crypto lessons and quizzes to earn free cryptocurrency. Each course takes about 5 minutes.',
      },
      {
        q: 'What are airdrops?',
        a: 'Airdrops are free cryptocurrency distributions. Claim them once per coin from the Airdrops page.',
      },
      {
        q: 'How does the Convert feature work?',
        a: 'Convert lets you swap one cryptocurrency for another at live market rates with a 0.1% fee.',
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        q: 'Is my account secure?',
        a: 'Yes. We use Supabase authentication with encrypted passwords. Enable 2FA in Settings for extra security.',
      },
      {
        q: 'What happens if I forget my password?',
        a: 'Click "Forgot password" on the login page to receive a reset email.',
      },
    ],
  },
  {
    title: 'Technical',
    items: [
      {
        q: 'Can I install Coinova as an app?',
        a: 'Yes! Coinova is a Progressive Web App (PWA). On Android tap "Add to Home Screen" in Chrome. On iPhone tap Share \u2192 Add to Home Screen in Safari.',
      },
      {
        q: 'Why are prices sometimes delayed?',
        a: 'Prices update every 3 minutes to respect API rate limits. For the most current prices, click the refresh button.',
      },
    ],
  },
]

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm mb-10">Everything you need to know about Coinova</p>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-lg font-semibold text-black mb-2 px-1">{section.title}</h2>
            {section.items.map((item) => (
              <Accordion key={item.q} question={item.q} answer={
                <p className="whitespace-pre-line">{item.a}</p>
              } />
            ))}
          </div>
        ))}

        <div className="pt-4 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="text-[#0052FF] no-underline hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="text-[#0052FF] no-underline hover:underline">Privacy Policy</Link>
          <Link to="/contact" className="text-[#0052FF] no-underline hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
