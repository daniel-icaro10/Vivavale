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
  color = "oklch(0.545 0.155 277 / 0.5)",
}: MetricSparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="w-full">
      <p className="mb-1.5 vl-eyebrow">{label}</p>
      <ResponsiveContainer width="100%" height={48}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis domain={[0, 10]} hide />
          <Line
            type="basis"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
