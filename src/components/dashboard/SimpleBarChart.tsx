import { useMemo } from "react";

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  return (
    <div className="flex items-end justify-between h-40 gap-2 mt-4 pt-4 border-t border-slate-700 w-full overflow-x-auto pb-6">
      {data.map((item, index) => {
        const heightPercent = `${(item.value / maxValue) * 100}%`;
        return (
          <div
            key={index}
            className="flex flex-col items-center flex-1 min-w-[40px] gap-2"
          >
            <div
              className="w-full bg-blue-600 rounded-t-sm transition-all duration-300 hover:bg-blue-500 relative group"
              style={{
                height: heightPercent,
                minHeight: item.value > 0 ? "4px" : "1px",
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-xs px-2 py-1 rounded text-white whitespace-nowrap z-10 pointer-events-none transition-opacity">
                Rp {new Intl.NumberFormat("id-ID").format(item.value)}
              </div>
            </div>
            <span className="text-xs text-slate-400 rotate-45 origin-top-left translate-y-2 whitespace-nowrap">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
