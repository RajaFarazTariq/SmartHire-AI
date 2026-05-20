"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createJobAction, type CreateJobState } from "../actions";

const initialState: CreateJobState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create job"}
    </button>
  );
}

export default function NewJobPage() {
  const [state, formAction] = useFormState(createJobAction, initialState);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create job</h1>
        <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back to jobs
        </Link>
      </div>

      <form action={formAction} className="space-y-4">
        <Field label="Title" name="title" required />
        <Field label="Company" name="company" />
        <Field
          label="Description"
          name="description"
          required
          textarea
          rows={6}
        />
        <Field
          label="Required skills"
          name="requiredSkills"
          required
          hint="Comma-separated, e.g. Python, PostgreSQL, REST APIs"
        />
        <Field
          label="Preferred skills"
          name="preferredSkills"
          hint="Comma-separated (optional)"
        />
        <Field
          label="Minimum experience (years)"
          name="minExperience"
          type="number"
          min={0}
          max={50}
        />

        {state.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  textarea,
  rows,
  type,
  min,
  max,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  type?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  const baseClasses =
    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={rows} className={baseClasses} />
      ) : (
        <input
          type={type ?? "text"}
          name={name}
          required={required}
          min={min}
          max={max}
          className={baseClasses}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
