import { html, useState } from '../lib.js'
import { Loader, EstimateBadge, RiskRewardMap, TierSelector, CategoryToggles } from '../components.js'
import { computeProjectedAPY, TIERS, CATEGORIES } from '../mock-data.js'

export function RiskTierPage({ onComplete }) {
  const [tierId, setTierId] = useState(3)
  const [excluded, setExcluded] = useState([])
  const [loading, setLoading] = useState(false)

  const projectedApy = computeProjectedAPY(tierId, excluded)
  const tier = TIERS.find(t => t.id === tierId)

  const activeCount = CATEGORIES.filter(c => !excluded.includes(c.id)).length
  const needsWarning = activeCount === 0

  const handleTierDotClick = (clickedTierId) => {
    setTierId(clickedTierId)
  }

  const handleStart = () => {
    if (needsWarning) return
    setLoading(true)
  }

  if (loading) {
    return html`<${Loader} message="Allocating your capital..." onDone=${() => onComplete(tierId, excluded)} />`
  }

  return html`
    <div className="risk-tier-page">
      <div className="page-section-header">
        <span className="mono muted step-label">STEP 2 OF 2</span>
        <h2>Set Your Risk Profile</h2>
        <p className="muted">Tap a tier on the map or use the selector below. Toggle categories to customize.</p>
      </div>

      <div className="risk-tier-layout">
        <div className="risk-tier-main">
          <div className="card">
            <div className="card-label mono">RISK / REWARD MAP <${EstimateBadge} /></div>
            <${RiskRewardMap}
              tierId=${tierId}
              excludedCategories=${excluded}
              onTierClick=${handleTierDotClick}
              mode="select"
              layers=${{ tiers: true, user: true, others: true, categories: true }}
            />
          </div>

          <div className="card" style=${{ marginTop: 16 }}>
            <div className="card-label mono">TIER SELECTOR</div>
            <${TierSelector} value=${tierId} onChange=${setTierId} excludedCategories=${excluded} />
          </div>
        </div>

        <div className="risk-tier-sidebar">
          <div className="card">
            <div className="card-label mono">PROJECTED APY <${EstimateBadge} /></div>
            <div className="card-value projected-apy">${projectedApy.toFixed(1)}%</div>
            <div className="muted mono" style=${{ fontSize: '0.75rem', marginTop: 4 }}>
              ${tier.name} tier · ${tier.apyRange[0]}–${tier.apyRange[1]}% range
            </div>
          </div>

          <div className="card" style=${{ marginTop: 16 }}>
            <div className="card-label mono">CATEGORY EXCLUSIONS</div>
            <${CategoryToggles}
              excludedCategories=${excluded}
              onChange=${setExcluded}
              tierId=${tierId}
            />
            ${needsWarning && html`
              <div className="warning-note mono">At least one category must be active.</div>
            `}
          </div>

          <button
            className=${`button button-orange start-btn ${needsWarning ? 'btn-disabled' : ''}`}
            onClick=${handleStart}
            disabled=${needsWarning}
            style=${{ marginTop: 16, width: '100%' }}
          >
            Start Earning
          </button>
        </div>
      </div>
    </div>
  `
}
