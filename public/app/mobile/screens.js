import { html, useState, useMemo } from '../lib.js'
import { RiskRewardMap, DonutChart, LineChart } from '../components.js'
import { Segmented, Switch, Card, Button, MLoader, Sheet, NavBar, Icon } from './ui.js'
import {
  TIERS, CATEGORIES, CATEGORY_COLORS, formatUSD, formatPct,
  computeProjectedAPY, computeRiskLevel, computeCategoryBalances,
  generateNetWorthSeries, generatePerformanceSeries, generateAnonymizedStrategies,
  getEffectiveAllocation, generateActivityLog,
} from '../mock-data.js'

/* ===================== Dashboard ===================== */
export function MDashboard({ state, navigate, onTierSwitch }) {
  const { deposit, tierId, excludedCategories } = state
  const [timeRange, setTimeRange] = useState('30d')
  const [previewTier, setPreviewTier] = useState(null)
  const [switching, setSwitching] = useState(false)
  const [layers, setLayers] = useState({ tiers: true, user: true, others: true, categories: true })

  const tier = TIERS.find(t => t.id === tierId)
  const projectedApy = computeProjectedAPY(tierId, excludedCategories)
  const balances = computeCategoryBalances(deposit, tierId, excludedCategories)
  const alloc = getEffectiveAllocation(tierId, excludedCategories)

  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const series = useMemo(() => generateNetWorthSeries(deposit * 0.98, days, projectedApy), [deposit, days, projectedApy])
  const currentValue = series[series.length - 1]?.value || deposit
  const startValue = series[0]?.value || deposit
  const pnlAbs = currentValue - startValue
  const pnlPct = startValue > 0 ? (pnlAbs / startValue) * 100 : 0
  const realizedRate = Math.round(projectedApy * 0.85 * 10) / 10

  const donutData = useMemo(() =>
    CATEGORIES.filter(c => balances[c.id] > 0).map(c => ({ label: c.name, value: balances[c.id], color: CATEGORY_COLORS[c.id] })),
    [balances])

  if (switching) {
    return html`<${MLoader} message="Rebalancing…" onDone=${() => { onTierSwitch(previewTier); setPreviewTier(null); setSwitching(false) }} />`
  }

  const previewObj = previewTier ? TIERS.find(t => t.id === previewTier) : null
  const previewApy = previewTier ? computeProjectedAPY(previewTier, excludedCategories) : null

  const layerDefs = [['user', 'You'], ['tiers', 'Tiers'], ['others', 'Others'], ['categories', 'Cats']]

  return html`
    <div className="m-screen">
      <${NavBar} title="Portfolio" right=${html`<button className="m-icon-btn" onClick=${() => navigate('risk-settings')}><${Icon.gear} size=${22} /></button>`} />

      <${Card} className="m-hero">
        <div className="m-hero-label">TOTAL NET WORTH</div>
        <div className="m-hero-value">${formatUSD(currentValue)}</div>
        <div className=${`m-hero-pnl ${pnlAbs >= 0 ? 'm-up' : 'm-down'}`}>
          ${pnlAbs >= 0 ? '▲' : '▼'} ${formatUSD(Math.abs(pnlAbs))} (${formatPct(pnlPct)})
        </div>
        <div style=${{ margin: '14px -6px 0' }}>
          <${LineChart} data=${series} width=${340} height=${110} />
        </div>
        <div style=${{ marginTop: 10 }}>
          <${Segmented} options=${['24h', '7d', '30d', 'All']} value=${timeRange} onChange=${setTimeRange} />
        </div>
      </${Card}>

      <div className="m-stat-duo">
        <${Card} className="m-stat">
          <div className="m-stat-label">BLENDED YIELD</div>
          <div className="m-stat-value">${realizedRate.toFixed(1)}%</div>
          <div className="m-stat-sub">est. fwd ${projectedApy.toFixed(1)}%</div>
        </${Card}>
        <${Card} className="m-stat">
          <div className="m-stat-label">RISK TIER</div>
          <div className="m-stat-value m-stat-value-sm">${tier.name}</div>
          <button className="m-stat-link" onClick=${() => navigate('risk-settings')}>Adjust →</button>
        </${Card}>
      </div>

      <div className="m-section-head"><span>Risk / Reward Map</span><span className="m-est">EST</span></div>
      <${Card} className="m-map-card">
        <div className="m-layer-row">
          ${layerDefs.map(([k, lbl]) => html`
            <button key=${k}
              className=${`m-layer-chip m-layer-${k} ${layers[k] ? 'm-layer-on' : ''}`}
              onClick=${() => k !== 'user' && setLayers(p => ({ ...p, [k]: !p[k] }))}
            ><span className="m-layer-dot"></span>${lbl}</button>
          `)}
        </div>
        <${RiskRewardMap}
          tierId=${tierId} excludedCategories=${excludedCategories}
          onTierClick=${(t) => t !== tierId && setPreviewTier(t)} mode="select" layers=${layers}
        />
        <p className="m-map-hint">Tap a tier dot to preview switching.</p>
      </${Card}>

      <div className="m-section-head"><span>Net Worth Split</span></div>
      <${Card}>
        <div className="m-split">
          <${DonutChart} data=${donutData} size=${108} innerLabel=${tier.name} />
          <div className="m-split-list">
            ${CATEGORIES.filter(c => balances[c.id] > 0).map(c => html`
              <div key=${c.id} className="m-split-row">
                <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[c.id] }}></span>
                <span className="m-split-name">${c.name}</span>
                <span className="m-split-pct">${(alloc[c.id] || 0).toFixed(0)}%</span>
              </div>
            `)}
          </div>
        </div>
      </${Card}>

      <div className="m-section-head"><span>Active Categories</span></div>
      <div className="m-cat-list">
        ${CATEGORIES.map(cat => {
          const isExcluded = excludedCategories.includes(cat.id)
          return html`
            <${Card} key=${cat.id} className=${`m-cat-card ${isExcluded ? 'm-off' : ''}`} onClick=${() => !isExcluded && navigate('allocation')}>
              <div className="m-cat-card-top">
                <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
                <span className="m-cat-card-name">${cat.name}</span>
                ${isExcluded ? html`<span className="m-off-badge">OFF</span>` : html`<${Icon.chevronRight} size=${18} className="m-muted" />`}
              </div>
              ${!isExcluded && html`
                <div className="m-cat-card-stats">
                  <span><b>${formatUSD(balances[cat.id] || 0)}</b> · ${(alloc[cat.id] || 0).toFixed(0)}%</span>
                  <span className="m-muted">${cat.strategyCount} strats · ${cat.apy.toFixed(1)}%</span>
                </div>
              `}
            </${Card}>
          `
        })}
      </div>

      <div className="m-quick-actions">
        <button className="m-qa" onClick=${() => navigate('funds')}><span className="m-qa-icon m-qa-green"><${Icon.plus} size=${20} /></span>Add</button>
        <button className="m-qa" onClick=${() => navigate('funds')}><span className="m-qa-icon"><${Icon.arrowDown} size=${20} /></span>Withdraw</button>
        <button className="m-qa" onClick=${() => navigate('risk-settings')}><span className="m-qa-icon m-qa-orange"><${Icon.gear} size=${20} /></span>Risk</button>
        <button className="m-qa" onClick=${() => navigate('activity')}><span className="m-qa-icon"><${Icon.pulse} size=${20} /></span>Activity</button>
      </div>

      <${Sheet} open=${!!previewTier} onClose=${() => setPreviewTier(null)} title="Switch Tier">
        ${previewObj && html`
          <div className="m-tier-compare">
            <div className="m-tier-compare-col">
              <span className="m-muted">CURRENT</span>
              <span className="m-tier-compare-name">${tier.name}</span>
              <span className="m-mono">${projectedApy.toFixed(1)}% APY</span>
            </div>
            <${Icon.chevronRight} size=${22} className="m-accent-text" />
            <div className="m-tier-compare-col">
              <span className="m-muted">NEW</span>
              <span className="m-tier-compare-name m-accent-text">${previewObj.name}</span>
              <span className="m-mono">${previewApy.toFixed(1)}% APY</span>
            </div>
          </div>
          <div className="m-tier-delta">
            Return ${formatPct(previewApy - projectedApy)} · Risk ${formatPct((computeRiskLevel(previewTier, excludedCategories) - computeRiskLevel(tierId, excludedCategories)) * 100)}
          </div>
          <${Button} kind="primary" onClick=${() => setSwitching(true)}>Switch to ${previewObj.name}</${Button}>
          <button className="m-text-link" onClick=${() => setPreviewTier(null)}>Cancel</button>
        `}
      </${Sheet}>
    </div>
  `
}

