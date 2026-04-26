import { supabase } from '../lib/supabase'

export async function logActivity({
  userId,
  action,
  description,
  metadata = {},
}) {
  if (!userId) return
  try {
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'

    await supabase.from('activity_log').insert({
      user_id: userId,
      action,
      description,
      user_agent: userAgent,
      metadata,
    })
  } catch (e) {
    console.error('Activity log error:', e)
  }
}
