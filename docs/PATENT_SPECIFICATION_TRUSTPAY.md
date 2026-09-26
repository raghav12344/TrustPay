# FORM 2
THE PATENTS ACT, 1970
(39 of 1970)
&
THE PATENTS RULES, 2003

## PROVISIONAL SPECIFICATION
(See section 10 and rule 13)

---

### 1. TITLE OF THE INVENTION
**"A COMPUTER-IMPLEMENTED SYSTEM AND METHOD FOR LOW-LATENCY, DUAL-STAGE MACHINE LEARNING AND GENERATIVE ARTIFICIAL INTELLIGENCE TRANSACTION ANOMALY GATING IN DISTRIBUTED LEDGERS"**

---

### 2. APPLICANTS & INVENTORS

1. **Raghav Gupta**
   * Registration No.: 20243226
   * Nationality: Indian

2. **Rishabh Srivastava**
   * Registration No.: 20243236
   * Nationality: Indian

3. **Rihabh Singh**
   * Registration No.: 20243235
   * Nationality: Indian

4. **Prince Keshari**
   * Registration No.: 20243218
   * Nationality: Indian

---

### 3. PREAMBLE TO THE DESCRIPTION

The following specification describes the invention:

---

### 4. TECHNICAL FIELD OF THE INVENTION

The present invention relates generally to real-time transactional security, financial computation, and distributed ledger systems. More particularly, the present invention relates to a computer-implemented, fault-tolerant dual-intelligence pipeline that orchestrates rapid sub-symbolic machine learning classification, contextual generative language model reasoning, and a deterministic non-hallucinatory decision engine to evaluate transactional risk and execute pre-settlement quarantine protocols.

---

### 5. BACKGROUND AND PRIOR ART DEFICIENCIES

Conventional financial fraud detection systems typically suffer from fundamental architectural trade-offs:

1. **The Black-Box Dilemma**: Standard gradient-boosted decision trees (GBDT) and deep neural networks provide rapid scoring (e.g., within milliseconds) but output opaque scalar probabilities. They fail to provide human-interpretable contextual justifications, leading to substantial delays during manual compliance investigations and regulatory audit reviews.
2. **Generative Model Latency and Hallucination Risks**: While modern Large Language Models (LLMs) can synthesize nuanced behavioral explanations, their non-deterministic nature and vulnerability to semantic hallucination make them dangerous to deploy as autonomous arbiters of financial ledger mutations. Furthermore, LLM latency (frequently 500ms to 3000ms) introduces checkout friction if placed directly on the critical transactional path.
3. **Cold-Start Vulnerabilities and False-Positive Spikes**: Established anomaly detection engines rely heavily on historical mean and standard deviation baselines. For newly registered user accounts lacking prior transaction history, standard systems frequently trigger false-positive account suspensions due to uncalibrated variance metrics and novel device/location flags.
4. **Post-Settlement Chargeback Exposure**: In conventional payment architectures, fraud scoring frequently operates asynchronously *after* ledger deduction or balance settlement has completed. Consequently, identifying fraudulent activity requires expensive ledger rollbacks, inter-bank chargeback disputes, and administrative overhead.

Accordingly, there exists a profound technical need for a fault-tolerant architecture that couples sub-15ms machine learning inference with structured contextual generative reasoning, bounded by a strictly deterministic decision gate and pre-settlement ledger quarantine protocol.

---

### 6. OBJECTS OF THE INVENTION

The principal objects of the present invention include:
1. To provide a high-throughput, low-latency transaction processing architecture executing gradient-boosted risk probability calculation within 15 milliseconds.
2. To provide an explainable AI (XAI) subsystem utilizing a large-scale generative model that outputs structured, audit-compliant natural-language justifications without granting the language model autonomous ledger-mutation permissions.
3. To provide a mathematically bounded cold-start confidence tiering system that decouples absence of historical data from malicious intent.
4. To implement a zero-leakage, point-in-time dynamic sliding window feature extraction pipeline operating on relational transaction stores.
5. To execute an atomic pre-settlement quarantine protocol that halts balance deduction for suspicious transactions while maintaining continuous checkout availability via deterministic fallbacks.

---

### 7. SUMMARY OF THE INVENTION

