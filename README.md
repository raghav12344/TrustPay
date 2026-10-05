# TRUSTPAY: End-to-End Engineering Architecture Report
## AI-Powered Fraud Detection & Real-Time Transaction Monitoring System

---

### Academic Engineering Project & Engineering Team

**Academic Program**: Bachelor of Technology (B.Tech) • B.Tech 3rd Year Project Evaluation 2026  
**Department**: Department of Computer Science & Engineering  

#### Project Contributors
| Member # | Student Name | Registration Number | Department |
| :---: | :--- | :---: | :--- |
| **Member 1** | **Raghav Gupta** | `20243226` | B.Tech (3rd Year) • Computer Science & Engineering |
| **Member 2** | **Rishabh Srivastava** | `20243236` | B.Tech (3rd Year) • Computer Science & Engineering |
| **Member 3** | **Rishabh Singh** | `20243235` | B.Tech (3rd Year) • Computer Science & Engineering |
| **Member 4** | **Prince Keshari** | `20243218` | B.Tech (3rd Year) • Computer Science & Engineering |

---

### Executive Summary

**TRUSTPAY** is a production-grade, simulated banking and financial intelligence platform designed to process high-throughput financial transactions while simultaneously executing multi-tiered artificial intelligence risk analysis.

The enterprise architecture decouples responsibilities across six independent, containerized services:
1. **Frontend Presentation Layer (`frontend` — Port 5173)**: React 18 + Vite Single Page Application (SPA) offering dedicated portals for Retail Customers and Compliance Administrators.
2. **Core Banking API Gateway (`backend` — Port 5000)**: Node.js / Express 5 RESTful gateway managing stateless JWT authentication, RBAC authorization, location geocoding, device fingerprinting, and asynchronous transaction publishing (`202 Accepted`).
3. **In-Memory Cache & Protection Layer (`redis` — Port 6379)**: Redis 7 Alpine engine enforcing a **Sliding-Window Rate Limiter** (`ZSET`, max 5 requests per 10s per user/IP) on `/api/transactions` and sub-millisecond response caching on `/api/accounts/me` (30s TTL) and `/api/auth/profile` (300s TTL) with event-driven cache invalidation.
4. **Asynchronous Message Broker (`rabbitmq` — Ports 5672 / 15672)**: RabbitMQ broker hosting the durable `fraud_evaluation_queue`, decoupling the ~1.4s GenAI/ML evaluation from the Node.js HTTP thread.
5. **Sentinel AI Intelligence & Settlement Worker (`ml-service` — Port 8000)**: Python 3 / FastAPI microservice and `aio-pika` background worker combining a trained LightGBM classifier, Groq-powered Llama 3.3 70B contextual GenAI analyst, hybrid deterministic decision engine, and direct atomic MySQL ledger settlement.
6. **Relational Database Engine (`db` — Port 3306)**: MySQL 8 (Aiven Cloud / Docker) with a Boyce-Codd Normal Form (BCNF) relational schema, ACID stored procedures with row-level locks (`SELECT ... FOR UPDATE`), active triggers, and optimized B-Tree indexes.

```mermaid
flowchart TB
    subgraph Tier1["Tier 1: Client Presentation Layer (React 18 + Vite :5173)"]
        UI_Cust["Customer Portal\n(Dashboard, Payments, Ledger)"]
        UI_Admin["Compliance Cockpit\n(Sentinel Radar, Fraud Queue, Ledger)"]
    end

    subgraph Tier2["Tier 2: API Gateway (Node.js & Express 5 :5000)"]
        RL_MW["Redis Sliding-Window Rate Limiter\n(Max 5 req / 10s -> HTTP 429)"]
        Auth_GW["Auth & Profile Module\n(JWT, Device Fingerprint)"]
        Tx_GW["Transaction Producer\n(Balance Pre-Check, 202 Accepted)"]
        Admin_GW["Admin Operations\n(Omnichannel Ledger, Deposits)"]
    end

    subgraph Tier3["Tier 3: Redis Cache & Rate Limiter (Redis 7 Alpine :6379)"]
        Redis_RL[("Sorted Set Sliding Window\nratelimit:transactions:*")]
        Redis_Cache[("TTL Key-Value Cache\ncache:accounts:me:* (30s)\ncache:auth:profile:* (300s)")]
    end

    subgraph Tier4["Tier 4: Message Broker (RabbitMQ :5672 / :15672)"]
        RMQ_Queue[["Durable Queue\nfraud_evaluation_queue"]]
    end

    subgraph Tier5["Tier 5: Sentinel AI Intelligence Worker (FastAPI + aio-pika :8000)"]
        Feat_Eng["Feature Engineering Pipeline\n(Velocity, Deviation, Device/Geo)"]
        ML_Model["LightGBM Classifier\n(Fraud Probability & Risk Score)"]
        GenAI["GenAI Contextual Analyst\n(Llama 3.3 70B via Groq)"]
        Decision["Hybrid Decision Engine\n(Cold-start, Behavioral Rules)"]
        Settler["Atomic MySQL Settler\n(settlement_service.py)"]
    end

    subgraph Tier6["Tier 6: Relational Ledger Engine (MySQL 8 InnoDB :3306)"]
        Tables[("Normalized Schema (BCNF)\n8 Entities, Foreign Keys")]
        SP["Stored Procedures\n(Approve/Reject with FOR UPDATE)"]
        Triggers["Database Triggers\n(Check Amount, Auto-Timestamp)"]
        Views["Analytical Views\n(Monitoring, KPI Summaries)"]
    end

    UI_Cust -->|"REST JSON + Bearer JWT"| Auth_GW
    UI_Cust -->|"POST /api/transactions"| RL_MW
    RL_MW -->|"Allowed"| Tx_GW
    UI_Admin -->|"Audit, Approve, Reject, Deposit"| Admin_GW

    RL_MW <-->|"ZREMRANGEBYSCORE / ZCARD / ZADD"| Redis_RL
    Auth_GW <-->|"GET / SETEX / DEL"| Redis_Cache
    Tx_GW -->|"Invalidate Cache"| Redis_Cache

    Tx_GW -->|"1. INSERT status='PENDING'"| Tables
    Tx_GW -->|"2. Publish Persistent Job"| RMQ_Queue
    Tx_GW -.->|"3. Immediate 202 Accepted"| UI_Cust

    RMQ_Queue -->|"4. Consume (aio-pika)"| Feat_Eng
    Feat_Eng --> ML_Model
    Feat_Eng --> GenAI
    ML_Model --> Decision
    GenAI --> Decision
    Decision --> Settler
    Settler -->|"5. INSERT Prediction/Alert & Settle Balance"| Tables

    Admin_GW -->|"CALL Approve/RejectTransaction"| SP
    SP --> Tables
    Tables -.-> Triggers
    Tables -.-> Views
```

---

## 1. Frontend Presentation Layer (`frontend/`)

### 1.1 Technical Stack & Foundations
- **Framework**: React 18 with Vite for sub-second hot module replacement and production builds.
- **Routing**: `react-router-dom` v6 with client-side role guards (`ProtectedRoute`).
- **Styling Architecture**: Pure CSS design tokens (`src/index.css`) eliminating external runtime overhead while delivering an enterprise fintech aesthetic.
- **Icons & Telemetry**: `lucide-react` for semantic iconography.
- **State & Context Architecture**:
  - `AuthContext`: Tracks JWT authentication, customer/admin roles, token persistence in `localStorage`, and device identification.
  - `ThemeContext`: Toggles and persists Light / Dark theme tokens on `document.documentElement[data-theme]`.
  - `ToastContext`: Global notification pipeline providing actionable feedback (`success`, `error`, `warning`, `info`).

---

### 1.2 User Experience & Page Architecture

#### A. Authentication & Identity
- **`Login.jsx` & `Register.jsx`**:
  - Enforces client-side validation for emails, phone numbers, and strong passwords.
  - Generates or retrieves an immutable client device fingerprint (`deviceIdentifier` UUID stored in `localStorage`) transmitted during authentication to detect account takeovers from unknown devices.
  - Dynamically redirects authenticated users to their authorized workspace (`/dashboard` for Customers, `/admin` for Administrators).

#### B. Retail Customer Experience
1. **Customer Dashboard (`CustomerDashboard.jsx`)**:
   - Liquidity card displaying formatted Indian Rupee balance (`₹`), account number, and account type.
   - Quick action bar (Make Transaction, View Ledger, Refresh).
   - Live telemetry counters (Monthly spend, completed transactions, security status).
   - Auto-refreshes data on window focus.
2. **Make Transaction (`MakeTransaction.jsx`)**:
   - Form for transaction type (`PAYMENT`, `TRANSFER`, `WITHDRAWAL`, `DEPOSIT`), amount, and merchant name.
   - HTML5 Geolocation API integration capturing real-time latitude/longitude coordinates to evaluate location jump anomalies.
   - Pre-validates account balance to prevent negative balances before sending network requests.
   - Instant optimistic balance adjustment and transaction outcome modal.
3. **Transaction Ledger & Details (`Transactions.jsx`, `TransactionDetails.jsx`)**:
   - Filterable table by status (`ALL`, `APPROVED`, `PENDING`, `REJECTED`) and transaction type.
   - Copyable transaction hashes and detailed modal dossiers displaying merchant, timestamp, and device metadata.
4. **Profile & Security (`Profile.jsx`)**:
   - Displays customer account dossier, registered device specifications, network IP telemetry, and active theme settings.

#### C. Administrative Compliance Cockpit
1. **Sentinel Overview (`AdminDashboard.jsx`)**:
   - Real-time radar metrics: Total Processed Volume, Active Fraud Alerts, Clean Clearances, Blocked Fraud Volume.
   - Live High-Risk Alert Queue with fast review triggers.
2. **Fraud Alerts Queue (`FraudAlerts.jsx`)**:
   - Filterable compliance queue sorted by risk score and severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - One-click navigation to forensic examination.
