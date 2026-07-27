"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expense.utils";
import type { AnalyticsChartBar } from "@/types";

const ACCENT = {
  needs: "#00FF85",
  wants: "#1E90FF",
  investments: "#FF0099",
} as const;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-white/10 px-4 py-3 shadow-xl"
      style={{ background: "#1a1a1a" }}
    >
      <p className="mb-2 text-xs text-white/60">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="capitalize text-white/80">{entry.name}</span>
          <span className="ml-auto font-semibold text-white">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpendingChart({
  view,
  chartData,
}: {
  view: "daily" | "weekly" | "monthly" | "yearly";
  chartData: AnalyticsChartBar[];
}) {
  return (
    <Card>
      <h2 className="mb-5 text-sm font-semibold text-white/80">
        {view === "weekly" && "Spending by Day"}
        {view === "monthly" && "Spending by Week"}
        {view === "yearly" && "Spending by Month"}
      </h2>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="label"
                tick={{
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                dataKey="needs"
                stackId="a"
                fill={ACCENT.needs}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="wants"
                stackId="a"
                fill={ACCENT.wants}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="investments"
                stackId="a"
                fill={ACCENT.investments}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap gap-4">
            {(["Needs", "Wants", "Investments"] as const).map(
              (name, index) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 text-sm text-white/50"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: [
                        ACCENT.needs,
                        ACCENT.wants,
                        ACCENT.investments,
                      ][index],
                    }}
                  />
                  {name}
                </div>
              ),
            )}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-white/40">
          No chart data for this period
        </div>
      )}
    </Card>
  );
}

export default SpendingChart;
