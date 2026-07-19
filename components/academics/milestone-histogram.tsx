"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MilestoneHistogram({ data }: { data: { milestone: number; count: number }[] }) {
  if (data.every((d) => d.count === 0)) {
    return <p className="text-sm text-muted-foreground">No milestones recorded yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="milestone"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--card-foreground)",
            fontSize: 12,
          }}
          labelFormatter={(label) => `Milestone ${label}`}
          formatter={(value) => [`${value}`, "Students"]}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
