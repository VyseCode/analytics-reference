type Point = { label: string; value: number };

const WIDTH = 600;
const HEIGHT = 180;
const TOP = 8;
const BOTTOM = 28;
const LEFT = 8;

export function BarChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((point) => point.value));
  const slot = data.length > 0 ? (WIDTH - LEFT * 2) / data.length : 0;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-48 w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <line
        x1={LEFT}
        y1={HEIGHT - BOTTOM}
        x2={WIDTH - LEFT}
        y2={HEIGHT - BOTTOM}
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      {data.map((point, index) => {
        const height = (point.value / max) * (HEIGHT - BOTTOM - TOP);
        const x = LEFT + index * slot + slot * 0.15;
        const y = HEIGHT - BOTTOM - height;
        return (
          <g key={`${point.label}-${index}`}>
            <rect
              x={x}
              y={y}
              width={Math.max(1, slot * 0.7)}
              height={point.value > 0 ? Math.max(height, 2) : 0}
              rx={2}
              fill="#4f46e5"
            />
            {(index % labelEvery === 0 || index === data.length - 1) && (
              <text
                x={x + slot * 0.35}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={10}
                fill="#64748b"
              >
                {point.label}
              </text>
            )}
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((point) => point.value));
  const slot = data.length > 1 ? (WIDTH - LEFT * 2) / (data.length - 1) : 0;
  const points = data.map((point, index) => ({
    x: LEFT + index * slot,
    y: HEIGHT - BOTTOM - (point.value / max) * (HEIGHT - BOTTOM - TOP),
    label: point.label,
    value: point.value,
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-48 w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <line
        x1={LEFT}
        y1={HEIGHT - BOTTOM}
        x2={WIDTH - LEFT}
        y2={HEIGHT - BOTTOM}
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      {points.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r={3} fill="#4f46e5" />
          {(index % labelEvery === 0 || index === data.length - 1) && (
            <text
              x={point.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
            >
              {point.label}
            </text>
          )}
          <title>{`${point.label}: ${point.value}`}</title>
        </g>
      ))}
    </svg>
  );
}
