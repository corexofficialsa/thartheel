"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Series = { key: string; label: string; color: string };

export function MonthlyComparisonChart({
  data,
  seriesA,
  seriesB,
}: {
  data: Record<string, string | number>[];
  seriesA: Series;
  seriesB: Series;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--card-foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Bar dataKey={seriesA.key} name={seriesA.label} fill={seriesA.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey={seriesB.key} name={seriesB.label} fill={seriesB.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
