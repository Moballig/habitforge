# Deshi Health Companion — Data Flow Diagrams & Sequence Diagrams

**Version:** 1.0
**Date:** November 2, 2026 (flows updated Nov 3 for live `budget.get` / client-side RAG coach)
**Source of truth:** `docs/bangladeshi-calorie-companion-research.md` §5, §7; `docs/ARCHITECTURE.md`

---

## 1. DFD — Level 0 (Context Diagram)

The system boundary. External entities interact with the single process **"Deshi Health Companion"**.

```mermaid
flowchart LR
    subgraph External
        U["🧑 End User<br/>(Bangladesh)"]
        Admin["👨‍💼 Admin /<br/>Nutritionist"]
        Groq["🤖 Groq API<br/>(LLM / Vision /<br/>Embeddings)"]
    end

    subgraph System["Deshi Health Companion (P0–P2)"]
        P0(("Deshi Health<br/>Companion"))
    end

    U -->|"Bangla/EN/Banglish input:<br/>profile, meals, activities, questions"| P0
    P0 -->|"Personalised plan,<br/>coach answers,<br/>citations, source tags"| U
    Admin -->|"CRUD foods, recipes,<br/>prices; review queue"| P0
    P0 -->|"Report queue,<br/>analytics (anonymised)"| Admin
    P0 -->|"Chat prompts,<br/>photo images<br/>(no PII)"| Groq
    Groq -->|"LLM responses,<br/>vision JSON"| P0
    P0 -->|"Passages / query text"| LocalEmbed["Local embedder<br/>(multilingual-e5-small)"]
    LocalEmbed -->|"384-dim vectors"| P0
```

**Data stores at Level 0:**
- Convex Tables (profiles, foods, mealLogs, activityLogs, budgetState, weighIns, auditLogs)
- IndexedDB (offline queue, food JSON snapshot)

---

## 2. DFD — Level 1 (Major Processes)

Decomposes the system into **7 primary processes**, each with inputs, outputs, and data stores.

```mermaid
flowchart TB
    subgraph External
        U["🧑 User"]
        Admin["👨‍💼 Admin"]
        Groq["🤖 Groq API"]
    end

    subgraph System["Deshi Health Companion"]
        P1(("P1<br/>Onboarding &<br/>Profile"))
        P2(("P2<br/>Food Logging"))
        P3(("P3<br/>Tracking &<br/>Nutrition"))
        P4(("P4<br/>Balance Engine"))
        P5(("P5<br/>Activity"))
        P6(("P6<br/>AI Coach"))
        P7(("P7<br/>Privacy &<br/>Admin"))
    end

    subgraph Stores
        DB[("Convex Tables")]
        IDB[("IndexedDB<br/>(offline)")]
        FS[("Food JSON<br/>snapshot")]
    end

    %% User → processes
    U -->|"Demographics, screening,<br/>consent, eating style"| P1
    U -->|"Bangla/EN/Banglish meal text,<br/>photos, household measures"| P2
    U -->|"Questions, meal requests"| P6
    U -->|"Activity type, minutes,<br/>manual steps"| P5
    U -->|"Delete-my-data request"| P7

    %% P1
    P1 -->|"safetyScreen, safetyMode,<br/>asianBmi, consentAt"| DB
    P1 -->|"Profile, energy (BMR/TDEE)"| U

    %% P2
    P2 -->|"Search candidates"| FS
    P2 -->|"LLM parse/photo prompts<br/>(no PII)"| Groq
    Groq -->|"JSON picks / photo items"| P2
    P2 -->|"mealLogs[] + kcal ranges<br/>+ sourceTag"| DB
    P2 -->|"Structured items<br/>(editable)"| U

    %% P3
    P3 -->|"Daily/weekly macros,<br/>plate balance, ranges"| DB
    P3 -->|"Weigh-ins"| DB
    P3 -->|"Dashboard data"| U

    %% P4
    P4 -->|"intakeKcal, target, floor,<br/>weightKg, dates, safetyMode"| P4
    P4 -->|"Rebalance plan (7-day budget,<br/>trims, activity minutes)"| DB
    P4 -->|"Plan, overshoot, what-if"| U

    %% P5
    P5 -->|"Activity type, MET,<br/>net kcal"| DB
    P5 -->|"MET lookup"| P4

    %% P6
    U -->|"Question (BN/EN/Banglish)"| P6
    P6 -->|"Rewrite query, embed"| Groq
    Groq -->|"Embeddings"| P6
    P6 -->|"vectorSearch + keyword merge"| DB
    P6 -->|"Chat completion prompt<br/>(chunks + tools + safe mode)"| Groq
    Groq -->|"Answer (numbers via tools)"| P6
    P6 -->|"Number validator, citation attach"| P6
    P6 -->|"Grounded answer + source"| U
    P6 -->|"Audit: what was retrieved"| DB

    %% P7
    Admin -->|"CRUD foods, recipes"| P7
    P7 -->|"foods.upsert, reportWrong"| DB
    P7 -->|"delete-my-data (purge all tables)"| DB
    P7 -->|"Report queue, analytics"| Admin

    %% Offline
    P2 -.->|"Queue when offline"| IDB
    IDB -.->|"Sync last-write-wins"| DB
```