The present invention provides a computer-implemented method and transactional architecture comprising:
1. **Dynamic Point-in-Time Feature Service**: Ingests real-time transactional telemetry and extracts a 20-dimensional behavioral feature vector strictly evaluated against transactions occurring prior to current transaction timestamp ($t < t_{\text{current}}$).
2. **Calibrated Gradient-Boosted Classification**: Evaluates the feature vector via an optimized LightGBM inference model to output a continuous risk probability $P_{\text{fraud}} \in [0.0, 1.0]$ and calibrated risk score.
3. **Structured Contextual Generative Reasoning**: Interrogates a 70-billion-parameter generative model via constrained JSON schema prompting to produce human-readable causal indicators and risk summaries.
4. **Deterministic Multi-Branch Decision Gate**: Enforces hard-coded composite anomaly rules that synthesize numerical probabilities, behavioral deviation counters, and cold-start maturity states.
5. **Two-Phase Isolation Ledger Gate**: Maintains transactions in a non-deductive `PENDING` custody state, routing high-risk events to an administrative alert queue while allowing low/medium risk events to execute balance deductions atomically.

---

### 8. DETAILED DESCRIPTION OF THE INVENTION

#### A. Feature Engineering and Zero Data Leakage
The system extracts 20 dimensional features across four distinct computational modalities:
* **Statistical Deviation Modality**: Rolling mean $\mu = \frac{1}{N}\sum X_i$, rolling sample standard deviation $\sigma = \sqrt{\frac{1}{N-1}\sum (X_i - \mu)^2}$, spend ratio $R = \frac{X}{\mu}$, and standard score $Z = \frac{X - \mu}{\sigma}$. An unusual amount flag is asserted if and only if $X > 3\mu \land \mu > 0$.
* **Temporal Modality**: Diurnal classification evaluating nocturnal intervals ($H \ge 22 \lor H < 6$), weekend indicators, and customer-specific historical window boundaries.
* **Sliding Velocity Windows**: Point-in-time calculation of transaction counts and volume across 1-hour ($3,600\text{s}$), 24-hour ($86,400\text{s}$), and 7-day ($604,800\text{s}$) sliding partitions.
* **Hardware & Spatial Fingerprinting**: Set-membership verification against user-associated historical device registries $\mathcal{D}$ and geographical centroid registries $\mathcal{L}$.

#### B. Phased Cold-Start Confidence Tiering
To resolve the cold-start false-positive dilemma, customer history confidence is dynamically classified:
* Tier 0 (`NONE`, $N=0$): Novel device and location flags are programmatically overridden to zero ($new\_device = 0, location\_changed = 0$). Auto-quarantine is inhibited unless $P_{\text{fraud}} \ge 0.70$.
* Tier 1 (`LIMITED`, $1 \le N < 3$): Baseline statistical variance calculations are suppressed; heuristic bounds apply.
* Tier 2 (`MODERATE`, $3 \le N < 5$): Temporal boundary testing is enabled ($\min(H) \le H \le \max(H)$).
* Tier 3 (`ESTABLISHED`, $N \ge 5$): Full dispersion and anomaly z-score weighting active.

#### C. Dual-Stage Model Inference and Structured Reasoning
The 20-dimensional vector is transmitted to a dedicated microservice. The LightGBM classifier executes matrix multiplication and tree traversals to generate $P_{\text{fraud}}$ in under 15ms. Concurrently, a structured context payload is assembled and passed to a generative model (Llama 3.3 70B via Groq LPUs) enforcing strict JSON schema parsing:
```json
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "reasons": ["array of causal factors"],
  "requires_admin_review": boolean,
  "summary": "plain-text synthesis"
}
```
If the generative reasoning endpoint encounters network latency exceeding a 15-second deadline or returns malformed tokens, a deterministic fallback function (`_fallback_analysis`) seamlessly engages, preserving the LightGBM risk classification without service degradation.

#### D. The Deterministic Decision Engine
The deterministic decision engine evaluates composite signals:
$$\text{Signals} = is\_unusual\_amount + is\_unusual\_time + new\_device + location\_changed$$

* **Account Takeover (ATO) Rule**:
  $$\text{IF } (new\_device \land location\_changed \land is\_unusual\_amount) \implies \text{ACTION: ADMIN\_REVIEW (HIGH)}$$
* **High-Certainty Composite Rule**:
  $$\text{IF } (P_{\text{fraud}} \ge 0.70 \land is\_unusual\_amount) \implies \text{ACTION: ADMIN\_REVIEW (HIGH)}$$
