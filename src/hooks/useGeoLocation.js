import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COUNTRY_CURRENCY_MAP = {
  US: 'USD',
  GB: 'GBP',
  // EU countries
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR',
  CY: 'EUR', HR: 'EUR',
  // Other supported currencies
  AE: 'AED',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  CH: 'CHF',
  JP: 'JPY',
}

export function detectCurrencyFromCountry(countryCode) {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD'
}

export function useGeoLocation(userId) {
  const [detected, setDetected] = useState({
    country: localStorage.getItem('detected-country') || null,
    currency: localStorage.getItem('detected-currency') || null,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only run if no preference saved yet
    if (detected.country && detected.currency) return

    let cancelled = false
    setLoading(true)

    async function detect() {
      try {
        const res = await fetch('https://ip-api.com/json')
        const data = await res.json()
        if (cancelled || data.status !== 'success') return

        const country = data.country || 'United States'
        const countryCode = data.countryCode || 'US'
        const currency = detectCurrencyFromCountry(countryCode)

        localStorage.setItem('detected-country', country)
        localStorage.setItem('detected-currency', currency)
        setDetected({ country, currency })

        // Save to Supabase profile on first detection
        if (userId) {
          await supabase
            .from('profiles')
            .update({ country, currency })
            .eq('id', userId)
        }
      } catch (err) {
        console.error('Geo detection failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    detect()
    return () => { cancelled = true }
  }, [userId, detected.country, detected.currency])

  return { ...detected, loading }
}

export async function detectAndSaveLocation(userId) {
  try {
    const res = await fetch('https://ip-api.com/json')
    const data = await res.json()
    if (data.status !== 'success') return null

    const country = data.country || 'United States'
    const countryCode = data.countryCode || 'US'
    const currency = detectCurrencyFromCountry(countryCode)

    localStorage.setItem('detected-country', country)
    localStorage.setItem('detected-currency', currency)

    if (userId) {
      await supabase
        .from('profiles')
        .update({ country, currency })
        .eq('id', userId)
    }

    return { country, countryCode, currency }
  } catch (err) {
    console.error('Geo detection failed:', err)
    return null
  }
}
