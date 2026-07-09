# Managed Crypto Yield Portal — Product Spec

A single-deposit, AI-managed portal. The user deposits USDC/USDT, sees a dollar balance, picks one of **three strategies**, and the system routes their capital across per-category sub-accounts. The user never touches individual strategies directly — they pick a strategy and the system handles allocation and rebalancing. This spec is a one-shot product flow: every screen, component, input, and state the demo needs, with no phasing.

---

## 1. Core Model

**Deposit → Choose Strategy → AI Allocation → Strategies (hidden).**

The mental model is **"own an asset class and earn yield on top of it."** The safer the underlying asset, the lower the risk and the return. There is **no customization** — the strategy choice sets everything; there are no category on/off toggles.

The user's money is held across **per-category sub-accounts**, not one pooled bucket. At any moment they see their **total net worth** and exactly **how much sits in each holding** — the split is a first-class part of the experience, surfaced on the dashboard and drill-down. A **discrete 3-tier dial** sets the allocation across these sub-accounts.

The three strategies, lower → higher risk:


| Tier | Name          | What it is                                                                              | Est. APY |
| ---- | ------------- | --------------------------------------------------------------------------------------- | -------- |
| 1    | **Stable**    | Hold stablecoins, earn the best safe yield on them. Dollar value barely moves.          | 4–12%    |
| 2    | **Blue-Chip** | Hold BTC/ETH/majors + a yield overlay that boosts returns and cushions dips.            | 8–25%    |
| 3    | **Growth**    | The same hold-plus-yield playbook on higher-growth assets. Bigger swings, more upside.  | 20–60%   |


Capital is held in **three internal category sub-accounts**, aligned to the asset ladder. Users see category names and counts on drill-down, never the raw strategies:

1. **Stablecoin Yield** — best-in-class lending/LP on stablecoins, market-neutral
2. **Blue-Chip + Yield** — BTC/ETH/SOL held with a yield overlay (funding, staking, yield tokens)
3. **Growth + Yield** — higher-growth assets held with the same yield-on-top approach

Higher tiers hold more of the riskier asset while keeping a safer cushion beneath (Stable = 100% stablecoin; Blue-Chip = 25% stablecoin / 75% blue-chip; Growth = 10% / 30% / 60%).

**Prediction Markets** are deliberately **not** part of the three managed strategies. They are surfaced separately as a **new & experimental**, opt-in sleeve at the end of the dashboard, drill-down and help — uncorrelated, early-access, and never touching the tier balances.

Each category contains multiple underlying strategies; the demo shows counts ("6 active strategies in Blue-Chip") without naming them.

---

## 2. Page Map

Nine surfaces total:

1. **Landing / Sign-up** — one-click entry
2. **Onboarding — Deposit**
3. **Onboarding — Choose Strategy** — three strategy cards + a clean risk/return read-out; the Risk/Reward Map appears as a supporting "where it sits" visual
4. **Dashboard (home)** — the primary recurring screen
5. **Allocation Drill-Down** — per-category sub-account balances, plus the experimental sleeve at the end
6. **Manage Funds** — deposit more / withdraw / withdraw all
7. **Risk Settings** — switch strategy with a before/after preview (also reachable from the dashboard)
8. **Activity** — read-only log of all on-chain actions, tx-hash linked to explorers
9. **Help / FAQ** — the longer explanations behind the inline one-liners (the three strategies, the experimental sleeve, and common questions)

Onboarding (2–3) runs once. After that the user lives on the Dashboard and dips into 5/6/7/8/9 as needed. Explanations are delivered in two layers: **short one-liners inline** at every decision point (deposit, strategy select, switch), and the **full detail in Help/FAQ**.

---

## 3. Page-by-Page

### 3.1 Landing / Sign-up

**Purpose:** Get the user in with one click.

