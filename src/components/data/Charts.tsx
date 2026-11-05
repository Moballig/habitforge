"use client";

import { useId } from "react";

/** Calorie ring — receives numbers as props; never computes health values. */
export function CalorieRing({
  eatenLow,
  eatenHigh,
  targetLow,
  targetHigh,
  size = 160,
  animate = false,
}: {
  eatenLow: number;
  eatenHigh: number;
  targetLow: number;
  targetHigh: number;
  size?: number;
  animate?: boolean;
}) {
  const id = useId();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const max = Math.max(targetHigh * 1.25, eatenHigh, 1);
  const mid = Math.min(eatenHigh / max, 1);
  const low = Math.min(eatenLow / max, 1);
  const targetPct = Math.min(targetHigh / max, 1);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Eaten ${Math.round(eatenLow)}–${Math.round(eatenHigh)} of guide ${Math.round(targetLow)}–${Math.round(targetHigh)} kcal`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        {/* target notch */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={stroke}
          strokeDasharray={`${targetPct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
          strokeDasharray={`${low * circ} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={animate ? "anim-ring" : ""}
          style={animate ? ({ ["--ring-circ" as string]: String(circ) } as React.CSSProperties) : undefined}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(mid - low) * circ} ${circ}`}
          strokeDashoffset={-low * circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.9}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span id={id} className="font-num text-3xl font-extrabold tabular">
          {Math.round(eatenLow)}–{Math.round(eatenHigh)}
        </span>
        <span className="text-xs font-semibold opacity-80">kcal</span>
      </div>
    </div>
  );
}

