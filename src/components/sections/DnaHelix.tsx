const RUNG_COLORS = [
  "#2563eb", // blue-600
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#2563eb",
];

/**
 * Stylized double-helix made of two sine-wave strands connected by rungs.
 * Pure SVG so it stays crisp at any size and respects reduced-motion.
 */
export default function DnaHelix({ className }: { className?: string }) {
  const rows = 7;
  const height = 420;
  const width = 120;
  const amplitude = 46;
  const centerX = width / 2;

  const points = Array.from({ length: rows }, (_, i) => {
    const t = i / (rows - 1);
    const y = t * height;
    const phase = t * Math.PI * 2.1;
    const leftX = centerX - Math.sin(phase) * amplitude;
    const rightX = centerX + Math.sin(phase) * amplitude;
    return { y, leftX, rightX };
  });

  const strandPath = (key: "leftX" | "rightX") =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[key].toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={strandPath("leftX")}
        fill="none"
        stroke="#bfdbfe"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d={strandPath("rightX")}
        fill="none"
        stroke="#bfdbfe"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <line
          key={`rung-${i}`}
          x1={p.leftX}
          y1={p.y}
          x2={p.rightX}
          y2={p.y}
          stroke="#dbeafe"
          strokeWidth={1.5}
        />
      ))}
      {points.map((p, i) => (
        <g key={`nodes-${i}`}>
          <circle cx={p.leftX} cy={p.y} r={5} fill={RUNG_COLORS[i % RUNG_COLORS.length]} />
          <circle
            cx={p.rightX}
            cy={p.y}
            r={5}
            fill={RUNG_COLORS[(i + 3) % RUNG_COLORS.length]}
          />
        </g>
      ))}
    </svg>
  );
}
