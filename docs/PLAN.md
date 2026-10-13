# ScamSim Implementation Plan

## 1. Current State & Verification
- **Repository**: Empty workspace initialized with `AGENTS.md` (root) and `SCAMSIM_MASTER_PROMPT_DOCUMENT.md` (root, not yet in `docs/`).
- **Codebase**: No `frontend/`, `backend/`, package managers, configs, tests, or CI detected.
- **Tools Verified**: Node v22.20.0, npm 11.7.0, Python 3.14.7 (uv 0.10.12 installed; Python 3.11 needed for Cloud Run/FastAPI spec), Git 2.50.1.
- **Missing Tools**: `gcloud` (missing), `firebase-tools` (missing), `make` (missing on Windows; use npm/PowerShell scripts).

## 2. Gaps & Prerequisites (Human Actions Needed)
1. **Google Cloud Project**: Create GCP project, enable billing, Cloud Run API, Firestore API, and Secret Manager.
2. **CLI Tools & Auth**: Install `gcloud` CLI (`gcloud auth login`, `gcloud config set project <id>`) and `firebase-tools` (`firebase login`).
3. **Firestore Database**: Create Firestore database in Native mode (default database, matching region).
4. **Gemini API Key**: If enabling P10 optional AI features, obtain Google AI Studio / Gemini API key.
5. **Specification relocation**: Move `SCAMSIM_MASTER_PROMPT_DOCUMENT.md` into `docs/` per spec §18.0 if desired.

## 3. Prompts P01–P14 Mapping & Risk Matrix
| Prompt | Target Files to Create / Modify | Key Risks & Mitigations |
|---|---|---|
| **P01** | `frontend/`, `backend/`, `Makefile`/scripts, configs, placeholder tests | Python 3.14 vs 3.11 compatibility (use `uv` with 3.11); missing `make` on Windows. |
| **P02** | `frontend/src/styles/tokens.css`, `components/ui/*`, `components/*`, `/_kit` | Contrast ratio failures on Teal/Coral; ensure WCAG 4.5:1 text compliance. |
| **P03** | `pages/{LandingPage,LibraryPage,NotFoundPage}.tsx`, `lib/{api,copy,fixtures}.ts` | Incomplete mocked data contracts; verify strict type alignment with spec §11. |
| **P04** | `backend/app/{models.py,scenarios_loader.py}`, `backend/scenarios/*.json`, tests | Graph topology or red-flag validation mismatch against §12.4/§12.5. |
| **P05** | `backend/app/{engine.py,scoring.py}`, `tests/test_engine.py` | State mutation / score leakage; keep functions strictly pure and deterministic. |
| **P06** | `frontend/src/pages/PlayPage.tsx`, `lib/useSession.ts`, UI mocks | Refresh state loss or double submission; implement idempotency and resume logic. |
| **P07** | `frontend/src/pages/ResultsPage.tsx`, results components | Frontend score calculation risk; enforce 100% server-authoritative numbers. |
| **P08** | `backend/app/adaptive.py`, `frontend/src/pages/ProgressPage.tsx`, tests | Cold-start tie breaking or incorrect skill-weight calculation against §13. |
| **P09** | `backend/app/{main.py,store.py,ratelimit.py,errors.py,routes/*}` | Firestore unavailable locally; ensure seamless automatic fallback to MemoryStore. |
| **P10** | `backend/app/ai.py`, `backend/app/routes/ai.py` (Gated) | Key absence or API latency/refusal; enforce strict 8s timeout and fallback text. |
| **P11** | `frontend/e2e/*`, `scripts/check-bundle.mjs`, `docs/TEST_REPORT.md` | Playwright browser download overhead; secret scanning false positives. |
| **P12** | Minimal fixes targeting confirmed defects in `docs/TEST_REPORT.md` | Scope creep during triage; adhere strictly to P0 -> P1 defect priorities. |
| **P13** | `Dockerfile`, `firebase.json`, `.firebaserc`, deployment configs | Missing `gcloud`/`firebase` tools; documented blockers if credentials missing. |
| **P14** | `README.md`, `docs/{API,ARCHITECTURE,EVALUATION,DEMO_SCRIPT}.md` | Unverified claims; ensure every assertion references real test artifacts. |
