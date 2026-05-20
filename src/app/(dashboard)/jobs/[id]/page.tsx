import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "../actions";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back to jobs
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
        {job.company && (
          <p className="mt-1 text-gray-600">{job.company}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Created {job.createdAt.toLocaleString()}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Description
        </h2>
        <p className="whitespace-pre-wrap text-gray-800">{job.description}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Required skills
        </h2>
        <SkillBadges skills={job.requiredSkills} tone="required" />
      </section>

      {job.preferredSkills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Preferred skills
          </h2>
          <SkillBadges skills={job.preferredSkills} tone="preferred" />
        </section>
      )}

      {job.minExperience != null && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Minimum experience
          </h2>
          <p className="text-gray-800">{job.minExperience} years</p>
        </section>
      )}
    </div>
  );
}

function SkillBadges({
  skills,
  tone,
}: {
  skills: string[];
  tone: "required" | "preferred";
}) {
  const cls =
    tone === "required"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <span
          key={s}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