3. **Alert Forensic Inspector (`FraudTransactionDetails.jsx`)**:
   - Comprehensive risk assessment card featuring a visual 0–100 risk score meter.
   - Behavioral signal badges (e.g., `New Device Detected`, `Unusual Hour`, `Location Mismatch`).
   - Groq AI Explanation: Natural language explanation summarizing why the transaction was flagged.
   - Customer Verification Utility: Direct telephone dialer simulation to call the customer.
   - Mandatory Audit Resolution: Approval / Rejection form requiring an immutable reason logged to `admin_reviews`.
4. **Omnichannel Transactions Ledger (`AdminTransactions.jsx`)**:
   - Master ledger covering all customers and states:
     - **Passed**: Cleared automatically by Sentinel AI.
     - **Reviewed**: Manually cleared or rejected by compliance officers with audit notes.
     - **Pending (Error Holds)**: Transactions held safely when the ML service experienced a timeout or anomaly.
     - **Pending (Security Flags)**: High-risk anomalies awaiting review.
   - Customer picker dropdown allowing instant filtering by individual account or global oversight.
   - Inline Resolution Modal enabling immediate approval/rejection and balance settlement.
5. **Accounts & Liquidity Management (`AdminAccounts.jsx`)**:
   - Displays all registered customer bank accounts and current balances.
   - Direct modal deposit tool (`CreditAccountModal.jsx`) allowing administrators to inject liquidity into customer accounts.
6. **Customer Directory (`CustomersList.jsx`)**:
   - Master directory with quick-action links to inspect any customer's dedicated transaction history or deposit funds.

#### D. Public Architectural Showcase & Landing Page (`LandingPage.jsx` at `/`)
1. **Interactive 4-Tier Distributed System Visualizer**:
   - Comprehensive interactive breakdown of Tier 1 (Client UI), Tier 2 (Express 5 Gateway), Tier 3 (Sentinel AI Microservice), and Tier 4 (Aiven MySQL 8 Relational Database).
   - Highlights protocols, data exchange formats, and strict separation of concerns.
2. **Sentinel Real-Time Telemetry Terminal & Security Simulator**:
   - Interactive security terminal streaming synthetic transactions (amount, device hash, coordinates, velocity deviation).
   - Simulates real-time LightGBM 0–100 risk scoring, demonstrating instant clearance (`CLEARED`) vs. quarantine (`SENTINEL HOLD`).
3. **Live Cloud API Health Probing**:
   - Client-side liveness ping querying the live cloud backend (`https://trustpay-backend-service.onrender.com/api/health`).
   - Displays real-time operational status, latency, and SLA uptime indicators.
4. **Academic Engineering Project & Team Showcase**:
   - Prominently showcases the 4 academic project contributors in clean, balanced cards with high-contrast monospace registration badges:
     - **Raghav Gupta** (`20243226`)
     - **Rishabh Srivastava** (`20243236`)
     - **Rishabh Singh** (`20243235`)
     - **Prince Keshari** (`20243218`)
   - B.Tech • Computer Science & Engineering • 3rd Year Project 2026.

---

### 1.3 Comprehensive UI/UX Audit & Multi-Viewport Verification

A rigorous 20-point UI/UX audit was conducted across four standardized responsive breakpoints:
- **1440px Desktop**: Widescreen layouts, full-feature analytical cards, persistent navigation sidebars.
- **1280px Laptop**: Optimized high-density grids, sticky transaction review headers.
- **768px Tablet**: Adaptive flex wrappers, collapsible sidebar with slide-over drawers, touch-friendly tap targets.
- **390px Mobile**: Fluid single-column stacks, horizontal table scrolling with sticky index columns, bottom sheet modals, and touch targets $\ge 44 \times 44\text{px}$.

#### 20-Point Fintech & Security Audit Matrix
| # | Audit Criterion | Benchmark Standard | Implementation in TrustPay | Verification Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Spacing Consistency** | Tokenized 4px/8px grid | CSS variables `--space-xs` through `--space-2xl` enforce uniform margins and padding | **PASSED** |
| 2 | **Typography Hierarchy** | Inter / Plus Jakarta Sans | 6-level type scale with strict tracking, weight contrast (400, 600, 700), and lineHeight | **PASSED** |
| 3 | **Layout Alignment** | Optical baseline alignment | Flex and CSS Grid alignment across all dashboards, icons, and numerical readouts | **PASSED** |
| 4 | **Card Sizing** | Responsive aspect ratios | Auto-fill grid templates (`repeat(auto-fit, minmax(280px, 1fr))`) preventing clipping | **PASSED** |
| 5 | **Sidebar Behavior** | Persistent desktop, drawer mobile | Fixed desktop navigation with smooth collapsible backdrop drawer on $\le 768\text{px}$ | **PASSED** |
| 6 | **Responsive Tables** | Horizontal overflow protection | Custom responsive wrappers with touch-scroll affordance, sticky headers, and mobile cards | **PASSED** |
| 7 | **Button Consistency** | Unified states & focus rings | Standardized `.btn-primary`, `.btn-secondary`, `.btn-danger` with `:focus-visible` rings | **PASSED** |
| 8 | **Loading States** | Zero layout shifts | Dual-ring SVG spinners and pulse skeleton placeholders for async network calls | **PASSED** |
| 9 | **Empty States** | Contextual recovery paths | Illustrated empty queue states with clear descriptions and actionable refresh CTAs | **PASSED** |
| 10 | **Error States** | Graceful failure feedback | Red error borders, semantic error badges, and global Toast notification alerts | **PASSED** |
| 11 | **Modal Sizing** | Clamped viewport bounds | Centered modal dialogs with backdrop blur (`backdrop-filter: blur(8px)`), max-w 90vw | **PASSED** |
| 12 | **Form UX** | Clean input affordances | High-contrast label bindings, numeric input masks, validation feedback, and clear helpers | **PASSED** |
| 13 | **Accessibility** | WCAG 2.1 AA Compliance | ARIA labels on icon buttons, semantic heading tags, and screen-reader navigable controls | **PASSED** |
| 14 | **Contrast Ratios** | Minimum 4.5:1 ratio | Tested contrast compliant in both Dark Mode (`#0b0f19`) and Light Mode (`#f8fafc`) | **PASSED** |
| 15 | **Navigation** | Contextual wayfinding | Active route pill indicators, breadcrumbs in deep reviews, and frictionless back links | **PASSED** |
| 16 | **Visual Hierarchy** | Information weighting | Bold liquidity figures, secondary timestamps, stark colored badges (`#10b981`, `#ef4444`) | **PASSED** |
| 17 | **Transaction Result UX** | Clear settlement status | Instant confirmation modal with transaction hash, balance impact, and sentinel status | **PASSED** |
| 18 | **Fraud-Risk Visualization** | Intuitive risk telemetry | Calibrated 0–100 risk score meter with color gradient and behavioral deviation pills | **PASSED** |
| 19 | **Admin Review Workflow** | Step-by-step dispute triage | Unified dossier displaying AI reasoning, phone dialer simulator, and atomic resolution form | **PASSED** |
| 20 | **Mobile Usability** | Touch ergonomics | Minimum $44\text{px}$ touch targets, zero horizontal body scroll, thumb-accessible primary buttons | **PASSED** |

---

## 2. Core Banking API Gateway, Message Queue & Redis Layer (`backend/`)

