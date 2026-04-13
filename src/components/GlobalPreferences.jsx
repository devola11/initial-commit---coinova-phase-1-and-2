import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const COUNTRIES = [
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'United States' },
  { flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom' },
  { flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria' },
  { flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany' },
  { flag: '\u{1F1EB}\u{1F1F7}', name: 'France' },
  { flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada' },
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia' },
  { flag: '\u{1F1EE}\u{1F1F3}', name: 'India' },
  { flag: '\u{1F1E7}\u{1F1F7}', name: 'Brazil' },
  { flag: '\u{1F1FF}\u{1F1E6}', name: 'South Africa' },
  { flag: '\u{1F1EC}\u{1F1ED}', name: 'Ghana' },
  { flag: '\u{1F1F0}\u{1F1EA}', name: 'Kenya' },
  { flag: '\u{1F1E6}\u{1F1EA}', name: 'UAE' },
  { flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan' },
  { flag: '\u{1F1F0}\u{1F1F7}', name: 'South Korea' },
  { flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexico' },
  { flag: '\u{1F1E6}\u{1F1F7}', name: 'Argentina' },
  { flag: '\u{1F1F3}\u{1F1F1}', name: 'Netherlands' },
  { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italy' },
  { flag: '\u{1F1EA}\u{1F1F8}', name: 'Spain' },
  { flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugal' },
  { flag: '\u{1F1E8}\u{1F1ED}', name: 'Switzerland' },
  { flag: '\u{1F1F8}\u{1F1EA}', name: 'Sweden' },
  { flag: '\u{1F1F3}\u{1F1F4}', name: 'Norway' },
  { flag: '\u{1F30D}', name: 'Global' },
]

const LANGUAGES = [
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'English' },
  { flag: '\u{1F1EB}\u{1F1F7}', name: 'Fran\u00E7ais' },
  { flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' },
  { flag: '\u{1F1EA}\u{1F1F8}', name: 'Espa\u00F1ol' },
  { flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugu\u00EAs' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: '\u65E5\u672C\u8A9E' },
  { flag: '\u{1F1F0}\u{1F1F7}', name: '\uD55C\uAD6D\uC5B4' },
  { flag: '\u{1F1E8}\u{1F1F3}', name: '\u4E2D\u6587' },
  { flag: '\u{1F1F8}\u{1F1E6}', name: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
]

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
  )
}

function Checkmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
  )
}

export function useGlobalPrefs() {
  const [country, setCountryState] = useState(
    () => localStorage.getItem('coinova_country') || 'United States'
  )
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('coinova_language') || 'English'
  )

  function setCountry(val) {
    setCountryState(val)
    localStorage.setItem('coinova_country', val)
  }
  function setLanguage(val) {
    setLanguageState(val)
    localStorage.setItem('coinova_language', val)
  }

  return { country, language, setCountry, setLanguage }
}

export default function GlobalPreferences({ onClose, country, language, setCountry, setLanguage }) {
  const { user } = useAuth()
  const [step, setStep] = useState('main')
  const [search, setSearch] = useState('')

  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRIES
    const q = search.toLowerCase()
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
  }, [search])

  function selectCountry(name) {
    setCountry(name)
    if (user) {
      supabase.from('profiles').update({ country: name }).eq('id', user.id).then(() => {})
    }
    setStep('main')
    setSearch('')
  }

  function selectLanguage(name) {
    setLanguage(name)
    if (user) {
      supabase.from('profiles').update({ language: name }).eq('id', user.id).then(() => {})
    }
    setStep('main')
  }

  const countryFlag = COUNTRIES.find((c) => c.name === country)?.flag || '\u{1F30D}'
  const langFlag = LANGUAGES.find((l) => l.name === language)?.flag || '\u{1F1FA}\u{1F1F8}'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Main ─────────────────────────────────────── */}
        {step === 'main' && (
          <div>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-black">Global preferences</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 bg-transparent border-none cursor-pointer text-gray-400 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <button
                onClick={() => { setStep('country'); setSearch('') }}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-transparent hover:bg-[#F8F9FA] cursor-pointer transition-colors text-left"
              >
                <div>
                  <div className="text-[13px] text-gray-400 mb-0.5">Country / region</div>
                  <div className="text-[15px] text-black font-medium">{countryFlag} {country}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <button
                onClick={() => setStep('language')}
                className="w-full flex items-center justify-between px-6 py-4 bg-transparent hover:bg-[#F8F9FA] cursor-pointer transition-colors text-left"
              >
                <div>
                  <div className="text-[13px] text-gray-400 mb-0.5">Language</div>
                  <div className="text-[15px] text-black font-medium">{langFlag} {language}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <div className="h-4" />
          </div>
        )}

        {/* ── Country selector ─────────────────────────── */}
        {step === 'country' && (
          <div>
            <div className="flex items-center gap-3 px-6 pt-5 pb-3">
              <button
                onClick={() => { setStep('main'); setSearch('') }}
                className="text-gray-500 hover:text-black bg-transparent border-none cursor-pointer"
              >
                <BackArrow />
              </button>
              <h2 className="text-lg font-semibold text-black">Country / region</h2>
            </div>
            <div className="px-6 pb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0052FF] bg-white"
                autoFocus
              />
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {filteredCountries.map((c) => (
                <button
                  key={c.name}
                  onClick={() => selectCountry(c.name)}
                  className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-transparent hover:bg-[#F8F9FA] cursor-pointer transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span className="text-[15px] text-black">{c.name}</span>
                  </div>
                  {country === c.name && <Checkmark />}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-6 py-6 text-center text-gray-400 text-sm">No results</div>
              )}
            </div>
            <div className="h-3" />
          </div>
        )}

        {/* ── Language selector ────────────────────────── */}
        {step === 'language' && (
          <div>
            <div className="flex items-center gap-3 px-6 pt-5 pb-4">
              <button
                onClick={() => setStep('main')}
                className="text-gray-500 hover:text-black bg-transparent border-none cursor-pointer"
              >
                <BackArrow />
              </button>
              <h2 className="text-lg font-semibold text-black">Language</h2>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {LANGUAGES.map((l) => (
                <button
                  key={l.name}
                  onClick={() => selectLanguage(l.name)}
                  className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-transparent hover:bg-[#F8F9FA] cursor-pointer transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{l.flag}</span>
                    <span className="text-[15px] text-black">{l.name}</span>
                  </div>
                  {language === l.name && <Checkmark />}
                </button>
              ))}
            </div>
            <div className="px-6 py-3 text-center text-gray-400 text-xs">
              More languages coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
