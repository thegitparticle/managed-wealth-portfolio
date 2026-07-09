import { html, useState, useEffect, useRef, useCallback } from './lib.js'
import { CATEGORIES, TIERS, EXPERIMENTAL, CATEGORY_COLORS, formatUSD, generateOtherUsers, computeProjectedAPY, computeRiskLevel } from './mock-data.js'

export function Loader({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 2500)
    return () => clearTimeout(t)
  }, [])
  return html`
    <div className="loader-overlay">
      <div className="loader-box card">
        <div className="loader-spinner"></div>
        <p className="mono loader-text">${message || 'Processing...'}</p>
      </div>
    </div>
  `
}

export function EstimateBadge() {
  return html`<span className="estimate-badge mono">EST.</span>`
}

export function DonutChart({ data, size, innerLabel }) {
  const canvasRef = useRef(null)
  const sz = size || 180

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = sz * dpr
    canvas.height = sz * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, sz, sz)

    const cx = sz / 2
    const cy = sz / 2
    const outerR = sz / 2 - 4
    const innerR = outerR * 0.62
    const total = data.reduce((s, d) => s + d.value, 0)
    if (total === 0) return

    let startAngle = -Math.PI / 2
    for (const segment of data) {
      const sweep = (segment.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep)
      ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = segment.color
      ctx.fill()
      startAngle += sweep
    }

    ctx.beginPath()
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2)
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#050505' : '#ffffff'
    ctx.fill()
  }, [data, sz])

  return html`
    <div className="donut-wrap" style=${{ width: sz, height: sz, position: 'relative' }}>
      <canvas ref=${canvasRef} style=${{ width: sz, height: sz }} />
      ${innerLabel && html`
        <div className="donut-label">${innerLabel}</div>
      `}
    </div>
  `
}

