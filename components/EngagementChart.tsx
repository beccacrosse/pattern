"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics/engagement";

export function EngagementChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    ratePct: d.rate === null ? null : d.rate * 100,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (Number.isNaN(n)) return "";
              return `${n.toFixed(2)}%`;
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line type="monotone" dataKey="ratePct" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
