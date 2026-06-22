import { html } from '../lib.js'

export function LandingPage({ onContinue }) {
  return html`
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-eyebrow mono">MANAGED CRYPTO YIELD</div>
        <h1 className="landing-title">Deposit dollars.<br />Pick your risk.<br />Let the system earn.</h1>
        <p className="landing-subtitle">
          A single-deposit, AI-allocated portal. Your capital is routed across diversified strategy baskets — you steer with a risk dial, the system handles everything else.
        </p>
        <button className="button button-orange landing-cta" onClick=${onContinue}>
          Continue with Google
        </button>
        <p className="landing-note mono muted">Demo mode — no real auth required</p>
      </div>
      <div className="landing-features">
        <div className="card landing-feature">
          <div className="card-label mono">5 Risk Tiers</div>
          <div className="landing-feature-text">From Preserve (4–8% APY) to Aggressive (35%+ APY)</div>
        </div>
        <div className="card landing-feature">
          <div className="card-label mono">AI Allocation</div>
          <div className="landing-feature-text">Capital automatically routed across 6 strategy categories</div>
        </div>
        <div className="card landing-feature">
          <div className="card-label mono">Full Transparency</div>
          <div className="landing-feature-text">Every on-chain action logged with tx hash verification</div>
        </div>
      </div>
    </div>
  `
}
