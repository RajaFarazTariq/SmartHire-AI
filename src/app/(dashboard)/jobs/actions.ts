"use server";

import { redirect } from "next/navigation";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobInputSchema } from "@/lib/validators/job";

export type CreateJobState = { error: string | null };

export async function createJobAction(
  _prev: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const user = await requireDbUser();

  const parsed = jobInputSchema.safeParse({
    title: formData.get("title"),
    company: formData.get("company"),
    description: formData.get("description"),
    requiredSkills: formData.get("requiredSkills"),
    preferredSkills: formData.get("preferredSkills"),
    minExperience: formData.get("minExperience"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(" · "),
    };
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      requiredSkills: parsed.data.requiredSkills,
      preferredSkills: parsed.data.preferredSkills,
      minExperience: parsed.data.minExperience,
    },
  });

  redirect(`/jobs/${job.id}`);
}

export async function getUserJobs() {
  const user = await requireDbUser();
  return prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJob(id: string) {
  const user = await requireDbUser();
  return prisma.job.findFirst({
    where: { id, userId: user.id },
  });
}