export function RiskRewardMap({ tierId, excludedCategories, onTierClick, onCategoryClick, mode, layers }) {
  const canvasRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [hoveredDot, setHoveredDot] = useState(null)
  const otherUsers = useRef(generateOtherUsers(60)).current
  const showLayers = layers || { tiers: true, user: true, others: true, categories: true }

  const W = 600
  const H = 360
  const PAD = { top: 30, right: 30, bottom: 50, left: 60 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const toX = useCallback((risk) => PAD.left + risk * plotW, [])
  const toY = useCallback((apy) => PAD.top + plotH - (Math.min(apy, 70) / 70) * plotH, [])

  const userRisk = computeRiskLevel(tierId, excludedCategories)
  const userApy = computeProjectedAPY(tierId, excludedCategories)

  const allDots = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const isDark = document.documentElement.classList.contains('dark')
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
    const textColor = isDark ? 'rgba(255,255,255,0.4)' : '#64748b'
    const axisColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'

    ctx.clearRect(0, 0, W, H)

    for (let i = 0; i <= 7; i++) {
      const y = toY(i * 10)
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(W - PAD.right, y)
      ctx.stroke()
      ctx.fillStyle = textColor
      ctx.font = '9px JetBrains Mono'
      ctx.textAlign = 'right'
      ctx.fillText(i * 10 + '%', PAD.left - 8, y + 3)
    }

    ctx.strokeStyle = axisColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, PAD.top)
    ctx.lineTo(PAD.left, H - PAD.bottom)
    ctx.lineTo(W - PAD.right, H - PAD.bottom)
    ctx.stroke()

    const riskLabels = ['Low', '', 'Medium', '', 'High']
    for (let i = 0; i < 5; i++) {
      const x = PAD.left + (i / 4) * plotW
      ctx.fillStyle = textColor
      ctx.font = '9px JetBrains Mono'
      ctx.textAlign = 'center'
      ctx.fillText(riskLabels[i], x, H - PAD.bottom + 18)
    }

    ctx.fillStyle = textColor
    ctx.font = '10px JetBrains Mono'
    ctx.textAlign = 'center'
    ctx.fillText('RISK \u2192', W / 2, H - 8)
    ctx.save()
    ctx.translate(14, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('PROJECTED APY \u2192', 0, 0)
    ctx.restore()

    const dots = []

    if (showLayers.others) {
      for (const u of otherUsers) {
        const x = toX(u.risk)
        const y = toY(u.apy)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
        ctx.fill()
        dots.push({ x, y, r: 3, type: 'other', label: 'Other user', risk: u.risk, apy: u.apy })
      }
    }

    if (showLayers.categories) {
      for (const cat of CATEGORIES) {
        const x = toX(cat.risk)
        const y = toY(cat.apy)
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = CATEGORY_COLORS[cat.id] || '#888'
        ctx.globalAlpha = 0.7
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = CATEGORY_COLORS[cat.id] || '#888'
        ctx.lineWidth = 1
        ctx.stroke()
        dots.push({ x, y, r: 6, type: 'category', label: cat.name, risk: cat.risk, apy: cat.apy, id: cat.id })
      }
    }

    if (showLayers.tiers) {
      const tierPoints = TIERS.map(t => ({
        x: toX(t.riskLevel),
        y: toY(computeProjectedAPY(t.id, excludedCategories)),
        tier: t,
      }))
      ctx.strokeStyle = isDark ? 'rgba(251,146,60,0.3)' : 'rgba(234,88,12,0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      for (let i = 0; i < tierPoints.length; i++) {
        if (i === 0) ctx.moveTo(tierPoints[i].x, tierPoints[i].y)
        else ctx.lineTo(tierPoints[i].x, tierPoints[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      for (const tp of tierPoints) {
        const isActive = tp.tier.id === tierId
        ctx.beginPath()
        ctx.arc(tp.x, tp.y, isActive ? 5 : 7, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? 'rgba(251,146,60,0.15)' : 'rgba(234,88,12,0.1)'
        ctx.fill()
        ctx.strokeStyle = isDark ? '#fb923c' : '#ea580c'
        ctx.lineWidth = isActive ? 2 : 1.5
        ctx.stroke()
        ctx.fillStyle = textColor
        ctx.font = '8px JetBrains Mono'
        ctx.textAlign = 'center'
        ctx.fillText(tp.tier.name, tp.x, tp.y - 12)
        dots.push({
          x: tp.x, y: tp.y, r: 7, type: 'tier',
          label: tp.tier.name,
          risk: tp.tier.riskLevel,
          apy: computeProjectedAPY(tp.tier.id, excludedCategories),
          tierId: tp.tier.id,
        })
      }
    }

    if (showLayers.user) {
      const ux = toX(userRisk)
      const uy = toY(userApy)
      ctx.beginPath()
      ctx.arc(ux, uy, 10, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#fb923c' : '#ea580c'
      ctx.fill()
      ctx.strokeStyle = isDark ? '#fff' : '#0f172a'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = isDark ? '#050505' : '#ffffff'
      ctx.font = 'bold 9px JetBrains Mono'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Y', ux, uy)
      ctx.textBaseline = 'alphabetic'
      dots.push({ x: ux, y: uy, r: 10, type: 'user', label: 'Your position', risk: userRisk, apy: userApy })
    }

    allDots.current = dots
  }, [tierId, excludedCategories, showLayers.tiers, showLayers.user, showLayers.others, showLayers.categories])

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    for (let i = allDots.current.length - 1; i >= 0; i--) {
      const d = allDots.current[i]
      const dist = Math.sqrt((mx - d.x) ** 2 + (my - d.y) ** 2)
      if (dist <= d.r + 4) {
        if (d.type === 'tier' && onTierClick) {
          onTierClick(d.tierId)
        } else if (d.type === 'category' && onCategoryClick) {
          onCategoryClick(d.id)
        }
        return
      }
    }
  }, [onTierClick, onCategoryClick])

  const handleCanvasMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    for (let i = allDots.current.length - 1; i >= 0; i--) {
      const d = allDots.current[i]
      const dist = Math.sqrt((mx - d.x) ** 2 + (my - d.y) ** 2)
      if (dist <= d.r + 4) {
        setTooltip({ x: e.clientX, y: e.clientY, label: d.label, risk: d.risk, apy: d.apy })
        setHoveredDot(d)
        canvas.style.cursor = (d.type === 'tier' && mode === 'select') ? 'pointer' : 'default'
        return
      }
    }
    setTooltip(null)
    setHoveredDot(null)
    canvas.style.cursor = 'default'
  }, [mode])

  return html`
    <div className="scatter-wrap" style=${{ position: 'relative' }}>
      <div className="scatter-legend">
        ${showLayers.user && html`<span className="legend-item"><span className="legend-dot legend-dot-user"></span> Your Position</span>`}
        ${showLayers.tiers && html`<span className="legend-item"><span className="legend-dot legend-dot-tier"></span> Risk Tiers</span>`}
        ${showLayers.others && html`<span className="legend-item"><span className="legend-dot legend-dot-others"></span> Other Users</span>`}
        ${showLayers.categories && html`<span className="legend-item"><span className="legend-dot legend-dot-cat"></span> Categories</span>`}
      </div>
      <canvas
        ref=${canvasRef}
        style=${{ width: W, height: H, maxWidth: '100%' }}
        onClick=${handleCanvasClick}
        onMouseMove=${handleCanvasMove}
        onMouseLeave=${() => { setTooltip(null); setHoveredDot(null) }}
      />
      ${tooltip && html`
        <div className="chart-tooltip mono" style=${{ left: 0, top: 0, transform: 'translate(-50%, -110%)', position: 'fixed', left: tooltip.x, top: tooltip.y }}>
          <strong>${tooltip.label}</strong><br />
          Risk: ${(tooltip.risk * 100).toFixed(0)}% · APY: ${tooltip.apy.toFixed(1)}%
        </div>
      `}
    </div>
  `
}

export function TierSelector({ value, onChange, excludedCategories }) {
  return html`
    <div className="tier-selector">
      ${TIERS.map(t => html`
        <button
          key=${t.id}
          className=${`tier-btn mono ${value === t.id ? 'tier-btn-active' : ''}`}
          onClick=${() => onChange(t.id)}
        >
          <span className="tier-btn-name">${t.name}</span>
          <span className="tier-btn-apy">${t.apyRange[0]}\u2013${t.apyRange[1]}%</span>
        </button>
      `)}
    </div>
  `
}

