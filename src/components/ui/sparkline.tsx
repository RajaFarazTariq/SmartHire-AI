// Decorative sparkline waves used at the bottom of stat/KPI cards (admin
// dashboard + candidate portal). Purely visual — stretched to the card width
// via preserveAspectRatio="none" and coloured via `currentColor`, so the
// caller sets the accent with a text-{color} class on a wrapping element.

const WAVES = [
  "M0,22 C12,14 20,14 32,19 C44,24 56,9 68,13 C80,17 90,22 100,15",
  "M0,15 C12,21 22,8 36,12 C50,16 58,25 72,19 C86,14 94,9 100,13",
  "M0,20 C10,12 22,23 34,17 C48,10 58,21 70,15 C84,9 92,17 100,11",
];

export function Sparkline({ index, id }: { index: number; id: string }) {
  const line = WAVES[index % WAVES.length];
  const area = `${line} L100,32 L0,32 Z`;
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
