import { useState, useEffect, useMemo } from 'react'
import { getCoinImageUrl } from '../utils/coinImages'

/* ── Coin Logo ────────────────────────────────────────────────────────── */

function CoinLogo({ id, image, symbol, size = 32, className = '' }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div style={{ width: size, height: size }}
        className={`rounded-full bg-[#1E2025] flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0 ${className}`}>
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)}
    style={{ width: size, height: size }} className={`rounded-full bg-white/5 flex-shrink-0 ${className}`} />
}

/* ── Confetti ─────────────────────────────────────────────────────────── */

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random(),
      color: ['#05B169', '#0052FF', '#F59E0B', '#F6465D', '#22C55E'][i % 5],
      size: 6 + Math.random() * 6,
    })), [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div key={p.id} className="absolute" style={{
          left: `${p.left}%`, top: '-10px',
          width: p.size, height: p.size,
          backgroundColor: p.color, borderRadius: '2px',
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ── Main Modal ───────────────────────────────────────────────────────── */

export default function LessonModal({ coin, onClose, onComplete }) {
  const [stage, setStage] = useState('loading') // loading | lesson | quiz | reward
  const [lesson, setLesson] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coin) return
    let cancelled = false

    async function generate() {
      try {
        const resp = await fetch('/api/generate-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coinName: coin.name,
            coinSymbol: coin.symbol?.toUpperCase(),
            coinId: coin.id,
            lessonNumber: 1,
          }),
        })

        if (!resp.ok) throw new Error('API error')
        const data = await resp.json()
        if (data.fallback) throw new Error('Fallback')

        if (!cancelled) {
          setLesson(data)
          setStage('lesson')
        }
      } catch {
        if (!cancelled) setError('Failed to generate lesson. Please try again.')
      }
    }

    generate()
    return () => { cancelled = true }
  }, [coin])

  function handleSelectOption(idx) {
    if (submitted) return
    setSelected(idx)
  }

  function handleSubmitQuiz() {
    if (selected === null) return
    setSubmitted(true)
    const correct = selected === lesson.quiz.correctIndex
    if (correct) {
      setTimeout(() => setStage('reward'), 1200)
    }
  }

  function handleClaim() {
    onComplete(lesson)
  }

  if (!coin) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#141519] border border-[#1E2025] rounded-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* ── Loading Stage ─────────────────────────────────────── */}
        {stage === 'loading' && !error && (
          <div className="p-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={64}
                className="animate-pulse" />
              <div className="absolute inset-[-6px] rounded-full border-2 border-transparent border-t-[#0052FF] animate-spin" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">
              Generating lesson for {coin.name}...
            </h3>
            <p className="text-[#8A919E] text-sm mb-1">Powered by Claude AI</p>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#0052FF]"
                  style={{ animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <style>{`
              @keyframes dotPulse {
                0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>
          </div>
        )}

        {/* ── Error State ──────────────────────────────────────── */}
        {error && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F6465D]/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F6465D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">{error}</p>
            <button onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-lg bg-[#1E2025] hover:bg-[#2C2F36] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
              Close
            </button>
          </div>
        )}

        {/* ── Lesson Stage ─────────────────────────────────────── */}
        {stage === 'lesson' && lesson && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">{lesson.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#8A919E] text-sm">{coin.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] font-semibold">
                    AI Generated
                  </span>
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#1E2025] bg-transparent border-none cursor-pointer text-[#8A919E] hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="text-white/90 text-sm leading-[1.8] whitespace-pre-line mb-5">
              {lesson.content}
            </div>

            {/* Key Fact */}
            {lesson.keyFact && (
              <div className="mb-5 p-4 rounded-xl bg-[#0052FF]/10 border-l-[3px] border-[#0052FF]">
                <p className="text-white text-sm font-medium">
                  <span className="text-[#0052FF] font-semibold">Key fact: </span>
                  {lesson.keyFact}
                </p>
              </div>
            )}

            {/* Continue to quiz button */}
            <button onClick={() => setStage('quiz')}
              className="w-full py-3 rounded-xl bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
              Take the quiz
            </button>
          </div>
        )}

        {/* ── Quiz Stage ──────────────────────────────────────── */}
        {stage === 'quiz' && lesson && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <CoinLogo id={coin.id} image={coin.image} symbol={coin.symbol} size={36} />
              <div>
                <h3 className="text-white font-bold">Test your knowledge</h3>
                <p className="text-[#8A919E] text-sm">{coin.name} quiz</p>
              </div>
            </div>

            <p className="text-white font-medium mb-4">{lesson.quiz.question}</p>

            <div className="space-y-2 mb-4">
              {lesson.quiz.options.map((opt, idx) => {
                let style = 'bg-[#0A0B0D] border-[#1E2025] text-white'
                if (submitted && idx === lesson.quiz.correctIndex) {
                  style = 'bg-[#05B169]/15 border-[#05B169] text-white'
                } else if (submitted && idx === selected && idx !== lesson.quiz.correctIndex) {
                  style = 'bg-[#F6465D]/15 border-[#F6465D] text-white'
                } else if (!submitted && idx === selected) {
                  style = 'bg-[#0052FF]/15 border-[#0052FF] text-white'
                }

                return (
                  <button key={idx} onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${style}`}>
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {submitted && idx === lesson.quiz.correctIndex && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      {submitted && idx === selected && idx !== lesson.quiz.correctIndex && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6465D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {submitted && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                selected === lesson.quiz.correctIndex
                  ? 'bg-[#05B169]/10 text-[#05B169]'
                  : 'bg-[#F6465D]/10 text-[#F6465D]'
              }`}>
                {lesson.quiz.explanation}
              </div>
            )}

            {!submitted && (
              <button onClick={handleSubmitQuiz} disabled={selected === null}
                className={`w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors ${
                  selected !== null ? 'bg-[#0052FF] hover:bg-[#0046D9] text-white' : 'bg-[#1E2025] text-[#5B616E] cursor-not-allowed'
                }`}>
                Submit answer
              </button>
            )}

            {submitted && selected !== lesson.quiz.correctIndex && (
              <button onClick={() => { setSelected(null); setSubmitted(false) }}
                className="w-full py-3 rounded-xl bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
                Try again
              </button>
            )}
          </div>
        )}

        {/* ── Reward Stage ─────────────────────────────────────── */}
        {stage === 'reward' && (
          <div className="relative p-8 text-center overflow-hidden">
            <Confetti />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#05B169]/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Lesson Complete!</h3>
              <p className="text-[#8A919E] text-sm mb-4">
                You learned about {coin.name}. Claim your reward!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#05B169]/15 mb-5">
                <span className="text-[#05B169] text-lg font-bold">10,000 SHIB</span>
              </div>
              <div className="space-y-2">
                <button onClick={handleClaim}
                  className="w-full py-3 rounded-xl bg-[#05B169] hover:bg-[#04a05e] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
                  Claim reward
                </button>
                <button onClick={onClose}
                  className="w-full py-3 rounded-xl bg-transparent hover:bg-[#1E2025] text-[#8A919E] text-sm font-medium border-none cursor-pointer transition-colors">
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
