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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExperienceEntry, EducationEntry } from "@/lib/candidate";
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

  const [headline, setHeadline] = useState(initial.headline);
  const [location, setLocation] = useState(initial.location);
  const [phone, setPhone] = useState(initial.phone);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [skillDraft, setSkillDraft] = useState("");
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

  function addSkill(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (!skills.includes(value)) setSkills([...skills, value]);
    setSkillDraft("");
  }

  function onSkillKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillDraft);
    } else if (e.key === "Backspace" && !skillDraft && skills.length) {
      setSkills(skills.slice(0, -1));
    }
  }

  async function handleSave() {
    setPending(true);
    const res = await updateProfileAction({
      headline,
      location,
      phone,
      bio,
      skills,
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
    if (res.ok) {
      toast.success("Resume updated");
      router.refresh();
    } else {
      toast.error(res.error ?? "Upload failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={identity.name} disabled />
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
          <CardTitle className="text-base">Primary resume</CardTitle>
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
            onKeyDown={onSkillKey}
            onBlur={() => addSkill(skillDraft)}
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
