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
  CalendarClock,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { STAGE_STYLES } from "@/lib/pipeline";

import {
  getCandidate,
  getCandidateScores,
  getApplicantApplications,
  listCandidateNotes,
} from "../actions";
import {
  getCandidateInterviews,
  getJobOptions,
  getOrgMembers,
  getSuggestedJobId,
  getEnabledRounds,
} from "../../interviews/actions";
import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";
import { availableRounds } from "@/lib/interview";
import { ExtractButton } from "../extract-button";
import { StageSelect } from "../stage-select";
import { MatchHistory } from "../match-history";
import { NotesPanel } from "../notes-panel";
import { InterviewsPanel } from "@/components/interviews/interviews-panel";
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
  const [
    candidate,
    scores,
    notes,
    interviews,
    jobOptions,
    orgMembers,
    ws,
    suggestedJobId,
    enabledRounds,
    applicantApplications,
  ] = await Promise.all([
    getCandidate(id),
    getCandidateScores(id),
    listCandidateNotes(id),
    getCandidateInterviews(id),
    getJobOptions(),
    getOrgMembers(),
    requireWorkspace(),
    getSuggestedJobId(id),
    getEnabledRounds(),
    getApplicantApplications(id),
  ]);

  if (!candidate) {
    notFound();
  }

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

      {/* All applications by this applicant (aggregated profile view) */}
      {applicantApplications.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-primary" /> Applications
                <Badge variant="secondary" className="font-normal">
                  {applicantApplications.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {applicantApplications.map((a) => (
                <Link
                  key={a.candidateId}
                  href={`/candidates/${a.candidateId}`}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/40",
                    a.isCurrent && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.jobTitle}
                      {a.isCurrent && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (viewing)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied {a.appliedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 border-0",
                      (STAGE_STYLES as Record<string, string>)[a.stage] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {a.stage}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interviews */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" /> Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InterviewsPanel
              candidateId={candidate.id}
              candidateName={candidate.fullName ?? candidate.filename}
              interviews={interviews}
              jobOptions={jobOptions}
              orgMembers={orgMembers}
              currentUserId={ws.user.id}
              currentUserRole={ws.role}
              isAdmin={isAdmin(ws.role)}
              defaultJobId={suggestedJobId ?? undefined}
              rounds={availableRounds(enabledRounds)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {scores.length > 0 ? (
          <MatchHistory scores={scores} />
        ) : (
          <div className="hidden lg:block" />
        )}
        <NotesPanel
          candidateId={candidate.id}
          notes={notes}
          orgMembers={orgMembers}
        />
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
