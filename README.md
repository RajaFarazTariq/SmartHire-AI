# AI Resume Screening & Recruitment System

An AI-powered recruitment platform that automatically parses resumes, extracts candidate insights using NLP, and ranks applicants against job descriptions with explainable multi-signal scoring.

Built with modern full-stack technologies including Next.js 15, TypeScript, Gemini AI, Pinecone, PostgreSQL, and Tailwind CSS.

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

## 📌 Development Roadmap

### ✅ Phase 1 — Project Setup

* Next.js 15 + TypeScript setup
* Tailwind CSS configuration
* Project structure initialization

### 🔐 Phase 2 — Authentication

* Clerk authentication
* Protected routes
* User sessions

### 🗄 Phase 3 — Database & ORM

* PostgreSQL setup
* Prisma schema & migrations

### 📄 Phase 4 — Job Management

* Job CRUD operations
* Job detail pages

### 📤 Phase 5 — Resume Upload

* Bulk file upload
* PDF/DOCX parsing
* Blob storage integration

### 🤖 Phase 6 — AI Extraction

* Structured resume parsing
* Skill extraction
* Embedding generation

### 📊 Phase 7 — Candidate Ranking

* Semantic similarity scoring
* Composite AI ranking
* AI-generated recruiter summaries

### 📈 Phase 8 — Recruiter Dashboard

* Ranked candidate tables
* Filtering & analytics
* Skill-gap visualization

### 👤 Phase 9 — Candidate Profiles

* Resume viewer
* Match history
* Candidate details

### ✨ Phase 10 — Production Polish

* Mobile responsiveness
* Dark mode
* CSV export
* Performance optimization

---

## 🔒 Security & Privacy

* Environment variables protected via `.env.local`
* Secure authentication using Clerk
* Scoped recruiter-based data access
* Resume file isolation and protected storage

⚠️ Never commit secrets or API keys to GitHub.

---

## 📊 Free-Tier Friendly

This project is designed to run entirely on free-tier services:

* Gemini API
* Pinecone
* Neon PostgreSQL
* Vercel Hosting
* Clerk Authentication

Estimated monthly cost: **$0**

---

## 🎯 Why This Project Matters

This project demonstrates:

* AI/ML integration in real-world workflows
* NLP & semantic search
* Vector databases & embeddings
* Full-stack architecture
* Modern recruiter-focused UX
* Explainable AI systems

It is designed as a production-grade portfolio project for AI Engineering, Data Science, Full-Stack Development, and ML roles.

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

Built with ❤️ using AI + Full-Stack Engineering.
