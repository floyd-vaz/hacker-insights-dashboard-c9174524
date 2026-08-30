import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Gauge, MessagesSquare } from "lucide-react";
import { api, formatDate, type DailySentiment, type Stats } from "@/data/mockData";
import { useEndpoint } from "@/hooks/useEndpoint";
import {
  ChartSkeleton,
  CountUp,
  ErrorState,
  FadeIn,
  GlassCard,
  LiveBadge,
  SectionHeading,
  StatSkeleton,
} from "@/components/dashboard/primitives";
import { SentimentChart } from "@/components/dashboard/SentimentChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signal.hn — AI Sentiment Dashboard for Hacker News" },
      {
        name: "description",
        content:
          "Live dashboard tracking Hacker News sentiment toward Claude, Gemini and OpenAI: totals, daily trend and standout threads.",
      },
      { property: "og:title", content: "Signal.hn — AI Sentiment Dashboard for Hacker News" },
      {
        property: "og:description",
        content: "Totals, daily trend and standout threads for Claude, Gemini and OpenAI.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const statsReq = useEndpoint<Stats>(() => api.getStats());
  const trendReq = useEndpoint<DailySentiment[]>(() => api.getDailySentiment(30));

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              Hacker News · AI company sentiment
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold text-balance sm:text-5xl">
              How Hacker News really feels about{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-positive bg-clip-text text-transparent">
                Claude, Gemini &amp; OpenAI
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Every thread scored, summarised and tracked over time — no spreadsheets, no scraping.
            </p>
          </div>
          <LiveBadge
            updatedAt={statsReq.updatedAt}
            onRefresh={() => {
              statsReq.refresh();
              trendReq.refresh();
            }}
            refreshing={statsReq.loading}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statsReq.loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : statsReq.error ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={statsReq.error.message} onRetry={statsReq.refresh} />
            </div>
          ) : statsReq.data ? (
            <>
              <HeroStat
                icon={<MessagesSquare className="h-4 w-4" />}
                label="Total Posts Analyzed"
                value={<CountUp value={statsReq.data.totalPosts} />}
                hint="across 3 AI companies"
              />
              <HeroStat
                icon={<Gauge className="h-4 w-4" />}
                label="Average Sentiment Score"
                value={
                  <CountUp
                    value={statsReq.data.averageSentiment}
                    decimals={2}
                    prefix={statsReq.data.averageSentiment > 0 ? "+" : ""}
                  />
                }
                hint="scale −1.00 to +1.00"
                accent={statsReq.data.averageSentiment >= 0 ? "positive" : "negative"}
              />
              <HeroStat
                icon={<CalendarRange className="h-4 w-4" />}
                label="Date Range"
                value={
                  <span className="text-2xl sm:text-3xl">
                    {formatDate(statsReq.data.dateRange.from)} –{" "}
                    {formatDate(statsReq.data.dateRange.to)}
                  </span>
                }
                hint="90 days of threads"
              />
            </>
          ) : null}
        </div>
      </section>

      <FadeIn>
        <SectionHeading
          title="Sentiment over the last 30 days"
          subtitle="Daily mean score across all analysed threads."
          action={
            <Link
              to="/daily-sentiment"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-primary"
            >
              Full trend <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {trendReq.loading ? (
          <ChartSkeleton />
        ) : trendReq.error ? (
          <ErrorState message={trendReq.error.message} onRetry={trendReq.refresh} />
        ) : (
          <GlassCard className="p-4 sm:p-6">
            <SentimentChart data={trendReq.data ?? []} height={280} />
          </GlassCard>
        )}
      </FadeIn>

      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickLink
            to="/top-posts"
            title="Top posts"
            body="The most positive and most negative threads, with the reason behind each score."
          />
          <QuickLink
            to="/posts"
            title="All posts explorer"
            body="Filter every analysed thread by company keyword and sentiment range."
          />
        </div>
      </FadeIn>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint: string;
  accent?: "positive" | "negative";
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div
        className="mt-3 font-display text-4xl font-semibold tabular-nums"
        style={
          accent
            ? { color: accent === "positive" ? "var(--positive)" : "var(--negative)" }
            : undefined
        }
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </GlassCard>
  );
}

function QuickLink({ to, title, body }: { to: "/top-posts" | "/posts"; title: string; body: string }) {
  return (
    <Link to={to} className="group focus-visible:outline-none">
      <GlassCard className="h-full p-6 transition-colors group-hover:border-white/25 group-focus-visible:border-primary/60">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </GlassCard>
    </Link>
  );
}
