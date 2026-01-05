# Phase 2.6 – Application Reliability, Regression & Automation PRD

## Purpose

Establish a **platform-wide reliability, regression, and automation framework** for TERMINAL.AI.

This phase ensures:

* Analytical correctness across Technical, Fundamental, Decision Intelligence, and Portfolio views
* UI stability during rapid feature evolution
* Institutional-grade confidence through automated testing and CI gates

This PRD **does not introduce new analytics**. It hardens and validates what already exists.

---

## Scope (Full Application)

Covered Modules:

* Terminal View (Technical Analysis)
* Fundamental Analysis View
* Decision Intelligence View
* Portfolio View
* Shared Backend Engines
* API Contracts
* UI Navigation & State Consistency

Explicitly Out of Scope:

* New indicators or financial models
* Alerts & notifications (future phase)
* Social sharing (future enhancement)

---

## Testing Architecture Overview

Testing is organized into **four layers**, progressing from deterministic logic to user-facing flows.

```
L1. Core Engine Tests (Backend – Deterministic)
L2. API Contract & Integration Tests
L3. UI Automation (Playwright – End-to-End)
L4. Regression & Stability Gates (CI)
```

Each layer must pass independently.

---

## L1 – Core Engine Test Suite (Backend)

### Objective

Ensure analytical correctness and prevent silent logic regressions.

### Engines Covered

#### Market Structure

* Accumulation detection
* Distribution detection
* Failed breakout logic
* Regime transitions
* Regime history timeline

#### Fundamental Engine

* Quarterly YoY calculations
* Rolling averages
* EPS absolute trend
* ROCE computation
* Other income checks
* Fundamental scoring engine

#### Decision Intelligence

* Confluence matrix mapping (3×3)
* Composite score calculation
* Stability score calculation
* Risk constraint severity assignment

### Test Characteristics

* Deterministic inputs
* Snapshot-based expected outputs
* No UI or network dependency

---

## L2 – API Contract & Integration Tests

### Objective

Lock backend response structures so frontend refactors do not break functionality.

### Endpoints Covered

* `/api/technical/analysis`
* `/api/fundamental/financials`
* `/api/analysis/summary`
* `/api/portfolio/summary`

### Assertions

* Response schema integrity
* Required fields always present
* Score ranges enforced (0–100)
* Enum validity (regimes, confidence, risk levels)

### Special Focus

* `mode="metrics_only"` behavior for portfolio
* Cached vs uncached responses consistency

---

## L3 – UI Automation (Playwright)

### Objective

Guarantee **user-visible stability** across the entire application.

### Global UI Guarantees

* No runtime JS errors
* No blank states where data exists
* Navigation never breaks application state

---

### Terminal View (Technical Analysis)

**Critical Flows**

* Load symbol (e.g., RELIANCE)
* Switch timeframe (Daily → Weekly)
* Toggle Zones / Failed Breakout
* Regime banner renders correctly
* Regime History Timeline visible

**Assertions**

* Chart renders without NaN
* Regime state matches API
* Timeline segments > 0

---

### Fundamental Analysis View

**Critical Flows**

* Switch to Fundamental tab
* Toggle table ↔ chart per section
* Scroll through all sections

**Assertions**

* Score banner visible
* Tables contain rows
* Charts render valid series
* EPS absolute values visible (non-percentage)

---

### Decision Intelligence View

**Critical Flows**

* Navigate to Decision Intelligence
* Confluence banner visible
* Composite score visible
* Risk constraints panel expands

**Assertions**

* Confluence state consistent with backend
* Risk severity matches thresholds
* No recommendation language appears

---

### Portfolio View

**Critical Flows**

* Paste bulk symbols (10–50)
* Start analysis
* Apply filters (Critical, Review, Monitor, Stable)
* Click row → navigate to Terminal

**Assertions**

* All rows load
* Sorting works
* Attention flags correct
* Navigation preserves app state

---

## L4 – Regression & Stability Gates (CI)

### Objective

Prevent unstable builds from shipping.

### Required Gates

* All L1 tests pass
* All API contracts valid
* Playwright critical paths pass
* No console errors detected
* Max response time thresholds respected

### Performance Thresholds

* Single analysis load: < 2.5s
* Portfolio (20 symbols cached): < 3s
* Portfolio (uncached): < 8s

---

## Tooling

### Backend

* Pytest
* Snapshot testing
* Mock OHLC & financial datasets

### Frontend

* Playwright
* Headless Chromium
* Test IDs (data-testid) enforced

### CI

* GitHub Actions
* Test matrix: backend + frontend

---

## Success Criteria

* Any developer can refactor UI without fear
* Scores and regimes never silently drift
* Portfolio and Terminal always agree
* Platform behaves predictably under scale

---

## Why This Phase Matters

This phase transitions TERMINAL.AI from:

> *“A powerful analysis tool”*

into:

> *“A reliable institutional decision platform.”*

No new features.
Only confidence.
