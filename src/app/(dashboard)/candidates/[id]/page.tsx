import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "../actions";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);

  if (!candidate) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/candidates" className="text-sm text-blue-600 hover:underline">
          ← Back to candidates
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {candidate.fullName ?? candidate.filename}
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          {candidate.fileType.toUpperCase()} · {candidate.status} · uploaded{" "}
          {candidate.uploadedAt.toLocaleString()}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 rounded-md border border-gray-200 p-4 text-sm">
        <Field label="Email" value={candidate.email} />
        <Field label="Phone" value={candidate.phone} />
        <Field label="Current title" value={candidate.currentTitle} />
        <Field
          label="Experience"
          value={
            candidate.yearsExperience != null
              ? `${candidate.yearsExperience} years`
              : null
          }
        />
        <Field label="Education" value={candidate.educationLevel} />
        <Field
          label="File"
          value={
            <a
              href={candidate.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {candidate.filename}
            </a>
          }
        />
      </section>

      {candidate.extractedSkills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Extracted skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {candidate.extractedSkills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Extracted text
        </h2>
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-xs text-gray-800">
          {candidate.rawText}
        </pre>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}
