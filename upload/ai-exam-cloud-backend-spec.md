# PROMPT FOR Z.AI GLM 5.2 — "AI Exam Cloud" End-to-End Backend Expansion

> Paste everything below the line into GLM 5.2. It is written so GLM inspects its own existing codebase first, then implements new backend logic, database schema, and API endpoints that plug into what already exists — without rewriting or breaking current functionality.

---

## STEP 0 — MANDATORY: DETECT BEFORE BUILDING

Before writing any code, do the following and report back:

1. Identify the current backend framework, language, and version (e.g., Express/NestJS on Node, Django/FastAPI on Python, Next.js API routes, etc.).
2. Identify the current database engine and ORM/query layer in use (e.g., PostgreSQL + Prisma, MongoDB + Mongoose, Supabase, Firebase).
3. Identify the current frontend framework, routing pattern, and state-management approach (e.g., Next.js App Router + Zustand, React + Redux, Vue + Pinia).
4. Identify existing authentication/authorization method (JWT, session-based, OAuth, Supabase Auth, Firebase Auth, etc.).
5. Identify existing folder/module structure and naming/code-style conventions.
6. List existing database tables/collections and existing API endpoints relevant to users, exams, and tests, if any already exist — so nothing gets duplicated or overwritten.

**Do not proceed to implementation until this inventory is done.** All code below must be translated into the detected stack's syntax and must extend existing files/modules rather than replacing them. If a described entity or endpoint already exists in some form, extend/migrate it — do not create a duplicate parallel system.

**Non-negotiable constraint:** existing working features, routes, database tables, and UI screens must continue to function exactly as before. New functionality is additive.

---

## STEP 1 — DATA MODEL (translate into your ORM/schema language)

Add these entities. Field types are indicative (adjust to SQL types or document schema as appropriate). Add foreign keys/relations as noted.

### `countries`
- id (PK), name, code

### `states_regions`
- id (PK), country_id (FK → countries), name, code

### `sectors`
- id (PK), name (e.g., Teaching, Healthcare, Agriculture, Technical, Judiciary, Police, Banking), slug

### `exams`
- id (PK), name, slug, country_id (FK), state_id (FK, nullable for national exams), sector_id (FK), conducting_authority, target_job_or_course, estimated_candidate_volume (enum: low/medium/high/very_high), exam_frequency (enum: annual/biennial/on_demand/irregular), languages_supported (array/join table), dedicated_platform_exists (boolean), competitor_count (int), existing_material_quality (enum: poor/moderate/good), previous_papers_available (boolean), market_gap_score (0–100), monetisation_potential (0–100), priority_score (computed), is_active (boolean), created_at, updated_at

### `exam_cycles`
- id (PK), exam_id (FK), year_or_session_label, application_start_date, application_end_date, exam_date, status (upcoming/ongoing/completed)

### `syllabus_topics`
- id (PK), exam_id (FK), parent_topic_id (nullable, FK → self, for hierarchy), title, weightage_percent (nullable)

### `questions`
- id (PK), exam_id (FK), topic_id (FK), source (enum: previous_year/ai_generated/curated), year (nullable if previous_year), question_text, options (array/JSON), correct_option, explanation_text, difficulty (easy/medium/hard), language_code, created_by (enum: system_ai/admin), created_at

### `mock_tests`
- id (PK), exam_id (FK), title, type (enum: chapter_test/full_mock/previous_year_replica), duration_minutes, total_questions, negative_marking_ratio (nullable), language_code

### `mock_test_questions` (join table)
- mock_test_id (FK), question_id (FK), sequence_order

### `users` (extend existing table — do not recreate)
Add fields if missing: preferred_language, current_prep_stage (enum: beginner/revision/final_sprint)

### `user_target_exams` (join table — supports multi-exam prep)
- id (PK), user_id (FK), exam_id (FK), exam_cycle_id (FK, nullable), target_date (nullable), is_primary (boolean)

### `user_test_attempts`
- id (PK), user_id (FK), mock_test_id (FK), started_at, submitted_at, score, accuracy_percent, time_taken_seconds, status (in_progress/submitted/abandoned)

### `user_answer_log`
- id (PK), attempt_id (FK), question_id (FK), selected_option, is_correct, time_taken_seconds

### `user_topic_performance` (derived/aggregated table, recomputed after each attempt)
- id (PK), user_id (FK), exam_id (FK), topic_id (FK), accuracy_percent, avg_time_per_question, attempts_count, weakness_flag (boolean), last_updated

### `study_plans`
- id (PK), user_id (FK), exam_id (FK), generated_on, plan_json (structured daily/weekly schedule), status (active/completed/archived)

### `rank_predictions`
- id (PK), user_id (FK), exam_id (FK), predicted_percentile, predicted_rank_range, based_on_attempt_id (FK), generated_at

