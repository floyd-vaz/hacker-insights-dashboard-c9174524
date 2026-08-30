import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Gauge, MessagesSquare } from "lucide-react";
import { api, formatDate, type Stats } from "@/data/mockData";
import { useEndpoint } from "@/hooks/useEndpoint";
import {
  CountUp,
  ErrorState,
  FadeIn,
  GlassCard,
  LiveBadge,
  SectionHeading,
  StatSkeleton,
} from "@/components/dashboard/primitives";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Sentiment Stats — Signal.hn" },
      {
        name: "description",
        content:
          "Headline sentiment statistics for AI companies on Hacker News: volume analysed, mean score, distribution and per-company breakdown.",
      },
      { property: "og:title", content: "Sentiment Stats — Signal.hn" },
      {
        property: "og:description",
        content: "Volume, mean score, distribution and per-company sentiment breakdown.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { data, loading, error, refresh, updatedAt } = useEndpoint<Stats>(() => api.getStats());

  return (
    <div className="space-y-10">
      <SectionHeading
        title="Stats"
        subtitle="Headline numbers across every analysed Hacker News thread."
        action={<LiveBadge updatedAt={updatedAt} onRefresh={refresh} refreshing={loading} />}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              icon={<MessagesSquare className="h-4 w-4" />}
              label="Total Posts Analyzed"
              value={<CountUp value={data.totalPosts} />}
            />
            <Stat
              icon={<Gauge className="h-4 w-4" />}
              label="Average Sentiment Score"
              value={
                <CountUp
                  value={data.averageSentiment}
                  decimals={2}
                  prefix={data.averageSentiment > 0 ? "+" : ""}
                />
              }
              tone={data.averageSentiment >= 0 ? "positive" : "negative"}
            />
            <Stat
              icon={<CalendarRange className="h-4 w-4" />}
              label="Date Range"
              value={
                <span className="text-2xl">
                  {formatDate(data.dateRange.from)} – {formatDate(data.dateRange.to)}
                </span>
              }
            />
          </div>

          <FadeIn>
            <SectionHeading title="Sentiment distribution" />
            <GlassCard className="p-6">
              <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="bg-positive/80"
                  style={{ width: `${data.positiveShare * 100}%` }}
                  aria-label="Positive share"
                />
                <div className="bg-neutral/60" style={{ width: `${data.neutralShare * 100}%` }} />
                <div className="bg-negative/80" style={{ width: `${data.negativeShare * 100}%` }} />
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <Share label="Positive" value={data.positiveShare} color="var(--positive)" />
                <Share label="Neutral" value={data.neutralShare} color="var(--neutral)" />
                <Share label="Negative" value={data.negativeShare} color="var(--negative)" />
              </dl>
            </GlassCard>
          </FadeIn>

          <FadeIn>
            <SectionHeading title="By company" subtitle="Volume and mean sentiment per keyword." />
            <div className="grid gap-4 sm:grid-cols-3">
              {data.topicBreakdown.map((t, i) => (
                <GlassCard key={t.topic} className="p-6">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">{t.topic}</p>
                  <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                    <CountUp value={t.posts} />
                    <span className="ml-1.5 text-sm font-normal text-muted-foreground">posts</span>
                  </p>
                  <p
                    className="mt-2 font-display text-lg font-semibold tabular-nums"
                    style={{ color: t.score >= 0 ? "var(--positive)" : "var(--negative)" }}
                  >
                    <CountUp value={t.score} decimals={2} prefix={t.score > 0 ? "+" : ""} />
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${((t.score + 1) / 2) * 100}%`, opacity: 0.8 - i * 0.05 }}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>
          </FadeIn>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "positive" | "negative";
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div
        className="mt-3 font-display text-4xl font-semibold tabular-nums"
        style={tone ? { color: `var(--${tone})` } : undefined}
      >
        {value}
      </div>
    </GlassCard>
  );
}

function Share({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums" style={{ color }}>
        <CountUp value={value * 100} decimals={1} suffix="%" />
      </dd>
    </div>
  );
}
