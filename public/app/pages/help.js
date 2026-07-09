import { html, useState } from '../lib.js'
import { RiskMeter, EstimateBadge } from '../components.js'
import { TIERS, EXPERIMENTAL, FAQ, computeRiskLevel } from '../mock-data.js'

export function HelpPage({ navigate }) {
  const [openFaq, setOpenFaq] = useState(0)

  return html`
    <div className="help-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>← Dashboard</button>
        <h2>How it works</h2>
        <p className="muted">Deposit dollars, pick a strategy, and the system earns for you. Here's the detail.</p>
      </div>

      <div className="help-intro card">
        <p>
          You choose one of three strategies. Each one <strong>holds a different kind of asset and earns yield
          on top of it</strong> — the safer the asset, the lower the risk and return. You never pick individual
          strategies; the system handles all routing and rebalancing automatically. Switch tiers anytime, no lock-up.
        </p>
      </div>

      <div className="section-header"><h3>The three strategies</h3></div>
      <div className="help-tiers">
        ${TIERS.map(t => {
          const risk = computeRiskLevel(t.id, [])
          return html`
            <div key=${t.id} className="card help-tier" style=${{ '--tier-color': t.color }}>
              <span className="tier-card-rail"></span>
              <div className="help-tier-head">
                <span className="tier-card-name">${t.name}</span>
                <span className="tier-risk-pill mono">${t.riskLabel}</span>
              </div>
              <div className="help-tier-meta mono">
                <span><span className="muted">HOLDS</span> ${t.holds}</span>
                <span><span className="muted">EST. APY</span> ${t.apyRange[0]}–${t.apyRange[1]}% <${EstimateBadge} /></span>
              </div>
              <${RiskMeter} level=${risk} />
              <p className="help-tier-body">${t.long}</p>
            </div>
          `
        })}
      </div>

      <div className="section-header" style=${{ marginTop: 8 }}><h3>Beyond your tiers</h3></div>
      <div className="card help-experimental" style=${{ '--tier-color': '#dc2626' }}>
        <div className="help-tier-head">
          <span className="tier-card-name">${EXPERIMENTAL.name}</span>
          <span className="experimental-badge mono">${EXPERIMENTAL.badge}</span>
        </div>
        <p className="help-tier-body">${EXPERIMENTAL.long}</p>
      </div>

      <div className="section-header" style=${{ marginTop: 8 }}><h3>Questions</h3></div>
      <div className="faq-list">
        ${FAQ.map((item, i) => {
          const open = openFaq === i
          return html`
            <div key=${i} className=${`card faq-item ${open ? 'faq-open' : ''}`}>
              <button className="faq-q" onClick=${() => setOpenFaq(open ? -1 : i)}>
                <span>${item.q}</span>
                <span className="faq-chevron mono">${open ? '−' : '+'}</span>
              </button>
              ${open && html`<p className="faq-a">${item.a}</p>`}
            </div>
          `
        })}
      </div>

      <p className="help-foot mono muted">
        All figures are estimates and all data here is simulated for the demo. Forward-looking numbers wear an <${EstimateBadge} /> badge.
      </p>
    </div>
  `
}
