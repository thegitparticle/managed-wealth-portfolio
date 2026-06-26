import { html, useState, useEffect, useRef } from '../lib.js'

/* ============================================================
   iOS-style mobile UI primitives
   ============================================================ */

// --- SF-style stroke icons (24x24 viewBox) ---
export const Icon = {
  home: (a) => svg(a, '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5"/>'),
  pie: (a) => svg(a, '<path d="M12 3a9 9 0 1 0 9 9h-9Z"/><path d="M12 3v9h9"/>'),
  wallet: (a) => svg(a, '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none"/>'),
  pulse: (a) => svg(a, '<path d="M3 12h4l2.5-7 4 14 2.5-7H21"/>'),
  gear: (a) => svg(a, '<path d="M4 8h7M16 8h4M4 16h4M13 16h7"/><circle cx="13.5" cy="8" r="2.4"/><circle cx="10.5" cy="16" r="2.4"/>'),
  chevronLeft: (a) => svg(a, '<path d="M15 5l-7 7 7 7"/>'),
  chevronRight: (a) => svg(a, '<path d="M9 5l7 7-7 7"/>'),
  plus: (a) => svg(a, '<path d="M12 5v14M5 12h14"/>'),
  arrowUp: (a) => svg(a, '<path d="M12 19V5M5 12l7-7 7 7"/>'),
  arrowDown: (a) => svg(a, '<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  external: (a) => svg(a, '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5"/>'),
  check: (a) => svg(a, '<path d="M4 12.5 9 17.5 20 6.5"/>'),
  sun: (a) => svg(a, '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>'),
  moon: (a) => svg(a, '<path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z"/>'),
}

function svg(attrs = {}, inner) {
  const { size = 24, className = '', stroke = 2, ...rest } = attrs
  return html`<svg
    width=${size} height=${size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth=${stroke} strokeLinecap="round" strokeLinejoin="round"
    className=${className} ...${rest}
    dangerouslySetInnerHTML=${{ __html: inner }}
  />`
}

// --- Status bar (time + signal/wifi/battery) ---
export function StatusBar() {
  const [time, setTime] = useState(() => clock())
  useEffect(() => {
    const t = setInterval(() => setTime(clock()), 15000)
    return () => clearInterval(t)
  }, [])
  return html`
    <div className="m-statusbar">
      <span className="m-statusbar-time">${time}</span>
      <span className="m-statusbar-icons">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l-1.3 1.4A6.7 6.7 0 0 0 8 4.1 6.7 6.7 0 0 0 3.3 6L2 4.6A8.6 8.6 0 0 1 8 2.2Zm0 3.4c1.4 0 2.6.5 3.5 1.4l-1.3 1.4A2.9 2.9 0 0 0 8 7.5c-.8 0-1.6.3-2.2.9L4.5 7A4.8 4.8 0 0 1 8 5.6Zm0 3.3 1.4 1.5L8 11.3 6.6 9.9 8 8.9Z"/></svg>
        <span className="m-battery"><span className="m-battery-shell"><span className="m-battery-fill"></span></span><span className="m-battery-cap"></span></span>
      </span>
    </div>
  `
}

function clock() {
  const d = new Date()
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  h = h % 12 || 12
  return `${h}:${m}`
}

// --- Nav bar with large title ---
export function NavBar({ title, large = true, onBack, right }) {
  return html`
    <div className=${`m-navbar ${large ? 'm-navbar-large' : ''}`}>
      <div className="m-navbar-row">
        <div className="m-navbar-side m-navbar-left">
          ${onBack && html`
            <button className="m-back" onClick=${onBack}>
              <${Icon.chevronLeft} size=${22} stroke=${2.4} /><span>Back</span>
            </button>
          `}
        </div>
        ${!large && html`<div className="m-navbar-center-title">${title}</div>`}
        <div className="m-navbar-side m-navbar-right">${right}</div>
      </div>
      ${large && html`<h1 className="m-large-title">${title}</h1>`}
    </div>
  `
}

// --- Segmented control (iOS) ---
export function Segmented({ options, value, onChange }) {
  return html`
    <div className="m-segmented">
      ${options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return html`
          <button
            key=${v}
            className=${`m-seg ${value === v ? 'm-seg-on' : ''}`}
            onClick=${() => onChange(v)}
          >${label}</button>
        `
      })}
    </div>
  `
}

// --- iOS toggle switch ---
export function Switch({ on, onChange }) {
  return html`
    <button className=${`m-switch ${on ? 'm-switch-on' : ''}`} onClick=${onChange} role="switch" aria-checked=${on}>
      <span className="m-switch-knob"></span>
    </button>
  `
}

// --- Card / grouped list ---
export function Card({ className = '', children, onClick, style }) {
  return html`<div className=${`m-card ${className}`} onClick=${onClick} style=${style}>${children}</div>`
}

// --- Bottom sheet ---
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return html`
    <div className="m-sheet-scrim" onClick=${onClose}>
      <div className="m-sheet" onClick=${(e) => e.stopPropagation()}>
        <div className="m-sheet-grabber"></div>
        ${title && html`<div className="m-sheet-title">${title}</div>`}
        <div className="m-sheet-body">${children}</div>
      </div>
    </div>
  `
}

// --- Full-screen loader (iOS spinner) ---
export function MLoader({ message, onDone, delay = 2200 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), delay)
    return () => clearTimeout(t)
  }, [])
  return html`
    <div className="m-loader">
      <div className="m-spinner">${Array.from({ length: 12 }).map((_, i) => html`<span key=${i} style=${{ transform: `rotate(${i * 30}deg)`, animationDelay: `${-(11 - i) * 0.083}s` }}></span>`)}</div>
      <p className="m-loader-text">${message || 'Working…'}</p>
    </div>
  `
}

// --- Primary / secondary buttons ---
export function Button({ kind = 'primary', children, onClick, disabled, full = true }) {
  return html`
    <button
      className=${`m-btn m-btn-${kind} ${full ? 'm-btn-full' : ''} ${disabled ? 'm-btn-disabled' : ''}`}
      onClick=${onClick}
      disabled=${disabled}
    >${children}</button>
  `
}