/* ===================== Allocation (drill-down) ===================== */
export function MAllocation({ state }) {
  const { deposit, tierId, excludedCategories, tierName } = state
  const [expanded, setExpanded] = useState(null)
  const balances = computeCategoryBalances(deposit, tierId, excludedCategories)
  const total = Object.values(balances).reduce((s, v) => s + v, 0)

  return html`
    <div className="m-screen">
      <${NavBar} title="Allocation" />
      <${Card} className="m-info-card">
        <div className="m-stat-label">HOW ALLOCATION WORKS</div>
        <p className="m-info-text">Your capital is split across per-category sub-accounts based on your tier and toggles. You control the dials; the AI handles strategy routing. Current tier: <strong>${tierName}</strong>.</p>
      </${Card}>

      <div className="m-cat-list">
        ${CATEGORIES.map(cat => {
          const balance = balances[cat.id] || 0
          const pct = total > 0 ? (balance / total * 100) : 0
          const isExcluded = excludedCategories.includes(cat.id)
          const isOpen = expanded === cat.id
          const strategies = isOpen ? generateAnonymizedStrategies(cat.id) : []
          const perf = isOpen ? generatePerformanceSeries(30, cat.apy, 0.3) : []
          return html`
            <${Card} key=${cat.id} className=${`m-drill ${isExcluded ? 'm-off' : ''}`}>
              <div className="m-drill-head" onClick=${() => !isExcluded && setExpanded(isOpen ? null : cat.id)}>
                <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
                <div className="m-drill-head-text">
                  <div className="m-cat-card-name">${cat.name}</div>
                  <div className="m-muted m-tiny">${cat.description}</div>
                </div>
                ${isExcluded
                  ? html`<span className="m-off-badge">OFF</span>`
                  : html`<div className="m-drill-head-right"><b>${formatUSD(balance)}</b><span className="m-muted m-tiny">${pct.toFixed(1)}%</span></div>`}
              </div>
              ${isOpen && !isExcluded && html`
                <div className="m-drill-body">
                  <div className="m-drill-stats">
                    <div><span className="m-tiny m-muted">STRATEGIES</span><span className="m-mono">${cat.strategyCount} active</span></div>
                    <div><span className="m-tiny m-muted">BLENDED APY</span><span className="m-mono">${cat.apy.toFixed(1)}%</span></div>
                  </div>
                  <div style=${{ margin: '4px -4px' }}><${LineChart} data=${perf} width=${300} height=${56} color=${CATEGORY_COLORS[cat.id]} /></div>
                  <div className="m-strat-list">
                    ${strategies.map((s, i) => html`
                      <div key=${i} className="m-strat-row">
                        <span className="m-strat-name">${s.name}</span>
                        <span className=${s.performance30d >= 0 ? 'm-up' : 'm-down'}>${formatPct(s.performance30d)}</span>
                        <span className=${`m-strat-status m-strat-${s.status}`}>${s.status}</span>
                      </div>
                    `)}
                  </div>
                </div>
              `}
            </${Card}>
          `
        })}
      </div>
    </div>
  `
}

