import { html, useState } from '../lib.js'
import { Loader } from '../components.js'
import { formatUSD } from '../mock-data.js'

export function ManageFundsPage({ state, navigate, onDeposit, onWithdraw, onWithdrawAll }) {
  const [tab, setTab] = useState('add')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [confirmWithdrawAll, setConfirmWithdrawAll] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const quickFills = [1000, 5000, 25000]

  const handleAdd = () => {
    if (numAmount <= 0) return
    setLoadingMsg('Depositing & rebalancing...')
    setLoading(true)
  }

  const handleWithdraw = () => {
    if (numAmount <= 0 || numAmount > state.deposit) return
    setLoadingMsg('Processing withdrawal...')
    setLoading(true)
  }

  const handleWithdrawAll = () => {
    setLoadingMsg('Withdrawing all funds...')
    setConfirmWithdrawAll(false)
    setLoading(true)
  }

  const handleDone = () => {
    setLoading(false)
    if (tab === 'add') {
      onDeposit(numAmount)
    } else if (tab === 'withdraw') {
      onWithdraw(numAmount)
    } else {
      onWithdrawAll()
    }
    setAmount('')
  }

  if (loading) {
    return html`<${Loader} message=${loadingMsg} onDone=${handleDone} />`
  }

  const remaining = state.deposit - numAmount

  return html`
    <div className="manage-funds-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>\u2190 Dashboard</button>
        <h2>Manage Funds</h2>
        <p className="muted">Current balance: ${formatUSD(state.deposit)}</p>
      </div>

      <div className="tab-bar">
        <button className=${`seg-btn mono ${tab === 'add' ? 'seg-active' : ''}`} onClick=${() => { setTab('add'); setAmount('') }}>Add Funds</button>
        <button className=${`seg-btn mono ${tab === 'withdraw' ? 'seg-active' : ''}`} onClick=${() => { setTab('withdraw'); setAmount('') }}>Withdraw</button>
        <button className=${`seg-btn mono ${tab === 'withdraw-all' ? 'seg-active' : ''}`} onClick=${() => { setTab('withdraw-all'); setAmount('') }}>Withdraw All</button>
      </div>

      ${tab === 'add' && html`
        <div className="card manage-form">
          <div className="form-group">
            <label className="form-label mono">Amount to Add (${state.stablecoin})</label>
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
                <button key=${v} className="button quick-fill-btn mono" onClick=${() => setAmount(String(v))}>$${(v / 1000).toFixed(0)}k</button>
              `)}
            </div>
          </div>
          ${numAmount > 0 && html`
            <div className="deposit-preview">
              <p>New balance after deposit: <strong>${formatUSD(state.deposit + numAmount)}</strong></p>
              <p className="muted mono" style=${{ fontSize: '0.75rem' }}>Allocation will rebalance into existing tier.</p>
            </div>
          `}
          <button
            className=${`button button-green deposit-btn ${numAmount <= 0 ? 'btn-disabled' : ''}`}
            onClick=${handleAdd}
            disabled=${numAmount <= 0}
          >Add Funds</button>
        </div>
      `}

      ${tab === 'withdraw' && html`
        <div className="card manage-form">
          <div className="form-group">
            <label className="form-label mono">Amount to Withdraw</label>
            <div className="amount-input-wrap">
              <span className="amount-prefix">$</span>
              <input
                type="number"
                className="amount-input mono"
                placeholder="0.00"
                max=${state.deposit}
                value=${amount}
                onInput=${(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="quick-fills">
              ${quickFills.filter(v => v <= state.deposit).map(v => html`
                <button key=${v} className="button quick-fill-btn mono" onClick=${() => setAmount(String(v))}>$${(v / 1000).toFixed(0)}k</button>
              `)}
            </div>
          </div>
          ${numAmount > 0 && numAmount <= state.deposit && html`
            <div className="deposit-preview">
              <p>New balance after withdrawal: <strong>${formatUSD(remaining)}</strong></p>
              <p className="muted mono" style=${{ fontSize: '0.75rem' }}>Allocation will rebalance proportionally.</p>
            </div>
          `}
          ${numAmount > state.deposit && html`
            <div className="warning-note mono">Amount exceeds available balance.</div>
          `}
          <button
            className=${`button button-orange deposit-btn ${numAmount <= 0 || numAmount > state.deposit ? 'btn-disabled' : ''}`}
            onClick=${handleWithdraw}
            disabled=${numAmount <= 0 || numAmount > state.deposit}
          >Withdraw</button>
        </div>
      `}

      ${tab === 'withdraw-all' && html`
        <div className="card manage-form">
          <div className="withdraw-all-info">
            <p>Withdraw your entire balance and close all positions.</p>
            <div className="card-value" style=${{ margin: '16px 0' }}>${formatUSD(state.deposit)}</div>
          </div>
          ${!confirmWithdrawAll && html`
            <button className="button button-orange deposit-btn" onClick=${() => setConfirmWithdrawAll(true)}>
              Withdraw All
            </button>
          `}
          ${confirmWithdrawAll && html`
            <div className="confirm-box">
              <p className="mono" style=${{ fontSize: '0.85rem' }}>Withdraw entire ${formatUSD(state.deposit)} and close all positions?</p>
              <div style=${{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button className="button" onClick=${() => setConfirmWithdrawAll(false)}>Cancel</button>
                <button className="button button-orange" onClick=${handleWithdrawAll}>Confirm Withdrawal</button>
              </div>
            </div>
          `}
        </div>
      `}
    </div>
  `
}
