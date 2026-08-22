# PreparationAI

AI Educational Operating System for competitive exam preparation (JEE, NEET, SAT, GRE, GMAT, GATE, CAT, UPSC, IELTS, TOEFL).

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma + SQLite (dev) / PostgreSQL (prod)**.

---

## Quick start (local dev)

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
#    .env already contains: DATABASE_URL=file:/home/z/my-project/db/custom.db
npx prisma db push
npx prisma generate

# 3. Start the dev server
npm run dev
# → http://localhost:3000
```

The first time you sign up, a `User` row is written to `db/custom.db`, a welcome `Notification` is created, and the bell icon in the topbar will light up with one unread item.

## Architecture

### Frontend (`src/`)
- `app/page.tsx` — view router (Dashboard, Mock Exam, AI Agents Hub, Explore Hub, …)
- `app/globals.css` — premium theme (Electric Blue primary, warm off-white background, glass topbar, soft premium shadows)
- `components/app-shell.tsx` — sidebar + glass topbar + notification bell
- `components/notifications/notification-bell.tsx` — real dropdown wired to `/api/notifications`
- `components/auth/auth-screen.tsx` — multi-step signup (Details → Grade → Country → Exams → Date → OTP)
- `components/mock-exam/exam-runner.tsx` — exam runner with proctoring + accurate time tracking
- `components/proctoring/` — NTA UFM-grounded integrity report
- `lib/store.ts` — Zustand store with localStorage cache + backend persistence

### Backend (`src/app/api/`)
- `auth/register` — create a User row in the DB
- `auth/login` — verify password + return user, attempts, seenSignatures, mentorMessages
- `auth/user` — upsert user (used for profile updates)
- `auth/attempts` — persist a single ExamAttempt
- `auth/signatures` — bulk-insert seen question signatures
- `notifications` — GET list + POST (create / mark_read / mark_all_read)
- `evaluate` — server-side exam evaluation
- `mock-exam` — server-side exam generation with cross-attempt dedup
- `proctoring/session` — proctoring session create / close / ingest events
- `mentor`, `socratic-mentor`, `rag-tutor`, `doubt-solver`, `pyq-trends`, … — per-agent AI endpoints (GLM-4.6 via `z-ai-web-dev-sdk`)

### Database (`prisma/schema.prisma`)
SQLite for dev (file-based at `db/custom.db`), PostgreSQL-ready for production.

| Table | Purpose |
|-------|---------|
| `users` | Account records (email, passwordHash, examGoal, examGoals, country, …) |
| `exam_attempts` | One row per mock exam submission (score, accuracy, behavior analysis JSON, …) |
| `mentor_messages` | AI Mentor conversation history per user |
| `notifications` | Bell-icon notifications (welcome, mock_submitted, achievement, nudge, system) |
| `seen_question_signatures` | Per-user cross-attempt question dedup memory |
| `academic_records` | Uploaded marksheet analyses |

## Deployment

### Vercel + PostgreSQL (Neon / Supabase / Railway)

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Set the environment variable `DATABASE_URL` to your Postgres connection string (e.g. `postgresql://user:pass@host:5432/db?schema=public`).
4. Update `prisma/schema.prisma` to switch the provider:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. In Vercel's Build settings, set the build command to:

   ```
   npx prisma generate && npx prisma db push && npm run build
   ```

6. Deploy.

### Self-hosted (Docker / VPS)

```bash
# Build
npm run build

# Migrate the DB
npx prisma db push

# Run the production server (configured in package.json)
npm start
```

The build is already configured for `next build` with a standalone output (`.next/standalone/server.js`).

## Development commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema changes to the DB (no migration history) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create a migration |
| `npm run db:reset` | Drop and recreate the DB (dev only) |

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI primitives |
| State | Zustand + persist middleware |
| Database | Prisma ORM → SQLite (dev), PostgreSQL (prod) |
| AI | GLM-4.6 via `z-ai-web-dev-sdk` |
| Auth | Email + password (Note: hash passwords with bcrypt/argon2 in production) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | lucide-react |

## License

Private. © PreparationAI.
