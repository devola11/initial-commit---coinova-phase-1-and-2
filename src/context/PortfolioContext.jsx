import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PortfolioContext = createContext(null)

export function PortfolioProvider({ children }) {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWallet = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('wallet')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setWallet(data)
  }, [user])

  const fetchHoldings = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setHoldings(data || [])
  }, [user])

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(data || [])
  }, [user])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchWallet(), fetchHoldings(), fetchTransactions()])
    setLoading(false)
  }, [fetchWallet, fetchHoldings, fetchTransactions])

  useEffect(() => {
    if (user) {
      refreshAll()
    } else {
      setWallet(null)
      setHoldings([])
      setTransactions([])
      setLoading(false)
    }
  }, [user, refreshAll])

  return (
    <PortfolioContext.Provider
      value={{
        wallet,
        holdings,
        transactions,
        loading,
        refreshAll,
        fetchWallet,
        fetchHoldings,
        fetchTransactions,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider')
  return context
}
