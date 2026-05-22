import { getCandidateContext } from "@/lib/candidate";
import type { ExperienceEntry, EducationEntry } from "@/lib/candidate";
import { PortalHeader } from "@/components/portal/portal-header";
import { ProfileForm } from "@/components/portal/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user, profile } = await getCandidateContext();

  const experience = (
    Array.isArray(profile?.experience) ? profile!.experience : []
  ) as unknown as ExperienceEntry[];
  const education = (
    Array.isArray(profile?.education) ? profile!.education : []
  ) as unknown as EducationEntry[];

  return (
    <div className="mx-auto max-w-3xl">
      <PortalHeader
        title="Your profile"
        description="Keep your details up to date so recruiters see your best self."
      />
      <ProfileForm
        identity={{
          name: user.fullName ?? user.username ?? "",
          email: user.email,
        }}
        initial={{
          headline: profile?.headline ?? "",
          location: profile?.location ?? "",
          phone: profile?.phone ?? "",
          bio: profile?.bio ?? "",
          skills: profile?.skills ?? [],
          experience,
          education,
          linkedinUrl: profile?.linkedinUrl ?? "",
          githubUrl: profile?.githubUrl ?? "",
          portfolioUrl: profile?.portfolioUrl ?? "",
          websiteUrl: profile?.websiteUrl ?? "",
        }}
        resume={{
          name: profile?.resumeName ?? null,
          type: profile?.resumeType ?? null,
        }}
      />
    </div>
  );
}
