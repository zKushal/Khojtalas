import type { ReactNode } from "react";

type Accent = "cyan" | "magenta" | "white";

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  accent?: Accent;
  description?: string;
}

const accentClass: Record<Accent, string> = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  white: "text-white",
};

export default function MetricsCard({
  title,
  value,
  icon,
  accent = "white",
  description,
}: MetricsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-silver/60">{title}</span>
        <span className={accentClass[accent]}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${accentClass[accent]}`}>{value}</p>
      {description && (
        <p className="mt-1 text-[11px] text-silver/50">{description}</p>
      )}
    </div>
  );
}
