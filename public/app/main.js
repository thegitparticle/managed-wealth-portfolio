import { React, html, useState, useEffect, useCallback } from './lib.js'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
import { TIERS } from './mock-data.js'

import { MobileApp } from './mobile/mobile-app.js'
import { LandingPage } from './pages/landing.js'
import { DepositPage } from './pages/deposit.js'
import { RiskTierPage } from './pages/risk-tier.js'
import { DashboardPage } from './pages/dashboard.js'
import { DrillDownPage } from './pages/drill-down.js'
import { ManageFundsPage } from './pages/manage-funds.js'
import { RiskSettingsPage } from './pages/risk-settings.js'
import { ActivityPage } from './pages/activity.js'
import { HelpPage } from './pages/help.js'

function DesktopApp({ onSwitchDevice }) {
  const [page, setPage] = useState('landing')
  const [deposit, setDeposit] = useState(0)
  const [stablecoin, setStablecoin] = useState('USDC')
  const [tierId, setTierId] = useState(1)
  const [excludedCategories, setExcludedCategories] = useState([])

  const tier = TIERS.find(t => t.id === tierId)
  const tierName = tier ? tier.name : 'Stable'

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
        ${page === 'help' && html`<${HelpPage} navigate=${navigate} />`}
      </main>
      <${Footer} onSwitchDevice=${onSwitchDevice} />
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
              <button className=${`nav-btn mono ${page === 'help' ? 'nav-active' : ''}`} onClick=${() => navigate('help')}>Help</button>
            </nav>
          `}
          <${ThemeToggle} />
        </div>
      </div>
    </header>
  `
}

function Footer({ onSwitchDevice }) {
  return html`
    <footer className="footer">
      <div className="container">
        <p className="muted mono">Manage Wealth by Fere \u00B7 Demo Mode \u00B7 All data is simulated</p>
        ${onSwitchDevice && html`
          <button className="footer-switch mono" onClick=${onSwitchDevice}>\u2190 Switch to mobile view</button>
        `}
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

function DeviceChooser({ onChoose }) {
  return html`
    <div className="device-chooser">
      <div className="device-chooser-inner">
        <div className="device-brand">
          <h1>Manage Wealth</h1>
          <span className="muted mono">by Fere</span>
        </div>
        <p className="device-prompt mono">Choose how you want to view the demo</p>
        <div className="device-options">
          <button className="device-option" onClick=${() => onChoose('mobile')}>
            <div className="device-icon device-icon-mobile">
              <div className="device-phone"><span className="device-phone-notch"></span></div>
            </div>
            <span className="device-option-title">Mobile View</span>
            <span className="device-option-sub mono">Native iOS app experience · recommended</span>
          </button>
          <button className="device-option" onClick=${() => onChoose('desktop')}>
            <div className="device-icon device-icon-desktop">
              <div className="device-monitor"></div>
              <div className="device-stand"></div>
            </div>
            <span className="device-option-title">Desktop View</span>
            <span className="device-option-sub mono">Full dashboard layout</span>
          </button>
        </div>
        <p className="device-note mono muted">You can switch anytime · demo data is simulated</p>
      </div>
    </div>
  `
}

function Root() {
  const [device, setDevice] = useState(() => {
    try { return localStorage.getItem('device') } catch { return null }
  })

  // Apply stored theme (default dark) on first load so the chooser matches the brand.
  useEffect(() => {
    let theme = 'dark'
    try { theme = localStorage.getItem('theme') || 'dark' } catch {}
    document.documentElement.classList.toggle('dark', theme !== 'light')
  }, [])

  const choose = useCallback((d) => {
    try { localStorage.setItem('device', d) } catch {}
    setDevice(d)
  }, [])

  const reset = useCallback(() => {
    try { localStorage.removeItem('device') } catch {}
    setDevice(null)
  }, [])

  if (!device) return html`<${DeviceChooser} onChoose=${choose} />`
  if (device === 'mobile') return html`<${MobileApp} onSwitchDevice=${reset} />`
  return html`<${DesktopApp} onSwitchDevice=${reset} />`
}

const rootElement = document.getElementById('app')
if (!rootElement) throw new Error('Root element #app not found')
const root = createRoot(rootElement)
root.render(html`<${Root} />`)
