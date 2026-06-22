export const TIERS = [
  { id: 1, name: 'Preserve', description: 'Pure stablecoin yield only', apyRange: [4, 8], riskLevel: 0.10 },
  { id: 2, name: 'Steady', description: 'Yield + delta-neutral funding-rate capture', apyRange: [7, 14], riskLevel: 0.25 },
  { id: 3, name: 'Balanced', description: 'Adds spot blue-chip exposure + low-risk prediction markets', apyRange: [12, 25], riskLevel: 0.45 },
  { id: 4, name: 'Growth', description: 'Heavier blue-chip + funding leverage + broader prediction markets', apyRange: [20, 45], riskLevel: 0.65 },
  { id: 5, name: 'Aggressive', description: 'Adds macro prediction bets + complex yield (Pendle-style)', apyRange: [35, 65], riskLevel: 0.85 },
]

export const CATEGORIES = [
  { id: 'stablecoin', name: 'Stablecoin Yield', description: 'Lending/LP on stables', strategyCount: 4, risk: 0.08, apy: 6.2 },
  { id: 'funding', name: 'Funding-Rate / Delta-Neutral', description: '4\u20135 perp funding strategies, market-neutral', strategyCount: 5, risk: 0.22, apy: 10.8 },
  { id: 'bluechip', name: 'Spot Blue-Chip', description: 'Buy-and-hold BTC/ETH/SOL with managed sizing', strategyCount: 3, risk: 0.52, apy: 18.5 },
  { id: 'pred-low', name: 'Prediction \u2014 Low Risk', description: 'Easy-win / arbitrage prediction-market plays', strategyCount: 4, risk: 0.38, apy: 14.2 },
  { id: 'pred-high', name: 'Prediction \u2014 High Risk', description: 'Macro / event bets', strategyCount: 3, risk: 0.78, apy: 42.0 },
  { id: 'complex', name: 'Complex Yield', description: 'Pendle-style structured yield', strategyCount: 2, risk: 0.62, apy: 28.5 },
]

export const ALLOCATIONS = {
  1: { stablecoin: 100, funding: 0, bluechip: 0, 'pred-low': 0, 'pred-high': 0, complex: 0 },
  2: { stablecoin: 55, funding: 45, bluechip: 0, 'pred-low': 0, 'pred-high': 0, complex: 0 },
  3: { stablecoin: 25, funding: 25, bluechip: 20, 'pred-low': 18, 'pred-high': 0, complex: 12 },
  4: { stablecoin: 12, funding: 20, bluechip: 25, 'pred-low': 15, 'pred-high': 18, complex: 10 },
  5: { stablecoin: 5, funding: 12, bluechip: 23, 'pred-low': 10, 'pred-high': 28, complex: 22 },
}

export function getEffectiveAllocation(tierId, excludedCategories) {
  const base = { ...ALLOCATIONS[tierId] }
  let totalExcluded = 0
  for (const catId of excludedCategories) {
    totalExcluded += base[catId] || 0
    base[catId] = 0
  }
  const remaining = Object.keys(base).filter(k => base[k] > 0)
  if (remaining.length === 0) return base
  const currentTotal = remaining.reduce((s, k) => s + base[k], 0)
  if (currentTotal === 0) return base
  for (const k of remaining) {
    base[k] = base[k] / currentTotal * 100
  }
  return base
}

export function computeProjectedAPY(tierId, excludedCategories) {
  const alloc = getEffectiveAllocation(tierId, excludedCategories)
  let weightedApy = 0
  for (const cat of CATEGORIES) {
    const pct = alloc[cat.id] || 0
    weightedApy += (pct / 100) * cat.apy
  }
  return Math.round(weightedApy * 10) / 10
}

export function computeRiskLevel(tierId, excludedCategories) {
  const alloc = getEffectiveAllocation(tierId, excludedCategories)
  let weightedRisk = 0
  for (const cat of CATEGORIES) {
    const pct = alloc[cat.id] || 0
    weightedRisk += (pct / 100) * cat.risk
  }
  return Math.round(weightedRisk * 100) / 100
}

export function computeCategoryBalances(totalDeposit, tierId, excludedCategories) {
  const alloc = getEffectiveAllocation(tierId, excludedCategories)
  const balances = {}
  for (const cat of CATEGORIES) {
    balances[cat.id] = Math.round((alloc[cat.id] / 100) * totalDeposit * 100) / 100
  }
  return balances
}

export function generatePerformanceSeries(days, baseApy, volatility) {
  const series = []
  let cumulative = 0
  const dailyReturn = baseApy / 365 / 100
  const now = Date.now()
  for (let i = days; i >= 0; i--) {
    const noise = (Math.random() - 0.5) * volatility * dailyReturn
    cumulative += dailyReturn + noise
    series.push({
      date: new Date(now - i * 86400000).toISOString().split('T')[0],
      value: Math.round(cumulative * 10000) / 100,
    })
  }
  return series
}

export function generateNetWorthSeries(deposit, days, apy) {
  const series = []
  const dailyReturn = apy / 365 / 100
  const now = Date.now()
  let value = deposit
  for (let i = days; i >= 0; i--) {
    const noise = (Math.random() - 0.45) * dailyReturn * 0.5
    value = value * (1 + dailyReturn + noise)
    series.push({
      date: new Date(now - i * 86400000).toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    })
  }
  return series
}

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateOtherUsers(count) {
  const rng = seededRandom(42)
  const users = []
  for (let i = 0; i < count; i++) {
    const tierBias = rng() * 4 + 1
    const tier = TIERS[Math.min(4, Math.floor(tierBias) - 1)]
    const risk = tier.riskLevel + (rng() - 0.5) * 0.15
    const midApy = (tier.apyRange[0] + tier.apyRange[1]) / 2
    const apy = midApy + (rng() - 0.5) * (tier.apyRange[1] - tier.apyRange[0]) * 0.6
    users.push({
      risk: Math.max(0.02, Math.min(0.95, risk)),
      apy: Math.max(2, Math.round(apy * 10) / 10),
    })
  }
  return users
}

