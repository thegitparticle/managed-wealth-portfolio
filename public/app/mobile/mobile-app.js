import { html, useState, useEffect, useCallback } from '../lib.js'
import { TIERS } from '../mock-data.js'
import { StatusBar, Icon } from './ui.js'
import { MLanding, MDeposit, MRiskTier } from './onboarding.js'
import { MDashboard, MAllocation, MFunds, MRiskSettings, MActivity } from './screens.js'

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Icon.home },
  { id: 'allocation', label: 'Allocation', icon: Icon.pie },
  { id: 'funds', label: 'Funds', icon: Icon.wallet },
  { id: 'activity', label: 'Activity', icon: Icon.pulse },
]

const ONBOARDING = ['landing', 'deposit', 'risk-tier']

export function MobileApp({ onSwitchDevice }) {
  const [page, setPage] = useState('landing')
  const [deposit, setDeposit] = useState(0)
  const [stablecoin, setStablecoin] = useState('USDC')
  const [tierId, setTierId] = useState(3)
  const [excludedCategories, setExcludedCategories] = useState([])

  // Mobile demo defaults to dark (iOS OLED) — ensure it on mount.
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const tier = TIERS.find(t => t.id === tierId)
  const state = { deposit, stablecoin, tierId, excludedCategories, tierName: tier ? tier.name : 'Balanced' }

  const navigate = useCallback((p) => {
    setPage(p)
    const scroller = document.querySelector('.m-scroll')
    if (scroller) scroller.scrollTo({ top: 0 })
  }, [])

  const onDepositComplete = (sc, amt) => { setStablecoin(sc); setDeposit(amt); navigate('risk-tier') }
  const onRiskComplete = (tid, ex) => { setTierId(tid); setExcludedCategories(ex); navigate('dashboard') }
  const onTierSwitch = (tid) => setTierId(tid)
  const onAddFunds = (amt) => { setDeposit(p => p + amt); navigate('dashboard') }
  const onWithdraw = (amt) => { setDeposit(p => Math.max(0, p - amt)); navigate('dashboard') }
  const onWithdrawAll = () => { setDeposit(0); navigate('landing') }
  const onRiskApply = (t, ex) => { setTierId(t); setExcludedCategories(ex) }

  const isOnboarding = ONBOARDING.includes(page)
  const showTabBar = !isOnboarding

  return html`
    <div className="m-root">
    <div className="m-device">
      <${StatusBar} />
      <div className=${`m-scroll ${showTabBar ? 'm-scroll-tabbed' : ''}`}>
        ${page === 'landing' && html`<${MLanding} onContinue=${() => navigate('deposit')} onSwitchDevice=${onSwitchDevice} />`}
        ${page === 'deposit' && html`<${MDeposit} onComplete=${onDepositComplete} />`}
        ${page === 'risk-tier' && html`<${MRiskTier} onComplete=${onRiskComplete} />`}
        ${page === 'dashboard' && html`<${MDashboard} state=${state} navigate=${navigate} onTierSwitch=${onTierSwitch} />`}
        ${page === 'allocation' && html`<${MAllocation} state=${state} navigate=${navigate} />`}
        ${page === 'funds' && html`<${MFunds} state=${state} onDeposit=${onAddFunds} onWithdraw=${onWithdraw} onWithdrawAll=${onWithdrawAll} />`}
        ${page === 'risk-settings' && html`<${MRiskSettings} state=${state} navigate=${navigate} onApply=${onRiskApply} />`}
        ${page === 'activity' && html`<${MActivity} state=${state} navigate=${navigate} />`}
      </div>

      ${showTabBar && html`
        <nav className="m-tabbar">
          ${TABS.map(t => html`
            <button key=${t.id} className=${`m-tab ${page === t.id ? 'm-tab-on' : ''}`} onClick=${() => navigate(t.id)}>
              <${t.icon} size=${24} stroke=${page === t.id ? 2.3 : 1.9} />
              <span>${t.label}</span>
            </button>
          `)}
        </nav>
      `}
      <div className="m-home-indicator"></div>
    </div>
    </div>
  `
}
