import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { api, type Post, type Topic } from "@/data/mockData";
import { useEndpoint } from "@/hooks/useEndpoint";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  LiveBadge,
  SectionHeading,
} from "@/components/dashboard/primitives";
import { PostCard } from "@/components/dashboard/PostCard";
import { cn } from "@/lib/utils";

const TOPICS: Topic[] = ["Claude", "Gemini", "OpenAI"];
const BANDS = [
  { key: "all", label: "All sentiment", test: () => true },
  { key: "positive", label: "Positive", test: (s: number) => s > 0.25 },
  { key: "neutral", label: "Neutral", test: (s: number) => s >= -0.25 && s <= 0.25 },
  { key: "negative", label: "Negative", test: (s: number) => s < -0.25 },
] as const;

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "All Posts Explorer — Signal.hn" },
      {
        name: "description",
        content:
          "Search and filter every analysed Hacker News thread about Claude, Gemini and OpenAI by keyword and sentiment range.",
      },
      { property: "og:title", content: "All Posts Explorer — Signal.hn" },
      {
        property: "og:description",
        content: "Filter analysed AI threads by keyword, company and sentiment range.",
      },
    ],
  }),
  component: PostsPage,
});

function PostsPage() {
  const { data, loading, error, refresh, updatedAt } = useEndpoint<Post[]>(() => api.getPosts());
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [band, setBand] = useState<(typeof BANDS)[number]["key"]>("all");
  const [min, setMin] = useState(-1);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const bandTest = BANDS.find((b) => b.key === band)!.test;
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (topics.length === 0 || topics.includes(p.topic)) &&
        bandTest(p.sentiment) &&
        p.sentiment >= min &&
        (q === "" ||
          p.title.toLowerCase().includes(q) ||
          p.reason.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q)),
    );
  }, [data, query, topics, band, min]);

  const dirty = query !== "" || topics.length > 0 || band !== "all" || min !== -1;
  const reset = () => {
    setQuery("");
    setTopics([]);
    setBand("all");
    setMin(-1);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        title="All posts"
        subtitle="Every analysed thread, filterable by company keyword and sentiment."
        action={<LiveBadge updatedAt={updatedAt} onRefresh={refresh} refreshing={loading} />}
      />

      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[16rem] flex-1">
            <span className="sr-only">Search posts by keyword or topic</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, topics or reasons…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-ring/40 focus:outline-none"
            />
          </label>

          <div className="flex gap-1.5" role="group" aria-label="Filter by company">
            {TOPICS.map((t) => {
              const active = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setTopics((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-primary/40 bg-primary/15 text-foreground shadow-[0_0_26px_-10px_var(--violet-glow)]"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="glass ml-auto inline-flex rounded-full p-1" role="group" aria-label="View mode">
            {(
              [
                { key: "grid", Icon: LayoutGrid, label: "Grid view" },
                { key: "list", Icon: List, label: "List view" },
              ] as const
            ).map(({ key, Icon, label }) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn(
                  "rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  view === key
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex gap-1.5" role="group" aria-label="Filter by sentiment band">
            {BANDS.map((b) => (
              <button
                key={b.key}
                type="button"
                aria-pressed={band === b.key}
                onClick={() => setBand(b.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  band === b.key
                    ? "bg-white/12 text-foreground ring-1 ring-white/15"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>

          <label className="flex min-w-[14rem] flex-1 items-center gap-3 text-xs text-muted-foreground">
            Min score
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--primary)]"
            />
            <span className="w-12 text-right font-display tabular-nums text-foreground">
              {min > 0 ? "+" : ""}
              {min.toFixed(2)}
            </span>
          </label>

          {dirty ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {loading ? "Loading threads…" : `${filtered.length} of ${data?.length ?? 0} posts`}
      </p>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState actionLabel={dirty ? "Clear filters" : undefined} onAction={dirty ? reset : undefined} />
      ) : (
        <div
          className={cn(
            "grid gap-4",
            view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
          )}
        >
          {filtered.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} tilt />
          ))}
        </div>
      )}
    </div>
  );
}
