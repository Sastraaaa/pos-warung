import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: "up" | "down";
}

export function SummaryCard({ title, value, icon, trend }: SummaryCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col gap-2">
      <div className="flex items-center justify-between text-slate-400">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && (
          <span
            className={`text-sm font-medium mb-1 ${trend === "up" ? "text-green-500" : "text-red-500"}`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}