### 2.1 Technical Stack & Design
- **Runtime**: Node.js with Express 5.
- **Database Driver**: `mysql2/promise` with connection pooling (10 connections, conditional SSL encryption for Aiven Cloud & Docker MySQL).
- **Message Queue Producer**: `amqplib` (AMQP 0-9-1 client) publishing persistent evaluation payloads to the durable `fraud_evaluation_queue` in RabbitMQ (`src/services/queueService.js`).
- **In-Memory Cache & Rate Limiter**: `redis` (v4 client) powering a Sorted-Set (`ZSET`) Sliding-Window Rate Limiter (`src/middleware/rateLimiter.js`) and sub-millisecond route caching (`src/config/redis.js`).
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`) signed with HMAC SHA-256.
- **Password Security**: `bcrypt` salted password hashing.
- **HTTP Client**: `axios` for fallback inter-service communication with the ML microservice.

---

### 2.2 Route Architecture, Rate Limiting & Caching Matrix

| Method | Endpoint | Authorization | Redis / Queue Policy | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | — | Registers a new customer and provisions a unique bank account |
| `POST` | `/api/auth/login` | Public | Invalidates Profile Cache | Authenticates credentials, binds device fingerprint, returns JWT |
| `GET` | `/api/auth/profile` | Authenticated | **Redis Cached (TTL: 300s)** | Retrieves customer/admin profile and registered devices (`X-Cache: HIT/MISS`) |
| `POST` | `/api/transactions` | `CUSTOMER` | **Rate Limited (5 req / 10s)** + **RabbitMQ Producer (`202 Accepted`)** | Pre-validates balance, inserts `PENDING` tx, publishes to `fraud_evaluation_queue`, returns `202 Accepted` |
| `GET` | `/api/transactions` | `CUSTOMER` | — | Returns scoped transaction history for authenticated customer |
| `GET` | `/api/transactions/admin/all` | `ADMIN` | — | Omnichannel ledger across all accounts with diagnostic filters |
| `GET` | `/api/transactions/admin/fraud-alerts` | `ADMIN` | — | Fetches suspicious transaction queue via stored procedure |
| `POST` | `/api/transactions/admin/transactions/:id/approve` | `ADMIN` | Invalidates Account Cache | Executes `ApproveTransaction` stored procedure and updates balance |
| `POST` | `/api/transactions/admin/transactions/:id/reject` | `ADMIN` | — | Executes `RejectTransaction` stored procedure |
| `GET` | `/api/accounts/me` | `CUSTOMER` | **Redis Cached (TTL: 30s)** | Retrieves current account balance and account number (`X-Cache: HIT/MISS`) |
| `GET` | `/api/accounts/admin/all` | `ADMIN` | — | Lists all customer bank accounts and liquidity |
| `POST` | `/api/accounts/admin/deposit` | `ADMIN` | Invalidates Account Cache | Credits account balance and logs deposit transaction |
| `GET` | `/api/health` | Public | — | Liveness probe returning API operational status |

---

### 2.3 Asynchronous RabbitMQ Decoupling (`queueService.js` & `202 Accepted`)

Because the GenAI LLM forensic analysis (`Groq Llama 3.3 70B`) takes $\approx 1.44\text{ seconds}$ over WAN, synchronous HTTP evaluation previously blocked the Node.js event loop. TrustPay decouples transaction ingestion from AI inference using **RabbitMQ**:

1. **Pre-Validation & Ledger Persistence**: When `POST /api/transactions` is called, the Express gateway verifies account ownership, checks `balance >= amount`, validates the device fingerprint, resolves GPS coordinates, and inserts the row into MySQL `transactions` with `status = 'PENDING'`.
2. **Durable Queue Publishing**: The gateway serializes the transaction telemetry (`transaction_id`, `user_id`, `account_id`, `amount`, `device_id`, `location_id`, `latitude`, `longitude`, `balance`) and publishes a persistent message (`persistent: true`) to `fraud_evaluation_queue`.
3. **Instant Non-Blocking Response**: The gateway immediately responds with **`HTTP 202 Accepted`** in $< 15\text{ms}$, freeing the Node.js worker thread to handle high concurrency.
4. **Zero-Downtime Fallback**: If the RabbitMQ broker is unreachable in a standalone non-Docker environment, the controller automatically schedules a non-blocking `setImmediate()` background task so transactions still settle asynchronously.

---

### 2.4 Redis Sliding-Window Rate Limiting & Caching (`redis.js`, `rateLimiter.js`)

1. **Sliding-Window Rate Limiter (`src/middleware/rateLimiter.js`)**:
   - Protects `POST /api/transactions` against brute-force card testing and automated bot bursts.
   - Uses an atomic Redis `MULTI` pipeline over a Sorted Set (`ratelimit:transactions:user:<userId>`):
     - `ZREMRANGEBYSCORE`: Evicts request timestamps older than $t_{\text{now}} - 10,000\text{ ms}$.
     - `ZCARD`: Counts active requests inside the rolling 10-second window.
     - `ZADD` & `PEXPIRE`: Records the current timestamp and refreshes the 10-second key expiry.
   - **Enforcement**: Allows a maximum of **5 requests per 10 seconds** per user/IP. A 6th request within the window is immediately rejected with **`HTTP 429 Too Many Requests`** and standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.
2. **Distributed Response Caching (`src/config/redis.js`)**:
   - **`GET /api/accounts/me`**: Cached under `cache:accounts:me:<userId>` with a **30-second TTL**. Automatically invalidated (`DEL`) whenever a transaction is created, approved by an admin, or credited via admin deposit.
   - **`GET /api/auth/profile`**: Cached under `cache:auth:profile:<userId>` with a **300-second (5-minute) TTL**. Automatically invalidated upon user login when device `last_seen` and IP telemetry change.

---

## 3. Sentinel AI Intelligence & Asynchronous Worker Layer (`ml-service/`)

### 3.1 Technical Stack
- **Framework**: FastAPI (Python 3.11 / 3.13) with Uvicorn ASGI server and `lifespan` background task management.
- **Asynchronous Queue Consumer**: `aio-pika` (`connect_robust` with `prefetch_count=10`) consuming from `fraud_evaluation_queue` (`app/services/queue_consumer.py`).
- **Direct MySQL Settlement Engine**: Atomic ledger settlement (`app/services/settlement_service.py`) updating `fraud_predictions`, `fraud_alerts`, `transactions`, and `accounts` directly from the Python worker.
- **Machine Learning Core**: LightGBM, Scikit-Learn, Pandas, NumPy.
- **Model Serialization**: `joblib`.
- **Large Language Model (LLM)**: Llama 3.3 70B via the Groq High-Speed Inference API.
- **Validation**: Pydantic v2 schemas.

---

### 3.2 Dynamic Behavioral & Spatial Feature Engineering Pipeline (`feature_service.py`)

The ML service queries the database for the customer's historical transactions up to the current transaction timestamp (preventing data leakage) and computes comprehensive multi-dimensional behavioral, spatial, and monetary telemetry:

1. **Temporal Features**:
   - `transaction_hour`: Normalized transaction hour (0–23).
   - `is_night`: Binary flag (`1` if $H \ge 22 \lor H < 6$).
   - `is_weekend`: Binary flag (`1` if $\text{Weekday} \ge 5$).
   - `is_unusual_time`: Binary flag indicating if the transaction occurs outside the customer's typical active hour window ($\text{Hour} < \min(H) \lor \text{Hour} > \max(H)$).
2. **Monetary Velocity & Statistical Spend Profiling**:
   - `amount`: Raw transaction magnitude ($X$).
   - `historical_amount_mean`: Rolling historical average ($\mu$).
   - `historical_amount_std`: Rolling standard deviation ($\sigma$).
   - `amount_to_historical_mean`: Ratio of current expenditure to historical average ($R = X / \mu$).
   - `amount_zscore`: Normalized dispersion standard score ($Z = (X - \mu)/\sigma$).
   - `is_unusual_amount`: Evaluates to `1` if amount exceeds $3 \times \mu$.
   - `is_extreme_outlier`: Asserts `1` if standard score $Z \ge 3.5$ or spend ratio $R \ge 5.0$.
3. **Sliding-Window Velocity Aggregations**:
   - `transactions_last_10m` & `amount_last_10m`: Rapid burst velocity in the last 600 seconds.
   - `is_burst_velocity`: Evaluates to `1` if $\ge 3$ transactions occur within 10 minutes (bot / card-testing indicator).
   - `transactions_last_1h`: Transaction velocity in the last 3,600 seconds.
   - `transactions_last_24h` & `amount_last_24h`: Transaction count and volume in the last 24 hours.
   - `transactions_last_7d` & `amount_last_7d`: Cumulative weekly velocity and volume.
4. **Hardware & Spatial Geolocation Velocity**:
   - `known_device`: Binary flag (`1` if device identifier matches previous trusted logins).
   - `new_device`: Binary flag (`1` if hardware profile has never been registered by this user).
   - `known_location`: Binary flag (`1` if transaction originates from user's standard city/state).
   - `location_changed`: Binary flag (`1` if location ID differs from previous transaction history).
   - `distance_from_last_km`: Great-circle Haversine spatial distance ($\Delta d$ in km) between consecutive transactions.
   - `travel_speed_kmh`: Real-world implied velocity ($V = \Delta d / \Delta t$ in km/h).
   - `is_impossible_travel`: Physical teleportation flag asserted if $V > 800\text{ km/h}$ over $\Delta d > 100\text{ km}$.
   - `min_distance_to_known_locations_km` & `is_distant_location`: Minimum distance to any historically familiar centroid ($> 500\text{ km}$).
5. **Capital Depletion (Balance Drain) Telemetry**:
   - `balance_drain_ratio`: Proportion of available account balance demanded ($\min(1.0, X / \text{Balance})$).
   - `is_high_balance_drain`: Asserts `1` if drain ratio $\ge 0.85$, amount $\ge \text{₹}1,000$, and initiated from an unverified device.
6. **Account Maturity Index**:
   - `transaction_count`: Cumulative lifetime transaction count ($N$).
   - `history_confidence`: Categorical confidence tier (`NONE` for $N=0$, `LIMITED` for $1 \le N < 3$, `MODERATE` for $3 \le N < 5$, `ESTABLISHED` for $N \ge 5$).

---

### 3.3 Supervised Machine Learning Model (`train.py`, `predict.py`)

- **Algorithm**: LightGBM (Light Gradient Boosting Machine) compiled decision tree ensemble.
- **Input Dimensionality**: Evaluates the 20-dimensional core behavioral feature vector in $< 15\text{ms}$.
- **Calibrated Multiplier Scoring**: Combines the raw model probability with physical spatial and velocity constraints:
  - Impossible travel ($V > 800\text{ km/h}$) automatically floors calibrated risk at $88.0$.
  - Rapid burst velocity ($3+\text{ tx in 10m}$) applies a $+25.0$ risk penalty.
  - High balance drain ($>85\%$ depletion) applies a $+20.0$ risk penalty.
  - Extreme spend outlier ($Z \ge 3.5$) applies a $+15.0$ risk penalty.
- **Output Metrics**:
  - `fraud_probability`: Calibrated continuous probability $\in [0.0, 1.0]$.
  - `base_model_probability`: Uncalibrated raw tree inference probability.
  - `risk_score`: Calibrated integer score $\in [0, 100]$.
  - `risk_level`:
    - `LOW`: Calibrated score $< 30$
    - `MEDIUM`: $30 \le \text{Calibrated Score} < 70$
    - `HIGH`: $\text{Calibrated Score} \ge 70$

---

### 3.4 GenAI Contextual Analyst (`analyst.py`, `context_builder.py`)

To transform statistical probabilities into compliance intelligence, the service formats the transaction telemetry and behavioral deviation profile into a structured prompt evaluated by an LLM:

- **JSON Output Contract**:
  ```json
  {
    "risk_level": "HIGH",
    "reasons": [
      "CRITICAL: Impossible travel detected (1,162.1 km at implied speed of 4,648.3 km/h).",
      "Transaction amount (₹50,000) exceeds historical average by 12x.",
      "High balance depletion: withdraws 92% of available account balance from an unverified device."
    ],
    "requires_admin_review": true,
    "summary": "High-risk anomaly indicating potential account takeover with impossible travel."
  }
  ```
- **Deterministic Fallback**: If the external Groq LLM API is rate-limited, unreachable, or times out, the analyst invokes `_fallback_analysis()`, which preserves the LightGBM model score and sets standard explanation notes without blocking the pipeline.

---

### 3.5 Hardened Deterministic Decision Engine (`engine.py`)

The final settlement action is governed by a deterministic rule engine that fuses calibrated ML risk probabilities, physical telemetry constraints, and account maturity flags:

```python
# Pseudo-logic of make_final_decision:

# Rule 1: Cold-Start Guard (First-time user protection)
if transaction_count == 0:
    if fraud_probability >= 0.70:
        return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}
    return {"final_risk_level": "MEDIUM", "action": "MONITOR"}

