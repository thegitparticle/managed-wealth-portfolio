import { html, useState } from '../lib.js'
import { Loader, EstimateBadge, RiskRewardMap, TierCards, RiskMeter } from '../components.js'
import { computeProjectedAPY, computeRiskLevel, TIERS } from '../mock-data.js'

export function RiskTierPage({ onComplete }) {
  const [tierId, setTierId] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showLearn, setShowLearn] = useState(false)

  const tier = TIERS.find(t => t.id === tierId)
  const projectedApy = computeProjectedAPY(tierId, [])
  const risk = computeRiskLevel(tierId, [])

  const handleStart = () => setLoading(true)

  if (loading) {
    return html`<${Loader} message="Allocating your capital..." onDone=${() => onComplete(tierId, [])} />`
  }

  return html`
    <div className="risk-tier-page">
      <div className="page-section-header">
        <span className="mono muted step-label">STEP 2 OF 2</span>
        <h2>Choose your strategy</h2>
        <p class="muted">Each option holds a different kind of asset and earns yield on top. Pick one — you can change it anytime.</p>
      </div>

      <div className="risk-tier-layout">
        <div className="risk-tier-main">
          <${TierCards} value=${tierId} onChange=${setTierId} />

          <div className="card learn-card" style=${{ marginTop: 16 }}>
            <button className="learn-toggle mono" onClick=${() => setShowLearn(!showLearn)}>
              How does ${tier.name} work? <span className="learn-chevron">${showLearn ? '▲' : '▼'}</span>
            </button>
            ${showLearn && html`<p className="learn-body">${tier.long}</p>`}
          </div>
        </div>

        <div className="risk-tier-sidebar">
          <div className="card">
            <div className="card-label mono">YOU SELECTED</div>
            <div className="selected-tier-name" style=${{ '--tier-color': tier.color }}>${tier.name}</div>
            <div className="tier-summary-row" style=${{ marginTop: 14 }}>
              <div>
                <div className="mono muted micro">PROJECTED APY</div>
                <div className="tier-summary-apy">${projectedApy.toFixed(1)}% <${EstimateBadge} /></div>
              </div>
              <div className="tier-summary-riskcol">
                <div className="mono muted micro">RISK</div>
                <div className="tier-summary-risk">${tier.riskLabel}</div>
              </div>
            </div>
            <div style=${{ marginTop: 14 }}><${RiskMeter} level=${risk} /></div>
            <p className="tier-summary-blurb">${tier.blurb}</p>
          </div>

          <div className="card map-card-compact" style=${{ marginTop: 16 }}>
            <div className="card-label mono">WHERE IT SITS <${EstimateBadge} /></div>
            <${RiskRewardMap}
              tierId=${tierId}
              excludedCategories=${[]}
              onTierClick=${setTierId}
              mode="select"
              layers=${{ tiers: true, user: true, others: true, categories: false }}
            />
          </div>

          <button
            className="button button-orange start-btn"
            onClick=${handleStart}
            style=${{ marginTop: 16, width: '100%' }}
          >
            Start Earning
          </button>
          <p className="onboard-foot-note mono muted">
            Prediction Markets (new &amp; experimental) are available separately once you're in.
          </p>
        </div>
      </div>
    </div>
  `
}
