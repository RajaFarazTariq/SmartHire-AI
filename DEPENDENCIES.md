# SmartHire-AI — Tech Stack & Dependency Reference

An AI-powered, two-sided recruitment platform. Recruiters post jobs and screen
resumes with AI scoring; candidates apply through a self-service portal and track
their hiring progress in real time.

> **Authoritative dependency source:** [`package.json`](./package.json).
> Install with `npm install`. [`requirements.txt`](./requirements.txt) is a
> categorized, human-readable mirror for quick scanning (not pip-installable).

---

## 1. Tech Stack at a Glance

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 15 (App Router, React Server Components, Server Actions, Middleware) |
| **Language** | TypeScript 5 |
| **UI runtime** | React 19 |
| **Styling** | Tailwind CSS v4, `tw-animate-css`, CSS design tokens (light/dark) |
| **UI components** | shadcn/ui pattern on Radix UI primitives |
| **Icons** | lucide-react |
| **Animation** | Motion (Framer Motion) |
| **Charts** | Recharts |
| **Authentication** | Clerk v6 (sessions, Organizations, RBAC) |
| **Database** | PostgreSQL (Neon serverless) |
| **ORM** | Prisma 5 |
| **AI — extraction & embeddings** | Google Gemini (`@google/generative-ai`) |
| **AI — vector search** | Pinecone |
| **File storage** | Vercel Blob (private) |
| **Document parsing** | `pdf-parse` (PDF), `mammoth` (DOCX → text & HTML) |
| **Validation** | Zod |
| **Forms / upload** | react-dropzone |
| **Notifications** | Sonner (toasts) + in-app notification system |
| **Theming** | next-themes |
| **Deployment target** | Vercel (recommended) |

---

## 2. Prerequisites

- **Node.js ≥ 20** (Next.js 15 requires ≥ 18.18) and **npm ≥ 10**
- Accounts / API keys for the external services:
  - [Clerk](https://dashboard.clerk.com) — authentication
  - [Neon](https://console.neon.tech) — PostgreSQL database
  - [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key
  - [Pinecone](https://app.pinecone.io) — vector index (768 dims, cosine)
  - [Vercel Blob](https://vercel.com/dashboard/stores) — file storage token

---

## 3. Dependencies by Category

### Runtime dependencies

| Category | Packages |
| --- | --- |
| Core framework | `next`, `react`, `react-dom` |
| Authentication | `@clerk/nextjs`, `@clerk/themes` |
| Database / ORM | `@prisma/client` |
| AI / ML | `@google/generative-ai`, `@pinecone-database/pinecone` |
| File storage | `@vercel/blob` |
| Document parsing | `pdf-parse`, `mammoth` |
| UI primitives | `@radix-ui/react-{alert-dialog, avatar, dialog, dropdown-menu, label, select, separator, slot, tooltip}` |
| UI utilities | `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Styling | `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`, `next-themes` |
| Charts | `recharts` |
| Animation | `motion` |
| Forms / upload | `react-dropzone` |
| Validation | `zod` |
| Notifications | `sonner` |

### Dev dependencies

| Category | Packages |
| --- | --- |
| Types | `typescript`, `@types/node`, `@types/react`, `@types/react-dom` |
| Linting | `eslint`, `eslint-config-next` |
| Database tooling | `prisma` |
| Env loading | `dotenv-cli` (loads `.env.local` for Prisma CLI commands) |

---

## 4. Environment Variables

Copy [`.env.example`](./.env.example) → `.env.local` and fill in values.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (client) |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (server) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | ➖ | Post sign-in fallback (`/continue`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | ➖ | Post sign-up fallback (`/continue`) |
| `DATABASE_URL` | ✅ | Neon PostgreSQL **direct/unpooled** connection string |
| `GOOGLE_API_KEY` | ✅ | Gemini API key (extraction + embeddings) |
| `PINECONE_API_KEY` | ✅ | Pinecone API key |
| `PINECONE_INDEX` | ✅ | Pinecone index name (e.g. `resume-screening`) |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob read/write token |

**AI configuration (in code):** extraction model `gemini-2.5-flash`; embedding
model `gemini-embedding-001` truncated to **768 dimensions**. The Pinecone index
must therefore be created with **768 dimensions, cosine** metric.

---

## 5. Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local      # then fill in real values

# 3. Generate the Prisma client
npm run db:generate

# 4. Apply database migrations
npm run db:migrate              # dev: creates/applies migrations
# (first-time alternative: `npm run db:push` to sync schema without migrations)

# 5. Start the dev server
npm run dev                     # http://localhost:3000
```

> **Prisma + `.env.local`:** the Prisma CLI ignores `.env.local`, so always use
> the `npm run db:*` wrappers below (they inject it via `dotenv-cli`). Running
> `prisma ...` directly will fail to find `DATABASE_URL`.

---

## 6. Commands Reference

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (port 3000) |
| `npm run build` | Production build *(stop the dev server first — they share `.next`)* |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create & apply a dev migration |
| `npm run db:push` | Push schema to the DB without a migration file |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

---

## 7. Project Structure

```
src/
├── app/
│   ├── (auth)/              # Sign-in, sign-up, join (role chooser)
│   ├── (dashboard)/         # Recruiter/admin app (org-gated)
│   │   ├── dashboard/  jobs/  candidates/  upload/  activity/  …
│   ├── portal/              # Candidate portal (auth-only, no org)
│   │   ├── jobs/  applications/  profile/  notifications/
│   ├── api/                 # Route handlers (file proxies, role cookie)
│   ├── continue/            # Post-auth role router
│   └── onboarding/          # Org creation (recruiters)
├── components/              # UI (ui/, dashboard/, portal/, shared)
├── lib/                     # prisma, auth, org, gemini, pinecone, parsers, …
└── middleware.ts            # Clerk auth + route gating
prisma/
├── schema.prisma           # Data model
└── migrations/             # SQL migration history
```

---

## 8. External Services Summary

| Service | Purpose | Notes |
| --- | --- | --- |
| **Clerk** | Auth, sessions, Organizations, RBAC | Single instance; role separation via `accountType` + org membership |
| **Neon (PostgreSQL)** | Primary datastore | Use the direct/unpooled URL; serverless auto-suspend is normal |
| **Google Gemini** | Resume parsing + embeddings | `gemini-2.5-flash`, `gemini-embedding-001@768` |
| **Pinecone** | Semantic candidate search | 768-dim cosine index, scoped by org metadata |
| **Vercel Blob** | Resume file storage | Private store; served via authenticated proxy routes |

---

## 9. Architecture Notes

- **Auth & roles:** one Clerk instance. Recruiters belong to a Clerk
  Organization; candidates do not. `User.accountType` (`recruiter` | `applicant`)
  plus org membership drive routing. Middleware gates org routes; the onboarding
  page bounces candidates to `/portal`.
- **Data isolation:** recruiter data (jobs, candidates, scores, activity) is
  scoped by `orgId`. Candidate records created via the portal carry the job's
  `orgId` so they appear in the recruiter's pipeline.
- **AI pipeline:** resume upload → text extraction (`pdf-parse`/`mammoth`) →
  Gemini structured extraction → embedding → Pinecone upsert → status `ready`.
  Transient Gemini errors are retried with exponential backoff.
