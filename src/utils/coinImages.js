// Hand-picked CoinGecko CDN URLs for the coins we know about. The
// `assets.coingecko.com` host has been flaky / hotlink-blocking in some
// regions, so we point at `coin-images.coingecko.com` which serves the same
// files reliably. Filenames are NOT just `{coin_id}.png` for every coin
// (BNB, LINK, XRP, AVAX all use bespoke filenames), so we list them literally.
export const coinImageMap = {
  bitcoin:      'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  ethereum:     'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
  solana:       'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
  binancecoin:  'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  chainlink:    'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  tether:       'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  ripple:       'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  dogecoin:     'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png',
  cardano:      'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
  'avalanche-2':'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
}

// Resolve a logo URL in priority order: explicit stored image → hand-picked
// map → best-guess CDN path. Consumers should still attach an onError handler
// to fall through to an initials circle when even this misses.
export function getCoinImageUrl(coinId, storedImage) {
  if (storedImage) return storedImage
  if (coinImageMap[coinId]) return coinImageMap[coinId]
  if (!coinId) return null
  return `https://coin-images.coingecko.com/coins/images/1/large/${coinId}.png`
}