# Rule 2: Impossible Travel Threat (Physical teleportation / Proxy jumping)
if is_impossible_travel:
    return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}

# Rule 3: Account Takeover (ATO) Triad
if new_device and (location_changed or is_distant_location) and (unusual_amount or is_high_balance_drain):
    return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}

# Rule 4: Rapid Burst / Card Testing Attack
if is_burst_velocity and (new_device or fraud_probability >= 0.40):
    return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}

# Rule 5: Capital Depletion on Unverified Device
if is_high_balance_drain and new_device:
    return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}

# Rule 6: High ML Probability + Extreme Spend Outlier
if (fraud_probability >= 0.70 and (unusual_amount or is_extreme_outlier)) or (is_extreme_outlier and new_device):
    return {"final_risk_level": "HIGH", "action": "ADMIN_REVIEW"}

# Rule 7: Moderate / Isolated Discrepancies
if new_device or location_changed or unusual_amount or is_burst_velocity or is_distant_location or fraud_probability >= 0.30:
    return {"final_risk_level": "MEDIUM", "action": "MONITOR"}

# Rule 8: Familiar Customer Baseline (Instant Clearance)
if known_device and known_location and not unusual_amount and not unusual_time and not is_burst_velocity and fraud_probability < 0.30:
    return {"final_risk_level": "LOW", "action": "AUTO_APPROVE"}
```

---

### 3.6 Empirical Machine Learning Accuracy, Latency & Decision Layer Benchmarks

The machine learning engine and its end-to-end decision pipeline were empirically evaluated on the full 100,000-transaction processed dataset (`training_features.csv`) using a strict **80/20 chronological holdout test set** ($20,000$ unseen transactions: $19,311$ legitimate and $689$ fraudulent; class imbalance ratio $\approx 28:1$). Benchmarks were measured using high-precision hardware timers (`time.perf_counter_ns`).

#### A. Statistical Accuracy Metrics (Holdout Test Set $N = 20,000$, Threshold $= 0.50$)

| Metric | Measured Score | Industry Standard | Operational Assessment |
| :--- | :---: | :---: | :--- |
| **Overall Accuracy** | **99.98%** | $> 98.0\%$ | High global classification fidelity |
| **Balanced Accuracy** | **99.64%** | $> 95.0\%$ | Resilient against severe class imbalance |
| **ROC-AUC Score** | **0.9991** | $> 0.950$ | Near-perfect separation between fraud and clean distributions |
| **PR-AUC (Avg Precision)** | **0.9986** | $> 0.900$ | High precision across all recall thresholds |
| **Fraud Precision** | **100.00%** | $> 92.0\%$ | **Zero false alarms**; legitimate customers are never flagged |
| **Fraud Recall (Sensitivity)** | **99.27%** | $> 90.0\%$ | Intercepted 684 of 689 fraud attempts directly |
| **Specificity (Clean Pass Rate)** | **100.00%** | $> 99.0\%$ | 100% of legitimate transactions cleared |
| **F1-Score (Fraud Class)** | **0.9964** | $> 0.900$ | Optimal harmonic balance |
| **False Positive Rate (FPR)** | **0.000%** | $< 0.10\%$ | Zero customer friction |
| **False Negative Rate (FNR)** | **0.726%** | $< 3.00\%$ | Only 5 fraud slips out of 20,000 transactions |

#### B. Confusion Matrix ($N = 20,000$)
```
                        PREDICTED CLEAN         PREDICTED FRAUD
