import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { type Post } from "@/data/mockData";
import { api } from "@/data/api";
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

type Tone = "positive" | "negative";

export const Route = createFileRoute("/top-posts")({
  head: () => ({
    meta: [
      { title: "Top Posts — Signal.hn" },
      {
        name: "description",
        content:
          "The most positive and most negative Hacker News threads about AI companies, each with a sentiment score and a short reason.",
      },
      { property: "og:title", content: "Top Posts — Signal.hn" },
      {
        property: "og:description",
        content: "Most loved and most criticised AI threads on Hacker News, scored and explained.",
      },
    ],
  }),
  component: TopPostsPage,
});

function TopPostsPage() {
  const [tone, setTone] = useState<Tone>("positive");
  const { data, loading, error, refresh, updatedAt } = useEndpoint<{
    positive: Post[];
    negative: Post[];
  }>(() => api.getTopPosts());

  const list = data ? data[tone] : [];

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Top posts"
        subtitle="Standout threads at both ends of the sentiment scale."
        action={<LiveBadge updatedAt={updatedAt} onRefresh={refresh} refreshing={loading} />}
      />

      <div
        className="glass inline-flex rounded-full p-1"
        role="group"
        aria-label="Choose sentiment direction"
      >
        {(
          [
            { key: "positive", label: "Most positive", Icon: ThumbsUp },
            { key: "negative", label: "Most negative", Icon: ThumbsDown },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={tone === key}
            onClick={() => setTone(key)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              tone === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tone === key ? (
              <motion.span
                layoutId="tone-pill"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className={cn(
                  "absolute inset-0 rounded-full border",
                  key === "positive"
                    ? "border-positive/30 bg-positive/10 shadow-[0_0_30px_-10px_var(--positive)]"
                    : "border-negative/30 bg-negative/10 shadow-[0_0_30px_-10px_var(--negative)]",
                )}
              />
            ) : null}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No standout threads yet"
          description="Once more posts are analysed the extremes will show up here."
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {list.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
