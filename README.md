# SmartHire AI

SmartHire AI is an enterprise recruitment platform that automatically parses resumes, extracts candidate insights with NLP, and ranks applicants against job descriptions using explainable, multi-signal AI scoring — helping hiring teams screen high volumes of applicants in seconds.

The platform is built for multi-team organizations with role-based access, organization-scoped data, audit-ready activity tracking, and a production-grade architecture. It runs on Next.js 15, TypeScript, Google Gemini, Pinecone, PostgreSQL, and Tailwind CSS.

---

## 🚀 Features

* AI-powered resume parsing (PDF/DOCX)
* NLP-based skill & entity extraction
* Semantic candidate-job matching
* Multi-signal ranking algorithm
* Recruiter dashboard with analytics
* Bulk resume upload system
* Explainable AI-generated summaries
* Responsive modern UI with dark mode
* Secure authentication & protected routes
* Real-time candidate scoring and filtering

---

## 🧠 AI Matching Engine

The ranking system combines three weighted scoring signals:

| Signal              | Weight | Purpose                                             |
| ------------------- | ------ | --------------------------------------------------- |
| Semantic Similarity | 40%    | Measures contextual similarity using embeddings     |
| Skill Match         | 40%    | Matches required job skills                         |
| Experience Match    | 20%    | Compares candidate experience with job requirements |

```ts
overallScore =
  0.40 * semanticScore +
  0.40 * skillMatchScore +
  0.20 * experienceScore
```

This hybrid approach improves ranking accuracy while keeping results explainable for recruiters.

---

## 🛠 Tech Stack

### Frontend

* Next.js 15
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* React Hook Form
* Zod
* TanStack Query
* Recharts

### Backend & AI

* Gemini AI
* LangChain
* Pinecone Vector Database
* Prisma ORM
* PostgreSQL (Neon)

### Authentication & Storage

* Clerk Authentication
* Vercel Blob Storage

---

## 📂 Project Structure

```bash
src/
 ├── app/
 ├── components/
 ├── lib/
 ├── types/
 ├── api/
 └── prisma/
```

The project follows a clean, scalable, and production-ready architecture.

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-resume-screening-system.git
cd ai-resume-screening-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Add the required API keys:

```env
GOOGLE_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 🧩 Platform Capabilities

### Organizations & access control

* Multi-team organizations with shared, org-scoped data
* Role-based access (Admin / Recruiter / Manager)
* Authentication, protected routes, and session management

### Job & candidate management

* Job creation, editing, and detail views
* Bulk resume upload with PDF/DOCX parsing
* Hiring pipeline stages (Applied → Shortlisted → Interview → Rejected → Hired)
* Candidate filtering, sorting, search, and bulk actions
* Recruiter notes and candidate profiles with an inline resume viewer

### AI matching & ranking

* Structured resume extraction (skills, experience, education)
* Semantic candidate–job matching via vector embeddings
* Composite multi-signal scoring with skill-gap analysis
* Explainable, AI-generated recruiter summaries per candidate

### Analytics & operations

* Recruiter dashboard with KPIs, pipeline and score analytics
* Activity tracking for audit-ready operations
* CSV export of ranked candidates
* Responsive UI, dark mode, and performance-optimized rendering

---

## 🔒 Security & Privacy

* Environment variables protected via `.env.local`
* Secure authentication using Clerk
* Scoped recruiter-based data access
* Resume file isolation and protected storage

⚠️ Never commit secrets or API keys to GitHub.

---

## ☁️ Infrastructure

SmartHire AI runs on managed, horizontally scalable cloud services, so it grows from a single team to organization-wide deployment without re-architecture:

* Google Gemini — extraction & AI summaries
* Pinecone — vector search for semantic matching
* Neon PostgreSQL — primary datastore
* Vercel — hosting, serverless compute, and blob storage
* Clerk — authentication & organization management

---

## 🎯 Why SmartHire AI

SmartHire AI helps recruiters, HR teams, and organizations hire faster and more objectively:

* Screen high volumes of resumes in seconds instead of hours
* Rank candidates with explainable, multi-signal AI scores recruiters can trust
* Standardize evaluation across the team with shared, organization-scoped data
* Surface the strongest matches per role with semantic search and skill-gap analysis
* Keep hiring auditable with activity tracking and role-based access control

---

## 📚 Resources

* Next.js
* Prisma
* Pinecone
* Gemini API
* Clerk
* LangChain

---

## ⭐ Future Improvements

* ATS integrations
* Bias detection tools
* Multi-language resume support
* AI interview analysis
* Candidate outreach automation
* Advanced recruiter analytics

---

SmartHire AI — intelligent recruitment screening for modern hiring teams.
