import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Clock,
} from "lucide-react";

import {
  getCandidate,
  getCandidateScores,
  getCandidateNotes,
} from "../actions";
import { ExtractButton } from "../extract-button";
import { StageSelect } from "../stage-select";
import { MatchHistory } from "../match-history";
import { NotesPanel } from "../notes-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeViewer } from "@/components/resume-viewer";

function statusVariant(status: string) {
  if (status === "ready") return "success" as const;
  if (status === "error") return "destructive" as const;
  return "warning" as const;
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [candidate, scores, rawNotes] = await Promise.all([
    getCandidate(id),
    getCandidateScores(id),
    getCandidateNotes(id),
  ]);

  if (!candidate) {
    notFound();
  }

  const notes = rawNotes.map((n) => ({
    id: n.id,
    body: n.body,
    createdAt: n.createdAt,
    author: n.user.fullName ?? n.user.username ?? n.user.email.split("@")[0],
  }));

  const fileUrl = `/api/candidates/${candidate.id}/file`;
  const facts = [
    { icon: Mail, label: "Email", value: candidate.email },
    { icon: Phone, label: "Phone", value: candidate.phone },
    { icon: Briefcase, label: "Current title", value: candidate.currentTitle },
    {
      icon: Clock,
      label: "Experience",
      value:
        candidate.yearsExperience != null
          ? `${candidate.yearsExperience} years`
          : null,
    },
    { icon: GraduationCap, label: "Education", value: candidate.educationLevel },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/candidates"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to candidates
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {candidate.fullName ?? candidate.filename}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {candidate.fileType.toUpperCase()} · uploaded{" "}
              {candidate.uploadedAt.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StageSelect candidateId={candidate.id} stage={candidate.stage} />
          <Badge variant={statusVariant(candidate.status)}>
            {candidate.status}
          </Badge>
          <ExtractButton candidateId={candidate.id} status={candidate.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resume preview */}
        <div className="lg:col-span-2">
          <ResumeViewer
            fileType={candidate.fileType}
            fileName={candidate.filename}
            fileUrl={fileUrl}
            height={620}
          />
        </div>

        {/* Profile facts + skills */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {facts.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {f.label}
                      </p>
                      <p className="break-words text-sm">
                        {f.value ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.extractedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.extractedSkills.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills extracted yet. Run AI extraction to populate.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {scores.length > 0 ? (
          <MatchHistory scores={scores} />
        ) : (
          <div className="hidden lg:block" />
        )}
        <NotesPanel candidateId={candidate.id} notes={notes} />
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                <span>Extracted text</span>
                <span className="text-xs text-muted-foreground group-open:hidden">
                  Show
                </span>
                <span className="hidden text-xs text-muted-foreground group-open:inline">
                  Hide
                </span>
              </summary>
              <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed text-foreground">
                {candidate.rawText}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
