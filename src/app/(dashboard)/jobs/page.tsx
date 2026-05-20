import Link from "next/link";
import { getUserJobs } from "./actions";

export default async function JobsPage() {
  const jobs = await getUserJobs();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-600">No jobs yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first job posting to start screening candidates.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="block px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-medium text-gray-900">{job.title}</h2>
                  <span className="text-xs text-gray-500">
                    {job.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {job.company && (
                  <p className="text-sm text-gray-600">{job.company}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {job.requiredSkills.length} required skill
                  {job.requiredSkills.length === 1 ? "" : "s"}
                  {job.minExperience != null
                    ? ` · ${job.minExperience}+ yrs experience`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
