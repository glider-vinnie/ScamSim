# AGENTS.md — ScamSim standing rules
Project: ScamSim, adaptive financial-scam simulator (hackathon, 3-hour build). Spec: docs/SCAMSIM_MASTER_PROMPT_DOCUMENT.md (read ONLY the sections a prompt cites).
Stack: frontend/ React+TS+Vite+Tailwind · backend/ FastAPI (Python 3.11) · Firestore · Cloud Run · Gemini optional.
Routes: / /library /play/:sessionId /results/:sessionId /progress. API prefix /api (spec §11). Header X-Client-Id (uuid v4).
Skills: urgency, impersonation, payment_verification, qr_collect, safe_verification.
Scoring: scoreDelta safe+2 cautious+1 risky0 critical-1; decisionScore=round(100*max(0,sum)/(2n)); flagScore=round(100*caught/present); score=round(.7*decision+.3*flag).
Palette (exact): Navy #194777, Teal #19869B, Mist #B2C8CA, Sand #EABD82, Coral #E96532, Berry #A92343 + neutrals in §8. Teal/Coral never small text.
RULES
1. Before editing: inspect the repo with targeted reads (list dirs, open only relevant files). Preserve working code; no rewrites of working files; no scope creep.
2. Safety: no real payments, no PIN/OTP inputs, no functional QR, no real links, no real brand names, no secrets in code/bundle. Every sim view shows SIMULATION labelling.
3. Server is authoritative for transitions, scores, skills. Frontend never computes or sends scores.
4. Use identical names for routes, components, fields and endpoints as the spec. Do not invent alternatives.
5. Tests: run only the tests relevant to the change plus a fast full run at the end. Never claim a pass you did not execute. Never fake data.
6. Token discipline: no re-printing whole files in chat, no repeating the spec, no long explanations, no unrequested docs.
7. REPORT FORMAT (≤15 lines): Done (bullets) · Files changed · Commands run + real result · Status label per item (Implemented/Tested locally/Planned/Blocked) · Unresolved issues.
