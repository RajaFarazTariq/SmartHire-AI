"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { detectFileType } from "@/lib/parsers";
import type { ExperienceEntry, EducationEntry } from "@/lib/candidate";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type ProfileInput = {
  headline: string;
  location: string;
  phone: string;
  bio: string;
  skills: string[];
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

export async function uploadResumeAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
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
  return { ok: true };
}
