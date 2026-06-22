import { html, useState, useMemo } from '../lib.js'
import { Loader, EstimateBadge, RiskRewardMap, TierSelector, CategoryToggles, DonutChart } from '../components.js'
import {
  TIERS, CATEGORIES, CATEGORY_COLORS, formatUSD,
  computeProjectedAPY, computeCategoryBalances, getEffectiveAllocation,
} from '../mock-data.js'

export function RiskSettingsPage({ state, navigate, onApply }) {
  const [newTier, setNewTier] = useState(state.tierId)
  const [newExcluded, setNewExcluded] = useState([...state.excludedCategories])
  const [loading, setLoading] = useState(false)

  const currentApy = computeProjectedAPY(state.tierId, state.excludedCategories)
  const newApy = computeProjectedAPY(newTier, newExcluded)
  const hasChanges = newTier !== state.tierId || JSON.stringify(newExcluded.sort()) !== JSON.stringify([...state.excludedCategories].sort())

  const currentAlloc = getEffectiveAllocation(state.tierId, state.excludedCategories)
  const newAlloc = getEffectiveAllocation(newTier, newExcluded)
  const currentBalances = computeCategoryBalances(state.deposit, state.tierId, state.excludedCategories)
  const newBalances = computeCategoryBalances(state.deposit, newTier, newExcluded)

  const currentDonut = useMemo(() =>
    CATEGORIES.filter(c => currentBalances[c.id] > 0).map(c => ({ label: c.name, value: currentBalances[c.id], color: CATEGORY_COLORS[c.id] })),
    [currentBalances]
  )
  const newDonut = useMemo(() =>
    CATEGORIES.filter(c => newBalances[c.id] > 0).map(c => ({ label: c.name, value: newBalances[c.id], color: CATEGORY_COLORS[c.id] })),
    [newBalances]
  )

  const activeCount = CATEGORIES.filter(c => !newExcluded.includes(c.id)).length
  const needsWarning = activeCount === 0

  const handleApply = () => {
    if (!hasChanges || needsWarning) return
    setLoading(true)
  }

  if (loading) {
    return html`<${Loader} message="Rebalancing..." onDone=${() => {
      onApply(newTier, newExcluded)
      navigate('dashboard')
    }} />`
  }

  return html`
    <div className="risk-settings-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>\u2190 Dashboard</button>
        <h2>Risk Settings</h2>
        <p className="muted">Adjust your risk tier and category exclusions. Preview changes before applying.</p>
      </div>

      <div className="risk-settings-layout">
        <div className="risk-settings-main">
          <div className="card">
            <div className="card-label mono">RISK TIER</div>
            <${TierSelector} value=${newTier} onChange=${setNewTier} excludedCategories=${newExcluded} />
          </div>

          <div className="card" style=${{ marginTop: 16 }}>
            <div className="card-label mono">CATEGORY EXCLUSIONS</div>
            <${CategoryToggles}
              excludedCategories=${newExcluded}
              onChange=${setNewExcluded}
              tierId=${newTier}
            />
            ${needsWarning && html`
              <div className="warning-note mono">At least one category must be active.</div>
            `}
          </div>

          <div className="card" style=${{ marginTop: 16 }}>
            <div className="card-label mono">PROJECTED APY <${EstimateBadge} /></div>
            <div className="card-value projected-apy">${newApy.toFixed(1)}%</div>
          </div>
        </div>

        <div className="risk-settings-sidebar">
          <div className="card">
            <div className="card-label mono">BEFORE / AFTER PREVIEW</div>
            <div className="compare-donuts">
              <div className="compare-donut-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>CURRENT</span>
                <${DonutChart} data=${currentDonut} size=${100} innerLabel=${TIERS.find(t => t.id === state.tierId)?.name} />
                <span className="mono" style=${{ fontSize: '0.8rem' }}>${currentApy.toFixed(1)}% APY</span>
              </div>
              <div className="compare-arrow">\u2192</div>
              <div className="compare-donut-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>NEW</span>
                <${DonutChart} data=${newDonut} size=${100} innerLabel=${TIERS.find(t => t.id === newTier)?.name} />
                <span className="mono" style=${{ fontSize: '0.8rem' }}>${newApy.toFixed(1)}% APY</span>
              </div>
            </div>

            <div className="compare-table">
              <div className="compare-table-header mono">
                <span>Category</span>
                <span>Current</span>
                <span>New</span>
              </div>
              ${CATEGORIES.map(cat => html`
                <div key=${cat.id} className="compare-table-row mono">
                  <span style=${{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="cat-color-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
                    ${cat.name.length > 15 ? cat.name.slice(0, 15) + '..' : cat.name}
                  </span>
                  <span>${(currentAlloc[cat.id] || 0).toFixed(0)}%</span>
                  <span className=${(newAlloc[cat.id] || 0) !== (currentAlloc[cat.id] || 0) ? 'changed-val' : ''}>${(newAlloc[cat.id] || 0).toFixed(0)}%</span>
                </div>
              `)}
            </div>
          </div>

          <button
            className=${`button button-orange start-btn ${!hasChanges || needsWarning ? 'btn-disabled' : ''}`}
            onClick=${handleApply}
            disabled=${!hasChanges || needsWarning}
            style=${{ marginTop: 16, width: '100%' }}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  `
}
