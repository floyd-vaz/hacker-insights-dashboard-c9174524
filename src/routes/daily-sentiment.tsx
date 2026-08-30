import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api, formatDate, type DailySentiment } from "@/data/mockData";
import { useEndpoint } from "@/hooks/useEndpoint";
import {
  ChartSkeleton,
  CountUp,
  EmptyState,
  ErrorState,
  GlassCard,
  LiveBadge,
  SectionHeading,
} from "@/components/dashboard/primitives";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

export const Route = createFileRoute("/daily-sentiment")({
  head: () => ({
    meta: [
      { title: "Daily Sentiment Trend — Signal.hn" },
      {
        name: "description",
        content:
          "Day-by-day Hacker News sentiment trend for AI companies, with post volume and hoverable data points.",
      },
      { property: "og:title", content: "Daily Sentiment Trend — Signal.hn" },
      {
        property: "og:description",
        content: "Day-by-day sentiment trend and post volume for AI company threads.",
      },
    ],
  }),
  component: DailySentimentPage,
});

function DailySentimentPage() {
  const [days, setDays] = useState<number>(30);
  const { data, loading, error, refresh, updatedAt } = useEndpoint<DailySentiment[]>(
    () => api.getDailySentiment(days),
    [days],
  );

  const series = data ?? [];
  const best = series.length ? series.reduce((a, b) => (b.score > a.score ? b : a)) : null;
  const worst = series.length ? series.reduce((a, b) => (b.score < a.score ? b : a)) : null;
  const mean = series.length ? series.reduce((s, d) => s + d.score, 0) / series.length : 0;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Daily sentiment"
        subtitle="Mean score per day, −1.00 (hostile) to +1.00 (glowing)."
        action={<LiveBadge updatedAt={updatedAt} onRefresh={refresh} refreshing={loading} />}
      />

      <div
        className="glass inline-flex rounded-full p-1"
        role="group"
        aria-label="Select time range"
      >
        {RANGES.map((r) => (
          <button
            key={r.label}
            type="button"
            aria-pressed={days === r.days}
            onClick={() => setDays(r.days)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              days === r.days
                ? "border border-white/15 bg-white/10 text-foreground shadow-[0_0_28px_-10px_var(--violet-glow)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : series.length === 0 ? (
        <EmptyState
          title="No sentiment recorded"
          description="There are no analysed threads in this window yet."
        />
      ) : (
        <>
          <GlassCard className="p-4 sm:p-6">
            <SentimentChart data={series} height={340} />
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <Mini label="Window mean" value={mean} decimals={3} />
            <Mini
              label={`Best day · ${best ? formatDate(best.date) : "—"}`}
              value={best?.score ?? 0}
              decimals={3}
            />
            <Mini
              label={`Worst day · ${worst ? formatDate(worst.date) : "—"}`}
              value={worst?.score ?? 0}
              decimals={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Mini({ label, value, decimals }: { label: string; value: number; decimals: number }) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className="mt-2 font-display text-2xl font-semibold tabular-nums"
        style={{ color: value >= 0 ? "var(--positive)" : "var(--negative)" }}
      >
        <CountUp value={value} decimals={decimals} prefix={value > 0 ? "+" : ""} />
      </p>
    </GlassCard>
  );
}