### Level 1 — Process summaries

| Process | Name | Key inputs | Key outputs | Stores |
|---------|------|-----------|-------------|--------|
| **P1** | Onboarding & Profile | Demographics, screening answers, consent | `safetyMode`, Asian BMI, energy (BMR/TDEE) | `profiles`, `auditLogs` |
| **P2** | Food Logging | Meal text, photos, household measures | `mealLogs[]` with kcal ranges + source tags | `mealLogs`, `foods` |
| **P3** | Tracking & Nutrition | Logs, weigh-ins | Daily/weekly macros, plate balance, ranges | `mealLogs`, `weighIns`, `foods` |
| **P4** | Balance Engine | Intake, target, floor, weight, dates, safetyMode | 7-day budget, rebalance plan | `budgetState` |
| **P5** | Activity | Activity type, minutes, MET | Net kcal (engine-computed) | `activityLogs` |
| **P6** | AI Coach | User question, safe categories | Grounded answer + citations | `ragChunks` (vector), `auditLogs` |
| **P7** | Privacy & Admin | Admin CRUD, delete-my-data | Purged data, report queue | All tables |

---

## 3. DFD — Level 2 (Sub-processes)

### 3.1 P2 — Food Logging (Level 2)

```mermaid
flowchart TB
    subgraph P2["P2 Food Logging"]
        P21(("P2.1<br/>Candidate<br/>Search"))
        P22(("P2.2<br/>LLM Parse<br/>(JSON mode)"))
        P23(("P2.3<br/>Photo<br/>Recognition"))
        P24(("P2.4<br/>Unit → Gram<br/>Conversion"))
        P25(("P2.5<br/>Kcal Computation<br/>(code, not LLM)"))
        P26(("P2.6<br/>Confirm / Edit"))
    end

    U["User"] -->|"Meal text"| P21
    FS[("Food JSON<br/>snapshot")] -->|"Top-5 candidates<br/>(id, name, aliases)"| P21
    P21 -->|"Candidates + text"| P22
    Groq["Groq"] -->|"JSON picks<br/>[{foodId, qty, unit}]"| P22
    P22 -->|"Picks or error"| P24
    U -->|"Photo"| P23
    P23 -->|"Images + supported list"| Groq
    Groq -->|"Items + portion class"| P23
    P23 -->|"portionClass + plate preset"| P24
    P24 -->|"grams"| P25
    P25 -->|"kcalLow, kcalHigh,<br/>sourceTag"| P26
    P26 -->|"Confirmed items"| DB[("mealLogs")]
    P26 -->|"Editable result"| U
```

| Sub-process | Input | Output | Notes |
|-------------|-------|--------|-------|
| P2.1 | User text, food JSON | Top-5 candidates per phrase | Client-side fuzzy search |
| P2.2 | Text + candidate IDs | `[{foodId, qty, unit}]` | LLM picks from list only; may not invent foods |
| P2.3 | Photo images | Items + portion class (S/M/L) | Qwen vision, ≤3 images, JSON mode |
| P2.4 | quantity + unit + measures | grams | Code converts via `measures[]` |
| P2.5 | grams + food row | kcal range + sourceTag | **Code computes, never LLM** |
| P2.6 | Structured items | Confirmed `mealLogs` | Always editable; save corrections with consent |

