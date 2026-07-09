import { html, useState, useMemo } from '../lib.js'
import { Loader, EstimateBadge, TierCards, DonutChart, RiskMeter } from '../components.js'
import {
  TIERS, CATEGORIES, CATEGORY_COLORS,
  computeProjectedAPY, computeRiskLevel, computeCategoryBalances, getEffectiveAllocation,
} from '../mock-data.js'

export function RiskSettingsPage({ state, navigate, onApply }) {
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
  const currentTier = TIERS.find(t => t.id === state.tierId)
  const newTierObj = TIERS.find(t => t.id === newTier)

  const currentDonut = useMemo(() =>
    CATEGORIES.filter(c => currentBalances[c.id] > 0).map(c => ({ label: c.name, value: currentBalances[c.id], color: CATEGORY_COLORS[c.id] })),
    [currentBalances]
  )
  const newDonut = useMemo(() =>
    CATEGORIES.filter(c => newBalances[c.id] > 0).map(c => ({ label: c.name, value: newBalances[c.id], color: CATEGORY_COLORS[c.id] })),
    [newBalances]
  )

  const handleApply = () => {
    if (!hasChanges) return
    setLoading(true)
  }

  if (loading) {
    return html`<${Loader} message="Rebalancing..." onDone=${() => {
      onApply(newTier, [])
      navigate('dashboard')
    }} />`
  }

  return html`
    <div className="risk-settings-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>← Dashboard</button>
        <h2>Adjust your strategy</h2>
        <p className="muted">Switch tier and preview exactly how your money moves before you apply. No lock-up.</p>
      </div>

      <div className="risk-settings-layout">
        <div className="risk-settings-main">
          <${TierCards} value=${newTier} onChange=${setNewTier} />
        </div>

        <div className="risk-settings-sidebar">
          <div className="card">
            <div className="card-label mono">PROJECTED APY <${EstimateBadge} /></div>
            <div className="card-value projected-apy">${newApy.toFixed(1)}%</div>
            <div className="mono muted" style=${{ fontSize: '0.72rem', marginTop: 2 }}>${newTierObj.riskLabel} risk</div>
            <div style=${{ marginTop: 12 }}><${RiskMeter} level=${newRisk} /></div>
            <p className="tier-summary-blurb">${newTierObj.blurb}</p>
          </div>

          <div className="card" style=${{ marginTop: 16 }}>
            <div className="card-label mono">BEFORE / AFTER</div>
            <div className="compare-donuts">
              <div className="compare-donut-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>NOW</span>
                <${DonutChart} data=${currentDonut} size=${100} innerLabel=${currentTier?.name} />
                <span className="mono" style=${{ fontSize: '0.8rem' }}>${currentApy.toFixed(1)}% APY</span>
              </div>
              <div className="compare-arrow">→</div>
              <div className="compare-donut-col">
                <span className="mono muted" style=${{ fontSize: '0.7rem' }}>NEW</span>
                <${DonutChart} data=${newDonut} size=${100} innerLabel=${newTierObj?.name} />
                <span className="mono" style=${{ fontSize: '0.8rem' }}>${newApy.toFixed(1)}% APY</span>
              </div>
            </div>

            <div className="compare-table">
              <div className="compare-table-header mono">
                <span>Holding</span>
                <span>Now</span>
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
            className=${`button button-orange start-btn ${!hasChanges ? 'btn-disabled' : ''}`}
            onClick=${handleApply}
            disabled=${!hasChanges}
            style=${{ marginTop: 16, width: '100%' }}
          >
            ${hasChanges ? `Switch to ${newTierObj.name}` : 'No changes'}
          </button>
        </div>
      </div>
    </div>
  `
}
