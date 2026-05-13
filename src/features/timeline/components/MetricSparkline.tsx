"use client";

import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface SparkPoint {
  date: string;
  value: number;
}

interface MetricSparklineProps {
  data: SparkPoint[];
  label: string;
  color?: string;
}

export function MetricSparkline({
  data,
  label,
  color = "oklch(0.545 0.155 277)",
}: MetricSparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="w-full">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[0, 10]} hide />
          <Line
            type="basis"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
