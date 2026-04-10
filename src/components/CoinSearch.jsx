import { useEffect, useRef, useState } from 'react'
import { searchCoins } from '../lib/coingecko'

export default function CoinSearch({ onSelect, placeholder = 'Search coins...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchCoins(query)
        setResults(data)
        setOpen(true)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [query])

  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handlePick(coin) {
    onSelect?.({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.large || coin.thumb,
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-subtle focus:outline-none focus:border-primary-blue transition-colors"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-card-bg border border-card-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-text-muted text-sm">Searching...</div>
          )}
          {results.map((coin) => (
            <button
              key={coin.id}
              onClick={() => handlePick(coin)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-root-bg text-left bg-transparent border-none cursor-pointer border-b border-card-border last:border-b-0"
            >
              <img
                src={coin.large || coin.thumb}
                alt={coin.symbol}
                className="w-7 h-7 rounded-full"
              />
              <div className="min-w-0">
                <div className="text-text-primary text-sm font-semibold truncate">
                  {coin.name}
                </div>
                <div className="text-text-muted text-xs uppercase">
                  {coin.symbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
