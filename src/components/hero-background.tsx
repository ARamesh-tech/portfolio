/**
 * Decorative "data pipeline" backdrop — nodes connected by flowing edges.
 * Pure SVG + CSS animation, no JS.
 */
export function HeroBackground() {
  const nodes: [number, number][] = [
    [40, 60],
    [180, 30],
    [320, 90],
    [470, 40],
    [620, 110],
    [760, 50],
    [120, 190],
    [280, 220],
    [440, 180],
    [600, 230],
    [740, 170],
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [0, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [2, 7],
    [3, 8],
    [4, 9],
    [5, 10],
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <svg
        viewBox="0 0 800 260"
        className="absolute -top-6 right-0 h-auto w-[min(100%,900px)] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        fill="none"
      >
        {edges.map(([a, b], i) => {
          const [x1, y1] = nodes[a]!;
          const [x2, y2] = nodes[b]!;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--accent)"
              strokeOpacity={0.35}
              strokeWidth={1}
              strokeDasharray="4 8"
              className="animate-flow"
              style={{ animationDelay: `${(i % 5) * -0.7}s` }}
            />
          );
        })}
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={10} fill="var(--accent)" fillOpacity={0.08} />
            <circle
              cx={x}
              cy={y}
              r={3}
              fill="var(--accent)"
              className="animate-pulse-dot origin-center"
              style={{ animationDelay: `${(i % 4) * 0.5}s`, transformBox: "fill-box" }}
            />
          </g>
        ))}
      </svg>
      <div className="absolute -top-40 -right-20 size-[480px] rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute top-1/2 -left-40 size-[360px] rounded-full bg-warm/10 blur-3xl" />
    </div>
  );
}
