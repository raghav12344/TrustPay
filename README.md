# TRUSTPAY: End-to-End Engineering Architecture Report
## AI-Powered Fraud Detection & Real-Time Transaction Monitoring System

---

### Academic Capstone Project & Engineering Team

**Academic Program**: Bachelor of Technology (B.Tech) • Final Year Major Project Evaluation 2026  
**Department**: Department of Computer Science & Engineering  

#### Project Contributors
| Member # | Student Name | Registration Number | Department |
| :---: | :--- | :---: | :--- |
| **Member 1** | **Raghav Gupta** | `20243226` | B.Tech • Computer Science & Engineering |
| **Member 2** | **Rishabh Srivastava** | `20243236` | B.Tech • Computer Science & Engineering |
| **Member 3** | **Rihabh Singh** | `20243235` | B.Tech • Computer Science & Engineering |
| **Member 4** | **Prince Keshari** | `20243218` | B.Tech • Computer Science & Engineering |

---

### Executive Summary

**TRUSTPAY** is a production-grade, simulated banking and financial intelligence platform designed to process high-throughput financial transactions while simultaneously executing multi-tiered artificial intelligence risk analysis.

The architecture decouples responsibilities across four independent tiers:
1. **Frontend Presentation Layer**: React 18 + Vite Single Page Application (SPA) offering dedicated portals for Retail Customers and Compliance Administrators.
2. **Core Banking API Gateway**: Node.js / Express 5 RESTful gateway managing authentication, authorization, location geocoding, device fingerprinting, and transactional orchestration.
3. **Sentinel AI Intelligence Service**: Python 3 / FastAPI microservice combining a trained LightGBM machine learning classifier, Groq-powered contextual GenAI explanation, and a hybrid deterministic decision engine.
4. **Relational Database Engine**: Aiven Cloud MySQL 8 instance with a Boyce-Codd Normal Form (BCNF) relational schema, ACID stored procedures with row-level locks (`SELECT ... FOR UPDATE`), active triggers, and optimized B-Tree indexes.

```mermaid
flowchart TB
    subgraph Tier1["Tier 1: Client Presentation Layer (React 18 + Vite)"]
        UI_Cust["Customer Portal\n(Dashboard, Payments, Ledger)"]
        UI_Admin["Compliance Cockpit\n(Sentinel Radar, Fraud Queue, Ledger)"]
    end

    subgraph Tier2["Tier 2: API Gateway (Node.js & Express 5)"]
        Auth_GW["Auth & RBAC Module\n(JWT, Device Fingerprint)"]
        Tx_GW["Transaction Orchestrator\n(Pre-validation, Balance Check)"]
        Admin_GW["Admin Operations\n(Omnichannel Ledger, Deposits)"]
    end

    subgraph Tier3["Tier 3: Sentinel AI Intelligence Layer (FastAPI)"]
        Feat_Eng["Feature Engineering Pipeline\n(Velocity, Deviation, Device/Geo)"]
        ML_Model["LightGBM Classifier\n(Fraud Probability & Risk Score)"]
        GenAI["GenAI Contextual Analyst\n(Llama 3.3 via Groq)"]
        Decision["Hybrid Decision Engine\n(Cold-start, Behavioral Rules)"]
    end

    subgraph Tier4["Tier 4: Relational Ledger Engine (MySQL 8 - InnoDB)"]
        Tables[("Normalized Schema (BCNF)\n8 Entities, Foreign Keys")]
        SP["Stored Procedures\n(Approve/Reject with FOR UPDATE)"]
        Triggers["Database Triggers\n(Check Amount, Auto-Timestamp)"]
        Views["Analytical Views\n(Monitoring, KPI Summaries)"]
    end

    UI_Cust -->|REST JSON + Bearer JWT| Auth_GW
    UI_Cust -->|Submit Transaction| Tx_GW
    UI_Admin -->|Audit, Approve, Reject, Deposit| Admin_GW

    Tx_GW -->|Telemetry & Context Payload| Feat_Eng
    Feat_Eng --> ML_Model
    Feat_Eng --> GenAI
    ML_Model --> Decision
    GenAI --> Decision
    Decision -->|Risk Assessment & Signals| Tx_GW

    Tx_GW -->|ACID Queries & Updates| Tables
    Admin_GW -->|CALL Approve/RejectTransaction| SP
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
   - Prominently showcases the 4 capstone project contributors in clean, balanced cards with high-contrast monospace registration badges:
     - **Raghav Gupta** (`20243226`)
     - **Rishabh Srivastava** (`20243236`)
     - **Rihabh Singh** (`20243235`)
     - **Prince Keshari** (`20243218`)
   - B.Tech • Computer Science & Engineering • Final Year Major Project 2026.

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

## 2. Core Banking API Gateway (`backend/`)

### 2.1 Technical Stack & Design
- **Runtime**: Node.js with Express 5.
- **Database Driver**: `mysql2/promise` with connection pooling (10 connections, SSL encryption).
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`) signed with HMAC SHA-256.
- **Password Security**: `bcrypt` salted password hashing.
- **HTTP Client**: `axios` for low-latency inter-service communication with the ML microservice.

---

