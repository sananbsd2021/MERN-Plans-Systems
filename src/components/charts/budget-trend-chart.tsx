"use client"

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const data = [
  { month: "Jan", budget: 4000, spent: 2400 },
  { month: "Feb", budget: 3000, spent: 1398 },
  { month: "Mar", budget: 2000, spent: 9800 },
  { month: "Apr", budget: 2780, spent: 3908 },
  { month: "May", budget: 1890, spent: 4800 },
  { month: "Jun", budget: 2390, spent: 3800 },
  { month: "Jul", budget: 3490, spent: 4300 },
]

export function BudgetTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `฿${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          }}
          itemStyle={{ fontSize: "12px" }}
        />
        <Area
          type="monotone"
          dataKey="budget"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#colorBudget)"
        />
        <Area
          type="monotone"
          dataKey="spent"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorSpent)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
