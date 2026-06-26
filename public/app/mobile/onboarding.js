import { html, useState } from '../lib.js'
import { RiskRewardMap } from '../components.js'
import { Segmented, Switch, Card, Button, MLoader, Icon } from './ui.js'
import {
  TIERS, CATEGORIES, CATEGORY_COLORS, formatUSD,
  computeProjectedAPY,
} from '../mock-data.js'

/* --- Landing --- */
export function MLanding({ onContinue, onSwitchDevice }) {
  return html`
    <div className="m-landing">
      <div className="m-landing-top">
        <div className="m-logo-mark">F</div>
        <div className="m-eyebrow">MANAGE WEALTH BY FERE</div>
        <h1 className="m-landing-title">Deposit dollars.<br/>Pick your risk.<br/><span className="m-accent-text">Let the system earn.</span></h1>
        <p className="m-landing-sub">A single-deposit, AI-allocated portal. Your capital is routed across diversified strategy baskets — you steer with a risk dial.</p>
      </div>

      <div className="m-landing-features">
        ${[
          ['5 Risk Tiers', 'Preserve (4–8%) to Aggressive (35%+)'],
          ['AI Allocation', 'Routed across 6 strategy categories'],
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

/* --- Risk tier (Step 2) --- */
export function MRiskTier({ onComplete }) {
  const [tierId, setTierId] = useState(3)
  const [excluded, setExcluded] = useState([])
  const [loading, setLoading] = useState(false)

  const projectedApy = computeProjectedAPY(tierId, excluded)
  const tier = TIERS.find(t => t.id === tierId)
  const activeCount = CATEGORIES.filter(c => !excluded.includes(c.id)).length
  const needsWarning = activeCount === 0

  const toggleCat = (catId) => {
    setExcluded(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
  }

  if (loading) {
    return html`<${MLoader} message="Allocating your capital…" onDone=${() => onComplete(tierId, excluded)} />`
  }

  return html`
    <div className="m-flow">
      <div className="m-step-pill">STEP 2 OF 2</div>
      <h2 className="m-flow-title">Set your risk profile</h2>
      <p className="m-flow-sub">Tap a tier on the map, then fine-tune below.</p>

      <${Card} className="m-apy-hero">
        <div className="m-apy-hero-label">PROJECTED APY <span className="m-est">EST</span></div>
        <div className="m-apy-hero-value">${projectedApy.toFixed(1)}%</div>
        <div className="m-apy-hero-sub">${tier.name} · ${tier.apyRange[0]}–${tier.apyRange[1]}% range</div>
      </${Card}>

      <${Card} className="m-map-card">
        <${RiskRewardMap}
          tierId=${tierId} excludedCategories=${excluded}
          onTierClick=${setTierId} mode="select"
          layers=${{ tiers: true, user: true, others: true, categories: true }}
        />
      </${Card}>

      <label className="m-field-label">TIER</label>
      <div className="m-tier-scroller">
        ${TIERS.map(t => html`
          <button key=${t.id} className=${`m-tier-card ${tierId === t.id ? 'm-tier-card-on' : ''}`} onClick=${() => setTierId(t.id)}>
            <span className="m-tier-card-name">${t.name}</span>
            <span className="m-tier-card-apy">${t.apyRange[0]}–${t.apyRange[1]}%</span>
          </button>
        `)}
      </div>

      <label className="m-field-label">CATEGORY EXCLUSIONS</label>
      <${Card} className="m-list">
        ${CATEGORIES.map((cat, i) => html`
          <div key=${cat.id} className=${`m-list-row ${i === CATEGORIES.length - 1 ? 'm-list-row-last' : ''}`}>
            <span className="m-cat-dot" style=${{ background: CATEGORY_COLORS[cat.id] }}></span>
            <span className="m-list-row-name">${cat.name}</span>
            <${Switch} on=${!excluded.includes(cat.id)} onChange=${() => toggleCat(cat.id)} />
          </div>
        `)}
      </${Card}>
      ${needsWarning && html`<div className="m-warn">At least one category must be active.</div>`}

      <div className="m-flow-foot">
        <${Button} kind="primary" disabled=${needsWarning} onClick=${() => setLoading(true)}>Start earning</${Button}>
      </div>
    </div>
  `
}
