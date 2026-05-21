import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  ArrowRight,
  Brain,
  BarChart3,
  FileSearch,
  UploadCloud,
  Users,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, FadeInOnMount } from "@/components/motion";

const features = [
  {
    icon: UploadCloud,
    title: "Bulk resume upload",
    desc: "Drag-and-drop dozens of PDF or DOCX resumes at once. We extract clean text from every file automatically.",
  },
  {
    icon: Brain,
    title: "AI skill extraction",
    desc: "Gemini parses each resume into structured data — skills, experience, education, and work history.",
  },
  {
    icon: FileSearch,
    title: "Semantic matching",
    desc: "Vector embeddings compare candidates to your job description by meaning, not just keywords.",
  },
  {
    icon: BarChart3,
    title: "Explainable scores",
    desc: "Every candidate gets a transparent composite score across semantic fit, skills, and experience.",
  },
  {
    icon: Users,
    title: "Ranked shortlists",
    desc: "Instantly see your top candidates per role, with matched and missing skills surfaced at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    desc: "Your data is scoped to your account with authenticated, protected access on every route.",
  },
];

const steps = [
  {
    n: "01",
    title: "Post a job",
    desc: "Describe the role and list required and preferred skills.",
  },
  {
    n: "02",
    title: "Upload resumes",
    desc: "Drop in candidate resumes — we parse and structure them.",
  },
  {
    n: "03",
    title: "Review the ranking",
    desc: "Get an explainable, ranked shortlist in seconds.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/docs">Docs</Link>
            </Button>
            <SignedOut>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]" />
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <FadeInOnMount>
              <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
                <Sparkles className="size-3.5 text-primary" />
                AI-powered candidate screening
              </Badge>
            </FadeInOnMount>
            <FadeInOnMount delay={0.08}>
              <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
                Screen resumes in seconds, not hours
              </h1>
            </FadeInOnMount>
            <FadeInOnMount delay={0.16}>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
                SmartHire AI extracts skills, scores candidates, and ranks them
                against your job descriptions with explainable, AI-driven match
                scores — so you can focus on the best people.
              </p>
            </FadeInOnMount>
            <FadeInOnMount delay={0.24}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <SignedOut>
                  <Button asChild size="xl" className="w-full sm:w-auto">
                    <Link href="/sign-up">
                      Get started free <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                    <Link href="/docs">Read the docs</Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild size="xl" className="w-full sm:w-auto">
                    <Link href="/dashboard">
                      Go to dashboard <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>
            </FadeInOnMount>
            <FadeInOnMount delay={0.32}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" /> PDF & DOCX support
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" /> Explainable scoring
                </span>
              </div>
            </FadeInOnMount>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to hire smarter
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete screening pipeline, from raw resume to ranked shortlist.
            </p>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <Card className="group h-full transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-3">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </span>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Three steps from job post to ranked candidates.
              </p>
            </FadeIn>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <FadeIn key={s.n} delay={i * 0.1}>
                  <div className="relative">
                    <span className="text-5xl font-bold text-primary/20">
                      {s.n}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(255,255,255,0.18),transparent)]" />
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to find your best candidates?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                Start screening resumes with AI today. Set up your first job in
                under a minute.
              </p>
              <div className="mt-8 flex justify-center">
                <SignedOut>
                  <Button asChild size="xl" variant="secondary">
                    <Link href="/sign-up">
                      Create your account <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild size="xl" variant="secondary">
                    <Link href="/dashboard">
                      Open dashboard <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Brand />
          <p className="text-sm text-muted-foreground">
            Built as a portfolio project demonstrating AI/ML + full-stack.
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
