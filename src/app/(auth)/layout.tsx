import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Brand } from "@/components/brand";

const highlights = [
  "Bulk PDF & DOCX resume parsing",
  "AI skill extraction with Gemini",
  "Explainable candidate match scores",
  "Ranked shortlists per job",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_30%_0%,rgba(255,255,255,0.18),transparent)]" />
        <Brand href="/" className="relative text-primary-foreground" />
        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold tracking-tight">
            Screen resumes in seconds, not hours.
          </h2>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-primary-foreground/90">
                <CheckCircle2 className="size-5 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          SmartHire AI — intelligent recruitment screening.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back home
          </Link>
          <div className="lg:hidden">
            <Brand href="/" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
