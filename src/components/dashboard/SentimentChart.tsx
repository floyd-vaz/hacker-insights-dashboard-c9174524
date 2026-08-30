import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, type DailySentiment } from "@/data/mockData";

function GlassTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload as DailySentiment;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm shadow-[0_20px_50px_-20px_rgba(0,0,0,1)]">
      <p className="font-display font-semibold">{formatDate(point.date)}</p>
      <p className="mt-1.5 flex items-center justify-between gap-6 text-muted-foreground">
        Score
        <span
          className="font-display font-semibold tabular-nums"
          style={{ color: point.score >= 0 ? "var(--positive)" : "var(--negative)" }}
        >
          {point.score > 0 ? "+" : ""}
          {point.score.toFixed(3)}
        </span>
      </p>
      <p className="flex items-center justify-between gap-6 text-muted-foreground">
        Posts <span className="font-display font-semibold text-foreground">{point.posts}</span>
      </p>
    </div>
  );
}

export function SentimentChart({ data, height = 300 }: { data: DailySentiment[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--violet-glow)" stopOpacity={0.55} />
              <stop offset="55%" stopColor="var(--cyan-glow)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--cyan-glow)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
          />
          <YAxis
            domain={[-1, 1]}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            content={<GlassTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--primary)"
            strokeWidth={2.2}
            fill="url(#sentimentFill)"
            activeDot={{
              r: 5,
              fill: "var(--primary)",
              stroke: "rgba(255,255,255,0.85)",
              strokeWidth: 2,
            }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