ACTUAL CLEAN (19,311)    19,311 (100.00%)            0 (0.00%)    <-- True Negatives / False Positives
ACTUAL FRAUD    (689)         5   (0.73%)          684 (99.27%)   <-- False Negatives / True Positives
```

#### C. Decision Threshold Sensitivity Sweep
| Threshold $\tau$ | Precision | Recall | F1-Score | False Positives | False Negatives | Operating Profile |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **0.20** | 99.85% | 99.42% | 0.9964 | 1 | 4 | Maximum intercept mode |
| **0.30** | 100.00% | 99.42% | 0.9971 | 0 | 4 | **Optimal peak F1-Score** |
| **0.40** | 100.00% | 99.27% | 0.9964 | 0 | 5 | Balanced conservative |
| **0.50 (Default)** | **100.00%** | **99.27%** | **0.9964** | **0** | **5** | **Production Baseline** |
| **0.60** | 100.00% | 99.27% | 0.9964 | 0 | 5 | Stable plateau |
| **0.70** | 100.00% | 99.27% | 0.9964 | 0 | 5 | High certainty |
| **0.80** | 100.00% | 99.27% | 0.9964 | 0 | 5 | Ultra-high confidence |

#### D. Multi-Tier Latency Benchmarks (ML Model + LLM + Decision Layer)

To evaluate production feasibility for real-time payments (e.g., POS terminal swipes and instant UPI payment clearing), microsecond-precision hardware timers (`time.perf_counter_ns`) were executed across $1,000$ consecutive single-transaction evaluations, benchmarked across each distinct subsystem layer:

##### 1. Layer-by-Layer Latency & Execution Breakdown

| Pipeline Layer | Function / Component | Underlying Engine | Mean Latency | Median ($p_{50}$) | $p_{99}$ Tail | Throughput (QPS) | Operational Scope |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Layer 1: Feature Extraction** | `build_customer_features` | Vectorized NumPy / Pandas | **0.127 ms** ($127\,\mu\text{s}$) | 0.123 ms | 0.192 ms | 7,874 QPS | 14 dynamic behavioral features (Z-score, velocity, Haversine jump) |
| **Layer 2: ML Model Inference** | `predict_fraud` | LightGBM + Physics Engine | **2.346 ms** | 2.297 ms | 3.610 ms | 426 QPS | 300 tree evaluations + speed & balance drain physical bounds |
| *(Raw Model Evaluation)* | `predict_proba` | Pure C++ LightGBM booster | **1.310 ms** | 1.200 ms | 1.840 ms | 764 QPS | Raw matrix gradient boosting tree evaluation |
| **Layer 3: GenAI Context Builder**| `build_genai_context` | Structured JSON Assembly | **0.036 ms** ($36\,\mu\text{s}$) | 0.035 ms | 0.058 ms | 27,770 QPS | Serializes ledger history, telemetry, and ML risk flags |
| **Layer 4: LLM Forensic Analyst** | `analyze_transaction` | Groq Cloud Llama 3.3 70B | **1,435.6 ms** | 1,452.2 ms | 1,541.8 ms | ~0.7 QPS | WAN round-trip + 70B parameter natural language forensic reasoning |
| *(LLM Fail-Safe Fallback)* | `_fallback_analysis` | Deterministic Local Rules | **0.005 ms** ($5\,\mu\text{s}$) | 0.005 ms | 0.009 ms | 200,000 QPS | Zero-delay fallback when Groq experiences timeout or outage |
| **Layer 5: Decision Engine** | `make_final_decision` | Institutional Action Matrix | **0.008 ms** ($8\,\mu\text{s}$) | 0.008 ms | 0.014 ms | 125,000 QPS | Fuses ML risk, physics constraints, and compliance directives |

##### 2. Pipeline Operating Profiles

- **Profile A: Synchronous Real-Time Payment Fast-Path (Layers 1 + 2 + 5)**:
  - **Total Latency**: **2.517 ms** (Mean) / **2.465 ms** (Median) / **3.859 ms** ($p_{99}$)
  - **Single-Core Throughput**: $\approx 400\text{ – }560\text{ transactions/second}$
  - **SLA Assessment**: Well within the ultra-strict $< 50\text{ ms}$ global banking SLA for card authorization networks and instantaneous UPI rails.
- **Profile B: Full Deep Forensic Pipeline (Layers 1 + 2 + 3 + 4 + 5)**:
  - **Total Latency**: **1,438.1 ms** ($\approx 1.44\text{ seconds}$)
  - **Time Allocation**: Core local computation is **0.18%** ($2.52\text{ ms}$); external WAN network latency + LLM token generation represents **99.82%** ($1,435.6\text{ ms}$).
  - **Operational Workflow**: Triggered asynchronously for transactions routed to `MONITOR` or `ADMIN_REVIEW`, generating real-time audit dossiers without blocking user payments.
- **Profile C: Zero-Downtime Fail-Safe Mode**:
  - **Total Latency**: **2.522 ms**
  - **Action**: Should the external cloud LLM experience network partitions, latency spikes ($> 2.5\text{s}$), or HTTP errors, the pipeline degrades gracefully to local deterministic heuristics, placing ambiguous transactions in `PENDING_ERROR` or `ADMIN_REVIEW` to protect institutional liquidity.

#### E. Batch Inference Scalability & High-Throughput SLA
| Batch Size | Total Execution Time | Latency Per Item | Throughput (QPS) | Use Case |
| :---: | :---: | :---: | :---: | :--- |
| **1** | 1.32 ms | $1,318.6\text{ }\mu\text{s}$ | 758 QPS | Real-time Point-of-Sale / UPI |
| **10** | 1.44 ms | $144.2\text{ }\mu\text{s}$ | 6,936 QPS | Micro-batched queue |
| **50** | 1.63 ms | $32.6\text{ }\mu\text{s}$ | 30,677 QPS | High-traffic payment gateway |
| **100** | 1.74 ms | $17.4\text{ }\mu\text{s}$ | 57,480 QPS | Enterprise clearinghouse |
| **1,000** | 4.87 ms | $4.87\text{ }\mu\text{s}$ | 205,321 QPS | Bulk batch processing |
| **10,000** | 35.36 ms | $3.54\text{ }\mu\text{s}$ | 282,825 QPS | Scheduled reconciliations |
| **20,000** | 70.10 ms | $3.50\text{ }\mu\text{s}$ | **285,318 QPS** | Full daily offline ledger audit |

#### F. End-to-End Decision Layer Performance (ML + Rules + GenAI Context)
When the calibrated ML scores are fused with deterministic institutional business rules in `engine.py`:
- **Total Fraud Capture Rate (Recall)**: **99.42%** ($685$ of $689$ total fraud attempts intercepted across `MONITOR` + `ADMIN_REVIEW`).
- **Clean Auto-Approval Rate**: **98.96%** ($19,111$ of $19,311$ legitimate clean transactions auto-approved instantly with zero friction).
- **Admin Hard-Block Precision**: **100.00%** ($0$ false alarms; zero legitimate users hard-blocked).
- **Admin Hard-Block Recall**: **96.52%** ($665$ fraud attempts immediately blocked without customer intervention).
- **Stepped-Up Monitoring Rate**: **1.04%** (only $200$ borderline clean transactions placed under monitor).
- **Uncaptured Slippage Rate**: **0.58%** (only $4$ out of $689$ fraudulent transactions escaped ML and rule filters).

#### G. Top 10 Most Influential Features (Split Gain)
1. **`amount`** ($1,801$ splits): Absolute transaction monetary value.
2. **`amount_to_historical_mean`** ($1,305$ splits): Deviation ratio relative to user baseline.
3. **`amount_zscore`** ($995$ splits): Statistical standard score of the transaction.
4. **`transaction_count`** ($877$ splits): Historical transaction frequency and account maturity.
5. **`historical_amount_mean`** ($871$ splits): Account regular baseline average expenditure.
6. **`historical_amount_max`** ($765$ splits): Historical expenditure upper ceiling boundary.
7. **`historical_amount_std`** ($754$ splits): Variance in account expenditure.
8. **`transaction_hour`** ($591$ splits): Diurnal cycle and circadian indicators.
9. **`historical_amount_min`** ($589$ splits): Baseline minimum volume.
10. **`amount_last_7d`** ($565$ splits): Velocity and rolling spend volume.

---

### 3.7 Real-World Cross-Dataset Generalization Benchmarks (ULB & IEEE-CIS)

To validate the algorithmic resilience and portability of the TrustPay LightGBM pipeline across diverse financial distributions, the architecture was benchmarked against two internationally recognized real-world fraud repositories: the **ULB European Cardholders dataset** ($284,807$ transactions) and the **IEEE-CIS Fraud Detection dataset** ($30,000$ transactions).

#### A. Comprehensive Cross-Dataset Performance Matrix

| Evaluation Dimension | TrustPay Sentinel Pipeline (Project Baseline) | ULB European Cardholders Benchmark (Kaggle) | IEEE-CIS Dataset (Full 48-Feature Ingestion) | IEEE-CIS Dataset (Strictly 20 Project Features) |
| :--- | :---: | :---: | :---: | :---: |
| **Dataset Domain** | Modern Simulated Core Banking | Real-World European Credit Cards | Real-World E-Commerce & CNP | Real-World E-Commerce & CNP |
| **Total Population** | 100,000 transactions | 284,807 transactions | 30,000 transactions | 30,000 transactions |
| **Holdout Evaluation Set** | 20,000 transactions | 56,962 transactions | 6,000 transactions | 6,000 transactions |
| **Class Imbalance** | 3.48% (1 in 28) | 0.173% (1 in 578) | 2.87% (1 in 34) | 2.87% (1 in 34) |
| **Features Ingested** | 20 Behavioral & Telemetry | 30 (Time, Amount, V1–V28 PCA) | 48 (Card, Addr, Dist, Vesta) | **Strictly Our 20 Project Features** |
| **Overall Accuracy** | **99.98%** | **99.951%** | **97.97%** | **96.90%** |
| **ROC-AUC Score** | **0.9991** | **0.9770** | **0.8994** | **0.7575** |
| **PR-AUC (Avg Precision)** | **0.9986** | **0.7651** | **0.6113** | **0.1423** |
| **Fraud Precision** | **100.00%** | **91.23%** | **90.00%** | **60.00%** (at $\tau = 0.30$) |
| **Fraud Recall (Sensitivity)** | **99.27%** | **69.33%** (up to 74.67%) | **38.71%** (up to 68.82%) | **39.25%** (at $\tau = 0.05$) |
| **Operational Fraud Catch** | **99.42%** (Decision Layer) | 74.67% (Model) | 68.82% (Model) | 39.25% (Model) |
| **Specificity (Clean Pass)** | **100.00%** | **99.991%** | **99.86%** | **100.00%** |
| **False Positive Rate (FPR)**| **0.000%** (0 false alarms) | **0.0088%** (5 false alarms) | **0.138%** (8 false alarms) | **0.000%** (0 false alarms) |
| **Mean Inference Latency** | **1.31 ms** (Model) / **1.78 ms** (End-to-End) | **1.58 ms** | **1.90 ms** | **0.85 ms** |
| **Batch Scalability Throughput** | **285,318 QPS** | **366,069 QPS** | **183,940 QPS** | **344,548 QPS** |

#### B. Architectural Analysis of Cross-Domain Performance
1. **Why TrustPay Achieves 99.98% Accuracy**:
   - In modern banking, the institution possesses direct, unblinded client telemetry: persistent hardware device UUIDs, HTML5 GPS coordinates, customer account balance drain ratios, and dedicated customer spend baselines. This rich context enables the hybrid LightGBM + Decision Engine architecture to separate legitimate behavior from unauthorized attacks with **zero false alarms** ($100\%$ precision) and **$99.42\%$ operational fraud capture**.
2. **Generalization on Blinded Real-World Vectors (ULB Dataset)**:
   - On the ULB benchmark, all bank telemetry was privacy-anonymized into mathematical PCA components ($V_1$–$V_{28}$). Even under an extreme **$0.173\%$ class imbalance ($1$ fraud in $578$ clean)**, the TrustPay LightGBM architecture achieved **$0.9770\text{ ROC-AUC}$**, **$99.951\%\text{ accuracy}$**, and **$91.23\%\text{ precision}$** ($5$ false alarms across $56,887$ legitimate transactions).
3. **Resilience on E-Commerce Card-Not-Present Traffic (IEEE-CIS Dataset)**:
   - When tested on complex real-world web traffic from Vesta Corporation, the engine achieved **$0.8994\text{ ROC-AUC}$** and **$90.00\%\text{ precision}$**.
   - When stripped of 95% of its native attributes and evaluated **strictly on our 20 project features**, the core tree engine still captured an **ROC-AUC of $0.7575$**, maintaining sub-millisecond execution ($0.85\text{ ms}$).

---

## 4. Comprehensive Database Entity-Relationship (ER) Model

The TrustPay relational database engine operates on MySQL 8 (InnoDB engine) on Aiven Cloud. The architecture is decomposed into eight normalized entities satisfying Boyce-Codd Normal Form (BCNF).

### 4.1 Master Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : "owns (1:N)"
    USERS ||--o{ DEVICES : "registers (1:N)"
    USERS ||--o{ ADMIN_REVIEWS : "audits (1:N)"
    ACCOUNTS ||--o{ TRANSACTIONS : "holds (1:N)"
    LOCATIONS ||--o{ TRANSACTIONS : "geolocates (1:N)"
    DEVICES ||--o{ TRANSACTIONS : "originates (1:N)"
    TRANSACTIONS ||--o| FRAUD_PREDICTIONS : "evaluated by (1:1)"
    FRAUD_PREDICTIONS ||--o| FRAUD_ALERTS : "escalates to (1:1)"
    TRANSACTIONS ||--o| FRAUD_ALERTS : "flags (1:1)"
    TRANSACTIONS ||--o| ADMIN_REVIEWS : "resolved by (1:1)"

    USERS {
        BIGINT user_id PK "Auto Increment"
        VARCHAR(100) name "Full Legal Name"
        VARCHAR(150) email UK "Unique Login Email"
        VARCHAR(20) phone UK "Unique Verified Mobile"
        VARCHAR(255) password_hash "Bcrypt Salted Hash"
        ENUM role "CUSTOMER, ADMIN"
        TIMESTAMP created_at "Registration Timestamp"
    }

    ACCOUNTS {
        BIGINT account_id PK "Auto Increment"
        BIGINT user_id FK "References USERS(user_id)"
        VARCHAR(20) account_number UK "Unique Account Identifier"
        ENUM account_type "SAVINGS, CURRENT"
        DECIMAL(15_2) balance "Current Liquidity Balance"
        TIMESTAMP created_at "Provisioned Timestamp"
    }

    DEVICES {
        BIGINT device_id PK "Auto Increment"
        BIGINT user_id FK "References USERS(user_id)"
        VARCHAR(255) device_identifier "Hardware Fingerprint UUID"
        VARCHAR(50) device_type "Mobile, Desktop, Tablet, Web"
        VARCHAR(50) os "Operating System"
        VARCHAR(45) ip_address "IPv4 or IPv6 Address"
        BOOLEAN is_trusted "Trust Status Flag"
        TIMESTAMP first_seen "First Login Detected"
        TIMESTAMP last_seen "Most Recent Activity"
    }

    LOCATIONS {
        BIGINT location_id PK "Auto Increment"
        VARCHAR(100) city "Resolved City Name"
        VARCHAR(100) state "Administrative Region / State"
        VARCHAR(100) country "Country Name"
        DECIMAL(10_7) latitude "GPS Latitude"
        DECIMAL(10_7) longitude "GPS Longitude"
    }

    TRANSACTIONS {
        BIGINT transaction_id PK "Auto Increment"
        BIGINT account_id FK "References ACCOUNTS(account_id)"
        BIGINT device_id FK "References DEVICES(device_id) ON DELETE SET NULL"
        BIGINT location_id FK "References LOCATIONS(location_id) ON DELETE SET NULL"
        DECIMAL(15_2) amount "Amount (CHECK > 0)"
        ENUM transaction_type "TRANSFER, PAYMENT, WITHDRAWAL, DEPOSIT"
        VARCHAR(150) merchant "Merchant / Recipient Name"
        TIMESTAMP transaction_time "Initiation Timestamp"
        ENUM status "PENDING, APPROVED, REJECTED"
        TIMESTAMP created_at "Ledger Entry Creation"
    }

    FRAUD_PREDICTIONS {
        BIGINT prediction_id PK "Auto Increment"
        BIGINT transaction_id FK "References TRANSACTIONS(transaction_id) ON DELETE CASCADE"
        VARCHAR(100) model_id "Model Identifier (e.g. trustpay-lightgbm-v1)"
        DECIMAL(6_5) fraud_probability "Probability Score [0.0, 1.0]"
        DECIMAL(5_2) risk_score "Calibrated Score [0.00, 100.00]"
        ENUM prediction "LOW_RISK, MEDIUM_RISK, HIGH_RISK"
        TIMESTAMP predicted_at "Inference Timestamp"
    }

    FRAUD_ALERTS {
        BIGINT alert_id PK "Auto Increment"
        BIGINT transaction_id FK "References TRANSACTIONS(transaction_id) ON DELETE CASCADE"
        BIGINT prediction_id FK "References FRAUD_PREDICTIONS(prediction_id) ON DELETE CASCADE"
        ENUM severity "LOW, MEDIUM, HIGH, CRITICAL"
        TEXT reason "Anomalous Reasons & Signals"
        ENUM status "OPEN, UNDER_REVIEW, RESOLVED"
        TIMESTAMP created_at "Alert Generation Timestamp"
        TIMESTAMP resolved_at "Resolution Timestamp"
    }

    ADMIN_REVIEWS {
        BIGINT review_id PK "Auto Increment"
        BIGINT transaction_id FK "References TRANSACTIONS(transaction_id)"
        BIGINT admin_id FK "References USERS(user_id)"
        ENUM decision "APPROVED, REJECTED"
        TEXT reason "Compliance Justification"
        TIMESTAMP reviewed_at "Audit Decision Timestamp"
    }
```

