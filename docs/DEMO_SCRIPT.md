# ScamSim Live Demo Script & Evaluator Q&A

**Duration**: ~2:45 minutes  
**Goal**: Demonstrate interactive fraud simulation, server-authoritative scoring, and adaptive learning reflexes.

---

## 1. Step-by-Step Presentation Script

| Timestamp | View / Screen | Presenter Actions & Dialogue |
|---|---|---|
| **0:00 – 0:15** | **Landing Page** (`/`) | *"Reading passive warning lists isn't enough to build fraud defense reflexes. Under pressure, people default to urgency. ScamSim is an interactive fraud flight simulator that lets you experience attacks safely and trains your instincts through consequence-free decisions."* |
| **0:15 – 0:45** | **Quick Play** → **Scenario A** (`/play/:id`) | *Click "Start Quick Play". Point to the persistent SIMULATION warning banner.*<br/>*"Here we're selling a calculator on a student marketplace. Buyer Rohan claims he sent ₹1,800 and provides a screenshot receipt, claiming his campus bus departs in 5 minutes."* |
| **0:45 – 1:15** | **Decision Branching (Risky Path)** | *Select "Hand it over — screenshot looks fine".*<br/>*"We make the impulsive choice. Instantly, the server branches to a simulated financial loss. Notice the feedback panel: it clearly identifies the two red flags we missed, explains why the screenshot was forged, and highlights the safe alternative."* |
| **1:15 – 1:35** | **Replay Branch (Safe Path)** | *Click "Restart Simulation" → confirm modal. Select "Check my own UPI app for the credit first".*<br/>*"This time we take the secure action. Notice how the simulation branches to step 2 without penalty, letting us verify independent balances before handing over goods."* |
| **1:35 – 2:00** | **Results & Scoring** (`/results/:id`) | *Complete the scenario and click "See results".*<br/>*"All scoring is computed authoritatively by the backend engine, not the browser. The score ring combines decision quality and red flags spotted into a transparent, rule-based rating."* |
| **2:00 – 2:20** | **Adaptive Progress** (`/progress`) | *Click "View Progress".*<br/>*"The system updates our 5 fraud defense competency bars. Because our lowest skill is Impersonation detection, the adaptive recommendation engine immediately targets Scenario C, 'The Urgent Fraud Department Call'."* |
| **2:20 – 2:45** | **Architecture & Safety** | *Show architecture diagram or Cloud console.*<br/>*"The app runs on FastAPI on Cloud Run with Firestore for TTL-backed persistence. Gemini provides optional phrasing variation, but never touches scoring or decision trees. All simulated banking art is non-executable and safe."* |

---

## 2. Technical Q&A Cheat Sheet (Evidence-Backed)

### Q1: What is actually working right now?
* **Answer**: All core gameplay, deterministic branching engine, server-authoritative scoring, adaptive recommendations, responsive UI, WCAG AA compliance, and security scanners are 100% operational and verified by 145+ automated unit, regression, and E2E tests (see [docs/TRACEABILITY.md](TRACEABILITY.md)).

### Q2: How does this differ from traditional cybersecurity awareness training?
* **Answer**: Traditional training relies on static quizzes and warning posters. ScamSim provides realistic, high-fidelity UI artifacts (fake UPI slips, QR prompts) with real branching consequences and an adaptive learning loop that automatically targets the user's specific weak spots.

### Q3: Why did you choose Google Cloud Run and Firestore?
* **Answer**: Cloud Run provides containerized autoscaling with zero idle instances (`min-instances 0`) to conserve cost, while Firestore Native gives document persistence with automated TTL cleanup (`expiresAt`), removing the need for manual database maintenance or complex indexes.

### Q4: What happens if Gemini is rate-limited, down, or malformed?
* **Answer**: The backend implements strict fallback isolation. If Gemini times out (>8s), fails schema validation, or produces blocked words, the system transparently serves the authored fallback copy (`source: "fallback"`). Scoring, choices, and navigation are never compromised.

### Q5: How is the score calculated?
* **Answer**: It is a deterministic rule-based formula:
  $$\text{Score} = \text{round}(0.7 \times \text{DecisionScore} + 0.3 \times \text{FlagScore})$$
  Safe choices grant $+2$, cautious $+1$, risky $0$, and critical $-1$. There is zero AI hallucination in scoring.

### Q6: How does the adaptive recommendation work?
* **Answer**: It calculates mathematical scenario weights based on skill deltas across all choice nodes. The recommendation algorithm selects the scenario with the highest training weight for the user's lowest competency score, breaking ties via pre-set priority orders.

### Q7: How does ScamSim scale?
* **Answer**: The stateless FastAPI container scales horizontally on Cloud Run. Persistence is handled by Firestore without composite indexes. The current per-client rate limiter operates in-memory per container instance.
