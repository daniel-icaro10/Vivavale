"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
} from "recharts";

interface SparkPoint {
  date: string;
  value: number;
}

interface MetricSparklineProps {
  data: SparkPoint[];
  label: string;
  color?: string;
}

export function MetricSparkline({ data, label, color = "hsl(var(--primary))" }: MetricSparklineProps) {
  if (data.length < 2) return null;

  return (
    <div className="w-full">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <ResponsiveContainer width="100%" height={48}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <YAxis domain={[0, 10]} hide />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              padding: "4px 8px",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value) => [value, label]}
            labelFormatter={(date) => String(date)}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