/* ===================== Manage Funds ===================== */
export function MFunds({ state, onDeposit, onWithdraw, onWithdrawAll }) {
  const [tab, setTab] = useState('add')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [confirmAll, setConfirmAll] = useState(false)
  const numAmount = parseFloat(amount) || 0
  const quickFills = [1000, 5000, 25000]

  const done = () => {
    setLoading(false)
    if (tab === 'add') onDeposit(numAmount)
    else if (tab === 'withdraw') onWithdraw(numAmount)
    else onWithdrawAll()
    setAmount('')
  }

  if (loading) return html`<${MLoader} message=${loadingMsg} onDone=${done} />`

  return html`
    <div className="m-screen">
      <${NavBar} title="Funds" />
      <div className="m-balance-banner">Available balance <strong>${formatUSD(state.deposit)}</strong></div>
      <${Segmented}
        options=${[{ value: 'add', label: 'Add' }, { value: 'withdraw', label: 'Withdraw' }, { value: 'withdraw-all', label: 'All' }]}
        value=${tab} onChange=${(t) => { setTab(t); setAmount(''); setConfirmAll(false) }}
      />

      ${tab !== 'withdraw-all' && html`
        <label className="m-field-label" style=${{ marginTop: 22 }}>AMOUNT${tab === 'add' ? ` (${state.stablecoin})` : ''}</label>
        <div className="m-amount-field">
          <span className="m-amount-prefix">$</span>
          <input type="number" inputMode="decimal" className="m-amount-input" placeholder="0" value=${amount} onInput=${(e) => setAmount(e.target.value)} />
        </div>
        <div className="m-chips">
          ${quickFills.filter(v => tab === 'add' || v <= state.deposit).map(v => html`<button key=${v} className="m-chip" onClick=${() => setAmount(String(v))}>$${(v / 1000).toFixed(0)}k</button>`)}
        </div>
      `}

      ${tab === 'add' && numAmount > 0 && html`
        <${Card} className="m-preview">New balance: <strong>${formatUSD(state.deposit + numAmount)}</strong><br/><span className="m-muted m-tiny">Allocation rebalances into your tier.</span></${Card}>
      `}
      ${tab === 'withdraw' && numAmount > 0 && numAmount <= state.deposit && html`
        <${Card} className="m-preview">New balance: <strong>${formatUSD(state.deposit - numAmount)}</strong><br/><span className="m-muted m-tiny">Remaining allocation rebalances.</span></${Card}>
      `}
      ${tab === 'withdraw' && numAmount > state.deposit && html`<div className="m-warn">Amount exceeds available balance.</div>`}

      ${tab === 'withdraw-all' && html`
        <${Card} className="m-withdraw-all">
          <p className="m-muted">Withdraw your entire balance and close all positions.</p>
          <div className="m-hero-value" style=${{ margin: '12px 0' }}>${formatUSD(state.deposit)}</div>
        </${Card}>
      `}

      <div className="m-flow-foot">
        ${tab === 'add' && html`<${Button} kind="green" disabled=${numAmount <= 0} onClick=${() => { setLoadingMsg('Depositing & rebalancing…'); setLoading(true) }}>Add Funds</${Button}>`}
        ${tab === 'withdraw' && html`<${Button} kind="primary" disabled=${numAmount <= 0 || numAmount > state.deposit} onClick=${() => { setLoadingMsg('Processing withdrawal…'); setLoading(true) }}>Withdraw</${Button}>`}
        ${tab === 'withdraw-all' && !confirmAll && html`<${Button} kind="danger" onClick=${() => setConfirmAll(true)}>Withdraw All</${Button}>`}
        ${tab === 'withdraw-all' && confirmAll && html`
          <div className="m-confirm">Withdraw entire ${formatUSD(state.deposit)} and close all positions?</div>
          <${Button} kind="danger" onClick=${() => { setLoadingMsg('Withdrawing all funds…'); setConfirmAll(false); setLoading(true) }}>Confirm Withdrawal</${Button}>
          <button className="m-text-link" onClick=${() => setConfirmAll(false)}>Cancel</button>
        `}
      </div>
    </div>
  `
}

