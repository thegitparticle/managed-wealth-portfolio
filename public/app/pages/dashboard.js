import { html, useState, useMemo } from '../lib.js'
import { EstimateBadge, RiskRewardMap, DonutChart, LineChart, Loader, RiskMeter, ExperimentalCard } from '../components.js'
import {
  TIERS, CATEGORIES, CATEGORY_COLORS, formatUSD, formatPct,
  computeProjectedAPY, computeRiskLevel, computeCategoryBalances,
  generateNetWorthSeries, getEffectiveAllocation,
} from '../mock-data.js'

export function DashboardPage({ state, navigate, onTierSwitch }) {
  const { deposit, tierId } = state
  const [timeRange, setTimeRange] = useState('30d')
  const [chartExpanded, setChartExpanded] = useState(false)
  const [previewTier, setPreviewTier] = useState(null)
  const [switching, setSwitching] = useState(false)
  const [mapLayers, setMapLayers] = useState({ tiers: true, user: true, others: true, categories: true })

  const tier = TIERS.find(t => t.id === tierId)
  const projectedApy = computeProjectedAPY(tierId, [])
  const balances = computeCategoryBalances(deposit, tierId, [])
  const totalNetWorth = Object.values(balances).reduce((s, v) => s + v, 0)

  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const netWorthSeries = useMemo(
    () => generateNetWorthSeries(deposit * 0.98, days, projectedApy),
    [deposit, days, projectedApy]
  )

  const currentValue = netWorthSeries[netWorthSeries.length - 1]?.value || deposit
  const startValue = netWorthSeries[0]?.value || deposit
  const pnlAbs = currentValue - startValue
  const pnlPct = startValue > 0 ? (pnlAbs / startValue) * 100 : 0

  const blendedApy = projectedApy
  const realizedRate = Math.round(blendedApy * 0.85 * 10) / 10

  const donutData = useMemo(() => {
    return CATEGORIES
      .filter(c => balances[c.id] > 0)
      .map(c => ({ label: c.name, value: balances[c.id], color: CATEGORY_COLORS[c.id] }))
  }, [balances])

  const alloc = getEffectiveAllocation(tierId, [])

  const handleTierDotClick = (clickedTierId) => {
    if (clickedTierId === tierId) return
    setPreviewTier(clickedTierId)
  }

  const confirmSwitch = () => {
    if (!previewTier) return
    setSwitching(true)
  }

  const toggleLayer = (key) => {
    if (key === 'user') return
    setMapLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (switching) {
    return html`<${Loader} message="Rebalancing..." onDone=${() => {
      onTierSwitch(previewTier)
      setPreviewTier(null)
      setSwitching(false)
    }} />`
  }

  const previewTierObj = previewTier ? TIERS.find(t => t.id === previewTier) : null
  const previewApy = previewTier ? computeProjectedAPY(previewTier, []) : null
  const previewRisk = previewTier ? computeRiskLevel(previewTier, []) : null

  return html`
    <div className="dashboard-page">
      ${previewTier && html`
        <div className="tier-preview-overlay" onClick=${() => setPreviewTier(null)}>
          <div className="tier-preview-panel card" onClick=${(e) => e.stopPropagation()}>
            <div className="card-label mono">SWITCH STRATEGY</div>
            <div className="tier-compare">
              <div className="tier-compare-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>NOW</span>
                <span className="tier-compare-name">${tier.name}</span>
                <span className="mono">${projectedApy.toFixed(1)}% · ${tier.riskLabel}</span>
              </div>
              <div className="tier-compare-arrow">→</div>
              <div className="tier-compare-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>NEW</span>
                <span className="tier-compare-name" style=${{ color: previewTierObj.color }}>${previewTierObj.name}</span>
                <span className="mono">${previewApy.toFixed(1)}% · ${previewTierObj.riskLabel}</span>
              </div>
            </div>
            <p className="tier-preview-blurb">${previewTierObj.blurb}</p>
            <div style=${{ margin: '4px 0 10px' }}><${RiskMeter} level=${previewRisk} /></div>
            <div className="tier-preview-delta mono">
              Potential return ${formatPct(previewApy - projectedApy)} · Risk ${tier.riskLabel} → ${previewTierObj.riskLabel}
            </div>
            <div className="tier-preview-actions">
              <button className="button" onClick=${() => setPreviewTier(null)}>Cancel</button>
              <button className="button button-orange" onClick=${confirmSwitch}>Switch to ${previewTierObj.name}</button>
            </div>
          </div>
        </div>
      `}

      <div className="card dashboard-hero-card">
        <div className="card-label mono">RISK / REWARD MAP <${EstimateBadge} /></div>
        <div className="scatter-legend-toggles">
          ${Object.entries(mapLayers).map(([key, on]) => html`
            <button
              key=${key}
              className=${`legend-toggle mono ${on ? 'legend-toggle-on' : ''} ${key === 'user' ? 'legend-toggle-locked' : ''}`}
              onClick=${() => toggleLayer(key)}
            >
              <span className=${`legend-dot legend-dot-${key === 'user' ? 'user' : key === 'tiers' ? 'tier' : key === 'others' ? 'others' : 'cat'}`}></span>
              ${key === 'user' ? 'Your Position' : key === 'tiers' ? 'Tiers' : key === 'others' ? 'Other Users' : 'Categories'}
            </button>
          `)}
        </div>
        <${RiskRewardMap}
          tierId=${tierId}
          excludedCategories=${[]}
          onTierClick=${handleTierDotClick}
          mode="select"
          layers=${mapLayers}
        />
        <p className="map-hint mono muted">Tap another tier dot to preview switching.</p>
      </div>

      <section className="supporting-strip">
        <div className="card strip-card">
          <div className="card-label mono">TOTAL NET WORTH</div>
          <div className="card-value">${formatUSD(currentValue)}</div>
          <div className=${`mono strip-pnl ${pnlAbs >= 0 ? 'pnl-up' : 'pnl-down'}`}>
            ${formatUSD(Math.abs(pnlAbs))} (${formatPct(pnlPct)})
          </div>
          <div className="time-range-toggle">
            ${['24h', '7d', '30d', 'All'].map(r => html`
              <button
                key=${r}
                className=${`seg-btn seg-sm mono ${timeRange === r ? 'seg-active' : ''}`}
                onClick=${() => setTimeRange(r)}
              >${r}</button>
            `)}
          </div>
          ${chartExpanded && html`
            <div style=${{ marginTop: 12 }}>
              <${LineChart} data=${netWorthSeries} width=${320} height=${100} />
            </div>
          `}
          <button className="button mono" style=${{ marginTop: 8, fontSize: '0.65rem' }} onClick=${() => setChartExpanded(!chartExpanded)}>
            ${chartExpanded ? 'Hide chart' : 'Show chart'}
          </button>
        </div>

        <div className="card strip-card">
          <div className="card-label mono">BLENDED YIELD</div>
          <div className="card-value">${realizedRate.toFixed(1)}%</div>
          <div className="muted mono" style=${{ fontSize: '0.7rem' }}>
            (est. forward: ${projectedApy.toFixed(1)}%) <${EstimateBadge} />
          </div>
        </div>

        <div className="card strip-card">
          <div className="card-label mono">NET WORTH SPLIT</div>
          <div style=${{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <${DonutChart}
              data=${donutData}
              size=${120}
              innerLabel=${tier.name}
            />
            <div className="split-list">
              ${CATEGORIES.filter(c => balances[c.id] > 0).map(c => html`
                <div key=${c.id} className="split-row mono">
                  <span className="cat-color-dot" style=${{ background: CATEGORY_COLORS[c.id] }}></span>
                  <span className="split-name">${c.name.length > 18 ? c.name.slice(0, 18) + '...' : c.name}</span>
                  <span className="split-val">${formatUSD(balances[c.id])}</span>
                  <span className="muted">${(alloc[c.id] || 0).toFixed(0)}%</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h3>What you hold</h3>
        </div>
        <div className="grid category-grid">
          ${CATEGORIES.map(cat => {
            const balance = balances[cat.id] || 0
            const pctAlloc = alloc[cat.id] || 0
            const active = pctAlloc > 0
            return html`
              <div key=${cat.id} className=${`card cat-card ${active ? '' : 'cat-card-off'}`}>
                <div className="cat-card-header">
                  <span className="cat-color-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
                  <span className="card-label mono">${cat.name}</span>
                  ${!active && html`<span className="off-badge mono">0%</span>`}
                </div>
                ${active && html`
                  <div className="cat-card-body">
                    <div className="cat-card-stat">
                      <span className="mono muted" style=${{ fontSize: '0.65rem' }}>CAPITAL</span>
                      <span className="mono">${formatUSD(balance)} (${pctAlloc.toFixed(0)}%)</span>
                    </div>
                    <div className="cat-card-stat">
                      <span className="mono muted" style=${{ fontSize: '0.65rem' }}>STRATEGIES</span>
                      <span className="mono">${cat.strategyCount} active</span>
                    </div>
                    <div className="cat-card-stat">
                      <span className="mono muted" style=${{ fontSize: '0.65rem' }}>APY</span>
                      <span className="mono">${cat.apy.toFixed(1)}%</span>
                    </div>
                    <button className="button mono" style=${{ fontSize: '0.65rem', marginTop: 8 }} onClick=${() => navigate('drill-down')}>Details</button>
                  </div>
                `}
              </div>
            `
          })}
        </div>
      </section>

      <section className="experimental-section">
        <div className="section-header">
          <h3>Beyond your tiers</h3>
        </div>
        <${ExperimentalCard} onLearnMore=${() => navigate('help')} />
      </section>

      <section className="quick-actions">
        <button className="button button-green" onClick=${() => navigate('manage-funds')}>Add Funds</button>
        <button className="button" onClick=${() => navigate('manage-funds')}>Withdraw</button>
        <button className="button button-orange" onClick=${() => navigate('risk-settings')}>Adjust Risk</button>
        <button className="button" onClick=${() => navigate('activity')}>Activity</button>
        <button className="button" onClick=${() => navigate('help')}>Help</button>
      </section>
    </div>
  `
}
