import { html, useState } from '../lib.js'
import { RiskMeter } from '../components.js'
import { Segmented, Card, Button, MLoader } from './ui.js'
import {
  TIERS, formatUSD, computeProjectedAPY, computeRiskLevel,
} from '../mock-data.js'

/* --- Landing --- */
export function MLanding({ onContinue, onSwitchDevice }) {
  return html`
    <div className="m-landing">
      <div className="m-landing-top">
        <div className="m-logo-mark">F</div>
        <div className="m-eyebrow">MANAGE WEALTH BY FERE</div>
        <h1 className="m-landing-title">Deposit dollars.<br/>Pick your risk.<br/><span className="m-accent-text">Let the system earn.</span></h1>
        <p className="m-landing-sub">A single-deposit, AI-managed portal. Your money holds an asset class and earns yield on top — you just pick one of three strategies.</p>
      </div>

      <div className="m-landing-features">
        ${[
          ['3 Simple Strategies', 'Stable · Blue-Chip · Growth'],
          ['Yield On Everything', 'Own the asset, earn extra on top'],
          ['Full Transparency', 'Every action logged on-chain'],
        ].map(([t, d]) => html`
          <div key=${t} className="m-feature-row">
            <div className="m-feature-dot"></div>
            <div><div className="m-feature-title">${t}</div><div className="m-feature-desc">${d}</div></div>
          </div>
        `)}
      </div>

      <div className="m-landing-cta">
        <${Button} kind="primary" onClick=${onContinue}>Continue with Google</${Button}>
        <button className="m-text-link" onClick=${onSwitchDevice}>Demo mode · switch to desktop view</button>
      </div>
    </div>
  `
}

/* --- Deposit (Step 1) --- */
export function MDeposit({ onComplete }) {
  const [stablecoin, setStablecoin] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const numAmount = parseFloat(amount) || 0
  const quickFills = [1000, 5000, 25000, 100000]

  if (loading) {
    return html`<${MLoader} message="Confirming deposit…" onDone=${() => onComplete(stablecoin, numAmount)} />`
  }

  return html`
    <div className="m-flow">
      <div className="m-step-pill">STEP 1 OF 2</div>
      <h2 className="m-flow-title">Deposit funds</h2>
      <p className="m-flow-sub">Choose a stablecoin and amount to get started.</p>

      <label className="m-field-label">STABLECOIN</label>
      <${Segmented} options=${['USDC', 'USDT']} value=${stablecoin} onChange=${setStablecoin} />

      <label className="m-field-label" style=${{ marginTop: 22 }}>AMOUNT</label>
      <div className="m-amount-field">
        <span className="m-amount-prefix">$</span>
        <input
          type="number" inputMode="decimal" className="m-amount-input"
          placeholder="0" value=${amount}
          onInput=${(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="m-chips">
        ${quickFills.map(v => html`<button key=${v} className="m-chip" onClick=${() => setAmount(String(v))}>$${(v / 1000).toFixed(0)}k</button>`)}
        <button className="m-chip" onClick=${() => setAmount('250000')}>Max</button>
      </div>

      ${numAmount > 0 && html`
        <${Card} className="m-preview">You're depositing <strong>${formatUSD(numAmount)}</strong> in ${stablecoin}</${Card}>
      `}

      <div className="m-flow-foot">
        <${Button} kind="primary" disabled=${numAmount <= 0} onClick=${() => setLoading(true)}>Deposit ${stablecoin}</${Button}>
      </div>
    </div>
  `
}

/* --- Choose strategy (Step 2) --- */
export function MRiskTier({ onComplete }) {
  const [tierId, setTierId] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showLearn, setShowLearn] = useState(false)

  const tier = TIERS.find(t => t.id === tierId)
  const projectedApy = computeProjectedAPY(tierId, [])
  const risk = computeRiskLevel(tierId, [])

  if (loading) {
    return html`<${MLoader} message="Allocating your capital…" onDone=${() => onComplete(tierId, [])} />`
  }

  return html`
    <div className="m-flow">
      <div className="m-step-pill">STEP 2 OF 2</div>
      <h2 className="m-flow-title">Choose your strategy</h2>
      <p className="m-flow-sub">Each holds different assets and earns yield on top. Change anytime.</p>

      <div className="m-strat-picker">
        ${TIERS.map(t => {
          const active = tierId === t.id
          return html`
            <button
              key=${t.id}
              type="button"
              className=${`m-strat-card ${active ? 'm-strat-on' : ''}`}
              onClick=${() => { setTierId(t.id); setShowLearn(false) }}
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

      <${Card} className="m-apy-hero" style=${{ marginTop: 18 }}>
        <div className="m-apy-hero-label">${tier.name.toUpperCase()} · PROJECTED APY <span className="m-est">EST</span></div>
        <div className="m-apy-hero-value">${projectedApy.toFixed(1)}%</div>
        <div className="m-apy-hero-sub">${tier.riskLabel} risk</div>
        <div style=${{ marginTop: 12 }}><${RiskMeter} level=${risk} /></div>
      </${Card}>

      <button className="m-learn-toggle" onClick=${() => setShowLearn(!showLearn)}>
        How does ${tier.name} work? <span>${showLearn ? '▲' : '▼'}</span>
      </button>
      ${showLearn && html`<${Card} className="m-learn-body">${tier.long}</${Card}>`}

      <p className="m-onboard-note">Prediction Markets (new &amp; experimental) are available separately once you're in.</p>

      <div className="m-flow-foot">
        <${Button} kind="primary" onClick=${() => setLoading(true)}>Start earning</${Button}>
      </div>
    </div>
  `
}
