import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { formatUSD, formatCrypto } from '../utils/formatters'
import { getCoinImageUrl } from '../utils/coinImages'

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
            <CoinLogo id={course.coin_id} image={course.coin_image} symbol={course.coin_symbol} size={24} />
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

  useEffect(() => { loadData() }, [loadData])

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

  async function handleLessonComplete(lesson, correct) {
    // Save progress regardless of answer
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

    // Insert reward record
    await supabase.from('learn_rewards').insert({
      user_id: user.id, course_id: course.id,
      coin_id: course.coin_id, coin_symbol: course.coin_symbol,
      amount: course.reward_amount,
    })

    // Add to holdings
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

    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: user.id, type: 'buy', coin_id: course.coin_id,
      coin_symbol: course.coin_symbol, quantity: course.reward_amount,
      price_usd: 0, total_usd: 0, notes: 'learn_reward',
    })

    await Promise.all([refreshAll(), loadData()])
    setSuccessCourse(course)
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
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Learn & Earn</h1>
              <p className="text-text-muted text-sm mt-1">Learn about crypto and earn free tokens</p>
            </div>
            {totalEarned > 0 && (
              <div className="bg-[#05B169]/15 px-4 py-2 rounded-full">
                <span className="text-[#05B169] text-sm font-semibold">{formatUSD(totalEarned)} earned</span>
              </div>
            )}
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
        </>
      )}

      {successCourse && (
        <RewardClaimedModal course={successCourse} onClose={() => { setSuccessCourse(null); setActiveCourse(null) }} />
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

  if (available.length === 0 && courses.length > 0) return null

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">{'\uD83D\uDCDA'} Learn & Earn</h3>
        <Link to="/learn" className="text-primary-blue text-xs font-semibold no-underline hover:underline">View all</Link>
      </div>
      {available.length === 0 ? (
        <p className="text-text-muted text-sm">No courses available yet.</p>
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