const TX_HASHES = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
  '0x2b3c4d5e6f7890ab1234567890abcdef1234567890abcdef1234567890abcdef',
  '0x3c4d5e6f7890abcd234567890abcdef1234567890abcdef1234567890abcdef0',
  '0x4d5e6f7890abcdef34567890abcdef1234567890abcdef1234567890abcdef01',
  '0x5e6f7890abcdef1245678901abcdef1234567890abcdef1234567890abcdef02',
  '0x6f7890abcdef12345678901abcdef1234567890abcdef1234567890abcdef0123',
  '0x7890abcdef123456789012abcdef1234567890abcdef1234567890abcdef01234',
  '0x890abcdef1234567890123bcdef1234567890abcdef1234567890abcdef012345',
  '0x90abcdef12345678901234cdef1234567890abcdef1234567890abcdef0123456',
  '0xa0bcdef123456789012345def1234567890abcdef1234567890abcdef01234567',
]

const EXPLORER_BASES = [
  'https://etherscan.io/tx/',
  'https://solscan.io/tx/',
  'https://arbiscan.io/tx/',
]

const EVENT_TYPES = [
  { type: 'deposit', desc: 'Deposited {amount} USDC', category: null },
  { type: 'rebalance', desc: 'Rebalanced portfolio \u2014 tier adjustment', category: null },
  { type: 'trade', desc: 'Entered ETH funding position', category: 'funding' },
  { type: 'trade', desc: 'Opened USDC lending position', category: 'stablecoin' },
  { type: 'trade', desc: 'Bought BTC \u2014 Blue-Chip allocation', category: 'bluechip' },
  { type: 'trade', desc: 'Sold SOL \u2014 Blue-Chip rebalance', category: 'bluechip' },
  { type: 'trade', desc: 'Entered Polymarket position \u2014 low-risk arb', category: 'pred-low' },
  { type: 'trade', desc: 'Exited prediction position \u2014 settled', category: 'pred-low' },
  { type: 'trade', desc: 'Opened Pendle PT position', category: 'complex' },
  { type: 'trade', desc: 'Closed funding-rate spread', category: 'funding' },
  { type: 'trade', desc: 'Entered macro prediction bet', category: 'pred-high' },
  { type: 'trade', desc: 'Adjusted delta-neutral hedge', category: 'funding' },
  { type: 'tier_change', desc: 'Risk tier changed to {tier}', category: null },
  { type: 'withdrawal', desc: 'Withdrew {amount} USDC', category: null },
  { type: 'trade', desc: 'Rolled Pendle YT expiry', category: 'complex' },
  { type: 'trade', desc: 'Entered ETH/USDC LP', category: 'stablecoin' },
  { type: 'trade', desc: 'Exited BTC long \u2014 take profit', category: 'bluechip' },
]

export function generateActivityLog(deposit, tierName) {
  const now = Date.now()
  const events = []
  const rng = seededRandom(7)
  for (let i = 0; i < 35; i++) {
    const template = EVENT_TYPES[Math.floor(rng() * EVENT_TYPES.length)]
    const hoursAgo = i * (2 + Math.floor(rng() * 6))
    const amount = Math.round((rng() * deposit * 0.15 + 100) * 100) / 100
    let desc = template.desc
      .replace('{amount}', '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 }))
      .replace('{tier}', tierName)
    const txHash = TX_HASHES[Math.floor(rng() * TX_HASHES.length)]
    const explorer = EXPLORER_BASES[Math.floor(rng() * EXPLORER_BASES.length)]
    const catObj = template.category ? CATEGORIES.find(c => c.id === template.category) : null
    events.push({
      id: i,
      type: template.type,
      description: desc,
      category: catObj ? catObj.name : '\u2014',
      categoryId: template.category,
      amount: amount,
      timestamp: new Date(now - hoursAgo * 3600000).toISOString(),
      txHash: txHash,
      explorerUrl: explorer + txHash,
    })
  }
  return events
}

export function generateAnonymizedStrategies(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  if (!cat) return []
  const rng = seededRandom(categoryId.length * 7)
  const strategies = []
  for (let i = 0; i < cat.strategyCount; i++) {
    const letter = String.fromCharCode(65 + i)
    const perf30d = Math.round((rng() * cat.apy * 0.15 - cat.apy * 0.02) * 10) / 10
    strategies.push({
      name: cat.name.split(' ')[0] + ' Strategy ' + letter,
      performance30d: perf30d,
      status: rng() > 0.15 ? 'active' : 'paused',
    })
  }
  return strategies
}

export function formatUSD(value) {
  if (value == null) return '$0.00'
  return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatPct(value) {
  if (value == null) return '0.0%'
  return (value >= 0 ? '+' : '') + value.toFixed(1) + '%'
}

export const CATEGORY_COLORS = {
  stablecoin: '#059669',
  funding: '#0891b2',
  bluechip: '#ea580c',
  'pred-low': '#7c3aed',
  'pred-high': '#dc2626',
  complex: '#ca8a04',
}
