import Link from "next/link";
import { Briefcase, UserRound, ArrowRight } from "lucide-react";

const options = [
  {
    type: "candidate",
    title: "I'm looking for a job",
    desc: "Browse roles, apply with your resume, and track your application status.",
    icon: UserRound,
    tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    type: "recruiter",
    title: "I'm hiring",
    desc: "Post jobs, screen resumes with AI, and manage your candidate pipeline.",
    icon: Briefcase,
    tile: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export default function JoinPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          How do you plan to use SmartHire AI?
        </p>
      </div>

      <div className="space-y-3">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <Link
              key={o.type}
              href={`/api/role?type=${o.type}`}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm hover:shadow-primary/10"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${o.tile}`}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {o.desc}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
