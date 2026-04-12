import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ADMIN_EMAIL } from './Admin'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setCurrency(data.currency || 'USD')
      }
    }
    load()
  }, [user])

  async function handleSave() {
    setSavedMsg('')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, currency })
        .eq('id', user.id)
      if (error) throw error
      setSavedMsg('Saved')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (err) {
      setSavedMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">
        Settings
      </h1>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
        <div className="text-text-primary font-semibold mb-4">Profile</div>
        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-blue mb-4"
        />
        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-medium">
          Preferred currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full bg-root-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-blue mb-4"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="BTC">BTC (₿)</option>
          <option value="ETH">ETH (Ξ)</option>
        </select>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold disabled:opacity-50 border-none cursor-pointer transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {savedMsg && (
            <span className="text-profit text-xs font-medium">{savedMsg}</span>
          )}
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
        <div className="text-text-primary font-semibold mb-4">Account info</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-muted text-xs uppercase tracking-widest mb-1">
              Email
            </div>
            <div className="text-text-primary">{user?.email || '—'}</div>
          </div>
          <div>
            <div className="text-text-muted text-xs uppercase tracking-widest mb-1">
              Member since
            </div>
            <div className="text-text-primary">{memberSince}</div>
          </div>
        </div>
      </div>

      {user?.email?.toLowerCase() === ADMIN_EMAIL && (
        <div className="bg-card-bg border border-primary-blue/30 rounded-xl p-6 mb-6">
          <div className="text-primary-blue font-semibold mb-2">Admin</div>
          <div className="text-text-muted text-sm mb-4">
            You have administrator access.
          </div>
          <Link
            to="/admin"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-semibold no-underline transition-colors"
          >
            Open admin dashboard
          </Link>
        </div>
      )}

      <div className="bg-card-bg border border-loss/30 rounded-xl p-6">
        <div className="text-loss font-semibold mb-2">Danger zone</div>
        <div className="text-text-muted text-sm mb-4">
          Account: <span className="text-text-primary">{user?.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="px-5 py-2.5 rounded-lg bg-loss hover:opacity-90 text-white text-sm font-semibold border-none cursor-pointer transition-opacity"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
