"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { detectFileType, extractResumeText } from "@/lib/parsers";
import type { ExperienceEntry, EducationEntry } from "@/lib/candidate";
import { validateName, splitName } from "@/lib/validators/name";
import { extractProfileData } from "@/lib/ai/tasks";
import type { ProfileExtractionData } from "@/lib/validators/profile-extraction";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type ProfileInput = {
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

export async function updateProfileAction(
  input: ProfileInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  // Validate + persist the display name (authoritative server-side check).
  const nameCheck = validateName(input.fullName);
  if (!nameCheck.ok) {
    return { ok: false, error: nameCheck.error };
  }
  if (nameCheck.value !== user.fullName) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fullName: nameCheck.value },
    });
    // Best-effort sync back to Clerk so the name stays consistent everywhere.
    try {
      const { firstName, lastName } = splitName(nameCheck.value);
      const client = await clerkClient();
      await client.users.updateUser(user.id, { firstName, lastName });
    } catch (err) {
      console.error("updateProfileAction: Clerk name sync failed:", err);
    }
  }

  const experience = input.experience
    .filter((e) => e.title.trim() || e.company.trim())
    .slice(0, 20);
  const education = input.education
    .filter((e) => e.school.trim() || e.degree.trim())
    .slice(0, 20);

  const data = {
    headline: input.headline.trim() || null,
    location: input.location.trim() || null,
    phone: input.phone.trim() || null,
    bio: input.bio.trim() || null,
    skills: input.skills.map((s) => s.trim()).filter(Boolean).slice(0, 50),
    certifications: input.certifications
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 50),
    experience: experience as unknown as Prisma.InputJsonValue,
    education: education as unknown as Prisma.InputJsonValue,
    linkedinUrl: input.linkedinUrl.trim() || null,
    githubUrl: input.githubUrl.trim() || null,
    portfolioUrl: input.portfolioUrl.trim() || null,
    websiteUrl: input.websiteUrl.trim() || null,
  };

  await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  revalidatePath("/portal/profile");
  revalidatePath("/portal");
  return { ok: true };
}

export type UploadResumeResult = {
  ok: boolean;
  error?: string;
  /** AI-extracted profile fields for review/auto-fill. Absent if parsing failed. */
  parsed?: ProfileExtractionData;
  /** True when the file was stored but AI auto-fill couldn't run. */
  parseFailed?: boolean;
};

export async function uploadResumeAction(
  formData: FormData,
): Promise<UploadResumeResult> {
  const user = await requireDbUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a file." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File too large (max 4 MB)." };
  }
  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return { ok: false, error: "Only PDF and DOCX files are supported." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put(`resumes/profile/${user.id}/${file.name}`, buffer, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || (fileType === "pdf" ? "application/pdf" : undefined),
  });

  await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    update: { resumeUrl: blob.url, resumeName: file.name, resumeType: fileType },
    create: {
      userId: user.id,
      skills: [],
      resumeUrl: blob.url,
      resumeName: file.name,
      resumeType: fileType,
    },
  });

  revalidatePath("/portal/profile");
  revalidatePath("/portal");

  // Best-effort AI auto-fill. The upload itself always succeeds; parsing
  // failures (unreadable file, AI unavailable) just skip auto-fill.
  let parsed: ProfileExtractionData | undefined;
  let parseFailed = false;
  try {
    const rawText = await extractResumeText(buffer, fileType);
    if (rawText.trim().length > 0) {
      parsed = await extractProfileData(rawText);
    } else {
      parseFailed = true;
    }
  } catch (err) {
    console.error("uploadResumeAction: resume parsing failed:", err);
    parseFailed = true;
  }

  return { ok: true, parsed, parseFailed };
}
