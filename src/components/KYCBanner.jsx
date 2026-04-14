import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useKycStatus() {
  const { user } = useAuth()
  const [kycStatus, setKycStatus] = useState('unverified')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single()
      if (data?.kyc_status) setKycStatus(data.kyc_status)

      if (data?.kyc_status === 'rejected') {
        const { data: sub } = await supabase
          .from('kyc_submissions')
          .select('rejection_reason')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (sub?.rejection_reason) setRejectionReason(sub.rejection_reason)
      }
      setLoading(false)
    }
    load()
  }, [user])

  return { kycStatus, rejectionReason, loading }
}

export default function KYCBanner() {
  const { kycStatus, rejectionReason, loading } = useKycStatus()
  const [dismissed, setDismissed] = useState(false)

  // Hide approved banner after 3 days
  useEffect(() => {
    if (kycStatus === 'approved') {
      const approvedDismissed = localStorage.getItem('coinova_kyc_approved_dismissed')
      if (approvedDismissed) {
        const ts = parseInt(approvedDismissed, 10)
        if (Date.now() - ts < 3 * 24 * 60 * 60 * 1000) {
          setDismissed(true)
        }
      }
    }
  }, [kycStatus])

  if (loading || dismissed) return null

  if (kycStatus === 'unverified' || !kycStatus) {
    return (
      <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3" style={{ background: '#F59E0B20', border: '1px solid #F59E0B' }}>
        <div className="min-w-0">
          <div className="text-[#F59E0B] font-semibold text-sm">Complete KYC to unlock investing</div>
          <div className="text-[#8A8F98] text-xs mt-0.5">Verify your identity to invest real crypto</div>
        </div>
        <Link
          to="/kyc"
          className="px-4 py-2 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white text-xs font-semibold no-underline transition-colors whitespace-nowrap flex-shrink-0"
        >
          Verify Now
        </Link>
      </div>
    )
  }

  if (kycStatus === 'pending') {
    return (
      <div className="rounded-xl p-4 mb-6" style={{ background: '#0052FF20', border: '1px solid #0052FF' }}>
        <div className="text-[#0052FF] font-semibold text-sm">KYC Under Review</div>
        <div className="text-[#8A8F98] text-xs mt-0.5">Your documents are being reviewed (24-48 hrs)</div>
      </div>
    )
  }

  if (kycStatus === 'approved') {
    return (
      <div className="rounded-xl p-4 mb-6 flex items-center justify-between" style={{ background: '#05B16920', border: '1px solid #05B169' }}>
        <div>
          <div className="text-[#05B169] font-semibold text-sm">KYC Approved!</div>
          <div className="text-[#8A8F98] text-xs mt-0.5">You can now invest real crypto</div>
        </div>
        <button
          onClick={() => {
            setDismissed(true)
            localStorage.setItem('coinova_kyc_approved_dismissed', Date.now().toString())
          }}
          className="text-[#05B169]/60 hover:text-[#05B169] bg-transparent border-none cursor-pointer text-lg leading-none"
        >
          &times;
        </button>
      </div>
    )
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3" style={{ background: '#F6465D20', border: '1px solid #F6465D' }}>
        <div className="min-w-0">
          <div className="text-[#F6465D] font-semibold text-sm">KYC Rejected{rejectionReason ? `: ${rejectionReason}` : ''}</div>
          <div className="text-[#8A8F98] text-xs mt-0.5">Please resubmit your verification</div>
        </div>
        <Link
          to="/kyc"
          className="px-4 py-2 rounded-lg bg-[#F6465D] hover:opacity-90 text-white text-xs font-semibold no-underline transition-opacity whitespace-nowrap flex-shrink-0"
        >
          Resubmit
        </Link>
      </div>
    )
  }

  return null
}
