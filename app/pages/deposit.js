import { html, useState } from '../lib.js'
import { Loader, EstimateBadge } from '../components.js'
import { formatUSD } from '../mock-data.js'

export function DepositPage({ onComplete }) {
  const [stablecoin, setStablecoin] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const quickFills = [1000, 5000, 25000, 100000]

  const handleDeposit = () => {
    if (numAmount <= 0) return
    setLoading(true)
  }

  if (loading) {
    return html`<${Loader} message="Confirming deposit..." onDone=${() => onComplete(stablecoin, numAmount)} />`
  }

  return html`
    <div className="deposit-page">
      <div className="page-section-header">
        <span className="mono muted step-label">STEP 1 OF 2</span>
        <h2>Deposit Funds</h2>
        <p className="muted">Choose your stablecoin and amount to get started.</p>
      </div>

      <div className="deposit-form card">
        <div className="form-group">
          <label className="form-label mono">Stablecoin</label>
          <div className="segmented-toggle">
            <button
              className=${`seg-btn mono ${stablecoin === 'USDC' ? 'seg-active' : ''}`}
              onClick=${() => setStablecoin('USDC')}
            >USDC</button>
            <button
              className=${`seg-btn mono ${stablecoin === 'USDT' ? 'seg-active' : ''}`}
              onClick=${() => setStablecoin('USDT')}
            >USDT</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label mono">Amount</label>
          <div className="amount-input-wrap">
            <span className="amount-prefix">$</span>
            <input
              type="number"
              className="amount-input mono"
              placeholder="0.00"
              value=${amount}
              onInput=${(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="quick-fills">
            ${quickFills.map(v => html`
              <button
                key=${v}
                className="button quick-fill-btn mono"
                onClick=${() => setAmount(String(v))}
              >$${(v / 1000).toFixed(0)}k</button>
            `)}
            <button className="button quick-fill-btn mono" onClick=${() => setAmount('250000')}>Max</button>
          </div>
        </div>

        ${numAmount > 0 && html`
          <div className="deposit-preview">
            <p>You're depositing <strong>${formatUSD(numAmount)}</strong> in ${stablecoin}</p>
          </div>
        `}

        <button
          className=${`button button-orange deposit-btn ${numAmount <= 0 ? 'btn-disabled' : ''}`}
          onClick=${handleDeposit}
          disabled=${numAmount <= 0}
        >
          Deposit ${stablecoin}
        </button>
      </div>
    </div>
  `
}
