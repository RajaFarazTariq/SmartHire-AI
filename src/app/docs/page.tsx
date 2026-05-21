import type { Metadata } from "next";

import { DocsSidebar, type DocsTocItem } from "@/components/docs/docs-sidebar";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Docs — SmartHire AI",
  description: "Documentation for the SmartHire AI resume screening platform.",
};

const toc: DocsTocItem[] = [
  { id: "introduction", title: "Introduction" },
  { id: "getting-started", title: "Getting started" },
  { id: "authentication", title: "Authentication" },
  { id: "jobs", title: "Jobs" },
  { id: "resume-upload", title: "Resume upload" },
  { id: "candidates", title: "Candidate profiles" },
  { id: "scoring", title: "Scoring & ranking" },
  { id: "tech-stack", title: "Tech stack" },
  { id: "faq", title: "FAQ" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <DocsSidebar items={toc} />
      </aside>

      <article className="prose-docs min-w-0 max-w-3xl">
        <Section id="introduction" title="Introduction">
          <p className="lead">
            SmartHire AI is an AI-powered recruitment platform that ingests
            resumes, extracts structured candidate data, and ranks candidates
            against your job descriptions with explainable match scores.
          </p>
          <p>
            This documentation covers how the application is structured and how
            each feature works, from posting a job to reviewing a ranked
            shortlist.
          </p>
        </Section>

        <Section id="getting-started" title="Getting started">
          <p>Running the project locally takes two commands:</p>
          <Code>{`npm install\nnpm run dev`}</Code>
          <p>
            Then open{" "}
            <a href="http://localhost:3000" className="link">
              localhost:3000
            </a>
            . The app is a single Next.js project — frontend pages, server
            actions, and database access all run from the same process.
          </p>
          <p>
            Environment variables live in <Mono>.env.local</Mono> (database,
            authentication, AI, and file storage keys). Database commands are
            wrapped so they pick up that file:
          </p>
          <Code>{`npm run db:studio     # browse the database\nnpm run db:migrate    # apply schema changes`}</Code>
        </Section>

        <Section id="authentication" title="Authentication">
          <p>
            Auth is handled by Clerk. Sign-up requires email verification, and
            every dashboard route is protected by middleware — unauthenticated
            visitors are redirected to the sign-in page with a return URL.
          </p>
          <p>
            On first visit to the dashboard, your Clerk account is synced into
            the application database, so all your jobs and candidates are scoped
            privately to you.
          </p>
        </Section>

        <Section id="jobs" title="Jobs">
          <p>
            A <strong>job</strong> represents a role you are hiring for. Create
            one from <Mono>Jobs → New job</Mono> with:
          </p>
          <ul>
            <li>Title and company</li>
            <li>A full job description</li>
            <li>Required skills (used for matching)</li>
            <li>Preferred skills and a minimum experience level</li>
          </ul>
          <p>
            Skills are entered as comma-separated values and stored as a list.
            Each job is private to your account.
          </p>
        </Section>

        <Section id="resume-upload" title="Resume upload">
          <p>
            Upload resumes from the <Mono>Upload</Mono> page by dragging files
            in or browsing. Supported formats:
          </p>
          <ul>
            <li>
              <strong>PDF</strong> — parsed with a PDF text extractor
            </li>
            <li>
              <strong>DOCX</strong> — parsed with Mammoth
            </li>
          </ul>
          <p>
            Files up to 4 MB are accepted. Each upload streams the file to blob
            storage, extracts the plain text, and creates a candidate record
            with a <Badge variant="warning">processing</Badge> status. Multiple
            files upload in parallel, each with its own status.
          </p>
        </Section>

        <Section id="candidates" title="Candidate profiles">
          <p>
            Each candidate has a profile page showing the original file, the
            extracted plain text, and (once skill extraction runs) structured
            fields like name, contact info, current title, years of experience,
            and a list of skills.
          </p>
        </Section>

        <Section id="scoring" title="Scoring & ranking">
          <Badge variant="secondary" className="mb-3">
            Coming soon
          </Badge>
          <p>
            Candidates are scored against a job using a weighted composite of
            three signals:
          </p>
          <Code>{`overallScore =
  0.40 × semanticSimilarity +
  0.40 × skillMatch +
  0.20 × experienceMatch`}</Code>
          <ul>
            <li>
              <strong>Semantic similarity</strong> — cosine similarity between
              resume and job-description embeddings
            </li>
            <li>
              <strong>Skill match</strong> — percentage of required skills found
            </li>
            <li>
              <strong>Experience match</strong> — years of experience vs. the
              role&apos;s requirement
            </li>
          </ul>
        </Section>

        <Section id="tech-stack" title="Tech stack">
          <ul>
            <li>
              <strong>Framework:</strong> Next.js 15 (App Router) + TypeScript
            </li>
            <li>
              <strong>UI:</strong> Tailwind CSS v4, shadcn/ui, Framer Motion
            </li>
            <li>
              <strong>Auth:</strong> Clerk
            </li>
            <li>
              <strong>Database:</strong> PostgreSQL (Neon) via Prisma
            </li>
            <li>
              <strong>AI:</strong> Google Gemini for extraction, Pinecone for
              embeddings
            </li>
            <li>
              <strong>Storage:</strong> Vercel Blob for resume files
            </li>
          </ul>
        </Section>

        <Section id="faq" title="FAQ">
          <p className="font-medium">Is my data private?</p>
          <p>
            Yes. Every query is scoped to your authenticated user — you only see
            your own jobs and candidates.
          </p>
          <p className="mt-4 font-medium">What file types are supported?</p>
          <p>PDF and DOCX, up to 4 MB each.</p>
          <p className="mt-4 font-medium">Why is a candidate stuck on “processing”?</p>
          <p>
            Text extraction completes on upload; the AI skill-extraction step
            that flips status to “ready” is part of an upcoming release.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b py-8 first:pt-0 last:border-0">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a.link]:text-primary [&_a.link]:underline [&_a.link]:underline-offset-4 [&_li]:ml-4 [&_li]:list-disc [&_p.lead]:text-base [&_p.lead]:text-foreground [&_strong]:text-foreground [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
      {children}
    </code>
  );
}