/* ===================== Risk Settings ===================== */
export function MRiskSettings({ state, navigate, onApply }) {
  const [newTier, setNewTier] = useState(state.tierId)
  const [newExcluded, setNewExcluded] = useState([...state.excludedCategories])
  const [loading, setLoading] = useState(false)

  const currentApy = computeProjectedAPY(state.tierId, state.excludedCategories)
  const newApy = computeProjectedAPY(newTier, newExcluded)
  const hasChanges = newTier !== state.tierId || JSON.stringify([...newExcluded].sort()) !== JSON.stringify([...state.excludedCategories].sort())
  const currentAlloc = getEffectiveAllocation(state.tierId, state.excludedCategories)
  const newAlloc = getEffectiveAllocation(newTier, newExcluded)
  const currentBalances = computeCategoryBalances(state.deposit, state.tierId, state.excludedCategories)
  const newBalances = computeCategoryBalances(state.deposit, newTier, newExcluded)
  const activeCount = CATEGORIES.filter(c => !newExcluded.includes(c.id)).length
  const needsWarning = activeCount === 0

  const currentDonut = CATEGORIES.filter(c => currentBalances[c.id] > 0).map(c => ({ label: c.name, value: currentBalances[c.id], color: CATEGORY_COLORS[c.id] }))
  const newDonut = CATEGORIES.filter(c => newBalances[c.id] > 0).map(c => ({ label: c.name, value: newBalances[c.id], color: CATEGORY_COLORS[c.id] }))

  const toggleCat = (catId) => setNewExcluded(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])

  if (loading) return html`<${MLoader} message="Rebalancing…" onDone=${() => { onApply(newTier, newExcluded); navigate('dashboard') }} />`

  return html`
    <div className="m-screen">
      <${NavBar} title="Risk Settings" large=${false} onBack=${() => navigate('dashboard')} />

      <${Card} className="m-apy-hero" style=${{ marginTop: 8 }}>
        <div className="m-apy-hero-label">PROJECTED APY <span className="m-est">EST</span></div>
        <div className="m-apy-hero-value">${newApy.toFixed(1)}%</div>
      </${Card}>

      <label className="m-field-label">TIER</label>
      <div className="m-tier-scroller">
        ${TIERS.map(t => html`
          <button key=${t.id} className=${`m-tier-card ${newTier === t.id ? 'm-tier-card-on' : ''}`} onClick=${() => setNewTier(t.id)}>
            <span className="m-tier-card-name">${t.name}</span>
            <span className="m-tier-card-apy">${t.apyRange[0]}–${t.apyRange[1]}%</span>
          </button>
        `)}
      </div>

      <label className="m-field-label">CATEGORY EXCLUSIONS</label>
      <${Card} className="m-list">
        ${CATEGORIES.map((cat, i) => html`
          <div key=${cat.id} className=${`m-list-row ${i === CATEGORIES.length - 1 ? 'm-list-row-last' : ''}`}>
            <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
            <span className="m-list-row-name">${cat.name}</span>
            <${Switch} on=${!newExcluded.includes(cat.id)} onChange=${() => toggleCat(cat.id)} />
          </div>
        `)}
      </${Card}>
      ${needsWarning && html`<div className="m-warn">At least one category must be active.</div>`}

      <div className="m-section-head"><span>Before / After</span></div>
      <${Card}>
        <div className="m-compare-donuts">
          <div className="m-compare-col"><span className="m-tiny m-muted">CURRENT</span><${DonutChart} data=${currentDonut} size=${90} innerLabel=${TIERS.find(t => t.id === state.tierId)?.name} /><span className="m-mono m-tiny">${currentApy.toFixed(1)}%</span></div>
          <${Icon.chevronRight} size=${20} className="m-muted" />
          <div className="m-compare-col"><span className="m-tiny m-muted">NEW</span><${DonutChart} data=${newDonut} size=${90} innerLabel=${TIERS.find(t => t.id === newTier)?.name} /><span className="m-mono m-tiny m-accent-text">${newApy.toFixed(1)}%</span></div>
        </div>
        <div className="m-compare-table">
          ${CATEGORIES.map(cat => {
            const cv = currentAlloc[cat.id] || 0, nv = newAlloc[cat.id] || 0
            return html`
              <div key=${cat.id} className="m-compare-row">
                <span className="m-compare-cat"><span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>${cat.name}</span>
                <span className="m-muted">${cv.toFixed(0)}%</span>
                <${Icon.chevronRight} size=${12} className="m-muted" />
                <span className=${nv !== cv ? 'm-accent-text' : 'm-muted'}>${nv.toFixed(0)}%</span>
              </div>
            `
          })}
        </div>
      </${Card}>

      <div className="m-flow-foot">
        <${Button} kind="primary" disabled=${!hasChanges || needsWarning} onClick=${() => setLoading(true)}>Apply Changes</${Button}>
      </div>
    </div>
  `
}

