import Link from "next/link";
import { getUserCandidates } from "./actions";

export default async function CandidatesPage() {
  const candidates = await getUserCandidates();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <Link
          href="/upload"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Upload resumes
        </Link>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">No candidates yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Upload resumes to start building your candidate pool.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {candidates.map((c) => (
            <li key={c.id}>
              <Link
                href={`/candidates/${c.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-medium text-gray-900">
                    {c.fullName ?? c.filename}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {c.uploadedAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {c.fileType.toUpperCase()} · {c.status}
                  {c.currentTitle ? ` · ${c.currentTitle}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
