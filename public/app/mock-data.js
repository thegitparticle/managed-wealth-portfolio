// ---------------------------------------------------------------------------
// Three risk tiers, each an "own an asset class + earn yield on top" strategy.
// Tier 1 Stable   — hold stablecoins, earn the best yield on them.
// Tier 2 Blue-Chip — hold BTC/ETH/majors, stack yield on top (boost + cushion).
// Tier 3 Growth    — same playbook on higher-growth assets: more risk, more upside.
// Prediction Markets are a separate, new & experimental product (see EXPERIMENTAL).
// ---------------------------------------------------------------------------

export const TIERS = [
  {
    id: 1,
    name: 'Stable',
    color: '#059669',
    riskLabel: 'Very Low',
    riskLevel: 0.10,
    apyRange: [4, 12],
    holds: 'Stablecoins (USDC/USDT)',
    // one-liner shown on chips / tier cards
    tagline: 'Earn the best yield on your dollars.',
    // one sentence shown inline at decision points
    blurb: 'Your dollars stay dollars — we route them to the highest safe stablecoin yield in the world.',
    // fuller copy for the Help / FAQ screen
    long: 'Your balance stays in stablecoins the whole time, so its dollar value barely moves. We continuously route it to the best-yielding, market-neutral lending and liquidity strategies — beating a bank account or holding USDC idle. The main risk here is protocol/counterparty, not price.',
  },
  {
    id: 2,
    name: 'Blue-Chip',
    color: '#ea580c',
    riskLabel: 'Medium',
    riskLevel: 0.42,
    apyRange: [8, 25],
    holds: 'BTC · ETH · SOL + yield',
    tagline: 'Hold majors, with yield stacked on top.',
    blurb: 'You own blue-chip crypto for the upside, and we earn yield on top to boost returns and soften the dips.',
    long: 'You hold blue-chip crypto (BTC, ETH, SOL) for long-term upside. On top of that we run a yield overlay — funding capture, staking and yield tokens — which adds income, compounds returns, and cushions drawdowns. Risk is roughly that of holding blue-chips outright, but the assets are working harder. Price still moves with the market.',
  },
  {
    id: 3,
    name: 'Growth',
    color: '#7c3aed',
    riskLabel: 'High',
    riskLevel: 0.70,
    apyRange: [20, 60],
    holds: 'Growth assets + yield',
    tagline: 'The same playbook, higher-growth assets.',
    blurb: 'The hold-plus-yield approach applied to higher-growth crypto: bigger swings, higher potential return.',
    long: 'We apply the same hold-plus-yield approach to higher-growth assets. The yield still stacks on top, but the underlying assets are more volatile, so both the swings and the upside are larger. Best suited to capital you can leave to grow through cycles.',
  },
]

// Internal per-category sub-accounts. Three now, aligned to the asset ladder.
export const CATEGORIES = [
  { id: 'stablecoin', name: 'Stablecoin Yield', description: 'Best-in-class lending & liquidity on stablecoins, kept market-neutral.', strategyCount: 5, risk: 0.08, apy: 8.5 },
  { id: 'bluechip', name: 'Blue-Chip + Yield', description: 'BTC/ETH/SOL held with a yield overlay — funding, staking and yield tokens.', strategyCount: 6, risk: 0.45, apy: 16.0 },
  { id: 'growth', name: 'Growth + Yield', description: 'Higher-growth assets held with the same yield-on-top approach.', strategyCount: 4, risk: 0.72, apy: 35.0 },
]

// Prediction markets: deliberately NOT part of the managed tiers.
// A separate, opt-in, new & experimental product surfaced at the end.
export const EXPERIMENTAL = {
  id: 'prediction',
  name: 'Prediction Markets',
  badge: 'NEW · EXPERIMENTAL',
  description: 'Curated, event-driven prediction-market strategies. Uncorrelated to crypto and early-access — kept separate from your managed tiers.',
  long: 'An early-access sleeve, separate from the three managed tiers. It allocates a small, opt-in amount into curated prediction-market positions (e.g. macro and event outcomes). Returns are uncorrelated to the rest of your portfolio, but the strategy is experimental and can lose the amount allocated. Nothing here touches your Stable, Blue-Chip or Growth balances.',
  strategyCount: 3,
  risk: 0.85,
  apy: 40.0,
}

// A lookup that also includes the experimental sleeve (used by activity / drill-down).
export const ALL_CATEGORIES = [...CATEGORIES, EXPERIMENTAL]

// Tier → default allocation across the three categories (percent).
// Higher tiers hold more of the riskier asset, keeping a safer cushion beneath.
export const ALLOCATIONS = {
  1: { stablecoin: 100, bluechip: 0, growth: 0 },
  2: { stablecoin: 25, bluechip: 75, growth: 0 },
  3: { stablecoin: 10, bluechip: 30, growth: 60 },
}