---

### 4.2 Entity Catalog & Data Dictionary

| Table Name | Primary Key | Foreign Keys | Key Constraints | Business Role |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `user_id` | *None* | `UNIQUE(email)`, `UNIQUE(phone)`, `role IN ('CUSTOMER', 'ADMIN')` | Customer & Admin identity master table |
| **`accounts`** | `account_id` | `user_id` $\to$ `users` | `UNIQUE(account_number)`, `balance >= 0` | Monetary accounts ledger storing available liquidity |
| **`devices`** | `device_id` | `user_id` $\to$ `users` | `UNIQUE(user_id, device_identifier)` | Hardware fingerprints and recognized client telemetry |
| **`locations`** | `location_id` | *None* | Decoupled lat/long coordinates & city attributes | Geolocation master eliminating spatial transitiveness |
| **`transactions`** | `transaction_id` | `account_id` $\to$ `accounts`<br>`device_id` $\to$ `devices`<br>`location_id` $\to$ `locations` | `CHECK(amount > 0)`, `status IN ('PENDING', 'APPROVED', 'REJECTED')` | Core immutable financial transaction ledger |
| **`fraud_predictions`**| `prediction_id` | `transaction_id` $\to$ `transactions` | `CHECK(fraud_probability BETWEEN 0 AND 1)`, `CHECK(risk_score BETWEEN 0 AND 100)` | Output of LightGBM model inference |
| **`fraud_alerts`** | `alert_id` | `transaction_id` $\to$ `transactions`<br>`prediction_id` $\to$ `fraud_predictions` | `severity IN ('LOW','MEDIUM','HIGH','CRITICAL')`, `status IN ('OPEN','UNDER_REVIEW','RESOLVED')` | High-risk security queue entries for manual review |
| **`admin_reviews`** | `review_id` | `transaction_id` $\to$ `transactions`<br>`admin_id` $\to$ `users` | `decision IN ('APPROVED', 'REJECTED')` | Immutable administrative compliance audit log |

---

### 4.3 Relational Cardinality & Referential Integrity Matrix

1. **`users` $\to$ `accounts` (1 : N)**:
   - One user can hold multiple bank accounts (e.g. Savings, Current).
   - Referential Action: `ON DELETE CASCADE` guarantees that if a user is purged, associated accounts are cleaned.
2. **`users` $\to$ `devices` (1 : N)**:
   - A user can register multiple trusted devices (phone, laptop, tablet).
   - Enforced by composite key `UNIQUE (user_id, device_identifier)`.
   - Referential Action: `ON DELETE CASCADE`.
3. **`accounts` $\to$ `transactions` (1 : N)**:
   - An account executes zero to many transactions. Every transaction references exactly one origin account.
   - Referential Action: Restricted to maintain financial audit integrity.
4. **`locations` $\to$ `transactions` (1 : N)**:
   - Multiple transactions can occur in the same resolved city.
   - Referential Action: `ON DELETE SET NULL` ensures transaction records survive even if location tables are pruned.
5. **`devices` $\to$ `transactions` (1 : N)**:
   - Multiple transactions originate from a specific physical device.
   - Referential Action: `ON DELETE SET NULL`.
6. **`transactions` $\to$ `fraud_predictions` (1 : 1)**:
   - Each evaluated transaction has a corresponding prediction record.
   - Referential Action: `ON DELETE CASCADE`.
7. **`fraud_predictions` $\to$ `fraud_alerts` (1 : 1)**:
   - High-risk predictions escalate to an open fraud alert.
   - Referential Action: `ON DELETE CASCADE`.
8. **`transactions` $\to$ `admin_reviews` (1 : 1)**:
   - Transactions escalated to manual compliance receive exactly one final audit entry.
   - Linked to `users(user_id)` via `admin_id` to maintain compliance accountability.

---

### 4.4 Stored Procedures with Row-Level Locking

#### `ApproveTransaction(p_transaction_id, p_admin_id, p_reason)`
- **Concurrency Protection**: Executes `SELECT ... FROM transactions WHERE transaction_id = ? FOR UPDATE` to obtain an exclusive row lock, preventing concurrent approvals/rejections by multiple administrators.
- **State Validation**: Asserts `status = 'PENDING'`; otherwise signals `SQLSTATE '45000'`.
- **Atomic Balance Settlement**:
  - If `transaction_type = 'DEPOSIT'`: `UPDATE accounts SET balance = balance + amount`
  - If `transaction_type IN ('PAYMENT', 'TRANSFER', 'WITHDRAWAL')`: `UPDATE accounts SET balance = balance - amount`
- **Audit Logging**: Inserts decision and justification into `admin_reviews`.
- **Alert Closure**: Updates `fraud_alerts.status = 'RESOLVED'` and timestamps `resolved_at`.

#### `RejectTransaction(p_transaction_id, p_admin_id, p_reason)`
- **Concurrency Protection**: Obtains exclusive `FOR UPDATE` lock.
- **Balance Protection**: Leaves the customer's balance untouched.
- **Audit Logging**: Sets `transactions.status = 'REJECTED'`, inserts audit justification into `admin_reviews`, and marks alerts as resolved.

#### Read Stored Procedures:
- `GetCustomerTransactions(p_user_id)`: Fetches chronological transactions for a customer.
- `GetSuspiciousTransactions()`: Returns high-risk open alerts prioritized by risk score.

---

### 4.5 Active Database Triggers

1. **`trg_transaction_before_insert`** (`BEFORE INSERT ON transactions`):
   ```sql
   IF NEW.amount <= 0 THEN
       SIGNAL SQLSTATE '45000'
       SET MESSAGE_TEXT = 'Transaction amount must be greater than zero';
   END IF;
   ```
2. **`trg_fraud_alert_resolved`** (`BEFORE UPDATE ON fraud_alerts`):
   ```sql
   IF NEW.status = 'RESOLVED' AND OLD.status <> 'RESOLVED' THEN
       SET NEW.resolved_at = CURRENT_TIMESTAMP;
   END IF;
   ```
3. **`trg_fraud_alert_before_insert`** (`BEFORE INSERT ON fraud_alerts`):
   ```sql
   IF NEW.status IS NULL THEN
       SET NEW.status = 'OPEN';
   END IF;
   ```

---

### 4.6 Analytical Views & B-Tree Indexes

- **Views**:
  - `transaction_details`: Joins transactions with customer profiles, accounts, and resolved locations.
  - `fraud_monitoring`: Joins transactions, ML predictions, and alert statuses for monitoring dashboards.
  - `fraud_summary`: Aggregates transaction counts, volume, and average risk score grouped by risk level.
- **Indexes**: 15+ B-Tree indexes on foreign keys, status columns, transaction timestamps, risk scores, and alert severities.

---

## 5. Complete End-to-End Transaction Processing Workflow

The transaction execution pipeline orchestrates client inputs, database constraints, behavioral feature pipelines, machine learning inference, generative AI explanations, and administrative dispute settlements across 7 distinct phases.

```mermaid
flowchart TD
    Start(["Phase 1: Client Submission\n(React Form + Geolocation)"]) --> AuthValidate["Phase 2: Gateway Ingestion\n(JWT Check & Balance Pre-validation)"]
    
    AuthValidate -->|Insufficient Balance| FailBalance["HTTP 400 Bad Request\n(Transaction Aborted)"]
    AuthValidate -->|Valid Balance| InsertPending["Insert Record into transactions\nStatus: PENDING\n(Trigger trg_transaction_before_insert fires)"]
    
    InsertPending --> MLDispatch["Phase 3 & 4: Sentinel AI Dispatch\nPOST /api/analyze"]
    
    subgraph SentinelEngine["Sentinel AI Pipeline (FastAPI)"]
        MLDispatch --> FetchHistory["Query Customer History"]
        FetchHistory --> FeatEng["Extract Behavioral & Spatial Telemetry\n(Velocity, Spatial Speed, Drain, Geo)"]
        FeatEng --> LightGBM["LightGBM Classifier\n(Calculates Risk Score 0-100)"]
        FeatEng --> GroqGenAI["Groq Llama 3.3 GenAI\n(Generates Natural Language Explanation)"]
        LightGBM --> DecisionEngine["Hardened Decision Engine\nmake_final_decision()"]
        GroqGenAI --> DecisionEngine
    end
    
    DecisionEngine --> OutcomeBranch{"Phase 5: Decision Outcome"}
    
    OutcomeBranch -->|Low / Med Risk\nAUTO_APPROVE| PathApproved["Auto Clearance Branch\nUPDATE status = 'APPROVED'\nUPDATE accounts SET balance = balance +/- amount"]
    OutcomeBranch -->|High Risk\nADMIN_REVIEW| PathFlagged["Security Alert Branch\nINSERT INTO fraud_alerts (Status: OPEN)\nTransaction remains PENDING"]
    MLDispatch -.->|Service Error / Timeout| PathErrorHold["Fail-Safe Error Hold Branch\nTransaction remains PENDING\nNo Alert, Funds Safe"]
    
    PathApproved --> ResponseApproved["HTTP 201 Approved\n(Instant Balance Settlement)"]
    PathFlagged --> ResponseFlagged["HTTP 201 Under Review\n(Dispatched to Admin Queue)"]
    PathErrorHold --> ResponseError["HTTP 502 Bad Gateway\n(Pending Administrative Clearance)"]
    
    ResponseFlagged --> AdminOversight["Phase 6: Compliance Audit\n(/admin/transactions or /admin/fraud-alerts)"]
    ResponseError --> AdminOversight
    
    subgraph AdminResolution["Admin Compliance Action"]
        AdminOversight --> AdminAction{"Admin Evaluation"}
        AdminAction -->|Approve & Clear| ExecApprove["CALL ApproveTransaction()\nRow Lock FOR UPDATE\nStatus: APPROVED\nBalance Settled\nAlert: RESOLVED"]
        AdminAction -->|Reject Transaction| ExecReject["CALL RejectTransaction()\nRow Lock FOR UPDATE\nStatus: REJECTED\nBalance Untouched\nAlert: RESOLVED"]
    end
    
    ExecApprove --> Phase7["Phase 7: Real-Time Reconciliation\n(Customer & Admin Dashboards Updated)"]
    ExecReject --> Phase7
    ResponseApproved --> Phase7
    
    Phase7 --> EndNode(["Transaction Lifecycle Complete"])
```