// Horizontal Lower→Higher risk meter with a marker at `level` (0..1).
export function RiskMeter({ level }) {
  const pct = Math.max(4, Math.min(96, (level || 0) * 100))
  return html`
    <div className="risk-meter">
      <div className="risk-meter-track">
        <span className="risk-meter-fill" style=${{ width: pct + '%' }}></span>
        <span className="risk-meter-marker" style=${{ left: pct + '%' }}></span>
      </div>
      <div className="risk-meter-ends mono">
        <span>Lower risk</span><span>Higher risk</span>
      </div>
    </div>
  `
}

// The three selectable strategy cards — the primary tier chooser.
export function TierCards({ value, onChange }) {
  return html`
    <div className="tier-cards">
      ${TIERS.map(t => {
        const active = value === t.id
        return html`
          <button
            key=${t.id}
            type="button"
            className=${`tier-card ${active ? 'tier-card-on' : ''}`}
            onClick=${() => onChange(t.id)}
            style=${{ '--tier-color': t.color }}
          >
            <span className="tier-card-rail"></span>
            <div className="tier-card-head">
              <span className="tier-card-name">${t.name}</span>
              <span className="tier-risk-pill mono">${t.riskLabel}</span>
            </div>
            <div className="tier-card-tag">${t.tagline}</div>
            <div className="tier-card-holds mono"><span className="muted">HOLDS</span> ${t.holds}</div>
            <div className="tier-card-apy">
              <span className="tier-card-apy-num">${t.apyRange[0]}–${t.apyRange[1]}%</span>
              <span className="tier-card-apy-lbl mono">est. APY</span>
            </div>
            ${active && html`<div className="tier-card-blurb">${t.blurb}</div>`}
          </button>
        `
      })}
    </div>
  `
}

// Clean, non-verbose risk/return read-out for a tier — used in settings & switch.
export function InlineTierSummary({ tierId }) {
  const t = TIERS.find(x => x.id === tierId)
  const apy = computeProjectedAPY(tierId, [])
  const risk = computeRiskLevel(tierId, [])
  if (!t) return null
  return html`
    <div className="tier-summary">
      <div className="tier-summary-row">
        <div>
          <div className="mono muted micro">PROJECTED APY</div>
          <div className="tier-summary-apy">${apy.toFixed(1)}% <${EstimateBadge} /></div>
        </div>
        <div className="tier-summary-riskcol">
          <div className="mono muted micro">RISK</div>
          <div className="tier-summary-risk">${t.riskLabel}</div>
        </div>
      </div>
      <${RiskMeter} level=${risk} />
      <p className="tier-summary-blurb">${t.blurb}</p>
    </div>
  `
}

// Prediction markets — surfaced separately as a new / experimental sleeve.
export function ExperimentalCard({ onLearnMore }) {
  return html`
    <div className="experimental-card">
      <div className="experimental-head">
        <span className="experimental-badge mono">${EXPERIMENTAL.badge}</span>
        <span className="experimental-name">${EXPERIMENTAL.name}</span>
      </div>
      <p className="experimental-desc">${EXPERIMENTAL.description}</p>
      <div className="experimental-foot">
        <span className="mono muted micro">Separate from your managed tiers · coming soon</span>
        ${onLearnMore && html`<button className="button experimental-btn mono" onClick=${onLearnMore}>Learn more</button>`}
      </div>
    </div>
  `
}

export function LineChart({ data, width, height, color }) {
  const canvasRef = useRef(null)
  const w = width || 300
  const h = height || 120

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length < 2) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const pad = { top: 10, right: 10, bottom: 20, left: 10 }
    const pW = w - pad.left - pad.right
    const pH = h - pad.top - pad.bottom

    const values = data.map(d => d.value)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const range = maxV - minV || 1

    const isDark = document.documentElement.classList.contains('dark')
    const lineColor = color || (isDark ? '#fb923c' : '#ea580c')

    ctx.beginPath()
    let lastY = 0
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1)) * pW
      const y = pad.top + pH - ((data[i].value - minV) / range) * pH
      if (i === 0) { ctx.moveTo(x, y); lastY = y }
      else {
        ctx.lineTo(x, lastY)
        ctx.lineTo(x, y)
        lastY = y
      }
    }
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.lineTo(pad.left + pW, pad.top + pH)
    ctx.lineTo(pad.left, pad.top + pH)
    ctx.closePath()
    ctx.fillStyle = lineColor.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', '')
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + pH)
    gradient.addColorStop(0, lineColor + '20')
    gradient.addColorStop(1, lineColor + '02')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : '#64748b'
    ctx.font = '8px JetBrains Mono'
    ctx.textAlign = 'left'
    ctx.fillText(data[0].date.slice(5), pad.left, h - 4)
    ctx.textAlign = 'right'
    ctx.fillText(data[data.length - 1].date.slice(5), w - pad.right, h - 4)
  }, [data, w, h, color])

  return html`<canvas ref=${canvasRef} style=${{ width: w, height: h, maxWidth: '100%' }} />`
}