// excludedCategories is retained in the signatures for compatibility, but the
// product no longer exposes customization — callers pass an empty array.
export function getEffectiveAllocation(tierId, excludedCategories = []) {
  const base = { ...ALLOCATIONS[tierId] }
  for (const catId of excludedCategories) {
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

export function computeProjectedAPY(tierId, excludedCategories = []) {
  const alloc = getEffectiveAllocation(tierId, excludedCategories)
  let weightedApy = 0
  for (const cat of CATEGORIES) {
    const pct = alloc[cat.id] || 0
    weightedApy += (pct / 100) * cat.apy
  }
  return Math.round(weightedApy * 10) / 10
}

export function computeRiskLevel(tierId, excludedCategories = []) {
  const alloc = getEffectiveAllocation(tierId, excludedCategories)
  let weightedRisk = 0
  for (const cat of CATEGORIES) {
    const pct = alloc[cat.id] || 0
    weightedRisk += (pct / 100) * cat.risk
  }
  return Math.round(weightedRisk * 100) / 100
}

export function computeCategoryBalances(totalDeposit, tierId, excludedCategories = []) {
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
    const tierBias = rng() * TIERS.length + 1
    const tier = TIERS[Math.min(TIERS.length - 1, Math.floor(tierBias) - 1)]
    const risk = tier.riskLevel + (rng() - 0.5) * 0.16
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
  { type: 'rebalance', desc: 'Rebalanced portfolio — tier adjustment', category: null },
  { type: 'trade', desc: 'Opened USDC lending position', category: 'stablecoin' },
  { type: 'trade', desc: 'Rotated into best-yield stable vault', category: 'stablecoin' },
  { type: 'trade', desc: 'Entered ETH/USDC LP — market-neutral', category: 'stablecoin' },
  { type: 'trade', desc: 'Bought BTC — Blue-Chip core', category: 'bluechip' },
  { type: 'trade', desc: 'Staked ETH for yield', category: 'bluechip' },
  { type: 'trade', desc: 'Opened ETH funding-yield position', category: 'bluechip' },
  { type: 'trade', desc: 'Sold BTC — take profit', category: 'bluechip' },
  { type: 'trade', desc: 'Bought SOL — Growth sleeve', category: 'growth' },
  { type: 'trade', desc: 'Entered growth-basket position', category: 'growth' },
  { type: 'trade', desc: 'Opened leveraged yield-token position', category: 'growth' },
  { type: 'trade', desc: 'Trimmed growth position — risk control', category: 'growth' },
  { type: 'tier_change', desc: 'Risk tier changed to {tier}', category: null },
  { type: 'withdrawal', desc: 'Withdrew {amount} USDC', category: null },
  { type: 'trade', desc: 'Entered prediction market — macro event', category: 'prediction' },
  { type: 'trade', desc: 'Exited prediction position — settled', category: 'prediction' },
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
    const catObj = template.category ? ALL_CATEGORIES.find(c => c.id === template.category) : null
    events.push({
      id: i,
      type: template.type,
      description: desc,
      category: catObj ? catObj.name : '—',
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
  const cat = ALL_CATEGORIES.find(c => c.id === categoryId)
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
  bluechip: '#ea580c',
  growth: '#7c3aed',
  prediction: '#dc2626',
}

// Help / FAQ content — the "longer explanations" that back the inline one-liners.
export const FAQ = [
  {
    q: 'How is this better than just holding stablecoins?',
    a: 'On the Stable tier your money stays in stablecoins, so its dollar value barely moves — but instead of sitting idle it earns the best market-neutral yield we can find. You get bank-beating returns without taking on price risk.',
  },
  {
    q: 'What does "yield on top of blue-chips" actually mean?',
    a: 'On the Blue-Chip tier you own BTC, ETH and other majors for their upside. On top of those holdings we run yield strategies — funding capture, staking and yield tokens — that add income and cushion drawdowns. You keep the asset exposure and earn extra while you hold.',
  },
  {
    q: 'Does the yield reduce my downside?',
    a: 'It softens it. The yield you earn offsets some of the price drop, so a down month hurts less than holding the asset raw. It does not remove market risk — if blue-chips or growth assets fall hard, your balance still falls.',
  },
  {
    q: 'How is Growth different from Blue-Chip?',
    a: 'Same hold-plus-yield playbook, riskier underlying assets. Growth holds higher-volatility crypto, so both the swings and the potential returns are bigger. Use it for money you can leave to grow through cycles.',
  },
  {
    q: 'Can I switch tiers later?',
    a: 'Any time. Pick a new tier and confirm — we rebalance your portfolio into the new allocation. There is no lock-up.',
  },
  {
    q: 'What are Prediction Markets?',
    a: 'A separate, new and experimental sleeve — not part of the three managed tiers. It puts a small opt-in amount into curated event-driven positions that are uncorrelated to crypto. It is early-access and can lose the amount allocated; it never touches your tier balances.',
  },
  {
    q: 'Do I pick individual strategies?',
    a: 'No. You choose a tier; the system handles all strategy-level routing and rebalancing automatically. You can always see where your money sits in the Allocation view.',
  },
]
