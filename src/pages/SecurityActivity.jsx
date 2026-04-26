import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SecurityActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    setActivities(data || [])
    setLoading(false)
  }

  const getIcon = (action) => {
    if (!action) return 'A'
    if (action.includes('login')) return 'L'
    if (action.includes('logout')) return 'O'
    if (action.includes('password')) return 'P'
    if (action.includes('purchase') || action.includes('bought')) return 'B'
    if (action.includes('sold')) return 'S'
    if (action.includes('kyc')) return 'K'
    if (action.includes('two_factor')) return '2'
    return 'A'
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: 8 }}>Account Activity</h1>
      <p style={{ color: '#8A919E', marginBottom: 24 }}>
        Recent activity on your Coinova account
      </p>

      {loading && <div style={{ color: '#8A919E' }}>Loading...</div>}

      {!loading && activities.length === 0 && (
        <div
          style={{ color: '#8A919E', textAlign: 'center', padding: 40 }}
        >
          No activity yet
        </div>
      )}

      {activities.map((activity) => (
        <div
          key={activity.id}
          style={{
            background: '#141519',
            border: '1px solid #1E2025',
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#0052FF20',
              color: '#0052FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getIcon(activity.action)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              {activity.description}
            </div>
            <div style={{ color: '#8A919E', fontSize: 12 }}>
              {new Date(activity.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