/* ===================== Activity ===================== */
export function MActivity({ state }) {
  const [filter, setFilter] = useState('all')
  const events = useMemo(() => generateActivityLog(state.deposit, state.tierName), [state.deposit, state.tierName])
  const filtered = useMemo(() => filter === 'all' ? events : events.filter(e => e.type === filter), [events, filter])
  const types = ['all', 'deposit', 'withdrawal', 'rebalance', 'tier_change', 'trade']

  const fmtTime = (ts) => {
    const d = new Date(ts)
    const diff = (Date.now() - d.getTime()) / 3600000
    if (diff < 1) return `${Math.max(1, Math.round(diff * 60))}m ago`
    if (diff < 24) return `${Math.round(diff)}h ago`
    return `${Math.round(diff / 24)}d ago`
  }

  return html`
    <div className="m-screen">
      <${NavBar} title="Activity" />
      <div className="m-filter-scroller">
        ${types.map(t => html`
          <button key=${t} className=${`m-filter-chip ${filter === t ? 'm-filter-on' : ''}`} onClick=${() => setFilter(t)}>${t === 'all' ? 'All' : t.replace('_', ' ')}</button>
        `)}
      </div>
      <div className="m-feed">
        ${filtered.map(e => html`
          <${Card} key=${e.id} className="m-feed-row">
            <div className=${`m-feed-icon m-type-${e.type}`}>
              ${e.type === 'deposit' ? html`<${Icon.arrowDown} size=${17} />`
                : e.type === 'withdrawal' ? html`<${Icon.arrowUp} size=${17} />`
                : e.type === 'tier_change' ? html`<${Icon.gear} size=${17} />`
                : e.type === 'rebalance' ? html`<${Icon.pie} size=${17} />`
                : html`<${Icon.pulse} size=${17} />`}
            </div>
            <div className="m-feed-mid">
              <div className="m-feed-desc">${e.description}</div>
              <div className="m-feed-meta">${e.category} · ${formatUSD(e.amount)}</div>
            </div>
            <div className="m-feed-right">
              <span className="m-feed-time">${fmtTime(e.timestamp)}</span>
              <a className="m-feed-tx" href=${e.explorerUrl} target="_blank" rel="noopener noreferrer">${e.txHash.slice(0, 6)}…<${Icon.external} size=${11} /></a>
            </div>
          </${Card}>
        `)}
        ${filtered.length === 0 && html`<div className="m-empty">No matching events.</div>`}
      </div>
    </div>
  `
}