/** Smooth area chart — hand-written SVG. */
export function AreaChart({
  data,
  secondaryData,
  target,
  labels,
  width = 560,
  height = 140,
  highlightIndex,
  animate = false,
}: {
  data: number[];
  secondaryData?: number[];
  target?: number;
  labels?: string[];
  width?: number;
  height?: number;
  highlightIndex?: number;
  animate?: boolean;
}) {
  if (data.length === 0) return null;
  const aria = labels?.length
    ? `Trend chart, ${labels[0]} to ${labels[labels.length - 1]}`
    : "Trend chart";
  const max = Math.max(...data, target ?? 0) * 1.15;
  const min = 0;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const pts = data.map((v, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padY + innerH - ((v - min) / (max - min || 1)) * innerH;
    return [x, y] as const;
  });
  const path = pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${height - padY} L ${pts[0][0]} ${height - padY} Z`;
  const hi = highlightIndex != null ? pts[highlightIndex] : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${animate ? "anim-chart" : ""}`}
      role="img"
      aria-label={aria}
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {target != null && (
        <line
          x1={padX}
          x2={width - padX}
          y1={padY + innerH - (target / (max || 1)) * innerH}
          y2={padY + innerH - (target / (max || 1)) * innerH}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="4 4"
        />
      )}
      <path d={area} fill="url(#areaFill)" />
      <path d={path} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      {secondaryData && secondaryData.length === data.length && (
        <path
          d={secondaryData
            .map((v, i) => {
              const x = padX + (i / Math.max(secondaryData.length - 1, 1)) * innerW;
              const y = padY + innerH - ((v - min) / (max - min || 1)) * innerH;
              if (i === 0) return `M ${x} ${y}`;
              const px = padX + ((i - 1) / Math.max(secondaryData.length - 1, 1)) * innerW;
              const py = padY + innerH - ((secondaryData[i - 1] - min) / (max - min || 1)) * innerH;
              const cx = (px + x) / 2;
              return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="var(--accent, #10b981)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      )}
      {hi && (
        <>
          <circle cx={hi[0]} cy={hi[1]} r="8" fill="rgba(255,255,255,0.9)" />
          <circle cx={hi[0]} cy={hi[1]} r="4" fill="var(--coral)" />
        </>
      )}
    </svg>
  );
}

/** Weight Trend Chart (A9): 7-day smoothed trend is the thick primary line; raw weigh-ins are smaller dots. */
export function WeightTrendChart({
  rawWeights,
  smoothedWeights,
  labels,
  noiseTags,
  width = 560,
  height = 160,
}: {
  rawWeights: number[];
  smoothedWeights: number[];
  labels?: string[];
  noiseTags?: (string | undefined)[];
  width?: number;
  height?: number;
}) {
  const id = useId();
  if (rawWeights.length === 0 && smoothedWeights.length === 0) return null;

  const allVals = [...rawWeights, ...smoothedWeights].filter((v) => Number.isFinite(v) && v > 0);
  if (allVals.length === 0) return null;

  const minVal = Math.floor(Math.min(...allVals) - 0.6);
  const maxVal = Math.ceil(Math.max(...allVals) + 0.6);
  const valSpan = Math.max(maxVal - minVal, 1);

  const padX = 24;
  const padTop = 16;
  const padBottom = 26;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const smoothPts = smoothedWeights.map((v, i) => {
    const x = padX + (i / Math.max(smoothedWeights.length - 1, 1)) * innerW;
    const y = padTop + innerH - ((v - minVal) / valSpan) * innerH;
    return [x, y] as const;
  });

  const smoothPath = smoothPts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = smoothPts[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    })
    .join(" ");

  const area = smoothPts.length > 0
    ? `${smoothPath} L ${smoothPts[smoothPts.length - 1][0]} ${padTop + innerH} L ${smoothPts[0][0]} ${padTop + innerH} Z`
    : "";

  const rawPts = rawWeights.map((v, i) => {
    const x = padX + (i / Math.max(rawWeights.length - 1, 1)) * innerW;
    const y = padTop + innerH - ((v - minVal) / valSpan) * innerH;
    const tag = noiseTags?.[i];
    const hasNoise = Boolean(tag && tag !== "none");
    return { x, y, v, hasNoise, tag, label: labels?.[i] };
  });

  // Calculate 3 grid guide ticks
  const midVal = (minVal + maxVal) / 2;
  const ticks = [minVal, Math.round(midVal * 10) / 10, maxVal];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full select-none"
      role="img"
      aria-label="Weight trend: 7-day smoothed line with raw weigh-in dots"
    >
      <defs>
        <linearGradient id={`weightAreaFill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--violet, #5b3e9e)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--violet, #5b3e9e)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines & ticks */}
      {ticks.map((tick, i) => {
        const y = padTop + innerH - ((tick - minVal) / valSpan) * innerH;
        return (
          <g key={i}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--border, #e4e2ee)"
              strokeOpacity="0.6"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={padX - 4}
              y={y + 3.5}
              textAnchor="end"
              className="fill-ink/40 text-[9px] font-semibold tabular"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Smoothed trend area */}
      {area && <path d={area} fill={`url(#weightAreaFill-${id})`} />}

      {/* 7-day smoothed trend line: thick primary line (A9) */}
      {smoothPath && (
        <path
          d={smoothPath}
          fill="none"
          stroke="var(--violet, #5b3e9e)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Raw weigh-in dots: smaller dots (A9) */}
      {rawPts.map((pt, i) => (
        <g key={i}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={pt.hasNoise ? 4 : 3}
            fill={pt.hasNoise ? "var(--turmeric, #e9a23b)" : "var(--surface, #ffffff)"}
            stroke={pt.hasNoise ? "var(--turmeric, #e9a23b)" : "var(--ink, #1e1a2e)"}
            strokeWidth="1.75"
          />
        </g>
      ))}

      {/* First and Last x-axis labels */}
      {labels && labels.length > 0 && (
        <>
          <text
            x={padX}
            y={height - 8}
            textAnchor="start"
            className="fill-ink/50 text-[10px] font-medium"
          >
            {labels[0]}
          </text>
          {labels.length > 2 && (
            <text
              x={width / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-ink/40 text-[10px] font-medium"
            >
              {labels[Math.floor(labels.length / 2)]}
            </text>
          )}
          <text
            x={width - padX}
            y={height - 8}
            textAnchor="end"
            className="fill-ink/50 text-[10px] font-medium"
          >
            {labels[labels.length - 1]}
          </text>
        </>
      )}
    </svg>
  );
}

/** Semicircle gauge (ref 4). */
export function SemiGauge({
  value,
  max,
  label,
  valueLabel,
  size = 180,
}: {
  value: number;
  max: number;
  label?: string;
  valueLabel?: string;
  size?: number;
}) {
  const pct = Math.min(Math.max(value / (max || 1), 0), 1);
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r; // half circle
  return (
    <div className="flex flex-col items-center">
      {label && <p className="mb-1 text-xs font-semibold text-ink/50">{label}</p>}
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`} role="img" aria-label={`${label ?? ""} ${valueLabel ?? value}`}>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--surface-soft)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--violet)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${pct * circ} ${circ}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className="font-num text-2xl font-extrabold tabular">
            {valueLabel ?? value}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Bar-range chart (ref 2 health overview). */
export function BarRangeChart({
  days,
  values,
  targets,
  highlightToday,
}: {
  days: string[];
  values: number[];
  targets?: number[];
  highlightToday?: boolean;
}) {
  const max = Math.max(...values, ...(targets ?? [0]), 1) * 1.1;
  return (
    <div className="flex items-end gap-2" role="img" aria-label="Weekly intake vs guide">
      {values.map((v, i) => {
        const h = (v / max) * 100;
        const th = targets ? (targets[i] / max) * 100 : null;
        return (
          <div key={days[i] + i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex h-24 w-full items-end justify-center gap-0.5">
              {th != null && (
                <div
                  className="w-1.5 rounded-full bg-surface-soft"
                  style={{ height: `${th}%` }}
                />
              )}
              <div
                className={`w-2 rounded-full ${highlightToday && i === values.length - 1 ? "bg-blue" : "bg-blue/50"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-ink/45">{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Segmented progress (ref 4). */
export function SegmentedProgress({
  segments,
  filled,
}: {
  segments: number;
  filled: number;
}) {
  return (
    <div className="flex gap-1.5" aria-label={`${filled} of ${segments} complete`}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-violet" : "bg-surface-soft"}`}
        />
      ))}
    </div>
  );
}

/** Tiny sparkline for stat tiles. */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  stroke = "var(--violet)",
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Top-down plate balance — replaces anatomy figure. */
export function PlateBalance({
  veg,
  protein,
  grains,
  other,
  size = 160,
}: {
  veg: number;
  protein: number;
  grains: number;
  other: number;
  size?: number;
}) {
  const total = veg + protein + grains + other || 1;
  const segs = [
    { frac: veg / total, color: "var(--leaf)", label: "Veg" },
    { frac: protein / total, color: "var(--coral)", label: "Protein" },
    { frac: grains / total, color: "var(--turmeric)", label: "Grains" },
    { frac: other / total, color: "var(--blue)", label: "Other" },
  ];
  let acc = 0;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;

  function arc(from: number, to: number) {
    const a0 = from * 2 * Math.PI - Math.PI / 2;
    const a1 = to * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = to - from > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} role="img" aria-label="Plate balance">
        <circle cx={cx} cy={cy} r={r + 4} fill="var(--surface-soft)" />
        {segs.map((s) => {
          const from = acc;
          acc += s.frac;
          if (s.frac <= 0.001) return null;
          return <path key={s.label} d={arc(from, acc)} fill={s.color} opacity={0.85} />;
        })}
        <circle cx={cx} cy={cy} r={r * 0.35} fill="var(--surface)" />
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-semibold">{s.label}</span>
            <span className="font-num text-ink/50 tabular">{Math.round(s.frac * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
