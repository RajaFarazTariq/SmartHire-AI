"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
  FileText,
  Upload,
  Download,
  Linkedin,
  Github,
  Globe,
  Link2,
  Sparkles,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExperienceEntry, EducationEntry } from "@/lib/candidate";
import { validateName } from "@/lib/validators/name";
import type { ProfileExtractionData } from "@/lib/validators/profile-extraction";
import {
  updateProfileAction,
  uploadResumeAction,
  type ProfileInput,
} from "@/app/portal/profile/actions";

type Props = {
  identity: { name: string; email: string };
  initial: ProfileInput;
  resume: { name: string | null; type: string | null };
};

export function ProfileForm({ identity, initial, resume }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initial.fullName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [headline, setHeadline] = useState(initial.headline);
  const [location, setLocation] = useState(initial.location);
  const [phone, setPhone] = useState(initial.phone);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [certifications, setCertifications] = useState<string[]>(
    initial.certifications,
  );
  const [certDraft, setCertDraft] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    initial.experience,
  );
  const [education, setEducation] = useState<EducationEntry[]>(
    initial.education,
  );
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl);
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl);

  // AI auto-fill: parsed resume awaiting the user's review.
  const [parsed, setParsed] = useState<ProfileExtractionData | null>(null);

  function addToList(
    raw: string,
    list: string[],
    setList: (v: string[]) => void,
    clear: () => void,
  ) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (!list.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setList([...list, value]);
    }
    clear();
  }

  function listKeyHandler(
    draft: string,
    list: string[],
    setList: (v: string[]) => void,
    setDraft: (v: string) => void,
  ) {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addToList(draft, list, setList, () => setDraft(""));
      } else if (e.key === "Backspace" && !draft && list.length) {
        setList(list.slice(0, -1));
      }
    };
  }

  async function handleSave() {
    const check = validateName(fullName);
    if (!check.ok) {
      setNameError(check.error);
      toast.error(check.error);
      return;
    }
    setNameError(null);
    setPending(true);
    const res = await updateProfileAction({
      fullName: check.value,
      headline,
      location,
      phone,
      bio,
      skills,
      certifications,
      experience,
      education,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      websiteUrl,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Profile saved");
      router.push("/portal");
    } else {
      if (res.error) setNameError(res.error);
      toast.error(res.error ?? "Could not save profile");
    }
  }

  async function handleResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadResumeAction(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      toast.error(res.error ?? "Upload failed");
      return;
    }
    if (res.parsed) {
      setParsed(res.parsed);
      toast.success("Resume uploaded — review the details we found below");
    } else {
      toast.success("Resume updated");
      if (res.parseFailed) {
        toast.info("We couldn't auto-read this resume — fill in your details manually.");
      }
    }
    router.refresh();
  }

  // Apply a reviewed subset of the parsed resume into the form state. Only the
  // fields the user kept are passed in; existing values are never touched
  // unless explicitly included here.
  function applyAutofill(picked: AutofillSelection) {
    if (picked.fullName !== undefined) setFullName(picked.fullName);
    if (picked.headline !== undefined) setHeadline(picked.headline);
    if (picked.location !== undefined) setLocation(picked.location);
    if (picked.phone !== undefined) setPhone(picked.phone);
    if (picked.bio !== undefined) setBio(picked.bio);
    if (picked.skills) setSkills(picked.skills);
    if (picked.certifications) setCertifications(picked.certifications);
    if (picked.experience) setExperience(picked.experience);
    if (picked.education) setEducation(picked.education);
    if (picked.linkedinUrl !== undefined) setLinkedinUrl(picked.linkedinUrl);
    if (picked.githubUrl !== undefined) setGithubUrl(picked.githubUrl);
    if (picked.portfolioUrl !== undefined) setPortfolioUrl(picked.portfolioUrl);
    if (picked.websiteUrl !== undefined) setWebsiteUrl(picked.websiteUrl);
    setParsed(null);
    setNameError(null);
    toast.success("Applied — review everything, then Save changes");
  }

  return (
    <div className="space-y-6">
      {/* AI auto-fill review */}
      {parsed && (
        <AutofillReview
          parsed={parsed}
          current={{
            fullName,
            headline,
            location,
            phone,
            bio,
            skills,
            certifications,
            experience,
            education,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            websiteUrl,
          }}
          onApply={applyAutofill}
          onDismiss={() => setParsed(null)}
        />
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError(null);
              }}
              onBlur={() => {
                if (!fullName.trim()) return;
                const c = validateName(fullName);
                setNameError(c.ok ? null : c.error);
              }}
              aria-invalid={nameError ? true : undefined}
              className={cn(nameError && "border-rose-500 focus-visible:ring-rose-500")}
              placeholder="Your full name"
            />
            {nameError && (
              <p className="text-xs text-rose-500">{nameError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={identity.email} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Primary resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleResume}
            className="hidden"
          />
          {resume.name ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{resume.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(resume.type ?? "").toUpperCase()}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href="/api/portal/profile-resume" target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Replace"
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload resume (PDF/DOCX)
            </Button>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            We&apos;ll read your resume and offer to fill in your profile — you
            review everything before it&apos;s applied.
          </p>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="e.g. Senior Frontend Engineer"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">About</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="A short summary about your experience and goals…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1500}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 font-normal">
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            placeholder="Type a skill and press Enter"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={listKeyHandler(skillDraft, skills, setSkills, setSkillDraft)}
            onBlur={() => addToList(skillDraft, skills, setSkills, () => setSkillDraft(""))}
          />
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4" /> Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1 font-normal">
                  {c}
                  <button
                    type="button"
                    onClick={() =>
                      setCertifications(certifications.filter((x) => x !== c))
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            placeholder="e.g. AWS Certified Solutions Architect — press Enter"
            value={certDraft}
            onChange={(e) => setCertDraft(e.target.value)}
            onKeyDown={listKeyHandler(
              certDraft,
              certifications,
              setCertifications,
              setCertDraft,
            )}
            onBlur={() =>
              addToList(certDraft, certifications, setCertifications, () =>
                setCertDraft(""),
              )
            }
          />
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Experience</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setExperience([
                ...experience,
                { title: "", company: "", period: "", description: "" },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No experience added yet.
            </p>
          )}
          {experience.map((exp, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Role {i + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setExperience(experience.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Job title"
                  value={exp.title}
                  onChange={(e) =>
                    setExperience(
                      experience.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) =>
                    setExperience(
                      experience.map((x, j) =>
                        j === i ? { ...x, company: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
              <Input
                placeholder="Period (e.g. 2021 – Present)"
                value={exp.period}
                onChange={(e) =>
                  setExperience(
                    experience.map((x, j) =>
                      j === i ? { ...x, period: e.target.value } : x,
                    ),
                  )
                }
              />
              <Textarea
                rows={2}
                placeholder="What you worked on…"
                value={exp.description}
                onChange={(e) =>
                  setExperience(
                    experience.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Education</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setEducation([
                ...education,
                { school: "", degree: "", period: "" },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No education added yet.
            </p>
          )}
          {education.map((ed, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Entry {i + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEducation(education.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="School"
                  value={ed.school}
                  onChange={(e) =>
                    setEducation(
                      education.map((x, j) =>
                        j === i ? { ...x, school: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Degree"
                  value={ed.degree}
                  onChange={(e) =>
                    setEducation(
                      education.map((x, j) =>
                        j === i ? { ...x, degree: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
              <Input
                placeholder="Period (e.g. 2016 – 2020)"
                value={ed.period}
                onChange={(e) =>
                  setEducation(
                    education.map((x, j) =>
                      j === i ? { ...x, period: e.target.value } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" /> Links
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="linkedin" className="flex items-center gap-1.5">
              <Linkedin className="size-3.5" /> LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="github" className="flex items-center gap-1.5">
              <Github className="size-3.5" /> GitHub
            </Label>
            <Input
              id="github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portfolio" className="flex items-center gap-1.5">
              <Globe className="size-3.5" /> Portfolio
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website" className="flex items-center gap-1.5">
              <Globe className="size-3.5" /> Website
            </Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={pending}
          size="lg"
          className="shadow-lg"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="size-4" /> Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI auto-fill review
// ---------------------------------------------------------------------------

type CurrentValues = {
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  bio: string;
  skills: string[];
  certifications: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
};

type AutofillSelection = Partial<{
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  bio: string;
  skills: string[];
  certifications: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}>;

type ScalarKey =
  | "fullName"
  | "headline"
  | "location"
  | "phone"
  | "bio"
  | "linkedinUrl"
  | "githubUrl"
  | "portfolioUrl"
  | "websiteUrl";

const SCALAR_LABELS: Record<ScalarKey, string> = {
  fullName: "Name",
  headline: "Headline",
  location: "Location",
  phone: "Phone",
  bio: "About / summary",
  linkedinUrl: "LinkedIn",
  githubUrl: "GitHub",
  portfolioUrl: "Portfolio",
  websiteUrl: "Website",
};

function AutofillReview({
  parsed,
  current,
  onApply,
  onDismiss,
}: {
  parsed: ProfileExtractionData;
  current: CurrentValues;
  onApply: (picked: AutofillSelection) => void;
  onDismiss: () => void;
}) {
  // Map the parsed payload onto the profile's field names.
  const scalarSuggestions: { key: ScalarKey; value: string; blocked?: string }[] =
    [];

  function pushScalar(key: ScalarKey, value: string | null) {
    const v = (value ?? "").trim();
    if (!v) return;
    if (key === "fullName") {
      const check = validateName(v);
      scalarSuggestions.push({
        key,
        value: check.ok ? check.value : v,
        blocked: check.ok ? undefined : "Couldn't verify this as a real name",
      });
      return;
    }
    scalarSuggestions.push({ key, value: v });
  }

  pushScalar("fullName", parsed.fullName);
  pushScalar("headline", parsed.headline);
  pushScalar("location", parsed.location);
  pushScalar("phone", parsed.phone);
  pushScalar("bio", parsed.summary);
  pushScalar("linkedinUrl", parsed.linkedinUrl);
  pushScalar("githubUrl", parsed.githubUrl);
  pushScalar("portfolioUrl", parsed.portfolioUrl);
  pushScalar("websiteUrl", parsed.websiteUrl);

  const newSkills = parsed.skills.filter(
    (s) => !current.skills.some((x) => x.toLowerCase() === s.toLowerCase()),
  );
  const newCerts = parsed.certifications.filter(
    (c) => !current.certifications.some((x) => x.toLowerCase() === c.toLowerCase()),
  );
  const parsedExperience: ExperienceEntry[] = parsed.experience
    .filter((e) => e.title || e.company)
    .map((e) => ({
      title: e.title,
      company: e.company,
      period: e.period,
      description: e.description,
    }));
  const parsedEducation: EducationEntry[] = parsed.education
    .filter((e) => e.school || e.degree)
    .map((e) => ({ school: e.school, degree: e.degree, period: e.period }));

  // Selection state. Default ON when the current field is empty (safe fill);
  // default OFF when it already has a value (no silent overwrite).
  const initialChecked: Record<string, boolean> = {};
  for (const s of scalarSuggestions) {
    initialChecked[s.key] = !s.blocked && !current[s.key].trim();
  }
  if (newSkills.length) initialChecked.skills = true;
  if (newCerts.length) initialChecked.certifications = true;
  if (parsedExperience.length)
    initialChecked.experience = current.experience.length === 0;
  if (parsedEducation.length)
    initialChecked.education = current.education.length === 0;

  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const toggle = (k: string) =>
    setChecked((p) => ({ ...p, [k]: !p[k] }));

  const nothingToShow =
    scalarSuggestions.length === 0 &&
    newSkills.length === 0 &&
    newCerts.length === 0 &&
    parsedExperience.length === 0 &&
    parsedEducation.length === 0;

  function apply() {
    const picked: AutofillSelection = {};
    for (const s of scalarSuggestions) {
      if (checked[s.key] && !s.blocked) {
        (picked[s.key] as string) = s.value;
      }
    }
    if (checked.skills && newSkills.length) {
      picked.skills = [...current.skills, ...newSkills];
    }
    if (checked.certifications && newCerts.length) {
      picked.certifications = [...current.certifications, ...newCerts];
    }
    if (checked.experience && parsedExperience.length) {
      // Append to anything the user already entered (never discard their work).
      picked.experience = [...current.experience, ...parsedExperience];
    }
    if (checked.education && parsedEducation.length) {
      picked.education = [...current.education, ...parsedEducation];
    }
    onApply(picked);
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> Found in your resume
        </CardTitle>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {nothingToShow ? (
          <p className="text-sm text-muted-foreground">
            We read your resume but couldn&apos;t confidently pull out new
            details. Your existing profile is unchanged — feel free to fill
            things in manually.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Tick what you want to use. Fields you already filled are left
              unticked so nothing is overwritten without your say-so. Nothing is
              saved until you press <strong>Save changes</strong>.
            </p>

            <div className="space-y-1.5">
              {scalarSuggestions.map((s) => {
                const hasCurrent = current[s.key].trim().length > 0;
                return (
                  <ReviewRow
                    key={s.key}
                    disabled={Boolean(s.blocked)}
                    checked={Boolean(checked[s.key])}
                    onToggle={() => toggle(s.key)}
                    label={SCALAR_LABELS[s.key]}
                    value={s.value}
                    note={
                      s.blocked
                        ? s.blocked
                        : hasCurrent
                          ? "Will replace your current value"
                          : undefined
                    }
                  />
                );
              })}

              {newSkills.length > 0 && (
                <ReviewRow
                  checked={Boolean(checked.skills)}
                  onToggle={() => toggle("skills")}
                  label="Skills"
                  value={`Add ${newSkills.length}: ${newSkills.slice(0, 8).join(", ")}${
                    newSkills.length > 8 ? "…" : ""
                  }`}
                />
              )}
              {newCerts.length > 0 && (
                <ReviewRow
                  checked={Boolean(checked.certifications)}
                  onToggle={() => toggle("certifications")}
                  label="Certifications"
                  value={`Add ${newCerts.length}: ${newCerts.slice(0, 6).join(", ")}${
                    newCerts.length > 6 ? "…" : ""
                  }`}
                />
              )}
              {parsedExperience.length > 0 && (
                <ReviewRow
                  checked={Boolean(checked.experience)}
                  onToggle={() => toggle("experience")}
                  label="Experience"
                  value={`Add ${parsedExperience.length} role${
                    parsedExperience.length === 1 ? "" : "s"
                  }: ${parsedExperience
                    .map((e) => [e.title, e.company].filter(Boolean).join(" @ "))
                    .slice(0, 3)
                    .join("; ")}`}
                  note={
                    current.experience.length > 0
                      ? "Added alongside your existing roles"
                      : undefined
                  }
                />
              )}
              {parsedEducation.length > 0 && (
                <ReviewRow
                  checked={Boolean(checked.education)}
                  onToggle={() => toggle("education")}
                  label="Education"
                  value={`Add ${parsedEducation.length} entr${
                    parsedEducation.length === 1 ? "y" : "ies"
                  }: ${parsedEducation
                    .map((e) => [e.degree, e.school].filter(Boolean).join(", "))
                    .slice(0, 3)
                    .join("; ")}`}
                  note={
                    current.education.length > 0
                      ? "Added alongside your existing entries"
                      : undefined
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Cancel
              </Button>
              <Button size="sm" onClick={apply}>
                <Sparkles className="size-4" /> Apply selected
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewRow({
  checked,
  onToggle,
  label,
  value,
  note,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  value: string;
  note?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card px-3 py-2 text-sm",
        disabled ? "opacity-60" : "cursor-pointer hover:bg-accent/40",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block break-words">{value}</span>
        {note && (
          <span
            className={cn(
              "mt-0.5 block text-[11px]",
              disabled ? "text-rose-500" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {note}
          </span>
        )}
      </span>
    </label>
  );
}