### 3.2 P4 — Balance Engine (Level 2)

```mermaid
flowchart TB
    subgraph P4["P4 Balance Engine"]
        P41(("P4.1<br/>Overshoot<br/>Detection"))
        P42(("P4.2<br/>Safety Gate<br/>Check"))
        P43(("P4.3<br/>Window<br/>Selection"))
        P44(("P4.4<br/>Split<br/>Calculation"))
        P45(("P4.5<br/>Floor & Cap<br/>Clamp"))
        P46(("P4.6<br/>Template<br/>Render"))
    end

    Logs["mealLogs<br/>(today's intake)"] -->|"intakeKcal"| P41
    Profile["profiles<br/>(BMR, TDEE, goal)"] -->|"targetKcal, floorKcal"| P41
    P41 -->|"overshootKcal<br/>(if > tolerance)"| P42
    Safety["safetyMode<br/>(from engine)"] -->|"normal / restricted /<br/>doctor-first"| P42
    P42 -->|"allowed → continue<br/>blocked → empty plan"| P43
    P43 -->|"windowDays 3–7"| P44
    P44 -->|"dailyTrim, dailyActivity<br/>(60/40 split)"| P45
    Weight["weighIns"] -->|"weightKg"| P45
    P45 -->|"clamped trims + minutes<br/>(floor=BMR, cap=200)"| P46
    P46 -->|"Bangla/EN plan text"| DB[("budgetState")]
    P46 -->|"Plan + ±range"| U["User"]
```

| Sub-process | Input | Output | Rules |
|-------------|-------|--------|-------|
| P4.1 | intakeKcal, targetKcal | overshootKcal (or 0) | Only when `intake − target > 100` |
| P4.2 | safetyMode | allowed / blocked | restricted + doctor-first → blocked |
| P4.3 | overshoot size | windowDays | 3–7 (default 4) |
| P4.4 | coveredKcal, intakeShare | dailyTrim, dailyActivity | 60/40 split; never 100% cover |
| P4.5 | trim, activity, floor, cap | Clamped values | Floor = BMR; cap = 200 net kcal/day |
| P4.6 | Numeric plan | Bangla/EN text | **Templates only, not LLM** |

### 3.3 P6 — AI Coach RAG (Level 2)

```mermaid
flowchart TB
    subgraph P6["P6 AI Coach"]
        P61(("P6.1<br/>Query<br/>Rewrite"))
        P62(("P6.2<br/>Embed &<br/>Retrieve"))
        P63(("P6.3<br/>Keyword +<br/>Alias Merge"))
        P64(("P6.4<br/>Threshold<br/>Check"))
        P65(("P6.5<br/>LLM<br/>Completion"))
        P66(("P6.6<br/>Number<br/>Validator"))
        P67(("P6.7<br/>Citation<br/>Attach"))
    end

    U["User"] -->|"Question (BN/EN/Banglish)"| P61
    P61 -->|"Short English query"| Groq["Groq<br/>(rewrite)"]
    Groq -->|"Rewritten query"| P62
    P62 -->|"Embedding vector"| VI[("ragChunks<br/>vectorIndex")]
    VI -->|"Top chunks + scores"| P63
    P63 -->|"Merged + scored chunks"| P64
    P64 -->|"Above threshold → continue"| P65
    P64 -->|"Below threshold →<br/>refuse + suggest professional"| U
    P65 -->|"Chat completion<br/>(chunks + tools + safe mode)"| Groq
    Groq -->|"Answer draft"| P66
    P66 -->|"Numbers match tools/chunks → pass<br/>else regenerate once → template"| P67
    P67 -->|"Answer + Source: section"| U
    P67 -->|"Audit: retrieved chunks"| DB[("auditLogs")]
```

