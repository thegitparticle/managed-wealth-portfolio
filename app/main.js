import { React, html, useState, useEffect, useCallback } from './lib.js'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
import { TIERS } from './mock-data.js'

import { LandingPage } from './pages/landing.js'
import { DepositPage } from './pages/deposit.js'
import { RiskTierPage } from './pages/risk-tier.js'
import { DashboardPage } from './pages/dashboard.js'
import { DrillDownPage } from './pages/drill-down.js'
import { ManageFundsPage } from './pages/manage-funds.js'
import { RiskSettingsPage } from './pages/risk-settings.js'
import { ActivityPage } from './pages/activity.js'

function App() {
  const [page, setPage] = useState('landing')
  const [deposit, setDeposit] = useState(0)
  const [stablecoin, setStablecoin] = useState('USDC')
  const [tierId, setTierId] = useState(3)
  const [excludedCategories, setExcludedCategories] = useState([])

  const tier = TIERS.find(t => t.id === tierId)
  const tierName = tier ? tier.name : 'Balanced'

  const state = { deposit, stablecoin, tierId, excludedCategories, tierName }

  const navigate = useCallback((p) => setPage(p), [])

  const handleDepositComplete = useCallback((sc, amount) => {
    setStablecoin(sc)
    setDeposit(amount)
    setPage('risk-tier')
  }, [])

  const handleRiskComplete = useCallback((tid, excluded) => {
    setTierId(tid)
    setExcludedCategories(excluded)
    setPage('dashboard')
  }, [])

  const handleTierSwitch = useCallback((newTierId) => {
    setTierId(newTierId)
  }, [])

  const handleAddFunds = useCallback((amount) => {
    setDeposit(prev => prev + amount)
    setPage('dashboard')
  }, [])

  const handleWithdraw = useCallback((amount) => {
    setDeposit(prev => Math.max(0, prev - amount))
    setPage('dashboard')
  }, [])

  const handleWithdrawAll = useCallback(() => {
    setDeposit(0)
    setPage('landing')
  }, [])

  const handleRiskApply = useCallback((newTier, newExcluded) => {
    setTierId(newTier)
    setExcludedCategories(newExcluded)
  }, [])

  const showNav = page !== 'landing' && page !== 'deposit' && page !== 'risk-tier'

  return html`
    <div className="page">
      <${Header} page=${page} navigate=${navigate} showNav=${showNav} deposit=${deposit} />
      <main className="container">
        ${page === 'landing' && html`<${LandingPage} onContinue=${() => setPage('deposit')} />`}
        ${page === 'deposit' && html`<${DepositPage} onComplete=${handleDepositComplete} />`}
        ${page === 'risk-tier' && html`<${RiskTierPage} onComplete=${handleRiskComplete} />`}
        ${page === 'dashboard' && html`<${DashboardPage} state=${state} navigate=${navigate} onTierSwitch=${handleTierSwitch} />`}
        ${page === 'drill-down' && html`<${DrillDownPage} state=${state} navigate=${navigate} />`}
        ${page === 'manage-funds' && html`<${ManageFundsPage} state=${state} navigate=${navigate} onDeposit=${handleAddFunds} onWithdraw=${handleWithdraw} onWithdrawAll=${handleWithdrawAll} />`}
        ${page === 'risk-settings' && html`<${RiskSettingsPage} state=${state} navigate=${navigate} onApply=${handleRiskApply} />`}
        ${page === 'activity' && html`<${ActivityPage} state=${state} navigate=${navigate} />`}
      </main>
      <${Footer} />
    </div>
  `
}

function Header({ page, navigate, showNav, deposit }) {
  return html`
    <header className="header">
      <div className="container header-inner">
        <div className="brand" onClick=${() => showNav && navigate('dashboard')} style=${{ cursor: showNav ? 'pointer' : 'default' }}>
          <h1>Manage Wealth</h1>
          <span className="muted mono">by Fere</span>
        </div>
        <div className="controls">
          ${showNav && html`
            <nav className="header-nav">
              <button className=${`nav-btn mono ${page === 'dashboard' ? 'nav-active' : ''}`} onClick=${() => navigate('dashboard')}>Dashboard</button>
              <button className=${`nav-btn mono ${page === 'drill-down' ? 'nav-active' : ''}`} onClick=${() => navigate('drill-down')}>Allocation</button>
              <button className=${`nav-btn mono ${page === 'manage-funds' ? 'nav-active' : ''}`} onClick=${() => navigate('manage-funds')}>Funds</button>
              <button className=${`nav-btn mono ${page === 'activity' ? 'nav-active' : ''}`} onClick=${() => navigate('activity')}>Activity</button>
            </nav>
          `}
          <${ThemeToggle} />
        </div>
      </div>
    </header>
  `
}

function Footer() {
  return html`
    <footer className="footer">
      <div className="container">
        <p className="muted mono">Manage Wealth by Fere \u00B7 Demo Mode \u00B7 All data is simulated</p>
      </div>
    </footer>
  `
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [theme])

  return html`
    <button className="button button-green" onClick=${() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      ${theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  `
}

const rootElement = document.getElementById('app')
if (!rootElement) throw new Error('Root element #app not found')
const root = createRoot(rootElement)
root.render(html`<${App} />`)
