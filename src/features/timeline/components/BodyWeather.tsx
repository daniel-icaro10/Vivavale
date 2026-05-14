import type { WeeklyInsights } from "@/features/insights/types/insights";

interface BodyWeatherData {
  label: string;
  hue: number;
  chroma: number;
  lightness: number;
}

function computeBodyWeather(insights: WeeklyInsights): BodyWeatherData {
  const wellbeing = ((insights.avgMood ?? 5) + (insights.avgSleep ?? 5)) / 2;
  const strain    = ((insights.avgPain ?? 5) + (insights.avgFatigue ?? 5)) / 2;
  const balance   = wellbeing - strain;

  if (balance >= 3 && strain <= 3) {
    return { label: "Semana mais leve", hue: 155, chroma: 0.07, lightness: 0.78 };
  }
  if (strain >= 6.5) {
    return { label: "Corpo mais exigido", hue: 25, chroma: 0.05, lightness: 0.72 };
  }
  if (balance < -1.5) {
    return { label: "Oscilações presentes", hue: 255, chroma: 0.045, lightness: 0.74 };
  }
  if (wellbeing >= 5.5 && strain <= 5) {
    return { label: "Ritmo mais estável", hue: 200, chroma: 0.05, lightness: 0.76 };
  }
  return { label: "Semana com suas variações", hue: 180, chroma: 0.04, lightness: 0.77 };
}

interface BodyWeatherProps {
  insights: WeeklyInsights;
  heightPx?: number;
}

export function BodyWeather({ insights, heightPx = 68 }: BodyWeatherProps) {
  const { label, hue, chroma, lightness } = computeBodyWeather(insights);

  const c1 = `oklch(${lightness} ${chroma} ${hue} / 0.38)`;
  const c2 = `oklch(${(lightness + 0.06).toFixed(2)} ${(chroma * 0.55).toFixed(3)} ${hue + 28} / 0.22)`;
  const c3 = `oklch(${(lightness - 0.06).toFixed(2)} ${(chroma * 0.35).toFixed(3)} ${hue - 22} / 0.14)`;

  return (
    <div className="space-y-2.5">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        aria-hidden="true"
        style={{ height: `${heightPx}px`, background: "oklch(0.975 0.006 84)" }}
      >
        <div
          className="absolute inset-0 vl-breathe"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 18% 65%, ${c1}, transparent 62%),
              radial-gradient(ellipse 65% 85% at 72% 32%, ${c2}, transparent 55%),
              radial-gradient(ellipse 48% 55% at 52% 78%, ${c3}, transparent 48%)
            `,
            filter: "blur(22px)",
            transform: "scale(1.08)",
          }}
        />
      </div>
      <p
        className="px-0.5 text-[12px] text-muted-foreground/45"
        style={{ letterSpacing: "0.01em" }}
        aria-label={`Estado corporal desta semana: ${label}`}
      >
        {label}
      </p>
    </div>
  );
}