---

## STEP 2 — API ENDPOINTS TO ADD (translate to your routing framework)

Group under a versioned prefix consistent with existing API (e.g., `/api/v1/...`). Use existing auth middleware — do not build a parallel auth system.

### Catalog & discovery
- `GET /countries`
- `GET /states?country_id=`
- `GET /sectors`
- `GET /exams?country_id=&state_id=&sector_id=&search=` → paginated, filterable
- `GET /exams/:id` → full exam detail incl. syllabus, active cycles, language options
- `GET /exams/:id/syllabus` → nested topic hierarchy

### Onboarding / exam selection
- `POST /users/me/target-exams` → body: `{ exam_id, exam_cycle_id?, target_date?, is_primary }` (supports multiple calls for multi-exam prep)
- `GET /users/me/target-exams`
- `DELETE /users/me/target-exams/:id`
- `PATCH /users/me/preferences` → body: `{ preferred_language, current_prep_stage }`

### Practice & mock tests
- `GET /exams/:id/mock-tests?type=&language=`
- `GET /mock-tests/:id` → questions delivered WITHOUT correct answers/explanations until submission
- `POST /mock-tests/:id/attempts` → starts an attempt, returns attempt_id
- `POST /attempts/:id/answers` → submit one answer at a time (autosave) or batch on final submit
- `POST /attempts/:id/submit` → finalizes attempt, triggers scoring + performance recomputation + rank prediction (async job if volume is high)
- `GET /attempts/:id/result` → score, accuracy, topic-wise breakdown, time analysis

### Performance & personalization
- `GET /users/me/performance?exam_id=` → topic_performance rows + weakness flags
- `GET /users/me/study-plan?exam_id=`
- `POST /users/me/study-plan/regenerate?exam_id=`
- `GET /users/me/rank-prediction?exam_id=`

### AI content generation (internal/admin-triggered, can be a background job/queue)
- `POST /admin/exams/:id/generate-questions` → body: `{ topic_id, count, difficulty, language_code }` — calls the AI generation service (Section 3)
- `POST /admin/exams/:id/generate-mock-test` → assembles a full mock from question bank per exam's real pattern (duration, section weightage, negative marking)

Use existing error-handling middleware/response envelope conventions. Every endpoint must validate input (schema validation library already in use, e.g., Zod/Joi/Pydantic) and return consistent error shapes — do not introduce a second error format.

---

## STEP 3 — CORE BUSINESS LOGIC (pseudocode — implement in your language)

### 3.1 Exam-selection onboarding flow
```
function completeOnboarding(user, selections):
    for exam in selections.exams:
        create user_target_exams row (user, exam.id, exam.cycle_id, exam.target_date, is_primary=exam.isPrimary)
    update users.preferred_language = selections.language
    update users.current_prep_stage = selections.prepStage
    trigger generateInitialStudyPlan(user, primary_exam)
    return personalized_dashboard_payload(user)
```

### 3.2 Mock test scoring
```
function scoreAttempt(attempt_id):
    attempt = load attempt with answers
    for each answer:
        mark is_correct by comparing selected_option to question.correct_option
        apply negative_marking_ratio if incorrect and mock_test.negative_marking_ratio is set
    compute total_score, accuracy_percent, time_taken_seconds
    save to user_test_attempts
    recomputeTopicPerformance(attempt.user_id, attempt.exam_id)
    generateRankPrediction(attempt.user_id, attempt.exam_id, attempt_id)
    return result
```

### 3.3 Topic weakness detection
```
function recomputeTopicPerformance(user_id, exam_id):
    for topic in exam.syllabus_topics:
        answers = all user_answer_log rows joined to questions where topic_id = topic.id and question.exam_id = exam_id
        accuracy = correct_count / total_count
        avg_time = average(time_taken_seconds)
        weakness_flag = accuracy < WEAKNESS_THRESHOLD (e.g., 50%) OR avg_time > topic.expected_time_benchmark
        upsert user_topic_performance row
```

### 3.4 Study plan generation
```
function generateStudyPlan(user_id, exam_id):
    weak_topics = get user_topic_performance where weakness_flag = true, ordered by accuracy asc
    days_remaining = target_date - today (from user_target_exams)
    plan = distribute weak_topics + full syllabus coverage across days_remaining,
           allocate more sessions to weak_topics,
           insert periodic full mock tests (e.g., every 7 days)
    save as study_plans.plan_json
```

### 3.5 Rank/percentile prediction
```
function generateRankPrediction(user_id, exam_id, attempt_id):
    historical_scores = aggregate scores from other users' attempts on same exam_id (and same cycle if available)
    percentile = percentileRank(this_attempt.score, historical_scores)
    predicted_rank_range = estimate using candidate_volume and percentile
    save to rank_predictions
    # if insufficient historical data (new/low-volume exam), fall back to difficulty-adjusted heuristic score instead of a false-precision rank
```

