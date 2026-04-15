import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { formatUSD, formatCrypto } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'
import LessonModal from '../components/LessonModal'

/* ── Helpers ──────────────────────────────────────────────────────────── */

function CoinLogo({ id, image, symbol, size = 32 }) {
  const [err, setErr] = useState(false)
  const src = getCoinImageUrl(id, image)
  if (!src || err) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2025] flex items-center justify-center text-[9px] font-bold text-white uppercase flex-shrink-0">
        {(symbol || '').slice(0, 3)}
      </div>
    )
  }
  return <img src={src} alt={symbol} onError={() => setErr(true)}
    style={{ width: size, height: size }} className="rounded-full bg-white/5 flex-shrink-0" />
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

/* ── Success Modal ────────────────────────────────────────────────────── */

function RewardClaimedModal({ course, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm bg-[#141519] border border-[#1E2025] rounded-2xl p-6 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <Confetti />
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#05B169]/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">Added to your portfolio!</h3>
          <div className="flex items-center justify-center gap-2 mb-1">
            <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol || course.reward_symbol} size={24} />
            <span className="text-[#05B169] text-lg font-bold">{formatCrypto(course.reward_amount)} {course.reward_symbol}</span>
          </div>
          <p className="text-[#8A919E] text-sm mb-5">{'\u2248'} {formatUSD(course.reward_usd_value)}</p>
          <button onClick={onClose}
            className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
            Continue learning
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Quiz Component ───────────────────────────────────────────────────── */

function Quiz({ lesson, onComplete }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const options = typeof lesson.quiz_options === 'string'
    ? JSON.parse(lesson.quiz_options) : lesson.quiz_options

  function handleSelect(idx) {
    if (submitted) return
    setSelected(idx)
  }

  function handleSubmit() {
    if (selected === null) return
    setSubmitted(true)
    setTimeout(() => onComplete(selected === lesson.correct_answer), 1200)
  }

  return (
    <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-5">
      <h4 className="text-white font-semibold text-sm mb-1">Test your knowledge</h4>
      <p className="text-white font-medium mb-4">{lesson.quiz_question}</p>
      <div className="space-y-2 mb-4">
        {options.map((opt, idx) => {
          let style = 'bg-[#0A0B0D] border-[#1E2025] text-white'
          if (submitted && idx === lesson.correct_answer) {
            style = 'bg-[#05B169]/15 border-[#05B169] text-white'
          } else if (submitted && idx === selected && idx !== lesson.correct_answer) {
            style = 'bg-[#F6465D]/15 border-[#F6465D] text-white'
          } else if (!submitted && idx === selected) {
            style = 'bg-[#0052FF]/15 border-[#0052FF] text-white'
          }

          return (
            <button key={idx} onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${style}`}>
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {submitted && idx === lesson.correct_answer && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
                {submitted && idx === selected && idx !== lesson.correct_answer && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6465D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={selected === null}
          className={`w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-colors ${
            selected !== null ? 'bg-[#0052FF] hover:bg-[#0046D9] text-white' : 'bg-[#1E2025] text-[#5B616E] cursor-not-allowed'
          }`}>
          Submit answer
        </button>
      )}
      {submitted && (
        <div className={`text-sm font-medium ${selected === lesson.correct_answer ? 'text-[#05B169]' : 'text-[#F6465D]'}`}>
          {selected === lesson.correct_answer ? 'Correct! Well done.' : `Incorrect. The correct answer is: ${options[lesson.correct_answer]}`}
        </div>
      )}
    </div>
  )
}

/* ── Lesson View ──────────────────────────────────────────────────────── */

function LessonView({ course, lessons, progress, onBack, onLessonComplete, onClaimReward, claimedCourses }) {
  const completedLessons = lessons.filter((l) => progress.some((p) => p.lesson_id === l.id && p.completed))
  const currentIdx = completedLessons.length
  const currentLesson = lessons[Math.min(currentIdx, lessons.length - 1)]
  const allDone = completedLessons.length === lessons.length
  const isClaimed = claimedCourses.has(course.id)

  return (
    <div>
      {/* Header */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-[#8A919E] hover:text-white text-sm font-medium bg-transparent border-none cursor-pointer mb-4 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to courses
      </button>

      <div className="flex items-center gap-3 mb-4">
        <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol} size={40} />
        <div>
          <h2 className="text-white text-xl font-bold">{course.title}</h2>
          <div className="text-[#8A919E] text-sm">Lesson {Math.min(currentIdx + 1, lessons.length)} of {lessons.length}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-[#1E2025] mb-6">
        <div className="h-2 rounded-full bg-[#0052FF] transition-all" style={{ width: `${(completedLessons.length / lessons.length) * 100}%` }} />
      </div>

      {allDone && !isClaimed ? (
        /* Claim reward screen */
        <div className="relative bg-[#141519] border border-[#05B169] rounded-xl p-8 text-center overflow-hidden">
          <Confetti />
          <div className="relative z-10">
            <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol} size={64} />
            <h3 className="text-white text-2xl font-bold mt-4 mb-2">Congratulations!</h3>
            <p className="text-[#8A919E] mb-1">You earned</p>
            <div className="text-[#05B169] text-3xl font-bold mb-1">{formatCrypto(course.reward_amount)} {course.reward_symbol}</div>
            <p className="text-[#8A919E] text-sm mb-6">{'\u2248'} {formatUSD(course.reward_usd_value)}</p>
            <button onClick={() => onClaimReward(course)}
              className="px-8 py-3.5 rounded-xl bg-[#05B169] hover:bg-[#04a05e] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
              Claim reward
            </button>
          </div>
        </div>
      ) : allDone && isClaimed ? (
        <div className="bg-[#141519] border border-[#05B169] rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#05B169]/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#05B169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Course completed!</h3>
          <p className="text-[#05B169] text-sm font-semibold">Reward claimed</p>
        </div>
      ) : (
        /* Current lesson */
        <div className="space-y-6">
          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">{currentLesson.title}</h3>
            <div className="text-white text-sm leading-[1.8] whitespace-pre-line mb-4">
              {currentLesson.content}
            </div>
          </div>

          <Quiz
            key={currentLesson.id}
            lesson={currentLesson}
            onComplete={(correct) => onLessonComplete(currentLesson, correct)}
          />
        </div>
      )}
    </div>
  )
}

/* ── Course Card ──────────────────────────────────────────────────────── */

function CourseCard({ course, completedCount, isClaimed, onStart, onClaim }) {
  const allDone = completedCount >= course.total_lessons
  const inProgress = completedCount > 0 && !allDone

  return (
    <div className={`bg-[#141519] border rounded-xl p-5 transition-colors ${
      isClaimed ? 'border-[#05B169]/40' : 'border-[#1E2025] hover:border-[#2C2F36]'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol} size={48} />
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold">{course.title}</div>
          <div className="text-[#8A919E] text-xs mt-0.5">{course.description}</div>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#05B169]/15 text-[#05B169] text-xs font-semibold mb-3">
        Earn {formatCrypto(course.reward_amount)} {course.reward_symbol} {'\u2248'} {formatUSD(course.reward_usd_value)}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#8A919E] mb-1">
          <span>{completedCount}/{course.total_lessons} lessons</span>
          <span>{Math.round((completedCount / course.total_lessons) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#1E2025]">
          <div className="h-1.5 rounded-full bg-[#0052FF] transition-all" style={{ width: `${(completedCount / course.total_lessons) * 100}%` }} />
        </div>
      </div>

      {isClaimed ? (
        <div className="flex items-center gap-1.5 text-[#05B169] text-sm font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Completed
        </div>
      ) : allDone ? (
        <button onClick={() => onClaim(course)}
          className="w-full py-2.5 rounded-lg bg-[#05B169] hover:bg-[#04a05e] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
          Claim {formatUSD(course.reward_usd_value)} in {course.reward_symbol}
        </button>
      ) : (
        <button onClick={() => onStart(course)}
          className="w-full py-2.5 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-sm font-semibold border-none cursor-pointer transition-colors">
          {inProgress ? 'Continue' : 'Start learning'}
        </button>
      )}
    </div>
  )
}

/* ── Main Learn Page ──────────────────────────────────────────────────── */

export default function Learn() {
  const { user } = useAuth()
  const { holdings, refreshAll } = usePortfolio()
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState({})
  const [progress, setProgress] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState(null)
  const [successCourse, setSuccessCourse] = useState(null)

  // AI coin section state
  const [allCoins, setAllCoins] = useState([])
  const [coinSearch, setCoinSearch] = useState('')
  const [coinsLoading, setCoinsLoading] = useState(true)
  const [aiLessonCoin, setAiLessonCoin] = useState(null)
  const [aiCompletedCoins, setAiCompletedCoins] = useState(new Set())
  const [aiSuccessCoin, setAiSuccessCoin] = useState(null)

  const loadData = useCallback(async () => {
    if (!user) return
    const [{ data: c }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('learn_courses').select('*').eq('is_active', true).order('created_at'),
      supabase.from('learn_progress').select('*').eq('user_id', user.id),
      supabase.from('learn_rewards').select('*').eq('user_id', user.id),
    ])
    setCourses(c || [])
    setProgress(p || [])
    setRewards(r || [])
    setLoading(false)
  }, [user])

  // Load AI completed coins
  const loadAiCompleted = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('learn_rewards')
      .select('coin_id')
      .eq('user_id', user.id)
    if (data) {
      setAiCompletedCoins(new Set(data.map((r) => r.coin_id)))
    }
  }, [user])

  useEffect(() => { loadData(); loadAiCompleted() }, [loadData, loadAiCompleted])

  // Fetch all coins for "Learn About Any Coin"
  useEffect(() => {
    async function fetchCoins() {
      try {
        const resp = await fetch('/api/markets?per_page=250')
        const data = await resp.json()
        setAllCoins(Array.isArray(data) ? data : [])
      } catch { /* ignore */ }
      setCoinsLoading(false)
    }
    fetchCoins()
  }, [])

  // Load lessons for active course
  useEffect(() => {
    if (!activeCourse) return
    if (lessons[activeCourse.id]) return
    supabase
      .from('learn_lessons')
      .select('*')
      .eq('course_id', activeCourse.id)
      .order('lesson_number')
      .then(({ data }) => {
        setLessons((prev) => ({ ...prev, [activeCourse.id]: data || [] }))
      })
  }, [activeCourse, lessons])

  const claimedCourses = useMemo(() => new Set(rewards.map((r) => r.course_id)), [rewards])

  function getCompletedCount(courseId) {
    return progress.filter((p) => p.course_id === courseId && p.completed).length
  }

  const totalEarned = rewards.reduce((sum, r) => {
    const course = courses.find((c) => c.id === r.course_id)
    return sum + (course?.reward_usd_value || 0)
  }, 0)

  const completedCourseCount = rewards.length

  // Featured coin IDs
  const featuredCoinIds = new Set(['bitcoin', 'ethereum', 'dogecoin', 'shiba-inu', 'solana', 'chainlink'])

  // Filter coins for the "any coin" section
  const filteredCoins = useMemo(() => {
    let filtered = allCoins.filter((c) => !featuredCoinIds.has(c.id))
    if (coinSearch.trim()) {
      const q = coinSearch.toLowerCase()
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [allCoins, coinSearch])

  async function handleLessonComplete(lesson, correct) {
    const existing = progress.find((p) => p.lesson_id === lesson.id)
    if (!existing) {
      await supabase.from('learn_progress').insert({
        user_id: user.id,
        course_id: lesson.course_id,
        lesson_id: lesson.id,
        completed: true,
        answer_given: correct ? lesson.correct_answer : -1,
        completed_at: new Date().toISOString(),
      })
    } else if (!existing.completed) {
      await supabase.from('learn_progress').update({
        completed: true, answer_given: correct ? lesson.correct_answer : -1,
        completed_at: new Date().toISOString(),
      }).eq('id', existing.id)
    }
    await loadData()
  }

  async function handleClaimReward(course) {
    if (claimedCourses.has(course.id)) return

    await supabase.from('learn_rewards').insert({
      user_id: user.id, course_id: course.id,
      coin_id: course.coin_id, coin_symbol: course.coin_symbol,
      amount: course.reward_amount,
    })

    const existingHolding = holdings.find((h) => h.coin_id === course.coin_id)
    if (existingHolding) {
      await supabase.from('holdings').update({
        quantity: existingHolding.quantity + course.reward_amount,
      }).eq('id', existingHolding.id)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id, coin_id: course.coin_id,
        coin_symbol: course.coin_symbol, coin_name: course.coin_name,
        coin_image: course.coin_image, quantity: course.reward_amount,
        buy_price_usd: course.reward_usd_value / course.reward_amount,
      })
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'buy', coin_id: course.coin_id,
      coin_symbol: course.coin_symbol, quantity: course.reward_amount,
      price_usd: 0, total_usd: 0, notes: 'learn_reward',
    })

    await Promise.all([refreshAll(), loadData()])
    setSuccessCourse(course)
  }

  // Handle AI lesson completion & reward claim
  async function handleAiLessonComplete(coin, lessonData) {
    if (!user || !coin) return

    const rewardAmount = 10000
    const rewardSymbol = 'SHIB'
    const rewardCoinId = 'shiba-inu'
    const shibPrice = allCoins.find((c) => c.id === 'shiba-inu')?.current_price || 0.00001

    // Save AI lesson to learn_lessons
    await supabase.from('learn_lessons').insert({
      course_id: null,
      lesson_number: 1,
      title: lessonData.title,
      content: lessonData.content,
      quiz_question: lessonData.quiz.question,
      quiz_options: lessonData.quiz.options,
      correct_answer: lessonData.quiz.correctIndex,
      ai_generated: true,
      coin_id: coin.id,
    }).select().single()

    // Save reward
    await supabase.from('learn_rewards').insert({
      user_id: user.id,
      course_id: null,
      coin_id: coin.id,
      coin_symbol: coin.symbol?.toUpperCase(),
      amount: rewardAmount,
    })

    // Add SHIB to holdings
    const existingHolding = holdings.find((h) => h.coin_id === rewardCoinId)
    if (existingHolding) {
      await supabase.from('holdings').update({
        quantity: existingHolding.quantity + rewardAmount,
      }).eq('id', existingHolding.id)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id, coin_id: rewardCoinId,
        coin_symbol: rewardSymbol, coin_name: 'Shiba Inu',
        coin_image: allCoins.find((c) => c.id === rewardCoinId)?.image || '',
        quantity: rewardAmount,
        buy_price_usd: shibPrice,
      })
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'buy', coin_id: rewardCoinId,
      coin_symbol: rewardSymbol, quantity: rewardAmount,
      price_usd: 0, total_usd: 0, notes: 'learn_reward_ai',
    })

    await Promise.all([refreshAll(), loadData(), loadAiCompleted()])

    setAiLessonCoin(null)
    setAiSuccessCoin({
      coin_id: rewardCoinId,
      coin_image: allCoins.find((c) => c.id === rewardCoinId)?.image || '',
      coin_symbol: rewardSymbol,
      reward_symbol: rewardSymbol,
      reward_amount: rewardAmount,
      reward_usd_value: rewardAmount * shibPrice,
    })
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[#1E2025] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 bg-[#1E2025] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeCourse ? (
        <LessonView
          course={activeCourse}
          lessons={lessons[activeCourse.id] || []}
          progress={progress.filter((p) => p.course_id === activeCourse.id)}
          claimedCourses={claimedCourses}
          onBack={() => setActiveCourse(null)}
          onLessonComplete={handleLessonComplete}
          onClaimReward={handleClaimReward}
        />
      ) : (
        <>
          {/* ── Section 1: Header ──────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Learn & Earn</h1>
              <p className="text-text-muted text-sm mt-1">Learn about any cryptocurrency and earn free tokens</p>
            </div>
            <div className="flex items-center gap-3">
              {completedCourseCount > 0 && (
                <div className="bg-[#0052FF]/15 px-4 py-2 rounded-full">
                  <span className="text-[#0052FF] text-sm font-semibold">{completedCourseCount} courses completed</span>
                </div>
              )}
              {totalEarned > 0 && (
                <div className="bg-[#05B169]/15 px-4 py-2 rounded-full">
                  <span className="text-[#05B169] text-sm font-semibold">{formatUSD(totalEarned)} earned</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Featured Courses ────────────────────── */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <h2 className="text-white text-lg font-bold">Featured Courses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  completedCount={getCompletedCount(course.id)}
                  isClaimed={claimedCourses.has(course.id)}
                  onStart={setActiveCourse}
                  onClaim={handleClaimReward}
                />
              ))}
            </div>
          </div>

          {/* ── Section 3: Learn About Any Coin (AI) ───────────── */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white text-lg font-bold">Learn About Any Coin</h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold">
                AI
              </span>
            </div>
            <p className="text-[#8A919E] text-sm mb-5">
              Powered by AI &mdash; lessons generated instantly for any of our 250+ coins
            </p>

            {/* Search */}
            <div className="relative mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B616E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search any cryptocurrency..."
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0A0B0D] border border-[#1E2025] text-white text-sm placeholder-[#5B616E] outline-none focus:border-[#0052FF] transition-colors"
              />
            </div>

            {coinsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-44 bg-[#1E2025] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredCoins.slice(0, 40).map((coin) => {
                  const isLearned = aiCompletedCoins.has(coin.id)
                  return (
                    <div key={coin.id}
                      className="bg-[#141519] border border-[#1E2025] hover:border-[#2C2F36] rounded-xl p-4 transition-colors">
                      <div className="flex items-center gap-2.5 mb-3">
                        <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5"
                          onError={(e) => { e.target.style.display = 'none' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{coin.name}</div>
                          <div className="text-[#8A919E] text-xs uppercase">{coin.symbol}</div>
                        </div>
                      </div>
                      <div className="text-white text-sm font-medium mb-3">
                        {formatUSD(coin.current_price)}
                      </div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#7C3AED]/15 text-[#7C3AED] text-[9px] font-semibold">
                          AI Generated
                        </span>
                      </div>
                      {isLearned ? (
                        <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#05B169]/15 text-[#05B169] text-xs font-semibold">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          Learned
                        </div>
                      ) : (
                        <button
                          onClick={() => setAiLessonCoin(coin)}
                          className="w-full py-2 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-xs font-semibold border-none cursor-pointer transition-colors">
                          Learn & Earn
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* AI Lesson Modal */}
      {aiLessonCoin && (
        <LessonModal
          coin={aiLessonCoin}
          onClose={() => setAiLessonCoin(null)}
          onComplete={(lessonData) => handleAiLessonComplete(aiLessonCoin, lessonData)}
        />
      )}

      {/* Featured course success */}
      {successCourse && (
        <RewardClaimedModal course={successCourse} onClose={() => { setSuccessCourse(null); setActiveCourse(null) }} />
      )}

      {/* AI lesson success */}
      {aiSuccessCoin && (
        <RewardClaimedModal course={aiSuccessCoin} onClose={() => setAiSuccessCoin(null)} />
      )}
    </div>
  )
}

/* ── Dashboard Widget (exported) ──────────────────────────────────────── */

export function LearnWidget() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      supabase.from('learn_courses').select('*').eq('is_active', true).order('created_at'),
      supabase.from('learn_progress').select('*').eq('user_id', user.id),
      supabase.from('learn_rewards').select('*').eq('user_id', user.id),
    ]).then(([{ data: c }, { data: p }, { data: r }]) => {
      setCourses(c || []); setProgress(p || []); setRewards(r || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return null

  const claimedIds = new Set((rewards || []).map((r) => r.course_id))
  const available = courses.filter((c) => !claimedIds.has(c.id)).slice(0, 3)

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-text-primary font-semibold text-sm">{'\uD83D\uDCDA'} Learn & Earn</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] font-semibold">
            250+ coins
          </span>
        </div>
        <Link to="/learn" className="text-primary-blue text-xs font-semibold no-underline hover:underline">Explore all coins</Link>
      </div>
      {available.length === 0 ? (
        <div>
          <p className="text-text-muted text-sm mb-3">All featured courses completed!</p>
          <Link to="/learn"
            className="inline-flex items-center gap-1.5 text-[#0052FF] text-sm font-semibold no-underline hover:underline">
            Explore AI-powered lessons for 250+ coins
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {available.map((course) => {
            const completed = progress.filter((p) => p.course_id === course.id && p.completed).length
            return (
              <Link key={course.id} to="/learn"
                className="flex items-center gap-3 no-underline hover:bg-root-bg/40 rounded-lg p-1.5 -mx-1.5 transition-colors">
                <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{course.title}</div>
                  <div className="text-[#8A919E] text-[10px]">{completed}/{course.total_lessons} lessons</div>
                </div>
                <span className="text-[#05B169] text-xs font-semibold flex-shrink-0">
                  {formatUSD(course.reward_usd_value)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