| Sub-process | Input | Output | Notes |
|-------------|-------|--------|-------|
| P6.1 | User question | Short English query | LLM rewrites; extracts food names |
| P6.2 | Query text | Embedding + top chunks | Local `multilingual-e5-small` via `POST /api/embed`; `ctx.vectorSearch` |
| P6.3 | Vector results | Merged + keyword/alias match | Hybrid retrieval |
| P6.4 | Best score | Pass / refuse | Below threshold → refuse |
| P6.5 | Chunks + safe mode | Answer draft | Numbers only via tools |
| P6.6 | Draft answer | Validated answer | Every number must appear in tool result or chunk |
| P6.7 | Validated answer | Answer + citations | `Source: <section name>` |

### 3.4 P1 — Onboarding & Safety (Level 2)

```mermaid
flowchart TB
    subgraph P1["P1 Onboarding & Profile"]
        P11(("P1.1<br/>Demographic<br/>Capture"))
        P12(("P1.2<br/>Safety Screen<br/>(engine)"))
        P13(("P1.3<br/>Asian BMI<br/>Computation"))
        P14(("P1.4<br/>Energy<br/>Calculation"))
        P15(("P1.5<br/>Consent &<br/>Persist"))
    end

    U["User"] -->|"Age, sex, height,<br/>weight, activity, goal"| P11
    P11 -->|"Raw profile"| P12
    P12 -->|"screenFromAnswers()"| P12
    Engine["lib/engine"] -->|"safetyMode(screen)"| P12
    P12 -->|"safetyMode:<br/>normal / restricted /<br/>doctor-first"| P13
    P13 -->|"asianBmiBand()"| P13
    Engine -->|"bmi(), waistToHeight()"| P13
    P14 -->|"bmr(), tdee()"| P14
    Engine -->|"BMR, TDEE, floor"| P14
    P15 -->|"consent accepted"| DB[("profiles")]
    P15 -->|"auditLogs"| DB
    P14 -->|"Energy summary"| U
    P12 -->|"Safety banner"| U
```

| Sub-process | Input | Output | Engine function |
|-------------|-------|--------|-----------------|
| P1.1 | Form data | Raw profile object | — |
| P1.2 | Demographics + screening answers | `safetyMode` | `screenFromAnswers()`, `safetyMode()` |
| P1.3 | weightKg, heightCm, waistCm | `asianBmiBand`, WHtR | `bmi()`, `asianBmiBand()`, `waistToHeight()` |
| P1.4 | Profile | BMR, TDEE, floor | `bmr()`, `tdee()` |
| P1.5 | Consent + all derived fields | Persisted `profiles` row | — |

---

## 4. Sequence Diagrams

### 4.1 Onboarding → Safety Mode → Persist

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Onboarding Page
    participant E as lib/engine
    participant C as Convex profile.save
    participant DB as profiles table
    participant A as auditLogs

    U->>UI: Fill form (age, sex, height, weight,<br/>activity, goal, screening, consent)
    UI->>E: screenFromAnswers({...})
    E-->>UI: SafetyScreen
    UI->>E: safetyMode(screen)
    E-->>UI: "normal" | "restricted" | "doctor-first"
    UI->>E: asianBmiBand(weightKg, heightCm)
    E-->>UI: Asian BMI band
    UI->>E: bmi(weightKg, heightCm)
    E-->>UI: BMI value

    alt consent accepted
        UI->>C: useMutation(api.profile.save)({..., consent: true})
        C->>E: safetyMode(screen)  [server-side recompute]
        E-->>C: mode (never trusts client)
        C->>DB: insert/patch profiles
        DB-->>C: id
        C->>A: insert auditLogs "profile.create"
        C-->>UI: { id, safetyMode, asianBmiBand }
        UI->>U: Redirect to /home
    else consent rejected
        UI->>U: Stay on consent step
    end
```

### 4.2 Meal Logging (Text → Parse → Confirm)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /log page
    participant F as Client fuzzy search
    participant A as ai.parseMeal action
    participant G as Groq (JSON mode)
    participant M as mealLogs mutation
    participant DB as mealLogs table

    U->>UI: "dupure bhat, dal, alu bhorta, mach"
    UI->>F: Search per phrase (top-5 each)
    F-->>UI: candidates[]

    UI->>A: useAction()({ line, candidates })
    A->>G: chat.completions (JSON mode,<br/>candidates + line, temp 0.1)
    G-->>A: { picks: [{id, qty, unit}], notes }

    alt Groq OK
        A-->>UI: picks
        UI->>UI: Convert units → grams via measures
        UI->>UI: Compute kcal range (code)
    else Groq fail / rate limit
        A-->>UI: error
        UI->>U: Tap-to-pick candidate list
    end

    U->>UI: Confirm / edit items
    UI->>M: useMutation(mealLogs.create)({ items, method: "text", slot })
    M->>DB: insert mealLogs
    DB-->>M: id
    M-->>UI: success
    UI->>U: Show logged meal + kcal range
```