### 3.6 AI question generation service (used by admin endpoint)
```
function generateQuestions(exam_id, topic_id, count, difficulty, language_code):
    context = build prompt from: exam metadata, topic title, real exam pattern/style, difficulty, language
    call underlying LLM with structured-output instruction (return strict JSON array of {question_text, options, correct_option, explanation_text})
    validate each returned question: exactly one correct option, no duplicate options, explanation non-empty
    reject and retry any malformed items instead of saving bad data
    insert valid questions into questions table with source = 'ai_generated'
```

### 3.7 Multi-exam dashboard aggregation
```
function personalized_dashboard_payload(user):
    target_exams = get user_target_exams for user
    for each target_exam:
        include: syllabus progress %, next scheduled study-plan item, latest mock score, weakness_flags count
    return combined payload for dashboard rendering
```

---

## STEP 4 — FRONTEND INTEGRATION CONTRACT

Do not restructure existing pages/components. Add:

1. **Onboarding wizard component** (progressive drill-down): Country → State → Sector → Exam → Cycle/Language → Prep stage. Each step calls the catalog endpoints above with the previous step's selection as a filter. Final step calls `POST /users/me/target-exams` (once per selected exam) then `PATCH /users/me/preferences`, then redirects to dashboard.
2. **Exam catalog/search page**: calls `GET /exams` with filters; must support incremental filtering without full page reload (client-side state + query params).
3. **Mock test runner component**: fetches `GET /mock-tests/:id`, renders questions without correct answers, autosaves via `POST /attempts/:id/answers`, calls `POST /attempts/:id/submit` on finish, then renders `GET /attempts/:id/result`.
4. **Performance dashboard component**: renders `GET /users/me/performance` as topic-wise charts (reuse existing charting library if one is already in the project — do not add a new one unless none exists).
5. **Study plan component**: renders `GET /users/me/study-plan`; add a "regenerate" button wired to `POST /users/me/study-plan/regenerate`.
6. State management: use whatever is already used in the project (Redux/Zustand/Context/Vuex/Pinia) — do not introduce a second state library.
7. All new API calls must go through the existing API client/wrapper (existing axios instance, fetch wrapper, or generated SDK) so auth headers, base URL, and error interceptors stay consistent.

---

## STEP 5 — ERROR HANDLING, VALIDATION & QUALITY BAR (to avoid bugs)

- Validate every request body against a schema before touching the database; reject invalid input with a 4xx and a clear message, using the existing validation library.
- Wrap all database writes that touch multiple tables (e.g., scoring an attempt, which updates attempts + answer_log + topic_performance + rank_predictions) in a **single transaction** — partial writes must not be possible.
- Idempotency: submitting the same attempt twice (`POST /attempts/:id/submit`) must not double-count or duplicate performance rows — check attempt.status first.
- Rate-limit and queue the AI question-generation endpoint (Section 3.6) — do not call the LLM synchronously in the request/response cycle for bulk generation; use a background job/queue if one already exists in the project, otherwise implement a simple job table + worker rather than blocking HTTP requests.
- Add indexes on all foreign keys used in filtering/joins (`exams.state_id`, `exams.sector_id`, `questions.exam_id`, `questions.topic_id`, `user_test_attempts.user_id`, `user_topic_performance.user_id`).
- Write automated tests for: scoring logic (3.2), weakness detection (3.3), and the onboarding flow (3.1) at minimum, using whatever test framework is already configured in the project.
- Do not hardcode exam-specific logic (e.g., a specific state's negative-marking rule) inline in shared functions — store it as data on the `exams`/`mock_tests` records so the same code path serves every exam.

---

## STEP 6 — BUILD ORDER

1. Run Step 0 detection and report the stack back before writing code.
2. Implement Step 1 schema changes (migrations, not destructive changes to existing tables).
3. Implement Step 2 catalog endpoints (read-only, low risk) and verify against existing data.
4. Implement Step 4.1–4.2 (onboarding wizard + catalog page) against the new endpoints.
5. Implement Step 2 mock-test/attempt endpoints + Step 3.2/3.3 scoring and weakness logic, with the transaction and idempotency rules from Step 5.
6. Implement Step 4.3–4.5 (test runner, performance dashboard, study plan UI).
7. Implement Step 3.4–3.6 (study plan generation, rank prediction, AI question generation) as background-job-driven features.
8. Populate exam catalog data starting with Phase-1 categories: state government long-tail exams, teacher recruitment + state TET, agriculture & rural development, technical/diploma recruitment, healthcare allied professions, regional-language variants, department-specific government jobs.
9. Report back after each phase with: files/modules touched, migrations added, and any conflicts found with existing code — do not silently overwrite anything ambiguous; flag it instead.