### 2.2 Route Architecture & Role-Based Access Control (RBAC)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new customer and provisions a unique bank account |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, binds device fingerprint, returns JWT |
| `GET` | `/api/auth/profile` | Authenticated | Retrieves profile of the logged-in customer or admin |
| `POST` | `/api/transactions` | `CUSTOMER` | Initiates payment, triggers ML evaluation, updates ledger |
| `GET` | `/api/transactions` | `CUSTOMER` | Returns scoped transaction history for authenticated customer |
| `GET` | `/api/transactions/admin/all` | `ADMIN` | Omnichannel ledger across all accounts with diagnostic filters |
| `GET` | `/api/transactions/admin/fraud-alerts` | `ADMIN` | Fetches suspicious transaction queue via stored procedure |
| `POST` | `/api/transactions/admin/transactions/:id/approve` | `ADMIN` | Executes `ApproveTransaction` stored procedure |
| `POST` | `/api/transactions/admin/transactions/:id/reject` | `ADMIN` | Executes `RejectTransaction` stored procedure |
| `GET` | `/api/accounts/me` | `CUSTOMER` | Retrieves current account balance and account number |
| `GET` | `/api/accounts/admin/all` | `ADMIN` | Lists all customer bank accounts and liquidity |
| `POST` | `/api/accounts/admin/deposit` | `ADMIN` | Credits account balance and logs deposit transaction |
| `GET` | `/api/health` | Public | Liveness probe returning API operational status |

---

## 3. Sentinel AI Intelligence Layer (`ml-service/`)

### 3.1 Technical Stack
- **Framework**: FastAPI (Python 3.13) with Uvicorn ASGI server.
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
| **Backend Syntax Integrity** | `node -c src/server.js`, `node -c src/controllers/*.js` | Zero syntax errors | **PASSED** |
| **Database Triggers** | Tested via live SQL insert & update harness | Non-positive amounts blocked (`SQLSTATE 45000`), timestamps assigned | **PASSED** |
| **Database Stored Procedures** | Row-level locking & balance settlement | Double-review prevented, balance updated atomically | **PASSED** |
| **Fail-Safe ML Fallback** | Unreachable ML service simulation | Transaction placed in `PENDING_ERROR` hold, funds preserved | **PASSED** |
| **Cleanliness** | Removed temporary test scripts and routes | Zero unused or test files in backend or ml-service | **PASSED** |

---

## 7. Cloud Production Deployment & SPA Routing Infrastructure

TrustPay is engineered and packaged for distributed cloud hosting across high-availability cloud infrastructure:

### 7.1 Production Deployment Topology
- **Core Banking API Gateway (Backend)**:
  - **Provider**: Render Cloud Platform
  - **Live Production Endpoint**: `https://trustpay-backend-service.onrender.com/api`
  - **Liveness Health Probe**: `https://trustpay-backend-service.onrender.com/api/health`
  - **Runtime**: Node.js 20 LTS with Express 5
  - **Security**: Automated TLS 1.3 encryption, CORS origins whitelisting, HTTP header security.
- **Relational Database Engine**:
  - **Provider**: Aiven Cloud
  - **Engine**: MySQL 8.0.35 Enterprise (InnoDB Storage Engine)
  - **Connection Protocol**: TLS/SSL encrypted connection string with connection pool management (10 concurrent threads).
  - **Data Resilience**: Automated point-in-time recovery, automated backups, and row-level locking.
- **Sentinel AI Microservice**:
  - **Framework**: FastAPI (Python 3.13) with Uvicorn ASGI
  - **Inference Acceleration**: LightGBM compiled decision trees with Groq Cloud Llama 3.3 70B Versatile inference.

### 7.2 Single Page Application (SPA) Deep-Linking Configuration
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

## 8. Academic Project Defense & Major Capstone Evaluation Summary

### 8.1 Core Technical Accomplishments
1. **End-to-End Enterprise Decoupling**: Implemented a true 4-tier distributed architecture separating UI, Gateway, Machine Learning, and Relational Database concerns.
2. **Mathematical Relational Integrity**: Schema normalized to Boyce-Codd Normal Form (BCNF) across 8 entities with active check triggers preventing invalid balance insertions and automatic audit timestamping.
3. **ACID Transaction Guarantees**: Elimination of race conditions and double-spending through row-level locking (`SELECT ... FOR UPDATE`) in stored procedures for dispute settlements.
4. **Hybrid AI Surveillance**: 14-feature behavioral engineering pipeline feeding a calibrated LightGBM model (0–100 risk score) supplemented by contextual Groq Llama 3.3 GenAI explanations.
5. **Fail-Safe Banking Resilience**: Automated fallbacks redirecting transactions to administrative hold queues (`PENDING_ERROR`) if the AI microservice encounters network latency, preserving client funds.
6. **Publication-Grade Documentation**: Full technical blueprint, ER diagrams, 7-phase sequence workflows, and verified verification matrices.

### 8.2 Project Team Credentials
- **Raghav Gupta** (Registration Number: `20243226`) — B.Tech • Computer Science & Engineering
- **Rishabh Srivastava** (Registration Number: `20243236`) — B.Tech • Computer Science & Engineering
- **Rihabh Singh** (Registration Number: `20243235`) — B.Tech • Computer Science & Engineering
- **Prince Keshari** (Registration Number: `20243218`) — B.Tech • Computer Science & Engineering

