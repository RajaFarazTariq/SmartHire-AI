import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  Download,
  Linkedin,
  Github,
  Globe,
  Sparkles,
  CalendarClock,
} from "lucide-react";

import { getApplicationDetail, getApplicantInterviews } from "../actions";
import { timeAgo } from "@/lib/activity-meta";
import { STAGE_DESCRIPTIONS, isPipelineStage } from "@/lib/pipeline";
import { PortalHeader } from "@/components/portal/portal-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { ApplicationTimeline } from "@/components/portal/application-timeline";
import { PortalInterviewCard } from "@/components/portal/portal-interview-card";
import { ResumeViewer } from "@/components/resume-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getApplicationDetail(id);
  if (!app) notFound();

  const { job, candidate } = app;
  const interviews = await getApplicantInterviews(candidate.id);
  const stageCopy = isPipelineStage(candidate.stage)
    ? STAGE_DESCRIPTIONS[candidate.stage]
    : "";

  const links = [
    { url: candidate.linkedinUrl, label: "LinkedIn", icon: Linkedin },
    { url: candidate.githubUrl, label: "GitHub", icon: Github },
    { url: candidate.portfolioUrl, label: "Portfolio", icon: Globe },
  ].filter((l) => l.url);

  return (
    <div>
      <Link
        href="/portal/applications"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All applications
      </Link>

      <PortalHeader title={job.title}>
        <StatusBadge stage={candidate.stage} className="px-3 py-1 text-sm" />
      </PortalHeader>

      <p className="-mt-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Building2 className="size-4" /> {job.company ?? "Confidential"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> Applied {timeAgo(app.createdAt)}
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application progress</CardTitle>
            {stageCopy && (
              <p className="text-sm text-muted-foreground">{stageCopy}</p>
            )}
          </CardHeader>
          <CardContent>
            <ApplicationTimeline stage={candidate.stage} />
          </CardContent>
        </Card>

        {/* Submission details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href={`/api/portal/resume/${candidate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {candidate.filename}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {candidate.fileType.toUpperCase()} · view resume
                  </span>
                </span>
                <Download className="size-4 shrink-0 text-muted-foreground" />
              </a>

              {links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {links.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Button
                        key={l.label}
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <a href={l.url!} target="_blank" rel="noopener noreferrer">
                          <Icon className="size-3.5" /> {l.label}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              )}

              {candidate.coverNote && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Cover note
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
                    {candidate.coverNote}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {candidate.extractedSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> Skills detected
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Extracted from your resume by AI.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.extractedSkills.slice(0, 20).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Interviews */}
      {interviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" /> Your interviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviews.map((iv) => (
              <PortalInterviewCard
                key={iv.id}
                interview={{
                  id: iv.id,
                  type: iv.type,
                  status: iv.status,
                  scheduledAt: iv.scheduledAt,
                  durationMins: iv.durationMins,
                  meetingLink: iv.meetingLink,
                  location: iv.location,
                  feedback: iv.feedback[0]?.candidateMessage
                    ? {
                        message: iv.feedback[0].candidateMessage,
                        rating: iv.feedback[0].rating,
                      }
                    : null,
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full resume preview */}
      <div className="mt-6">
        <ResumeViewer
          fileType={candidate.fileType}
          fileName={candidate.filename}
          fileUrl={`/api/portal/resume/${candidate.id}`}
          height={560}
        />
      </div>
    </div>
  );
}
