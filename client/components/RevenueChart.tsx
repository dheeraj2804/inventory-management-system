"use client";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function RevenueChart({
  data,
}: {
  data: { label: string; sales: number; purchases: number }[];
}) {
  return (
    <div className="revenue-chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 230 }}
      >
        <AreaChart
          data={data}
          margin={{ top: 15, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25836c" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#25836c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e9eeeb"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7a8881", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: "#7a8881", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) =>
              v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
            }
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e0e8e3",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) =>
              `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            }
          />
          <Area
            name="Sales"
            type="monotone"
            dataKey="sales"
            stroke="#25836c"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            isAnimationActive={false}
          />
          <Area
            name="Purchases"
            type="monotone"
            dataKey="purchases"
            stroke="#b8a576"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="transparent"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