---

### 5.1 Detailed 7-Phase Execution Breakdown

#### Phase 1: Client Submission & Telemetry Ingestion
- **Actor**: Retail Customer via Web Client ([`MakeTransaction.jsx`](file:///D:/projects/trustpay/frontend/src/pages/customer/MakeTransaction.jsx)).
- **Input Parameters**: `accountId`, `amount`, `transactionType` (`PAYMENT`, `TRANSFER`, `WITHDRAWAL`, `DEPOSIT`), and `merchant`.
- **Telemetry Capture**: HTML5 Geolocation API retrieves live client coordinates (`latitude`, `longitude`).
- **Identity Transmission**: Device fingerprint UUID (`deviceIdentifier`) retrieved from local storage and bound to authorization header.

#### Phase 2: Gateway Ingestion, Pre-Validation & Ledger Hold
- **Actor**: Node.js API Gateway ([`transactionController.js`](file:///D:/projects/trustpay/backend/src/controllers/transactionController.js)).
- **JWT Verification**: Validates signature, extracts authenticated `user_id` and registered `device_id`.
- **Pre-Validation**:
  - Verifies account ownership: `SELECT account_id, balance FROM accounts WHERE account_id = ? AND user_id = ?`.
  - For debit operations (`PAYMENT`, `TRANSFER`, `WITHDRAWAL`), asserts `balance >= amount`. If insufficient, immediately returns HTTP 400.
- **Initial Ledger Insertion**:
  - Inserts transaction with `status = 'PENDING'`.
  - **Trigger Activation**: Database trigger `trg_transaction_before_insert` executes before write, validating `amount > 0`.

#### Phase 3: Dynamic Behavioral & Spatial Feature Engineering
- **Actor**: Python FastAPI Service ([`feature_service.py`](file:///D:/projects/trustpay/ml-service/app/services/feature_service.py)).
- **Historical Query**: Retrieves previous customer transactions with location telemetry to construct a statistical and spatial baseline without data leakage.
- **Transformation & Metrics Computed**:
  - **Burst & Velocity Sliding Windows**: 10-minute burst count (`transactions_last_10m`, `is_burst_velocity`), 1-hour, 24-hour, and 7-day velocity and spend totals.
  - **Monetary Dispersion**: Rolling mean ($\mu$), standard deviation ($\sigma$), ratio ($R$), and standard score ($Z = (X - \mu)/\sigma$, `is_extreme_outlier`).
  - **Spatial Velocity & Distance**: Great-circle Haversine distance ($\Delta d$ in km), elapsed interval ($\Delta t$), implied speed ($V = \Delta d / \Delta t$ in km/h), and impossible travel flag (`is_impossible_travel`).
  - **Hardware Familiarity**: Device fingerprint registry set-membership (`new_device`, `known_device`).
  - **Capital Depletion**: Account balance drain ratio (`balance_drain_ratio`, `is_high_balance_drain`).
  - **Account Maturity Index**: Cold-start confidence grading (`NONE`, `LIMITED`, `MODERATE`, `ESTABLISHED`).

#### Phase 4: Dual-Intelligence Inference & Calibration
1. **LightGBM Classifier Inference & Score Calibration** ([`predict.py`](file:///D:/projects/trustpay/ml-service/app/ml/predict.py)):
   - Processes the 20-dimensional feature vector in $< 15\text{ms}$ and applies deterministic physical anomaly multipliers (impossible travel floor, burst velocity penalty, balance drain penalty).
2. **Groq Llama 3.3 GenAI Analysis** ([`analyst.py`](file:///D:/projects/trustpay/ml-service/app/genai/analyst.py)):
   - Evaluates the transaction context against customer baselines.
   - Generates bulleted justifications and human-readable risk rationales citing exact speed, distance, and drain metrics.
   - Falls back gracefully to deterministic templates if API limits or network latency thresholds are breached.

#### Phase 5: Hardened Decision Branching
The decision engine ([`engine.py`](file:///D:/projects/trustpay/ml-service/app/decision/engine.py)) evaluates three branching outcomes:

- **Branch A: Automated Clearance (Low / Medium Risk)**
  - Risk score $< 70$ and normal customer behavioral profile.
  - Gateway updates transaction record: `UPDATE transactions SET status = 'APPROVED' WHERE transaction_id = ?`.
  - Balance is atomically updated:
    - If `DEPOSIT`: `UPDATE accounts SET balance = balance + amount`
    - Else: `UPDATE accounts SET balance = balance - amount`
  - Gateway returns HTTP 201 with `status = 'APPROVED'` and refreshed account balance.
- **Branch B: Sentinel Security Flag (High Risk / Anomaly)**
  - Risk score $\ge 70$, or high probability combined with unfamiliar device and location jumps.
  - Prediction record stored in `fraud_predictions`.
  - Alert created in `fraud_alerts` with severity (`HIGH` or `CRITICAL`) and reasons.
  - Transaction remains in `PENDING` state. **No customer funds are debited.**
  - Gateway returns HTTP 201 with `status = 'PENDING'`, alerting the customer that the payment is undergoing compliance review.
- **Branch C: Fail-Safe Error Hold (ML Service Unreachable / Timeout)**
  - If the ML microservice is offline or times out, the backend catch block activates.
  - The transaction record was already created with `status = 'PENDING'`.
  - Rather than rejecting the user or blindly approving an unscored transaction, the system holds the transaction in `PENDING_ERROR`.
  - Funds remain safe and untouched, awaiting administrative inspection.

#### Phase 6: Compliance Audit & Administrative Resolution
- **Actor**: Compliance Officer via Administrative Cockpit ([`AdminTransactions.jsx`](file:///D:/projects/trustpay/frontend/src/pages/admin/AdminTransactions.jsx) or [`FraudTransactionDetails.jsx`](file:///D:/projects/trustpay/frontend/src/pages/admin/FraudTransactionDetails.jsx)).
- **Forensic Inspection**: Admin views risk meter, AI reasoning, client hardware fingerprint, and contact verification.
- **Administrative Decision**:
  - **If Approved**:
    - Invokes `CALL ApproveTransaction(p_tx_id, p_admin_id, p_reason)`.
    - Stored procedure executes `SELECT ... FOR UPDATE` to lock row against race conditions.
    - Transitions transaction `status = 'APPROVED'`.
    - Updates customer balance (`UPDATE accounts SET balance = balance +/- amount`).
    - Inserts audit entry into `admin_reviews`.
    - Updates alert `status = 'RESOLVED'`, activating trigger `trg_fraud_alert_resolved` to timestamp `resolved_at`.
  - **If Rejected**:
    - Invokes `CALL RejectTransaction(p_tx_id, p_admin_id, p_reason)`.
    - Stored procedure locks row (`FOR UPDATE`), transitions `status = 'REJECTED'`, creates audit log, and resolves alert.
    - **Customer balance remains untouched.**

#### Phase 7: Real-Time State Reconciliation
- Customer and administrator dashboards re-fetch transactional ledgers.
- The finalized status (`APPROVED` or `REJECTED`) is displayed with verified badges, and liquidity balances reflect settlement.

---

### 5.2 Transaction State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING_SUBMITTED : Client Form Submit
    
    state PENDING_SUBMITTED {
        [*] --> BalanceCheck
        BalanceCheck --> LedgerInsert : Balance Verified
        BalanceCheck --> Terminated400 : Insufficient Funds
    }

    Terminated400 --> [*]

    LedgerInsert --> PENDING_EVALUATION : Trigger trg_transaction_before_insert Passed

    state PENDING_EVALUATION {
        [*] --> FeatureExtraction
        FeatureExtraction --> ModelInference
        ModelInference --> DecisionEvaluation
    }

    DecisionEvaluation --> APPROVED : Score < 70 (Low/Med Risk)
    DecisionEvaluation --> PENDING_ALERT : Score >= 70 (High Risk)
    DecisionEvaluation --> PENDING_ERROR : ML Service Timeout / Error

    state APPROVED {
        [*] --> BalanceSettlement
        BalanceSettlement --> ClientNotifiedApproved
    }

    state PENDING_ALERT {
        [*] --> AlertLogged
        AlertLogged --> AdminReviewQueue
    }

    state PENDING_ERROR {
        [*] --> ErrorLogged
        ErrorLogged --> AdminLedgerHold
    }

    AdminReviewQueue --> InReview : Compliance Officer Inspects
    AdminLedgerHold --> InReview : Compliance Officer Inspects

    state InReview {
        [*] --> ActionTaken
        ActionTaken --> StoredProcApprove : Click "Approve & Clear"
        ActionTaken --> StoredProcReject : Click "Reject"
    }

    StoredProcApprove --> APPROVED_BY_ADMIN : CALL ApproveTransaction()
    StoredProcReject --> REJECTED_BY_ADMIN : CALL RejectTransaction()

    state APPROVED_BY_ADMIN {
        [*] --> LockAcquiredApprove : FOR UPDATE
        LockAcquiredApprove --> BalanceDebitedCredited
        BalanceDebitedCredited --> TriggerTimestampResolvedApprove : trg_fraud_alert_resolved
        TriggerTimestampResolvedApprove --> AuditLoggedApprove : INSERT admin_reviews
    }

    state REJECTED_BY_ADMIN {
        [*] --> LockAcquiredReject : FOR UPDATE
        LockAcquiredReject --> BalancePreserved
        BalancePreserved --> TriggerTimestampResolvedReject : trg_fraud_alert_resolved
        TriggerTimestampResolvedReject --> AuditLoggedReject : INSERT admin_reviews
    }

    ClientNotifiedApproved --> [*]
    APPROVED_BY_ADMIN --> [*]
    REJECTED_BY_ADMIN --> [*]
```

---

## 6. Verification & Quality Matrix

| Component | Test Execution | Result | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Linting** | `npm run lint` | 0 errors, 0 warnings | **PASSED** |
| **Frontend Production Build** | `npm run build` | Built in 257ms with Vite | **PASSED** |
| **Backend Syntax Integrity** | `node -c src/server.js`, `node -c src/controllers/*.js`, `node -c src/services/*.js`, `node -c src/middleware/*.js` | Zero syntax errors | **PASSED** |
| **ML Service Compilation** | `py -m py_compile app/main.py app/services/queue_consumer.py app/services/settlement_service.py` | Zero compilation errors | **PASSED** |
| **RabbitMQ Async Queue Decoupling** | `POST /api/transactions` -> `fraud_evaluation_queue` -> FastAPI `aio-pika` worker | Immediate `202 Accepted` (<15ms); background worker settles DB atomically | **PASSED** |
| **Redis Sliding-Window Rate Limiter** | 6 rapid requests to `POST /api/transactions` within 10s window | Requests 1–5 allowed; Request 6 blocked with `HTTP 429 Too Many Requests` | **PASSED** |
| **Redis Endpoint Caching** | Repeated `GET /api/accounts/me` (30s TTL) & `GET /api/auth/profile` (300s TTL) | `X-Cache: MISS` on 1st call, `X-Cache: HIT` (<2ms) on subsequent calls | **PASSED** |
| **6-Container Docker Compose** | Validated `docker-compose.yml` & Dockerfiles (`frontend`, `backend`, `ml-service`, `db`, `rabbitmq`, `redis`) | Full multi-container orchestration with healthchecks & `.env` support | **PASSED** |
| **Database Triggers** | Tested via live SQL insert & update harness | Non-positive amounts blocked (`SQLSTATE 45000`), timestamps assigned | **PASSED** |
| **Database Stored Procedures** | Row-level locking & balance settlement | Double-review prevented, balance updated atomically | **PASSED** |
| **Fail-Safe ML Fallback** | Unreachable ML / Broker service simulation | Graceful fallback to synchronous HTTP / `PENDING_ERROR` hold, funds preserved | **PASSED** |

---

## 7. Cloud Production Deployment, Multi-Container Dockerization & SPA Routing Infrastructure

TrustPay is engineered and packaged for both distributed cloud hosting and single-command local/production multi-container orchestration via Docker Compose:

### 7.1 Production Deployment Topology
- **Core Banking API Gateway (Backend)**:
  - **Provider**: Render Cloud Platform
  - **Live Production Endpoint**: `https://trustpay-backend-service.onrender.com/api`
  - **Liveness Health Probe**: `https://trustpay-backend-service.onrender.com/api/health`
  - **Runtime**: Node.js 20 LTS with Express 5, `amqplib` (RabbitMQ Producer), and `redis` (Cache & Sliding-Window Rate Limiter)
  - **Security**: Automated TLS 1.3 encryption, CORS origins whitelisting, HTTP header security, and Redis ZSET rate limiting.
- **Relational Database Engine**:
  - **Provider**: Aiven Cloud / MySQL 8.0 Container
  - **Engine**: MySQL 8.0.35 Enterprise (InnoDB Storage Engine)
  - **Connection Protocol**: TLS/SSL encrypted connection string with connection pool management (10 concurrent threads).
  - **Data Resilience**: Automated point-in-time recovery, automated backups, and row-level locking.
- **Sentinel AI Microservice**:
  - **Framework**: FastAPI (Python 3.11+) with Uvicorn ASGI & `aio-pika` asynchronous RabbitMQ worker
  - **Inference Acceleration**: LightGBM compiled decision trees with Groq Cloud Llama 3.3 70B Versatile inference.

### 7.2 Multi-Container Dockerization & Orchestration (`docker-compose.yml`)
The entire 6-service enterprise stack is containerized and orchestrated via the root `docker-compose.yml` file with automated healthchecks (`service_healthy`), persistent volumes, and `.env` variable injection:

| Container Service | Image / Dockerfile | Exposed Ports | Role & Healthcheck Strategy |
| :--- | :--- | :--- | :--- |
| **`frontend`** | `./frontend/Dockerfile` (`node:20-alpine`) | `5173:5173` | React 19 + Vite UI server (`--host 0.0.0.0`); depends on `backend` |
| **`backend`** | `./backend/Dockerfile` (`node:20-alpine`) | `5000:5000` | Express 5 API Gateway, RabbitMQ producer, Redis rate limiter & cache; waits for healthy `db`, `rabbitmq`, and `redis` |
| **`ml-service`** | `./ml-service/Dockerfile` (`python:3.11-slim`) | `8000:8000` | FastAPI inference server + `aio-pika` background consumer worker; waits for healthy `db` and `rabbitmq` |
| **`db`** | `mysql:8.0` | `3306:3306` | MySQL 8 relational database; auto-initializes `/docker-entrypoint-initdb.d/01-schema.sql`; `mysqladmin ping` healthcheck |
| **`rabbitmq`** | `rabbitmq:3-management-alpine` | `5672:5672`, `15672:15672` | AMQP 0-9-1 broker (`5672`) + Management UI (`15672`) hosting `fraud_evaluation_queue`; `rabbitmq-diagnostics -q ping` healthcheck |
| **`redis`** | `redis:7-alpine` | `6379:6379` | In-memory cache & sliding-window rate limiter with AOF persistence (`--appendonly yes`); `redis-cli ping` healthcheck |

#### Quick-Start Docker Compose Commands
```bash
# 1. Copy the environment template and configure your GROQ_API_KEY (optional)
cp .env.example .env

# 2. Build and launch all 6 services in detached mode
docker compose up --build -d

# 3. Inspect service health and logs
docker compose ps
docker compose logs -f backend ml-service
```

### 7.3 Single Page Application (SPA) Deep-Linking Configuration
To ensure client-side routing works seamlessly across static hosts (Netlify, Vercel, Cloudflare Pages, AWS S3/CloudFront) and prevents HTTP 404 errors when users refresh deep URLs like `/admin/transactions` or `/dashboard`, multi-platform redirect configurations are implemented:

1. **Netlify & Static Hosting (`frontend/public/_redirects`)**:
   ```
   /*    /index.html   200
   ```
2. **Vercel Edge Platform (`frontend/vercel.json`)**:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. **Netlify TOML Specification (`frontend/netlify.toml`)**:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

---

## 8. Academic Project Defense & Evaluation Summary

### 8.1 Core Technical Accomplishments
1. **End-to-End 6-Tier Enterprise Decoupling**: Implemented a distributed 6-service architecture separating the React UI, Express API Gateway, RabbitMQ AMQP Broker, Redis Cache & Rate Limiter, FastAPI Sentinel ML Worker, and MySQL 8 Relational Database.
2. **Asynchronous Event-Driven ML Pipeline (RabbitMQ)**: Decoupled the ~1.43s ML + GenAI fraud evaluation from the Node.js event loop using a durable `fraud_evaluation_queue` (`amqplib` producer -> `aio-pika` consumer), returning immediate `202 Accepted` responses (`< 15 ms`) and settling balances asynchronously in MySQL.
3. **Redis Sliding-Window Rate Limiting & Low-Latency Caching**: Protected `POST /api/transactions` against automated bot floods using Redis sorted-set (`ZSET`) sliding-window rate limiting (max 5 requests per 10s per user/IP -> `HTTP 429`), and cached `GET /api/accounts/me` (30s TTL) and `GET /api/auth/profile` (300s TTL) with automatic write-invalidation.
4. **Full Multi-Container Docker Orchestration**: Packaged all 6 tiers (`frontend`, `backend`, `ml-service`, `db`, `rabbitmq`, `redis`) via `docker-compose.yml` with custom `Dockerfile`s, automated schema bootstrapping, persistent volumes, and healthcheck dependency chains.
5. **Mathematical Relational Integrity & ACID Guarantees**: Schema normalized to Boyce-Codd Normal Form (BCNF) across 8 entities with active check triggers, row-level locking (`SELECT ... FOR UPDATE`), and idempotent worker settlement preventing double-spending.
6. **Hybrid AI Surveillance & Fail-Safe Resilience**: 14-feature behavioral engineering pipeline feeding a calibrated LightGBM model (`99.90%` accuracy) supplemented by contextual Groq Llama 3.3 GenAI explanations, with automatic fallback if the broker or AI service is unreachable.

### 8.2 Project Team Credentials
- **Raghav Gupta** (Registration Number: `20243226`) — B.Tech (3rd Year) • Computer Science & Engineering
- **Rishabh Srivastava** (Registration Number: `20243236`) — B.Tech (3rd Year) • Computer Science & Engineering
- **Rishabh Singh** (Registration Number: `20243235`) — B.Tech (3rd Year) • Computer Science & Engineering
- **Prince Keshari** (Registration Number: `20243218`) — B.Tech (3rd Year) • Computer Science & Engineering


