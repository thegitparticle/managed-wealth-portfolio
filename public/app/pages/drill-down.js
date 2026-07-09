import { html, useState } from '../lib.js'
import { LineChart } from '../components.js'
import {
  CATEGORIES, EXPERIMENTAL, CATEGORY_COLORS, formatUSD, formatPct,
  computeCategoryBalances, getEffectiveAllocation,
  generatePerformanceSeries, generateAnonymizedStrategies,
} from '../mock-data.js'

export function DrillDownPage({ state, navigate }) {
  const { deposit, tierId } = state
  const [expandedCat, setExpandedCat] = useState(null)

  const balances = computeCategoryBalances(deposit, tierId, [])
  const alloc = getEffectiveAllocation(tierId, [])
  const totalNetWorth = Object.values(balances).reduce((s, v) => s + v, 0)

  const toggle = (catId) => {
    setExpandedCat(expandedCat === catId ? null : catId)
  }

  const renderSection = (cat, { experimental } = {}) => {
    const balance = balances[cat.id] || 0
    const pctOfTotal = totalNetWorth > 0 ? (balance / totalNetWorth * 100) : 0
    const inactive = !experimental && (alloc[cat.id] || 0) === 0
    const isExpanded = expandedCat === cat.id
    const strategies = isExpanded ? generateAnonymizedStrategies(cat.id) : []
    const perfSeries = isExpanded ? generatePerformanceSeries(30, cat.apy, 0.3) : []

    return html`
      <div key=${cat.id} className=${`card drill-section ${inactive ? 'cat-card-off' : ''} ${experimental ? 'drill-experimental' : ''}`}>
        <div className="drill-header" onClick=${() => !inactive && toggle(cat.id)} style=${{ cursor: inactive ? 'default' : 'pointer' }}>
          <div className="drill-header-left">
            <span className="cat-color-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
            <div>
              <div className="drill-cat-name">
                ${cat.name}
                ${experimental && html`<span className="experimental-badge mono" style=${{ marginLeft: 8 }}>${cat.badge}</span>`}
              </div>
              <div className="muted mono" style=${{ fontSize: '0.7rem' }}>${cat.description}</div>
            </div>
          </div>
          <div className="drill-header-right mono">
            ${experimental
              ? html`<span className="muted">Opt-in</span>`
              : inactive
                ? html`<span className="off-badge mono">0% — not in this tier</span>`
                : html`
                  <span>${formatUSD(balance)}</span>
                  <span className="muted" style=${{ marginLeft: 8 }}>${pctOfTotal.toFixed(1)}%</span>
                  <span style=${{ marginLeft: 8 }}>${isExpanded ? '▲' : '▼'}</span>
                `
            }
          </div>
        </div>

        ${isExpanded && !inactive && html`
          <div className="drill-body">
            <div className="drill-stats">
              <div className="drill-stat">
                <span className="mono muted" style=${{ fontSize: '0.65rem' }}>STRATEGIES</span>
                <span className="mono">${cat.strategyCount} active</span>
              </div>
              <div className="drill-stat">
                <span className="mono muted" style=${{ fontSize: '0.65rem' }}>BLENDED APY</span>
                <span className="mono">${cat.apy.toFixed(1)}%</span>
              </div>
              <div className="drill-stat">
                <span className="mono muted" style=${{ fontSize: '0.65rem' }}>30D PERF</span>
                <${LineChart} data=${perfSeries} width=${140} height=${50} color=${CATEGORY_COLORS[cat.id]} />
              </div>
            </div>
            <div className="drill-strategies">
              <div className="card-label mono" style=${{ marginBottom: 8 }}>STRATEGY BREAKDOWN</div>
              ${strategies.map((s, i) => html`
                <div key=${i} className="strategy-row mono">
                  <span className="strategy-name">${s.name}</span>
                  <span className=${s.performance30d >= 0 ? 'pnl-up' : 'pnl-down'}>
                    ${formatPct(s.performance30d)} / 30d
                  </span>
                  <span className=${`strategy-status ${s.status}`}>${s.status}</span>
                </div>
              `)}
            </div>
          </div>
        `}
      </div>
    `
  }

  return html`
    <div className="drill-down-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>← Dashboard</button>
        <h2>Where your money is</h2>
        <p className="muted">Every dollar, split across the holdings your tier uses.</p>
      </div>

      <div className="how-alloc card" style=${{ marginBottom: 20 }}>
        <div className="card-label mono">HOW ALLOCATION WORKS</div>
        <p className="muted" style=${{ fontSize: '0.85rem', marginTop: 8 }}>
          Your tier decides which assets you hold and how much yield sits on top. The AI engine handles the
          strategy-level routing and rebalancing — you just pick the tier. Current tier:
          <strong> ${state.tierName}</strong>.
        </p>
      </div>

      <div className="drill-sections">
        ${CATEGORIES.map(cat => renderSection(cat))}
      </div>

      <div className="section-header" style=${{ marginTop: 24 }}>
        <h3>Beyond your tiers</h3>
      </div>
      <div className="drill-sections">
        ${renderSection(EXPERIMENTAL, { experimental: true })}
      </div>
    </div>
  `
}
