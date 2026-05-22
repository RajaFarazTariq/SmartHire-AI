"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Linkedin,
  Github,
  Globe,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { applyToJobAction } from "@/app/portal/jobs/actions";

const MAX_BYTES = 4 * 1024 * 1024;

export function ApplyForm({
  jobId,
  defaults,
}: {
  jobId: string;
  defaults: { linkedinUrl: string; githubUrl: string; portfolioUrl: string };
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(defaults.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(defaults.githubUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(defaults.portfolioUrl);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) {
      toast.error("Use a PDF or DOCX under 4 MB.");
      return;
    }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_BYTES,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach your resume.");
      return;
    }
    setPending(true);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("coverNote", coverNote);
    fd.set("linkedinUrl", linkedinUrl);
    fd.set("githubUrl", githubUrl);
    fd.set("portfolioUrl", portfolioUrl);

    const res = await applyToJobAction(jobId, fd);
    if (res.ok) {
      toast.success("Application submitted!");
      router.push(`/portal/applications/${res.applicationId}`);
    } else {
      setPending(false);
      toast.error(res.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resume */}
      <div className="space-y-2">
        <Label>
          Resume <span className="text-rose-500">*</span>
        </Label>
        {file ? (
          <Card className="gap-0 p-0">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={pending}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </CardContent>
          </Card>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-input hover:border-primary/40 hover:bg-accent/40",
            )}
          >
            <input {...getInputProps()} />
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-5" />
            </span>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or DOCX, up to 4 MB
            </p>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
            <Linkedin className="size-3.5" /> LinkedIn
          </Label>
          <Input
            id="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="githubUrl" className="flex items-center gap-1.5">
            <Github className="size-3.5" /> GitHub
          </Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/…"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="portfolioUrl" className="flex items-center gap-1.5">
            <Globe className="size-3.5" /> Portfolio / website
          </Label>
          <Input
            id="portfolioUrl"
            type="url"
            placeholder="https://…"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>
      </div>

      {/* Cover note */}
      <div className="space-y-2">
        <Label htmlFor="coverNote">Cover note (optional)</Label>
        <Textarea
          id="coverNote"
          rows={4}
          placeholder="Tell the hiring team why you're a great fit…"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          maxLength={2000}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending || !file}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit application"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          We&apos;ll analyze your resume automatically.
        </p>
      </div>
    </form>
  );
}
