# AI Resume Screening & Recruitment System

A full-stack web application that ingests resumes, extracts structured candidate information using NLP, and ranks candidates against job descriptions with explainable AI-driven match scores.

## Project Overview

This system helps recruiters process high volumes of applicants by automatically extracting skills, scoring candidates, and ranking them on an intuitive dashboard.

**Tech Stack:** Next.js 15 · TypeScript · Gemini · Pinecone · Postgres

## Getting Started

### Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Implementation Roadmap (10 Phases)

### Phase 1 ✅ — Project Skeleton
- ✅ Next.js 15 setup with TypeScript & Tailwind
- ✅ Folder structure & .env.example
- ⏳ Push to GitHub and deploy to Vercel

### Phase 2 — Authentication (2h)
- [ ] Clerk auth setup
- [ ] Sign-in/sign-up pages
- [ ] Protected dashboard routes

### Phase 3 — Database + ORM (1-2h)
- [ ] Neon PostgreSQL
- [ ] Prisma schema & migrations
- [ ] Prisma client singleton

### Phase 4 — Job CRUD (3h)
- [ ] Job form & endpoints
- [ ] Job detail page

### Phase 5 — Resume Upload (3-4h)
- [ ] Bulk upload with react-dropzone
- [ ] PDF/DOCX parsing
- [ ] File storage in Vercel Blob

### Phase 6 — Skill Extraction (4-5h)
- [ ] Gemini structured extraction
- [ ] Zod validation
- [ ] Pinecone embeddings

### Phase 7 — Scoring & Ranking (4h)
- [ ] Multi-signal composite scoring
- [ ] AI summaries
- [ ] Score persistence

### Phase 8 — Recruiter Dashboard (3-4h)
- [ ] Ranked candidate table
- [ ] Color-coded scores
- [ ] Skill badges & summaries

### Phase 9 — Candidate Detail (2-3h)
- [ ] Full profile display
- [ ] PDF viewer
- [ ] Job match history

### Phase 10 — Polish (3-5h)
- [ ] Empty states & loaders
- [ ] CSV export
- [ ] Mobile responsive
- [ ] Dark mode

## Matching Algorithm

Three weighted signals (weights configurable):

- **Semantic Similarity (40%)** — Cosine similarity of embeddings
- **Skill Match (40%)** — % of required skills found
- **Experience Match (20%)** — Years vs. requirement

```
overallScore = 0.40×semantic + 0.40×skills + 0.20×experience
```

## Database Schema

Four core tables: User, Job, Candidate, Score (join table)

See `prisma/schema.prisma` for the full schema.

## Environment Variables

```bash
GOOGLE_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=resume-screening
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

**Never commit `.env.local`** — it's in `.gitignore`

## Free-Tier Capacity

- ~50 docs/user (Pinecone)
- ~1500 queries/day (Gemini)
- 3-5 concurrent users
- 500 MB database (Neon)
- 100 GB bandwidth (Vercel)

**Total cost: $0**

## Resources

- [Next.js](https://nextjs.org/docs)
- [Clerk](https://clerk.com)
- [Prisma](https://www.prisma.io)
- [Gemini API](https://ai.google.dev)
- [Pinecone](https://www.pinecone.io)

---

Built as a portfolio project demonstrating AI/ML + full-stack capabilities.
