import { useState, useEffect } from 'react'

const translations = {
  English: {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio',
    markets: 'Markets',
    invest: 'Invest',
    trending: 'Trending',
    convert: 'Convert',
    analytics: 'Analytics',
    learn: 'Learn',
    staking: 'Staking',
    airdrops: 'Airdrops',
    watchlist: 'Watchlist',
    alerts: 'Alerts',
    settings: 'Settings',
    logout: 'Log out',
    walletBalance: 'Wallet Balance',
    totalPortfolio: 'Total Portfolio Value',
    buyNow: 'Buy',
    sellNow: 'Sell',
    investNow: 'Invest',
    more: 'More',
  },
  'Fran\u00E7ais': {
    dashboard: 'Tableau de bord',
    portfolio: 'Portefeuille',
    markets: 'March\u00E9s',
    invest: 'Investir',
    trending: 'Tendances',
    convert: 'Convertir',
    analytics: 'Analytique',
    learn: 'Apprendre',
    staking: 'Staking',
    airdrops: 'Airdrops',
    watchlist: 'Liste de suivi',
    alerts: 'Alertes',
    settings: 'Param\u00E8tres',
    logout: 'D\u00E9connexion',
    walletBalance: 'Solde du portefeuille',
    totalPortfolio: 'Valeur totale du portefeuille',
    buyNow: 'Acheter',
    sellNow: 'Vendre',
    investNow: 'Investir',
    more: 'Plus',
  },
  Deutsch: {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio',
    markets: 'M\u00E4rkte',
    invest: 'Investieren',
    trending: 'Trends',
    convert: 'Konvertieren',
    analytics: 'Analytik',
    learn: 'Lernen',
    staking: 'Staking',
    airdrops: 'Airdrops',
    watchlist: 'Beobachtungsliste',
    alerts: 'Benachrichtigungen',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    walletBalance: 'Kontostand',
    totalPortfolio: 'Gesamtportfoliowert',
    buyNow: 'Kaufen',
    sellNow: 'Verkaufen',
    investNow: 'Investieren',
    more: 'Mehr',
  },
  'Espa\u00F1ol': {
    dashboard: 'Panel',
    portfolio: 'Portafolio',
    markets: 'Mercados',
    invest: 'Invertir',
    trending: 'Tendencias',
    convert: 'Convertir',
    analytics: 'Anal\u00EDtica',
    learn: 'Aprender',
    staking: 'Staking',
    airdrops: 'Airdrops',
    watchlist: 'Lista de seguimiento',
    alerts: 'Alertas',
    settings: 'Configuraci\u00F3n',
    logout: 'Cerrar sesi\u00F3n',
    walletBalance: 'Saldo de billetera',
    totalPortfolio: 'Valor total del portafolio',
    buyNow: 'Comprar',
    sellNow: 'Vender',
    investNow: 'Invertir',
    more: 'M\u00E1s',
  },
  'Portugu\u00EAs': {
    dashboard: 'Painel',
    portfolio: 'Portf\u00F3lio',
    markets: 'Mercados',
    invest: 'Investir',
    trending: 'Tend\u00EAncias',
    convert: 'Converter',
    analytics: 'Anal\u00EDticos',
    learn: 'Aprender',
    staking: 'Staking',
    airdrops: 'Airdrops',
    watchlist: 'Lista de observa\u00E7\u00E3o',
    alerts: 'Alertas',
    settings: 'Configura\u00E7\u00F5es',
    logout: 'Sair',
    walletBalance: 'Saldo da carteira',
    totalPortfolio: 'Valor total do portf\u00F3lio',
    buyNow: 'Comprar',
    sellNow: 'Vender',
    investNow: 'Investir',
    more: 'Mais',
  },
  '\u0627\u0644\u0639\u0631\u0628\u064A\u0629': {
    dashboard: '\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645',
    portfolio: '\u0627\u0644\u0645\u062D\u0641\u0638\u0629',
    markets: '\u0627\u0644\u0623\u0633\u0648\u0627\u0642',
    invest: '\u0627\u0633\u062A\u062B\u0645\u0631',
    trending: '\u0627\u0644\u0631\u0627\u0626\u062C',
    convert: '\u062A\u062D\u0648\u064A\u0644',
    analytics: '\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A',
    learn: '\u062A\u0639\u0644\u0645',
    staking: '\u0627\u0644\u062A\u062D\u0635\u064A\u0635',
    airdrops: '\u0627\u0644\u0625\u0633\u0642\u0627\u0637\u0627\u062A',
    watchlist: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629',
    alerts: '\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A',
    settings: '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A',
    logout: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C',
    walletBalance: '\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062D\u0641\u0638\u0629',
    totalPortfolio: '\u0625\u062C\u0645\u0627\u0644\u064A \u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u062D\u0641\u0638\u0629',
    buyNow: '\u0634\u0631\u0627\u0621',
    sellNow: '\u0628\u064A\u0639',
    investNow: '\u0627\u0633\u062A\u062B\u0645\u0631',
    more: '\u0627\u0644\u0645\u0632\u064A\u062F',
  },
}

// Map the Arabic LANGUAGES entry name to our key
const LANGUAGE_ALIASES = {
  'Arabic': '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
}

export function useLanguage() {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('coinova_language') || 'English'
  )

  useEffect(() => {
    const handleChange = () => {
      setLanguage(localStorage.getItem('coinova_language') || 'English')
    }
    window.addEventListener('storage', handleChange)
    window.addEventListener('languageChange', handleChange)
    return () => {
      window.removeEventListener('storage', handleChange)
      window.removeEventListener('languageChange', handleChange)
    }
  }, [])

  const resolved = LANGUAGE_ALIASES[language] || language
  const t = translations[resolved] || translations.English

  return { language, t }
}
