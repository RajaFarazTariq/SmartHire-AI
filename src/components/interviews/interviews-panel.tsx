"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarPlus,
  CalendarClock,
  Video,
  MapPin,
  Users,
  Sparkles,
  Loader2,
  Star,
  Trash2,
  ChevronDown,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  INTERVIEW_TYPES,
  INTERVIEW_STATUSES,
  INTERVIEW_STATUS_STYLES,
  RECOMMENDATIONS,
  RECOMMENDATION_STYLES,
  meetingProvider,
  type AIQuestionGroup,
  type InterviewType,
} from "@/lib/interview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  scheduleInterviewAction,
  updateInterviewAction,
  updateInterviewStatusAction,
  deleteInterviewAction,
  generateQuestionsAction,
  submitFeedbackAction,
  summarizePanelAction,
  type OrgMember,
  type getCandidateInterviews,
} from "@/app/(dashboard)/interviews/actions";
import type { PanelSummaryData } from "@/lib/validators/interview";

type Interview = Awaited<ReturnType<typeof getCandidateInterviews>>[number];

function fmt(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewsPanel({
  candidateId,
  candidateName,
  interviews,
  jobOptions,
  orgMembers,
  currentUserId,
  currentUserRole,
  isAdmin,
  defaultJobId,
  rounds,
}: {
  candidateId: string;
  candidateName: string;
  interviews: Interview[];
  jobOptions: { id: string; title: string }[];
  orgMembers: OrgMember[];
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
  defaultJobId?: string;
  rounds: InterviewType[];
}) {
  const memberMap = new Map(orgMembers.map((m) => [m.id, m.name]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {interviews.length === 0
            ? "No interviews scheduled."
            : `${interviews.length} interview${interviews.length === 1 ? "" : "s"}`}
        </p>
        <ScheduleSheet
          candidateId={candidateId}
          candidateName={candidateName}
          jobOptions={jobOptions}
          orgMembers={orgMembers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          defaultJobId={defaultJobId}
          rounds={rounds}
        />
      </div>

      {interviews.map((iv) => (
        <InterviewCard
          key={iv.id}
          interview={iv}
          memberMap={memberMap}
          orgMembers={orgMembers}
          rounds={rounds}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

const ROLE_ADMIN_STR = "org:admin";

function panelEligible(
  members: OrgMember[],
  currentUserId: string,
  currentUserRole: string,
): OrgMember[] {
  // Recruiters and managers can always be assigned to a panel. Other admins
  // never can. An admin scheduler additionally sees themselves, so they can
  // assign the interview to recruiters/managers and optionally join the panel.
  if (currentUserRole === ROLE_ADMIN_STR) {
    return members.filter(
      (m) => m.role !== ROLE_ADMIN_STR || m.id === currentUserId,
    );
  }
  return members.filter((m) => m.role !== ROLE_ADMIN_STR);
}

function PanelPicker({
  members,
  selectedIds,
  onToggle,
  currentUserId,
  currentUserRole,
}: {
  members: OrgMember[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  currentUserId: string;
  currentUserRole: string;
}) {
  const eligible = panelEligible(members, currentUserId, currentUserRole);
  return (
    <div className="space-y-1.5">
      <Label>Panel</Label>
      <p className="text-xs text-muted-foreground">
        {currentUserRole === ROLE_ADMIN_STR
          ? "Assign one or more recruiters or managers to conduct this interview — you can include yourself too."
          : "Admins can't be added to interview panels."}
      </p>
      {eligible.length === 0 ? (
        <p className="text-xs text-muted-foreground">No eligible interviewers.</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
          {eligible.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(m.id)}
                onChange={() => onToggle(m.id)}
              />
              <span className="truncate">{m.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleSheet({
  candidateId,
  candidateName,
  jobOptions,
  orgMembers,
  currentUserId,
  currentUserRole,
  defaultJobId,
  rounds,
}: {
  candidateId: string;
  candidateName: string;
  jobOptions: { id: string; title: string }[];
  orgMembers: OrgMember[];
  currentUserId: string;
  currentUserRole: string;
  defaultJobId?: string;
  rounds: InterviewType[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [jobId, setJobId] = useState(defaultJobId ?? jobOptions[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState(45);
  const [type, setType] = useState<string>(rounds[0] ?? INTERVIEW_TYPES[0]);
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [interviewerIds, setInterviewerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function toggleInterviewer(id: string) {
    setInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit() {
    if (!jobId) return toast.error("Select a job");
    if (!scheduledAt) return toast.error("Pick a date and time");
    setPending(true);
    const res = await scheduleInterviewAction({
      candidateId,
      jobId,
      scheduledAt,
      durationMins,
      type,
      meetingLink,
      location,
      interviewerIds,
      notes,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Interview scheduled");
      setOpen(false);
      setScheduledAt("");
      setMeetingLink("");
      setNotes("");
      setInterviewerIds([]);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not schedule");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" disabled={jobOptions.length === 0}>
          <CalendarPlus className="size-4" /> Schedule
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Schedule interview</SheetTitle>
          <p className="text-sm text-muted-foreground">{candidateName}</p>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-1.5">
            <Label>Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobOptions.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Meeting link (Zoom / Google Meet)</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input
              placeholder="Office, room, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <PanelPicker
            members={orgMembers}
            selectedIds={interviewerIds}
            onToggle={toggleInterviewer}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Scheduling…
              </>
            ) : (
              "Schedule interview"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InterviewCard({
  interview,
  memberMap,
  orgMembers,
  rounds,
  currentUserId,
  currentUserRole,
  isAdmin,
}: {
  interview: Interview;
  memberMap: Map<string, string>;
  orgMembers: OrgMember[];
  rounds: InterviewType[];
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [genPending, setGenPending] = useState(false);
  const [summary, setSummary] = useState<PanelSummaryData | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);

  const questions = (
    Array.isArray(interview.aiQuestions) ? interview.aiQuestions : []
  ) as unknown as AIQuestionGroup[];
  const totalQuestions = questions.reduce(
    (sum, g) => sum + (g.questions?.length ?? 0),
    0,
  );
  const myFeedback = interview.feedback.find((f) => f.interviewerId === currentUserId);
  // Conduct gate — keep in sync with src/lib/interview-access.ts canConductInterview.
  // Legacy interviews with empty panels fall back to the original scheduler.
  const canConduct =
    interview.interviewerIds.length > 0
      ? interview.interviewerIds.includes(currentUserId)
      : interview.createdById === currentUserId;

  function changeStatus(status: string) {
    startTransition(async () => {
      const res = await updateInterviewStatusAction(interview.id, status);
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Failed");
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteInterviewAction(interview.id);
      if (res.ok) {
        toast.success("Interview removed");
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  async function generate() {
    setGenPending(true);
    const res = await generateQuestionsAction(interview.id);
    setGenPending(false);
    if (res.ok) {
      toast.success("Questions generated");
      router.refresh();
    } else toast.error(res.error ?? "Failed");
  }

  async function summarize() {
    setSummarizing(true);
    const res = await summarizePanelAction(interview.id);
    setSummarizing(false);
    if (res.ok && res.summary) setSummary(res.summary);
    else toast.error(res.error ?? "Failed");
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{interview.type}</span>
            <Badge
              className={cn(
                "border-0",
                INTERVIEW_STATUS_STYLES[interview.status] ?? "",
              )}
            >
              {interview.status}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3.5" /> {fmt(interview.scheduledAt)} ·{" "}
              {interview.durationMins}m
            </span>
            <span className="truncate">for {interview.job.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {canConduct ? (
            <Select value={interview.status} onValueChange={changeStatus}>
              <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span
              className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
              title="View-only — you're not on this interview's panel."
            >
              View only
            </span>
          )}
          {canConduct && (
            <EditInterviewSheet
              interview={interview}
              orgMembers={orgMembers}
              rounds={rounds}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          )}
          {isAdmin && (
            <button
              onClick={remove}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rose-500"
              aria-label="Delete interview"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {interview.meetingLink && (
          <Button asChild size="sm" variant="outline" className="h-7">
            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
              <Video className="size-3.5" /> Join {meetingProvider(interview.meetingLink)}
            </a>
          </Button>
        )}
        {interview.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {interview.location}
          </span>
        )}
        {interview.interviewerIds.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {interview.interviewerIds.map((id) => memberMap.get(id) ?? "Member").join(", ")}
          </span>
        )}
      </div>

      {interview.notes && (
        <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs">{interview.notes}</p>
      )}

      {/* AI questions */}
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => questions.length > 0 && setQuestionsOpen((v) => !v)}
            disabled={questions.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground disabled:cursor-default"
            aria-expanded={questionsOpen}
          >
            <Sparkles className="size-3.5 text-primary" />
            AI interview questions
            {questions.length > 0 && (
              <>
                <span className="text-muted-foreground">
                  ({totalQuestions})
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform",
                    questionsOpen && "rotate-180",
                  )}
                />
              </>
            )}
          </button>
          {canConduct && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={generate}
              disabled={genPending}
            >
              {genPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : questions.length > 0 ? (
                "Regenerate"
              ) : (
                "Generate"
              )}
            </Button>
          )}
        </div>
        {questions.length > 0 && questionsOpen && (
          <div className="mt-2 space-y-2">
            {questions.map((g, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {g.category}
                </p>
                <ul className="ml-4 list-disc text-xs">
                  {g.questions.map((q, j) => (
                    <li key={j} className="mt-0.5">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">
            Scorecards ({interview.feedback.length})
          </p>
          {canConduct && interview.feedback.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={summarize}
              disabled={summarizing}
            >
              {summarizing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-3.5" /> AI summary
                </>
              )}
            </Button>
          )}
        </div>

        {summary && (
          <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <p className="font-semibold">
              Panel consensus: {summary.recommendation}
            </p>
            <p className="mt-1 text-muted-foreground">{summary.summary}</p>
          </div>
        )}

        <div className="mt-2 space-y-2">
          {interview.feedback.map((f) => (
            <div key={f.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {memberMap.get(f.interviewerId) ?? "Interviewer"}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 tabular-nums">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {f.rating}/5
                  </span>
                  <Badge
                    className={cn("border-0", RECOMMENDATION_STYLES[f.recommendation] ?? "")}
                  >
                    {f.recommendation}
                  </Badge>
                </span>
              </div>
              {f.strengths && <p className="mt-1"><b>Strengths:</b> {f.strengths}</p>}
              {f.concerns && <p className="mt-0.5"><b>Concerns:</b> {f.concerns}</p>}
              {f.comments && <p className="mt-0.5 text-muted-foreground">{f.comments}</p>}
            </div>
          ))}
        </div>

        {canConduct ? (
          <FeedbackForm interviewId={interview.id} existing={myFeedback} />
        ) : (
          <p className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
            You're not on this panel — viewing scorecards only.
          </p>
        )}
      </div>
    </div>
  );
}

function FeedbackForm({
  interviewId,
  existing,
}: {
  interviewId: string;
  existing?: Interview["feedback"][number];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 4);
  const [recommendation, setRecommendation] = useState(
    existing?.recommendation ?? RECOMMENDATIONS[1],
  );
  const [strengths, setStrengths] = useState(existing?.strengths ?? "");
  const [concerns, setConcerns] = useState(existing?.concerns ?? "");
  const [comments, setComments] = useState(existing?.comments ?? "");

  async function submit() {
    setPending(true);
    const res = await submitFeedbackAction(interviewId, {
      rating,
      recommendation,
      strengths,
      concerns,
      comments,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Feedback saved");
      setOpen(false);
      router.refresh();
    } else toast.error(res.error ?? "Failed");
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-2 h-7"
        onClick={() => setOpen(true)}
      >
        <ChevronDown className="size-3.5" />
        {existing ? "Edit your scorecard" : "Add your scorecard"}
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Rating (1-5)</Label>
          <Select
            value={String(rating)}
            onValueChange={(v) => setRating(Number(v))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Recommendation</Label>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECOMMENDATIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Textarea
        rows={2}
        placeholder="Strengths"
        value={strengths}
        onChange={(e) => setStrengths(e.target.value)}
      />
      <Textarea
        rows={2}
        placeholder="Concerns"
        value={concerns}
        onChange={(e) => setConcerns(e.target.value)}
      />
      <Textarea
        rows={2}
        placeholder="Additional comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending} className="h-8">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// datetime-local needs YYYY-MM-DDTHH:mm in the user's local time (not UTC).
function toLocalInput(d: Date | string) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function EditInterviewSheet({
  interview,
  orgMembers,
  rounds,
  currentUserId,
  currentUserRole,
}: {
  interview: Interview;
  orgMembers: OrgMember[];
  rounds: InterviewType[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(interview.scheduledAt),
  );
  const [durationMins, setDurationMins] = useState(interview.durationMins);
  const [type, setType] = useState<string>(interview.type);
  const [meetingLink, setMeetingLink] = useState(interview.meetingLink ?? "");
  const [location, setLocation] = useState(interview.location ?? "");
  const [interviewerIds, setInterviewerIds] = useState<string[]>(
    interview.interviewerIds,
  );
  const [notes, setNotes] = useState(interview.notes ?? "");

  function toggleInterviewer(id: string) {
    setInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit() {
    if (!scheduledAt) return toast.error("Pick a date and time");
    setPending(true);
    const res = await updateInterviewAction(interview.id, {
      scheduledAt,
      durationMins,
      type,
      meetingLink,
      location,
      interviewerIds,
      notes,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Interview updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not update");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Edit interview"
          title="Edit interview"
        >
          <Pencil className="size-3.5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit interview</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Update timing, panel, or the meeting link.
          </p>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Meeting link (Zoom / Google Meet)</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Candidate will be notified when this is added or changed.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input
              placeholder="Office, room, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <PanelPicker
            members={orgMembers}
            selectedIds={interviewerIds}
            onToggle={toggleInterviewer}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