- Headline + one-line value prop ("Deposit dollars. Pick your risk. Let the system earn.")
- Single **"Continue with [social]"** button (don't build auth into the demo — one click lands on Deposit)
- Inputs taken: none meaningful for the demo

### 3.2 Onboarding — Deposit

**Purpose:** Establish the dollar balance.

Components:

- **Stablecoin selector** — USDC / USDT only (segmented toggle)
- **Amount input** — numeric, with quick-fill chips ($1k / $5k / $25k / Max)
- **Live dollar-balance preview** — "You're depositing **$X**"
- **Deposit button** → 2–3s loader ("Confirming deposit…") → success state

Inputs taken: stablecoin choice, amount.

### 3.3 Onboarding — Choose Strategy

**Purpose:** Pick a strategy before showing the dashboard, with a clean, non-verbose read-out of what it means.

Components:

- **Three strategy cards (primary selector)** — Stable / Blue-Chip / Growth, each with a one-line tagline, what it holds, its est. APY range, and a risk label. Selecting a card reveals a one-sentence plain-language blurb. This is the main chooser — no toggles, no customization.
- **Risk/return read-out** — the selected strategy's **live projected APY** (badged **"Estimate"**), its risk label, and a Lower→Higher **risk meter** with a marker. Clean and glanceable.
- **Risk/Reward Map (supporting)** — the same scatter chart that anchors the dashboard, shown smaller as a "where it sits" visual. Tapping a tier dot also selects it.
- **"How does <strategy> work?"** inline expander — the fuller explanation, mirrored in Help/FAQ.
- **"Start earning" button** → 2–3s loader ("Allocating your capital…") → Dashboard

Inputs taken: strategy (tier). A footnote notes Prediction Markets are available separately, new & experimental.

### 3.4 Dashboard (home) — the primary screen

**Purpose:** At-a-glance status; the screen the user returns to daily. The **Risk/Reward Map is the centerpiece** — it's the first thing the eye lands on and the emotional core of the product. Everything else supports it.

#### Hero: the Risk/Reward Map (scatter chart)

A scatter plot on an X-Y axis, occupying the top/center of the dashboard.

- **X axis = Risk.** Left = low (Preserve), right = high (Aggressive). Label the band, not raw numbers.
- **Y axis = Expected / Projected return** (APY). Higher = more upside. Badged **"Estimate"** since the axis is forward-looking. The user's own dot reflects their *live* toggle state — excluding categories moves it, so the projection is personalized, not just the raw tier range.
- The natural shape is a rising risk/reward frontier — dots trend up and to the right — which makes the tradeoff legible at a glance.

**The dots (toggleable layers, legend up top):**

1. **Your position** — one bold, visually dominant dot at the user's current tier. Always on, never hidden. This is the anchor the user looks for first.
2. **The 5 risk tiers** — Preserve → Aggressive plotted as a path/curve. These are the positions the user *could* move to.
3. **Other users (anonymized)** — a cloud of faint dots showing where the rest of the user base sits, so the user can see "am I more or less aggressive than most?" No identities, just a distribution.
4. **Strategy categories** — each category (Stablecoin Yield, Funding, Blue-Chip, Prediction Low/High, Complex Yield) as its own dot, showing its individual risk/reward coordinates.

Each layer is a toggle in the legend; the user composes the view they want. Your-position is locked on.

**Interaction — fixed dot, click-to-preview:**

- The user's dot is **fixed** at their current tier; they don't drag it.
- **Clicking any tier dot** opens a preview: a comparison panel/overlay showing "Move from **Balanced** → **Growth**" with the projected return shift, the risk shift, and how their allocation mix would change. A **"Switch to this tier"** CTA confirms (→ 2–3s "Rebalancing…" loader → dashboard updates, your-position dot animates to the new spot).
- **Clicking an other-user or category dot** shows a lightweight tooltip/card (its risk band + projected return), but no switch action — those aren't tiers you can move to.
- **Hover** on any dot = tooltip with its coordinates.

This single chart absorbs what the three separate hero cards used to do: it *is* the risk view, it shows projected reward, and clicking is how you change tier. The old three-up cards drop to a supporting strip below.

#### Supporting strip (below the map)

Three compact cards, demoted from hero to a row — they give the concrete numbers the map abstracts:

1. **Total Net Worth + P&L** — current total dollar value across all sub-accounts, absolute and % change, time-range toggle (24h / 7d / 30d / All) → line chart on click/expand
2. **Blended Yield / APY** — current realized blended rate, with "(est. forward: X%)" sub-line badged estimate
3. **Net Worth Split** — donut of how the total is divided across category sub-accounts (dollar amount + % per category), current tier labeled. This is the "where is my money right now" view, backed by real per-category sub-account balances.

**Below that:**

- **Active Strategy Categories** — tiered-transparency summary cards, one per active category: name, % of capital, a single performance number, **"Details"** → Allocation Drill-Down. Excluded categories greyed with an "off" badge.
- **Quick actions row** — Add funds · Withdraw · Adjust risk · Activity

Note: the **"Adjust risk"** affordance and the **click-a-dot-to-switch** interaction on the map are two routes to the same outcome. The map is the visual/exploratory route; the Risk Settings panel (3.7) is the precise route with toggles. Keep both; they reinforce that risk is a living control.

### 3.5 Allocation Drill-Down

**Purpose:** Satisfy the user who wants to know *where the money actually is*, without overwhelming the default view.

- Per-category expandable sections, **one per sub-account**. Each shows: the sub-account's current dollar balance, its share of total net worth (%), number of active strategies, blended performance, and a short plain-language description of what the category does ("Captures funding-rate spreads while staying market-neutral").
- Individual strategies appear as **anonymized rows** ("Funding Strategy A — +2.1% / 30d") — enough to feel transparent, not enough to expose IP.
- A small **"How allocation works"** explainer tying it back to their tier + toggles.

### 3.6 Manage Funds

**Purpose:** Money in/out.

Three flows in one screen (tabbed or stacked):

- **Add funds** — same component as onboarding deposit; rebalances into existing allocation on confirm (2–3s loader)
- **Withdraw amount** — numeric input, shows resulting new balance + a note that allocation will rebalance; 2–3s loader
- **Withdraw all** — single action with a confirm step ("Withdraw entire $X and close all positions?"), 2–3s loader → empty/zeroed state

All amounts validated against available balance. Show pending→settled with the 2–3s demo loader.

### 3.7 Risk Settings

**Purpose:** The living risk control, reachable from the dashboard strip.

- Same three strategy cards as onboarding, pre-filled with the current choice
- **Before/after allocation preview** — two donuts + a per-holding current-vs-new table, so the switch feels deliberate
- **"Switch to <strategy>"** → 2–3s loader ("Rebalancing…") → back to Dashboard with updated allocation

### 3.8 Activity

**Purpose:** A read-only ledger that makes the portal feel alive and trustworthy — every on-chain action the system takes on the user's behalf, visible and verifiable. Keep it simple; it's a log, not a control surface.

- **Reverse-chronological feed** of events: deposits, withdrawals, rebalances, tier changes, and every strategy-level on-chain action — each trade, buy, sell, position entry, and position exit.
- Each row shows: timestamp, plain-language description ("Entered ETH funding position", "Sold BTC — Blue-Chip rebalance"), the category/sub-account it belongs to, dollar amount, and a **tx hash hyperlinked to the relevant blockchain explorer** (Etherscan, Solscan, etc. by chain).
- **Read-only.** No actions taken from here — no cancel, no retry. Purely transparency.
- Light **filters** (by type or category) are fine, but don't over-build it.

---

## 4. Global Components

- **Dollar-balance display** — consistent formatting everywhere ($ + 2dp)
- **Estimate badge** — any forward-looking number wears it
- **Demo loader** — standardized 2–3s spinner with contextual copy ("Allocating…", "Rebalancing…", "Confirming…")
- **Allocation visual** — one reusable donut/bar component, used in onboarding preview, dashboard hero, and risk settings
- **Risk/Reward Map** — the scatter-chart component (3.4). The product's signature element: used as the **primary tier selector in onboarding** (3.3), the **dashboard centerpiece** (3.4), and in a lighter form inside the tier-switch preview. One component, three contexts.
- **Time-range toggle** — shared by balance chart
- **Category card** — reused across dashboard summary and drill-down

---

## 5. State the Demo Must Track

- Deposited balance (USD) and which stablecoin
- Current risk tier (1–5)
- Set of excluded categories
- **Per-category sub-account balances** (dollar amount each), plus a mock performance series per sub-account (to drive charts and the net-worth split)
- **Live projected APY** as a function of (tier + excluded categories), recomputed on every toggle
- **Risk/reward coordinates** for: each of the 5 tiers, each category, the user's live personalized position, and a generated cloud of anonymized "other users" (a distribution clustered around the middle tiers) — to plot the map
- **Activity log** — a mock list of on-chain events (type, timestamp, category, amount, tx hash + explorer URL)
- Derived: total net worth, total P&L, blended APY, net-worth split

Everything is automated — the only user inputs across the whole product are: **sign in (1 click), deposit (stablecoin + amount), risk tier, category toggles, and add/withdraw amounts.** No strategy-level interaction exists by design.

---

## 6. Resolved Decisions

> **Redesign note (current):** the product now uses **three strategies** (Stable / Blue-Chip / Growth) on an "own an asset class + earn yield on top" model, with **no category toggles / customization**. Prediction Markets are pulled out as a separate **new & experimental** opt-in sleeve. A **Help/FAQ** surface backs the inline one-liners. The decisions below predate this and are kept for history; where they mention 5 tiers, six categories, or exclusion toggles, the redesign above supersedes them.

These were open assumptions; now locked:

1. **Per-category sub-accounts**, not a single pooled balance. The user sees total net worth *and* how much sits in each category at any moment. (Net-worth split on the dashboard; per-sub-account balances in drill-down.)
2. **Toggles exclude categories only** — no forced allocation, no caps. Complex customizations (e.g. "max 10% in prediction markets") are explicitly out of scope for now.
3. **Projections react live to the toggle set** — projected APY recomputes on every tier change and every category toggle, both in onboarding and on the map. Users can play freely and watch the number move.
4. **Withdrawals rebalance the remainder instantly** — kept simple, no proportional pull or strategy pausing.
5. **No fee surface in this product.** Fees (bps on profits) are fixed and handled elsewhere; deliberately not shown here so it doesn't clutter the blended-APY story.
6. **Activity surface included** (3.8) — read-only log of all on-chain actions (deposits, withdrawals, rebalances, tier changes, and every trade/buy/sell/entry/exit), each with a tx hash hyperlinked to the blockchain explorer. Not over-built.
7. **Risk/Reward Map is the primary tier selector in onboarding** (3.3) as well as the dashboard centerpiece (3.4) — users pick their first tier by tapping a dot on the frontier.
8. **"Other users" data is mocked** — a generated distribution to convey the feel. Real aggregation (k-anonymity, etc.) is out of scope for the demo.

 