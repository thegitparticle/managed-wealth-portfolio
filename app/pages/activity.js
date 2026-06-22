import { html, useState, useMemo } from '../lib.js'
import { CATEGORIES, generateActivityLog, formatUSD } from '../mock-data.js'

export function ActivityPage({ state, navigate }) {
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const tier = useMemo(() => state.tierName, [state.tierName])
  const events = useMemo(
    () => generateActivityLog(state.deposit, tier),
    [state.deposit, tier]
  )

  const filtered = useMemo(() => {
    let list = events
    if (filterType !== 'all') {
      list = list.filter(e => e.type === filterType)
    }
    if (filterCategory !== 'all') {
      list = list.filter(e => e.categoryId === filterCategory)
    }
    return list
  }, [events, filterType, filterCategory])

  const typeOptions = ['all', 'deposit', 'withdrawal', 'rebalance', 'tier_change', 'trade']
  const catOptions = ['all', ...CATEGORIES.map(c => c.id)]

  return html`
    <div className="activity-page">
      <div className="page-section-header">
        <button className="button mono back-btn" onClick=${() => navigate('dashboard')}>\u2190 Dashboard</button>
        <h2>Activity</h2>
        <p className="muted">Read-only ledger of all on-chain actions.</p>
      </div>

      <div className="activity-filters">
        <div className="filter-group">
          <label className="form-label mono">Type</label>
          <select className="filter-select mono" value=${filterType} onChange=${(e) => setFilterType(e.target.value)}>
            ${typeOptions.map(t => html`<option key=${t} value=${t}>${t === 'all' ? 'All Types' : t.replace('_', ' ')}</option>`)}
          </select>
        </div>
        <div className="filter-group">
          <label className="form-label mono">Category</label>
          <select className="filter-select mono" value=${filterCategory} onChange=${(e) => setFilterCategory(e.target.value)}>
            ${catOptions.map(c => {
              const cat = CATEGORIES.find(ca => ca.id === c)
              return html`<option key=${c} value=${c}>${c === 'all' ? 'All Categories' : cat ? cat.name : c}</option>`
            })}
          </select>
        </div>
      </div>

      <div className="activity-feed">
        ${filtered.map(event => html`
          <div key=${event.id} className="activity-row card">
            <div className="activity-row-main">
              <div className="activity-row-left">
                <span className=${`activity-type-badge mono type-${event.type}`}>${event.type.replace('_', ' ')}</span>
                <div>
                  <div className="activity-desc">${event.description}</div>
                  <div className="activity-meta mono muted">
                    ${event.category} · ${formatUSD(event.amount)}
                  </div>
                </div>
              </div>
              <div className="activity-row-right mono">
                <span className="activity-time">${new Date(event.timestamp).toLocaleString()}</span>
                <a
                  className="activity-tx"
                  href=${event.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${event.txHash.slice(0, 8)}...${event.txHash.slice(-6)}
                </a>
              </div>
            </div>
          </div>
        `)}
        ${filtered.length === 0 && html`
          <div className="card" style=${{ textAlign: 'center', padding: 40 }}>
            <p className="muted mono">No matching events.</p>
          </div>
        `}
      </div>
    </div>
  `
}
