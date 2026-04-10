import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: "up" | "down";
}

export function SummaryCard({ title, value, icon, trend }: SummaryCardProps) {
  return (
    <div className="bg-[var(--color-surface-panel)] border border-[var(--color-surface-border)] rounded-2xl p-5 shadow-sm transition-all hover:border-slate-600 hover:shadow-md flex flex-col gap-3 group">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">{title}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 border border-slate-700/50 group-hover:bg-slate-800 transition-colors">{icon}</div>
      </div>
      <div className="flex items-end gap-2 mt-auto">
        <p className="text-2xl font-black tracking-tight text-white">{value}</p>
        {trend && (
          <span
            className={`text-sm font-bold mb-1 ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}