* **Provisional Monitoring Rule**:
  $$\text{IF } (new\_device \lor location\_changed \lor is\_unusual\_amount \lor P_{\text{fraud}} \ge 0.30) \implies \text{ACTION: MONITOR (MEDIUM)}$$
* **Auto-Clearance Rule**:
  $$\text{IF } (known\_device \land known\_location \land \neg unusual\_amount \land \neg unusual\_time \land P_{\text{fraud}} < 0.30) \implies \text{ACTION: AUTO\_APPROVE (LOW)}$$

#### E. Ledger Gate Isolation Protocol
Upon receiving an `ADMIN_REVIEW` directive, the transactional database maintains the transaction record in `PENDING` status and dispatches an alert record to an administrative queue. Account balance records remain completely unaltered, preventing fraudulent capital outflow. Only upon manual cryptographic clearance by an authorized administrator does the transaction state transition to `APPROVED` and commit the balance decrement.

---

### 9. PATENT CLAIMS (PROVISIONAL)

**WE CLAIM:**

1. A computer-implemented method for transaction anomaly assessment and deterministic ledger isolation, comprising:
   * receiving a real-time transaction event comprising account identification, monetary amount, hardware identifier, geographical coordinates, and a transaction timestamp;
   * extracting historical transactions associated with said account identification occurring strictly prior to said transaction timestamp to eliminate data leakage;
   * calculating a dynamic multidimensional behavioral feature vector comprising sliding-window velocity aggregations, statistical spend dispersion parameters, spatial displacement flags, and hardware novelty flags;
   * generating a calibrated anomaly probability score via an ensembled gradient-boosted decision tree classifier within a sub-fifteen-millisecond operational latency;
   * executing structured prompt synthesis to generate natural-language causal reasoning tokens from a high-parameter generative language model constrained by a predefined schema;
   * evaluating said anomaly probability score, said causal reasoning tokens, and said behavioral feature vector through a deterministic multi-branch decision gate; and
   * maintaining an underlying database transaction record in a non-deductive provisional custody state without mutating customer account ledger balances upon detection of predefined composite threat patterns.

2. The method as claimed in claim 1, wherein calculating said behavioral feature vector comprises evaluating a customer maturity index, wherein said hardware novelty flags and said spatial displacement flags are programmatically suppressed to zero when historical transaction count equals zero, thereby preventing false-positive suspensions during cold-start ingestion.

3. The method as claimed in claim 1, further comprising a deterministic fallback protocol configured to catch generative language model latency, timeouts, or format failures, wherein said deterministic decision gate automatically substitutes the gradient-boosted anomaly probability score to ensure uninterrupted checkout execution.

4. The method as claimed in claim 1, wherein said deterministic multi-branch decision gate triggers an administrative review quarantine state when detecting an Account Takeover triad comprising a simultaneous occurrence of a novel hardware device identifier, an unrecorded geographic location identifier, and a transaction monetary amount exceeding three times the historical mean expenditure.

5. A system for real-time transaction risk scoring and ledger quarantine, comprising:
   * one or more processors;
   * a relational database storing financial ledger balances, transaction states, and registered device registries; and
   * a memory coupled to the one or more processors storing instructions that, when executed, configure the processors to execute the steps of claims 1 to 4.

---

### 10. ABSTRACT OF THE INVENTION

A computer-implemented system and method for real-time transaction anomaly assessment and deterministic ledger isolation is disclosed. The architecture utilizes a zero-leakage, point-in-time dynamic feature extraction service that computes a 20-dimensional behavioral feature vector incorporating sliding velocity windows, statistical dispersion ratios, and spatial/hardware novelty flags. The feature vector is processed by an ensembled LightGBM gradient-boosted classifier to produce a continuous anomaly probability score in under 15 milliseconds. Concurrently, a structured prompt is dispatched to a 70-billion-parameter generative language model (Llama 3.3) to generate audit-compliant, natural-language causal explanations. A deterministic decision engine combines the quantitative probability score, the qualitative explanation tokens, and multi-tier cold-start guard heuristics to determine transaction disposition. Transactions exhibiting high composite anomaly patterns are automatically held in an atomic non-deductive `PENDING` quarantine state, protecting financial ledger balances from fraudulent drainage prior to human administrative clearance.

---

**Dated this 26th day of September, 2026**

**Signatures of Applicants / Inventors:**

1. ____________________________ (Raghav Gupta)
2. ____________________________ (Rishabh Srivastava)
3. ____________________________ (Rihabh Singh)
4. ____________________________ (Prince Keshari)
