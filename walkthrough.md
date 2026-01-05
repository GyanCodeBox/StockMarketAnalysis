# Portfolio View & Institutional Analysis Walkthrough

This guide explains how to use the new **Portfolio View** and **Institutional Decision Intelligence** features.

## 1. Entering the Portfolio View
- Click the **Portfolio View** button in the main navigation (if available) or navigate to `/portfolio`.
- You will be greeted by the **Portfolio Regime Monitor**.

## 2. Running a Portfolio Scan
- **Bulk Paste**: You can paste a list of symbols separated by newlines, commas, or spaces (e.g., `RELIANCE, TCS, INFY`).
- **Scan**: Click **Run Portfolio Scan**. The system will perform parallel analysis on all symbols.

## 3. Understanding the Grid
The portfolio grid provides a high-level monitoring layer:

- **Confluence State**: High-level structural bias (e.g., *Accumulation*, *Distribution*, *Early Opportunity*).
- **Composite Score**: A quantitative measure (0-100) combining Technical, Fundamental, and Stability metrics. 
  - *Note: This is a relative quality measure, not a return expectation.*
- **Risk Level**: Derived from combined structural and fundamental constraints (Minimal, Medium, Elevated).
- **Stability**: Indicates if the current regime has persisted (Stable) or if there have been frequent recent transitions (Unstable).
- **Attention Badge**: The system flags instruments that require immediate review:
  - `CRITICAL`: Multiple risk constraints or extreme regime shifts.
  - `REVIEW`: Significant changes or early emerging alignments.
  - `MONITOR`: Standard ongoing review.
  - `STABLE`: No immediate action required.

## 4. Deep Dive into Single Stocks
- Clicking any row in the Portfolio Grid will take you back to the **Terminal** for that specific stock.
- The Terminal now includes **Market Structure Overlays**:
  - **Accumulation Zones**: Regions where institutional buying is detected.
  - **Distribution Zones**: Regions where institutional selling is detected.
  - **Failed Breakouts (!)**: Markers indicating trapped buyers or sellers.

## 5. Decision Intelligence Features
- **Stability History**: A timeline at the bottom of the chart showing the history of technical regimes.
- **Explain Candle**: Right-click any candle to get an AI-powered institutional interpretation of the price action.

## 6. How to Run Tests
The project maintains a 4-layer testing architecture (L1-L4):

### Backend Tests (L1/L2)
1. Navigate to the `backend/` directory.
2. Activate your virtual environment: `source venv/bin/activate`.
3. Run all backend tests: `pytest`.
4. Run specific module tests: `pytest app/services/tests/test_technical.py`.

### Frontend E2E Tests (L3)
1. Ensure the **Backend** is running: `uvicorn app.main:app --reload`.
2. Navigate to the `frontend/` directory.
3. Run all Playwright tests: `npx playwright test`.
4. Run tests with UI: `npx playwright test --ui`.

### Automated Pipeline (L4)
- Tests are automatically executed via GitHub Actions on every push to `main`.
- See `.github/workflows/` for configuration.

---
*Disclaimer: Portfolio View is a monitoring and prioritization layer. It does not generate signals or recommendations.*
