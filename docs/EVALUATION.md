# ScamSim User Impact Evaluation Protocol & Results

**Evaluation Status**: Proposed — not run (User study phase pending public deployment)  
**Standard**: Specification §20

---

## 1. Study Design & Protocol

* **Objective**: Evaluate whether experiencing interactive fraud simulations improves participant recognition of social engineering and verification reflexes.
* **Target Sample**: 5–8 consenting participants (peers/students).
* **Participant Journey (10 Minutes)**:
  1. **Quick Play**: Complete Scenario A (*The "Payment Screenshot" Ruse*).
  2. **Adaptive Recommendation**: Complete the recommended follow-up scenario (*The Urgent Fraud Department Call* or *The Fake Refund QR Trap*).
  3. **Brief Usability & Perception Survey**: 3 structured questions rated on a 1–5 Likert scale.
* **Ethical Safeguards & Privacy**:
  - Verbal informed consent prior to session start.
  - Zero collection of Personally Identifiable Information (PII). All sessions identified solely by pseudonymous random client UUIDs.
  - No real financial accounts or payment inputs used.

---

## 2. Quantitative Metrics & Formulas

1. **Completion Rate**:
   $$\text{Completion Rate} = \frac{\text{Completed Sessions}}{\text{Started Sessions}} \times 100\%$$
2. **Red-Flag Identification**:
   $$\text{Flag Detection Rate} = \frac{\sum \text{Red Flags Caught}}{\sum \text{Red Flags Present}} \times 100\% \quad (\text{first attempts only})$$
3. **Adaptive Targeting Accuracy**:
   $$\text{Targeting Accuracy} = \frac{\sum \text{Recommendations where } w(\text{weakest skill}) > 0}{\text{Total Recommendations Generated}} \times 100\%$$
4. **Task Time**:
   $$\text{Median Task Time} = \text{median}(\text{completionTime} - \text{startTime})$$
5. **Usability Index**: Mean scores (1 = Strongly Disagree, 5 = Strongly Agree):
   - Q1: "The instructions and scenario context were clear and easy to follow."
   - Q2: "The interactions and visual artifacts felt realistic."
   - Q3: "I feel more confident spotting unverified payment claims in real life."
6. **Replay Improvement (Descriptive)**:
   Safe-choice rate on second attempt vs. first attempt for users replaying a targeted scenario.

---

## 3. Results & Experimental Evidence

| Metric | Status / Value | Data Source |
|---|---|---|
| **Participants (*n*)** | *Proposed — not run* | Pending cohort session |
| **Completion Rate** | *Proposed — not run* | Automated server session records |
| **Red-Flag Identification** | *Proposed — not run* | Automated scoring engine results |
| **Targeting Accuracy** | **100% verified via automated tests** | Verified by `test_adaptive.py` (3 test suites) |
| **Median Task Time** | *Proposed — not run* | Session timestamps |
| **Mean Usability (Q1–Q3)**| *Proposed — not run* | Participant exit questionnaire |
| **Gemini Correctness** | *Proposed — not run* | Server fallback mode verified in local tests |

---

## 4. Methodological Limitations

1. **Small Sample Size**: Initial testing designed for small cohorts ($n=5\text{--}8$), suitable for qualitative usability refinement rather than broad statistical power.
2. **Peer Sample**: Test participants are university peers who may exhibit higher baseline digital literacy than the broader population.
3. **Simulation vs. Real-World Behavior**: High performance in a declared simulation does not guarantee immunity from sophisticated, high-pressure real-world fraud.
4. **Self-Reported Efficacy**: Survey questions measure perceived confidence rather than longitudinal behavioral retention.