### 4.3 Photo Logging (Assisted)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /log/photo page
    participant A as ai.analyzePhoto action
    participant G as Groq (Qwen vision)
    participant M as mealLogs mutation

    U->>UI: Upload 1–3 plate photos
    UI->>UI: Compress client-side (data-saver)
    UI->>A: useAction()({ images, supportedFoods, platePreset })
    A->>G: chat.completions (JSON mode,<br/>images + food list, ≤3 images)
    G-->>A: { items: [{foodId, portionClass, confidence}] }
    A-->>UI: items + portion classes

    UI->>UI: Map portionClass → grams via plate preset
    UI->>UI: Compute kcal range (code)
    UI->>U: Confirm / edit screen

    U->>UI: Confirm items + portions
    UI->>M: useMutation(mealLogs.create)({ items, method: "photo" })
```

### 4.4 Balance Engine (Overshoot → Rebalance Plan)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /plan page
    participant Q as budget.get query
    participant E as lib/engine (rebalance)
    participant DB as profiles/mealLogs/activityLogs

    U->>UI: View today's plan / after logging biriyani
    UI->>Q: useQuery(budget.get, { today })
    Q->>DB: Read profile (BMR, TDEE, safetyMode, budgetControls)
    Q->>DB: Read week mealLogs (intake) + activityLogs (credit, FR-REBAL-08)
    Q->>E: rebalance({ intakeKcal, targetKcal, floorKcal,<br/>weightKg, dates, safetyMode }, controls)
    E-->>Q: RebalancePlan { plan[], overshootKcal,<br/>windowDays, intakeShare, ... }

    alt safetyMode = normal
        Q-->>UI: plan (computed on read — no budgetState writes)
        UI->>U: Show plan with Bangla/EN templates<br/>+ ±15% uncertainty
    else safetyMode = restricted | doctor-first
        E-->>Q: { blocked: true, plan: [] }
        Q-->>UI: blocked + reason
        UI->>U: Safety referral card (no calorie targets)
    end
```

### 4.5 AI Coach RAG Chat

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /coach page
    participant EM as POST /api/embed
    participant R as rag.search + ai.rewriteQuery
    participant A as ai.chat action
    participant G as Groq API

    U->>UI: "diabetes thakle bhat koto khabo?"
    UI->>EM: embedQuery(q) — local e5-small, 384d
    EM-->>UI: queryEmbedding
    UI->>R: rag.search({ query, queryEmbedding, limit: 6 })
    R-->>UI: hybrid hits (score, section, page)
    opt Bangla script or top score < 0.8
        UI->>R: ai.rewriteQuery(q) → embed → second search → merged hits
    end
    UI->>A: ai.chat({ message, safeContext, context: top excerpts })
    Note over A: safeContext set by code from safetyMode<br/>— NEVER raw profile data
    A->>G: chat.completions (numbered excerpts +<br/>no-invented-numbers system rules)
    G-->>A: answer with inline [n] markers
    A-->>UI: { response } | { error }
    UI->>U: Answer + citation chips from [n] markers<br/>(lowConfidence when below threshold)
    Note over UI: Number validator (tool/chunk match) — planned, not built
```

### 4.6 Privacy — Delete My Data

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /settings
    participant P as privacy.deleteMyData
    participant DB as All tables

    U->>UI: Confirm "DELETE" (type exact word)
    UI->>P: useMutation(api.privacy.deleteMyData)({ key, confirm: "DELETE" })
    P->>DB: Delete profiles (by_key)
    P->>DB: Delete mealLogs (by_profile_and_date)
    P->>DB: Delete activityLogs (by_profile_and_date)
    P->>DB: Delete budgetState (by_profile_and_week)
    P->>DB: Delete weighIns (by_profile_and_date)
    P->>DB: Insert auditLogs "privacy.deleteMyData"
    P-->>UI: { ok: true, deleted: N }
    UI->>U: "All your data has been deleted."
```

