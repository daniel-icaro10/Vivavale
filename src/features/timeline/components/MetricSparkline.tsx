"use client";

import { useId } from "react";
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

// Extrai a cor oklch sem o modificador de opacidade
// "oklch(0.545 0.155 277 / 0.45)" → "oklch(0.545 0.155 277)"
function extractBaseColor(color: string): string {
  return color.includes("/") ? color.replace(/\s*\/[^)]*\)/, ")") : color;
}

export function MetricSparkline({
  data,
  label,
  color = "oklch(0.545 0.155 277)",
}: MetricSparklineProps) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `spark-grad-${uid}`;

  if (data.length < 2) return null;

  const baseColor = extractBaseColor(color);

  return (
    <div className="w-full">
      <p className="mb-2 vl-eyebrow">{label}</p>
      {/* mask-fade-x cria fade suave nas bordas — sensação de traço que some */}
      <div className="relative mask-fade-x">
        <ResponsiveContainer width="100%" height={44}>
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 6, left: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={baseColor} stopOpacity={0.05} />
                <stop offset="25%"  stopColor={baseColor} stopOpacity={0.38} />
                <stop offset="75%"  stopColor={baseColor} stopOpacity={0.38} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 10]} hide />
            <Line
              type="basis"
              dataKey="value"
              stroke={`url(#${gradientId})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive
              animationDuration={1400}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
