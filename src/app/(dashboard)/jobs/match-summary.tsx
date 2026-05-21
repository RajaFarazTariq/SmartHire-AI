import { CheckCircle2, AlertTriangle } from "lucide-react";

import { matchSummarySchema } from "@/lib/validators/extraction";

function parse(raw: string) {
  try {
    return matchSummarySchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Old summaries were stored as markdown-ish prose; strip the noisiest tokens
// so the fallback still reads cleanly.
function cleanLegacy(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

export function MatchSummary({ summary }: { summary: string }) {
  const data = parse(summary);

  if (!data) {
    return (
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {cleanLegacy(summary)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      {data.overview && (
        <p className="text-sm leading-relaxed text-foreground">{data.overview}</p>
      )}

      {data.strengths.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.gaps.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
            Gaps
          </h4>
          <ul className="space-y-1.5">
            {data.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