### 4.7 Offline Queue (Wave 7)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as PWA
    participant IDB as IndexedDB
    participant C as Convex
    participant DB as Tables

    U->>UI: Log meal (offline)
    UI->>IDB: Queue write { entryId, type, payload, timestamp }
    IDB-->>UI: OK (optimistic UI)
    UI->>U: "Saved offline — will sync"

    Note over UI,C: When connectivity returns...

    UI->>IDB: Read queue
    IDB-->>UI: Pending entries[]
    loop Each entry
        UI->>C: useMutation(mealLogs.create)({...entryId})
        C->>DB: insert (last-write-wins by entryId)
        DB-->>C: ok
        C-->>UI: synced
        UI->>IDB: Remove from queue
    end
    UI->>U: "Synced N entries"
```

### 4.8 Activity Logging (MET)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as /activity page
    participant E as lib/engine
    participant M as activity mutation
    participant DB as activityLogs

    U->>UI: "Walked 40 minutes"
    UI->>UI: Select type = walking
    UI->>E: metNetKcalMinutes(4.3, weightKg, 40)
    E-->>UI: 154 kcal net (±15%)
    UI->>U: Show "≈ 154 kcal ±15%"
    U->>UI: Confirm
    UI->>M: useMutation(activity.create)({ type, minutes, met: 4.3, netKcal })
    M->>DB: insert activityLogs
    DB-->>M: id
    M-->>UI: success
    UI->>U: Logged
```

---

## 5. Data Flow Summary Table

| DFD Level | Process | Data In | Data Out | Store | Engine / LLM |
|-----------|---------|---------|----------|-------|--------------|
| **L1** | P1 Onboarding | Demographics, screening | safetyMode, BMI, energy | profiles | Engine |
| **L1** | P2 Logging | Meal text, photos | mealLogs | mealLogs | LLM (parse) + Code (kcal) |
| **L1** | P3 Tracking | Logs, weigh-ins | Macros, ranges | mealLogs, weighIns | Engine |
| **L1** | P4 Balance | Intake, target, floor | Rebalance plan | budgetState | Engine |
| **L1** | P5 Activity | Type, minutes, MET | Net kcal | activityLogs | Engine |
| **L1** | P6 Coach | Question, safe mode | Answer + citations | ragChunks, auditLogs | LLM + RAG |
| **L1** | P7 Privacy | Delete request, admin CRUD | Purged data | All tables | — |
| **L2** | P2.1 Search | User text | Top-5 candidates | Food JSON | Client |
| **L2** | P2.2 Parse | Text + candidates | Picks | — | LLM (JSON mode) |
| **L2** | P2.3 Photo | Images | Items + portions | — | LLM (vision) |
| **L2** | P2.4 Convert | qty + unit | grams | — | Code |
| **L2** | P2.5 Compute | grams + food row | kcal range | — | Code |
| **L2** | P4.1 Overshoot | intake, target | overshootKcal | — | Code |
| **L2** | P4.2 Safety | safetyMode | allowed/blocked | — | Engine |
| **L2** | P4.3 Window | overshoot | windowDays | — | Code |
| **L2** | P4.4 Split | coveredKcal | trim + activity | — | Code |
| **L2** | P4.5 Clamp | trim, activity | clamped values | — | Engine |
| **L2** | P4.6 Render | Numeric plan | Bangla/EN text | — | Templates |
| **L2** | P6.1 Rewrite | Question | English query | — | LLM |
| **L2** | P6.2 Retrieve | Query | Chunks + scores | ragChunks | Embeddings |
| **L2** | P6.4 Threshold | Best score | Pass/refuse | — | Code |
| **L2** | P6.5 Complete | Chunks + tools | Answer draft | — | LLM |
| **L2** | P6.6 Validate | Draft | Validated answer | — | Code |
| **L2** | P6.7 Cite | Answer | Answer + sources | auditLogs | Code |
