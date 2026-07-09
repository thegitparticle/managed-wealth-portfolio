import { html, useState, useMemo } from '../lib.js'
import { RiskRewardMap, DonutChart, LineChart, RiskMeter } from '../components.js'
import { Segmented, Card, Button, MLoader, Sheet, NavBar, Icon } from './ui.js'
import {
  TIERS, CATEGORIES, EXPERIMENTAL, FAQ, CATEGORY_COLORS, formatUSD, formatPct,
  computeProjectedAPY, computeRiskLevel, computeCategoryBalances,
  generateNetWorthSeries, generatePerformanceSeries, generateAnonymizedStrategies,
  getEffectiveAllocation, generateActivityLog,
} from '../mock-data.js'

/* ===================== Dashboard ===================== */
export function MDashboard({ state, navigate, onTierSwitch }) {
  const { deposit, tierId } = state
  const [timeRange, setTimeRange] = useState('30d')
  const [previewTier, setPreviewTier] = useState(null)
  const [switching, setSwitching] = useState(false)
  const [layers, setLayers] = useState({ tiers: true, user: true, others: true, categories: true })

  const tier = TIERS.find(t => t.id === tierId)
  const projectedApy = computeProjectedAPY(tierId, [])
  const balances = computeCategoryBalances(deposit, tierId, [])
  const alloc = getEffectiveAllocation(tierId, [])

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
  const previewApy = previewTier ? computeProjectedAPY(previewTier, []) : null
  const previewRisk = previewTier ? computeRiskLevel(previewTier, []) : null

  const layerDefs = [['user', 'You'], ['tiers', 'Tiers'], ['others', 'Others'], ['categories', 'Cats']]

  return html`
    <div className="m-screen">
      <${NavBar} title="Portfolio" right=${html`
        <div className="m-nav-actions">
          <button className="m-icon-btn" onClick=${() => navigate('help')} aria-label="Help"><${Icon.help} size=${22} /></button>
          <button className="m-icon-btn" onClick=${() => navigate('risk-settings')} aria-label="Risk settings"><${Icon.gear} size=${22} /></button>
        </div>
      `} />

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
          <div className="m-stat-label">STRATEGY</div>
          <div className="m-stat-value m-stat-value-sm">${tier.name}</div>
          <button className="m-stat-link" onClick=${() => navigate('risk-settings')}>Change →</button>
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
          tierId=${tierId} excludedCategories=${[]}
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

      <div className="m-section-head"><span>What you hold</span></div>
      <div className="m-cat-list">
        ${CATEGORIES.filter(c => (alloc[c.id] || 0) > 0).map(cat => html`
          <${Card} key=${cat.id} className="m-cat-card" onClick=${() => navigate('allocation')}>
            <div className="m-cat-card-top">
              <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
              <span className="m-cat-card-name">${cat.name}</span>
              <${Icon.chevronRight} size=${18} className="m-muted" />
            </div>
            <div className="m-cat-card-stats">
              <span><b>${formatUSD(balances[cat.id] || 0)}</b> · ${(alloc[cat.id] || 0).toFixed(0)}%</span>
              <span className="m-muted">${cat.strategyCount} strats · ${cat.apy.toFixed(1)}%</span>
            </div>
          </${Card}>
        `)}
      </div>

      <div className="m-section-head"><span>Beyond your tiers</span></div>
      <${Card} className="m-experimental" onClick=${() => navigate('help')}>
        <div className="m-exp-top">
          <span className="m-exp-badge">${EXPERIMENTAL.badge}</span>
          <${Icon.spark} size=${18} className="m-exp-spark" />
        </div>
        <div className="m-exp-name">${EXPERIMENTAL.name}</div>
        <p className="m-exp-desc">${EXPERIMENTAL.description}</p>
        <div className="m-exp-foot">Separate from your managed tiers · coming soon</div>
      </${Card}>

      <div className="m-quick-actions">
        <button className="m-qa" onClick=${() => navigate('funds')}><span className="m-qa-icon m-qa-green"><${Icon.plus} size=${20} /></span>Add</button>
        <button className="m-qa" onClick=${() => navigate('funds')}><span className="m-qa-icon"><${Icon.arrowDown} size=${20} /></span>Withdraw</button>
        <button className="m-qa" onClick=${() => navigate('risk-settings')}><span className="m-qa-icon m-qa-orange"><${Icon.gear} size=${20} /></span>Risk</button>
        <button className="m-qa" onClick=${() => navigate('help')}><span className="m-qa-icon"><${Icon.help} size=${20} /></span>Help</button>
      </div>

      <${Sheet} open=${!!previewTier} onClose=${() => setPreviewTier(null)} title="Switch strategy">
        ${previewObj && html`
          <div className="m-tier-compare">
            <div className="m-tier-compare-col">
              <span className="m-muted">NOW</span>
              <span className="m-tier-compare-name">${tier.name}</span>
              <span className="m-mono">${projectedApy.toFixed(1)}% · ${tier.riskLabel}</span>
            </div>
            <${Icon.chevronRight} size=${22} className="m-accent-text" />
            <div className="m-tier-compare-col">
              <span className="m-muted">NEW</span>
              <span className="m-tier-compare-name" style=${{ color: previewObj.color }}>${previewObj.name}</span>
              <span className="m-mono">${previewApy.toFixed(1)}% · ${previewObj.riskLabel}</span>
            </div>
          </div>
          <p className="m-tier-blurb">${previewObj.blurb}</p>
          <div style=${{ margin: '2px 0 12px' }}><${RiskMeter} level=${previewRisk} /></div>
          <div className="m-tier-delta">
            Potential return ${formatPct(previewApy - projectedApy)} · Risk ${tier.riskLabel} → ${previewObj.riskLabel}
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
  const { deposit, tierId, tierName } = state
  const [expanded, setExpanded] = useState(null)
  const balances = computeCategoryBalances(deposit, tierId, [])
  const alloc = getEffectiveAllocation(tierId, [])
  const total = Object.values(balances).reduce((s, v) => s + v, 0)

  const renderDrill = (cat, { experimental } = {}) => {
    const balance = balances[cat.id] || 0
    const pct = total > 0 ? (balance / total * 100) : 0
    const inactive = !experimental && (alloc[cat.id] || 0) === 0
    const isOpen = expanded === cat.id
    const strategies = isOpen ? generateAnonymizedStrategies(cat.id) : []
    const perf = isOpen ? generatePerformanceSeries(30, cat.apy, 0.3) : []
    return html`
      <${Card} key=${cat.id} className=${`m-drill ${inactive ? 'm-off' : ''} ${experimental ? 'm-drill-exp' : ''}`}>
        <div className="m-drill-head" onClick=${() => !inactive && setExpanded(isOpen ? null : cat.id)}>
          <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
          <div className="m-drill-head-text">
            <div className="m-cat-card-name">
              ${cat.name}
              ${experimental && html`<span className="m-exp-badge m-exp-badge-inline">${cat.badge}</span>`}
            </div>
            <div className="m-muted m-tiny">${cat.description}</div>
          </div>
          ${experimental
            ? html`<span className="m-muted m-tiny">Opt-in</span>`
            : inactive
              ? html`<span className="m-off-badge">0%</span>`
              : html`<div className="m-drill-head-right"><b>${formatUSD(balance)}</b><span className="m-muted m-tiny">${pct.toFixed(1)}%</span></div>`}
        </div>
        ${isOpen && !inactive && html`
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
  }

  return html`
    <div className="m-screen">
      <${NavBar} title="Allocation" />
      <${Card} className="m-info-card">
        <div className="m-stat-label">HOW ALLOCATION WORKS</div>
        <p className="m-info-text">Your tier decides which assets you hold and how much yield sits on top. The AI handles all strategy routing — you just pick the tier. Current tier: <strong>${tierName}</strong>.</p>
      </${Card}>

      <div className="m-cat-list">
        ${CATEGORIES.map(cat => renderDrill(cat))}
      </div>

      <div className="m-section-head"><span>Beyond your tiers</span></div>
      <div className="m-cat-list">
        ${renderDrill(EXPERIMENTAL, { experimental: true })}
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
  const [loading, setLoading] = useState(false)

  const currentApy = computeProjectedAPY(state.tierId, [])
  const newApy = computeProjectedAPY(newTier, [])
  const newRisk = computeRiskLevel(newTier, [])
  const hasChanges = newTier !== state.tierId
  const currentAlloc = getEffectiveAllocation(state.tierId, [])
  const newAlloc = getEffectiveAllocation(newTier, [])
  const currentBalances = computeCategoryBalances(state.deposit, state.tierId, [])
  const newBalances = computeCategoryBalances(state.deposit, newTier, [])
  const newTierObj = TIERS.find(t => t.id === newTier)

  const currentDonut = CATEGORIES.filter(c => currentBalances[c.id] > 0).map(c => ({ label: c.name, value: currentBalances[c.id], color: CATEGORY_COLORS[c.id] }))
  const newDonut = CATEGORIES.filter(c => newBalances[c.id] > 0).map(c => ({ label: c.name, value: newBalances[c.id], color: CATEGORY_COLORS[c.id] }))

  if (loading) return html`<${MLoader} message="Rebalancing…" onDone=${() => { onApply(newTier, []); navigate('dashboard') }} />`

  return html`
    <div className="m-screen">
      <${NavBar} title="Strategy" large=${false} onBack=${() => navigate('dashboard')} />

      <div className="m-strat-picker" style=${{ marginTop: 8 }}>
        ${TIERS.map(t => {
          const active = newTier === t.id
          return html`
            <button
              key=${t.id}
              type="button"
              className=${`m-strat-card ${active ? 'm-strat-on' : ''}`}
              onClick=${() => setNewTier(t.id)}
              style=${{ '--tier-color': t.color }}
            >
              <span className="m-strat-rail"></span>
              <div className="m-strat-top">
                <span className="m-strat-name">${t.name}</span>
                <span className="m-strat-risk">${t.riskLabel}</span>
              </div>
              <div className="m-strat-tag">${t.tagline}</div>
              <div className="m-strat-line">
                <span className="m-strat-holds">${t.holds}</span>
                <span className="m-strat-apy">${t.apyRange[0]}–${t.apyRange[1]}%</span>
              </div>
              ${active && html`<div className="m-strat-blurb">${t.blurb}</div>`}
            </button>
          `
        })}
      </div>

      <${Card} className="m-apy-hero" style=${{ marginTop: 16 }}>
        <div className="m-apy-hero-label">PROJECTED APY <span className="m-est">EST</span></div>
        <div className="m-apy-hero-value">${newApy.toFixed(1)}%</div>
        <div className="m-apy-hero-sub">${newTierObj.riskLabel} risk</div>
        <div style=${{ marginTop: 12 }}><${RiskMeter} level=${newRisk} /></div>
      </${Card}>

      <div className="m-section-head"><span>Before / After</span></div>
      <${Card}>
        <div className="m-compare-donuts">
          <div className="m-compare-col"><span className="m-tiny m-muted">NOW</span><${DonutChart} data=${currentDonut} size=${90} innerLabel=${TIERS.find(t => t.id === state.tierId)?.name} /><span className="m-mono m-tiny">${currentApy.toFixed(1)}%</span></div>
          <${Icon.chevronRight} size=${20} className="m-muted" />
          <div className="m-compare-col"><span className="m-tiny m-muted">NEW</span><${DonutChart} data=${newDonut} size=${90} innerLabel=${newTierObj?.name} /><span className="m-mono m-tiny m-accent-text">${newApy.toFixed(1)}%</span></div>
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
        <${Button} kind="primary" disabled=${!hasChanges} onClick=${() => setLoading(true)}>${hasChanges ? `Switch to ${newTierObj.name}` : 'No changes'}</${Button}>
      </div>
    </div>
  `
}

/* ===================== Help / FAQ ===================== */
export function MHelp({ navigate }) {
  const [open, setOpen] = useState(0)

  return html`
    <div className="m-screen">
      <${NavBar} title="How it works" large=${false} onBack=${() => navigate('dashboard')} />

      <${Card} className="m-info-card" style=${{ marginTop: 8 }}>
        <p className="m-info-text">You choose one of three strategies. Each one holds a different kind of asset and earns yield on top. You never pick individual strategies — the system routes and rebalances automatically. Switch anytime, no lock-up.</p>
      </${Card}>

      <div className="m-section-head"><span>The three strategies</span></div>
      ${TIERS.map(t => {
        const risk = computeRiskLevel(t.id, [])
        return html`
          <${Card} key=${t.id} className="m-help-tier" style=${{ '--tier-color': t.color }}>
            <span className="m-strat-rail"></span>
            <div className="m-strat-top">
              <span className="m-strat-name">${t.name}</span>
              <span className="m-strat-risk">${t.riskLabel}</span>
            </div>
            <div className="m-help-meta">
              <span><span className="m-muted">HOLDS</span> ${t.holds}</span>
              <span><span className="m-muted">EST. APY</span> ${t.apyRange[0]}–${t.apyRange[1]}%</span>
            </div>
            <${RiskMeter} level=${risk} />
            <p className="m-help-body">${t.long}</p>
          </${Card}>
        `
      })}

      <div className="m-section-head"><span>Beyond your tiers</span></div>
      <${Card} className="m-help-tier m-help-exp" style=${{ '--tier-color': '#dc2626' }}>
        <div className="m-strat-top">
          <span className="m-strat-name">${EXPERIMENTAL.name}</span>
          <span className="m-exp-badge m-exp-badge-inline">${EXPERIMENTAL.badge}</span>
        </div>
        <p className="m-help-body">${EXPERIMENTAL.long}</p>
      </${Card}>

      <div className="m-section-head"><span>Questions</span></div>
      <div className="m-faq">
        ${FAQ.map((item, i) => {
          const isOpen = open === i
          return html`
            <${Card} key=${i} className=${`m-faq-item ${isOpen ? 'm-faq-open' : ''}`}>
              <button className="m-faq-q" onClick=${() => setOpen(isOpen ? -1 : i)}>
                <span>${item.q}</span>
                <span className="m-faq-chevron">${isOpen ? '−' : '+'}</span>
              </button>
              ${isOpen && html`<p className="m-faq-a">${item.a}</p>`}
            </${Card}>
          `
        })}
      </div>

      <p className="m-help-foot">All figures are estimates · demo data is simulated.</p>
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
