import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    if (!user) {
      setWallet(null)
      return
    }

    let cancelled = false

    async function fetchWallet() {
      const { data } = await supabase
        .from('wallet')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setWallet({
          balance: Number(data.balance_usd) || 0,
          walletBalance: Number(data.wallet_balance) || 0,
        })
      }
    }

    fetchWallet()

    const channel = supabase
      .channel(`wallet-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet',
          filter: `user_id=eq.${user.id}`,
        },
        fetchWallet
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  return wallet || { balance: 0, walletBalance: 0 }
}
