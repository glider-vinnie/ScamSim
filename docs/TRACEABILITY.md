# ScamSim Specification Traceability & Verification Matrix

Every feature and requirement in ScamSim is tracked to its underlying implementation file, test suite, and verified real execution evidence.

Status Labels: `Implemented`, `Tested locally`, `Tested deployed`, `Deployed`, `Planned`, `Blocked`.

---

## 1. Traceability Matrix

| Requirement / Criterion | Implementation File(s) | Test Suite File(s) | Concrete Evidence / Output | Status |
|---|---|---|---|---|
| **R1: Realistic Scam Artifacts** | `PaymentScreenshotMock.tsx`, `QrPlaceholder.tsx`, `CallCard.tsx` | `Components.test.tsx`, `scenarios-journey.spec.ts` | Unit tests pass; Playwright journeys render all mocks with fictional counterparty details | **Tested locally** |
| **R2: Simulation Safety & Privacy** | `SimulationBanner.tsx`, `scripts/check-bundle.mjs` | `check-bundle.mjs`, `negatives` test suite | `check-bundle.mjs` zero leaks, 0 password inputs, 0 innerHTML; SIMULATION label present | **Tested locally** |
| **R3: Deterministic Graph Traversal** | `backend/app/engine.py`, `backend/app/models.py` | `backend/tests/test_engine.py` | 80/80 pytest pass; identical inputs yield identical nextNodeId and decision result | **Tested locally** |
| **R4: Authoritative Server Scoring** | `backend/app/scoring.py` | `backend/tests/test_engine.py` | Verified exact formula: `0.7*decisionScore + 0.3*flagScore`; best path gives 100, loss path gives critical risk | **Tested locally** |
| **R5: Adaptive Learning Engine** | `backend/app/adaptive.py`, `ProgressPage.tsx` | `test_adaptive.py`, `adaptive-recommendations.spec.ts` | Clamping (0-100), cold-start tie breaking, and scenario weight targeting verified | **Tested locally** |
| **R6: Interactive Journey UI** | `PlayPage.tsx`, `ResultsPage.tsx`, `LandingPage.tsx` | `scenarios-journey.spec.ts`, `session-controls.spec.ts` | 36/36 Playwright E2E tests pass across Desktop (1280px) and Mobile (375px) | **Tested locally** |
| **R7: WCAG AA Accessibility** | `tokens.css`, `AppShell.tsx`, `NavBar.tsx` | `accessibility.spec.ts`, `scripts/contrast.mjs` | Axe-core scans report zero serious/critical violations; contrast verification script passes | **Tested locally** |
| **R8: Resilience & State Resume** | `backend/app/store.py`, `useSession.ts` | `test_store.py`, `resilience-errors.spec.ts` | Page reload retains active step; offline/500 returns non-crashing friendly UI banner | **Tested locally** |
| **R9: AI Phrasing Variation** | `backend/app/ai.py`, `backend/app/routes/ai.py` | `backend/tests/test_ai.py` | Gemini integration tested with safety validators, 8s timeout, and deterministic fallback | **Tested locally** |
| **R10: Containerization** | `backend/Dockerfile`, `firebase.json` | `check-bundle.mjs`, `Dockerfile` lint | Python 3.11-slim non-root container and Firebase SPA configuration created | **Implemented** |
| **R11: Public Cloud Deployment** | GCP Cloud Run, Firebase Hosting | Public URL verification | Documented in `docs/DEPLOY_BLOCKERS.md`; awaiting cloud operator credentials | **Blocked** |

---

## 2. Test Suite Execution Summary

* **Pytest (Backend Unit & Integration)**: `80 / 80 passed` (1.31s)
* **Vitest (Frontend Unit & Component)**: `29 / 29 passed` (3.70s)
* **Playwright (End-to-End & Cross-Device)**: `36 / 36 passed` (28.3s)
* **Security & Secret Scanner**: `PASS` (Clean bundle scan, zero secrets, zero credential inputs)
* **Design Token Contrast Audit**: `PASS` (All color pairs meet WCAG AA standards)
