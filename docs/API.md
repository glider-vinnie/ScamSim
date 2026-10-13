# ScamSim API Specification & Contract Reference

All endpoints are hosted under the prefix `/api`.  
Client requests interacting with session state or progress must provide the header:  
`X-Client-Id: <UUIDv4>`

---

## 1. Authentication & Security Headers

* `X-Client-Id`: Required for `/api/sessions/*`, `/api/progress`, and `/api/ai/*`. Must be a valid UUIDv4 string.
* `X-Request-Id`: Auto-generated or passed through for request traceability in structured logs without PII.

---

## 2. API Endpoints

### 1. Health & Readiness
* **Endpoint**: `GET /api/health`
* **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "store": "memory",
    "ai": "disabled"
  }
  ```
  *(Returns `store: "firestore"` in production, or `memory-fallback` if cloud database connection fails)*

---

### 2. List Scenarios
* **Endpoint**: `GET /api/scenarios`
* **Response `200 OK`**:
  ```json
  {
    "scenarios": [
      {
        "id": "payment-screenshot",
        "title": "The \"Payment Screenshot\" Ruse",
        "category": "fake_confirmation",
        "difficulty": "easy",
        "estimatedDuration": 3,
        "skills": ["payment_verification", "urgency", "safe_verification"]
      }
    ]
  }
  ```

---

### 3. Scenario Details
* **Endpoint**: `GET /api/scenarios/{scenarioId}`
* **Response `200 OK`**:
  ```json
  {
    "scenario": {
      "id": "payment-screenshot",
      "title": "The \"Payment Screenshot\" Ruse",
      "category": "fake_confirmation",
      "difficulty": "easy",
      "estimatedDuration": 3,
      "learningObjectives": ["Verify credits in personal banking app", "..."],
      "startingContext": "You listed a calculator on campus marketplace...",
      "skills": ["payment_verification", "urgency", "safe_verification"]
    }
  }
  ```
* **Error**: `404 Not Found` (`SCENARIO_NOT_FOUND`) if `scenarioId` is invalid.

---

### 4. Start Simulation Session
* **Endpoint**: `POST /api/sessions`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Request Body**:
  ```json
  {
    "scenarioId": "payment-screenshot",
    "mode": "practice"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "scenarioId": "payment-screenshot",
      "status": "in_progress",
      "mode": "practice",
      "currentNodeId": "A1",
      "decisions": [],
      "createdAt": "2026-10-13T10:00:00Z"
    },
    "node": {
      "id": "A1",
      "event": {
        "eventType": "payment_screenshot",
        "text": "Bhai, I just sent ₹1,800 to your UPI ID!",
        "speaker": "Rohan K. (fictional)"
      },
      "choices": [
        {"id": "A1-a", "label": "Hand it over — screenshot looks fine"},
        {"id": "A1-b", "label": "Check my own UPI app for the credit first"}
      ],
      "terminal": false,
      "progress": {"step": 1, "estTotal": 3}
    }
  }
  ```

---

### 5. Fetch Session State
* **Endpoint**: `GET /api/sessions/{sessionId}`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Response `200 OK`**: Returns current session state and active public node.
* **Error**: `404 Not Found` (`SESSION_NOT_FOUND`) if session does not exist or client does not own the session.

---

### 6. Submit Decision
* **Endpoint**: `POST /api/sessions/{sessionId}/decision`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Request Body**:
  ```json
  {
    "nodeId": "A1",
    "choiceId": "A1-b"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "session": { "id": "...", "currentNodeId": "A3", "status": "in_progress" },
    "result": {
      "nodeId": "A1",
      "choiceId": "A1-b",
      "risk": "safe",
      "whatHappened": "You kept the item safely and opened your personal banking app.",
      "why": "Unverified screenshots are trivial to manipulate.",
      "redFlagsCaught": ["A-RF1", "A-RF2"],
      "redFlagsMissed": [],
      "considerNext": "Watch out if the buyer claims an artificial deadline."
    },
    "nextNode": {
      "id": "A3",
      "terminal": false,
      "progress": {"step": 2, "estTotal": 3}
    }
  }
  ```
* **Idempotency**: Re-submitting the exact same `(nodeId, choiceId)` returns the cached decision result without penalty. Submitting a conflicting choice returns `409 Conflict` (`INVALID_TRANSITION`).

---

### 7. Complete Session
* **Endpoint**: `POST /api/sessions/{sessionId}/complete`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Response `200 OK`**:
  ```json
  {
    "session": { "id": "...", "status": "completed" },
    "results": {
      "decisionScore": 100,
      "flagScore": 100,
      "score": 100,
      "label": "Safe Handler — Threat Prevented",
      "skillsDemonstrated": ["payment_verification", "urgency", "safe_verification"],
      "areasToImprove": [],
      "keyTakeaways": ["Always check your own balance directly."],
      "recommendedActions": ["Do not let artificial urgency rush checks."]
    },
    "recommendedNext": {
      "scenarioId": "urgent-bank-call",
      "title": "The Urgent Fraud Department Call",
      "reason": "You're weakest at Impersonation detection; this one trains it."
    }
  }
  ```

---

### 8. User Progress
* **Endpoint**: `GET /api/progress`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Response `200 OK`**:
  ```json
  {
    "clientId": "...",
    "sessionCount": 1,
    "completedScenarios": {"payment-screenshot": 1},
    "skillEstimates": {
      "urgency": 60,
      "impersonation": 50,
      "payment_verification": 70,
      "qr_collect": 50,
      "safe_verification": 60
    },
    "missedFlagCounts": {},
    "recentResults": [
      {
        "sessionId": "...",
        "scenarioId": "payment-screenshot",
        "title": "The \"Payment Screenshot\" Ruse",
        "score": 100,
        "completedAt": "2026-10-13T10:15:00Z"
      }
    ],
    "recommendedNextScenario": {
      "scenarioId": "urgent-bank-call",
      "title": "The Urgent Fraud Department Call",
      "reason": "You're weakest at Impersonation detection; this one trains it."
    }
  }
  ```

---

### 9. Delete User Data (GDPR / Privacy)
* **Endpoint**: `DELETE /api/progress`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Response `200 OK`**: `{"status": "deleted"}`

---

### 10. AI Wording Variation
* **Endpoint**: `POST /api/ai/variation`
* **Headers**: `X-Client-Id: <UUIDv4>`
* **Request Body**:
  ```json
  {
    "scenarioId": "payment-screenshot",
    "nodeId": "A1"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "messageVariant": "Brother, ₹1,800 transferred! Quick check my slip please...",
    "source": "fallback"
  }
  ```
  *(Returns `source: "gemini"` when enabled and validated; returns `source: "fallback"` on disabled, timeout, or block)*

---

## 3. Standard Error Envelope

All API errors return a standard envelope with no stack traces or sensitive internals leaked:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description of error"
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| `404` | `SCENARIO_NOT_FOUND` | Scenario ID does not exist in catalog |
| `404` | `SESSION_NOT_FOUND` | Session ID not found or unauthorized for client |
| `409` | `SESSION_ALREADY_COMPLETED`| Attempted decision or duplicate action on completed session |
| `409` | `INVALID_TRANSITION` | Submitted node does not match current session node |
| `409` | `SESSION_NOT_TERMINAL` | Attempted completion before reaching terminal state |
| `422` | `CHOICE_INVALID` | Choice ID does not exist for the current node |
| `422` | `VALIDATION_ERROR` | Malformed payload, invalid UUIDv4 header, or unexpected fields (`extra="forbid"`) |
| `429` | `RATE_LIMIT_EXCEEDED` | Request threshold exceeded (>60 req/min/client) |
| `500` | `INTERNAL_ERROR` | Unexpected server fault handled gracefully |
