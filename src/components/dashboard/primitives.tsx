import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sentimentLabel } from "@/data/mockData";

/* ---------------------------------------------------------------- */
/* Ambient background                                                */
/* ---------------------------------------------------------------- */

export function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,var(--violet-glow)_0%,transparent_65%)] opacity-25 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,var(--cyan-glow)_0%,transparent_65%)] opacity-20 blur-3xl" />
      <div className="absolute -bottom-56 left-1/3 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,var(--positive)_0%,transparent_65%)] opacity-[0.14] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Glass surface                                                     */
/* ---------------------------------------------------------------- */

export function GlassCard({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "glass relative rounded-2xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)]",
        "before:pointer-events-none before:absolute before:inset-x-6 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Count-up                                                          */
/* ---------------------------------------------------------------- */

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 20, mass: 0.8 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => spring.on("change", (v) => setDisplay(v)), [spring]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Live badge                                                        */
/* ---------------------------------------------------------------- */

export function LiveBadge({
  updatedAt,
  onRefresh,
  refreshing,
}: {
  updatedAt: number | null;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const mins = updatedAt ? Math.max(0, Math.floor((Date.now() - updatedAt) / 60000)) : null;

  return (
    <button
      type="button"
      onClick={onRefresh}
      aria-label="Refresh sentiment data"
      className="glass group inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs font-medium text-foreground/90 shadow-[0_0_28px_-8px_var(--positive)] transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
      </span>
      <span className="hidden sm:inline">Live</span>
      <span className="text-muted-foreground">
        {mins === null ? "syncing…" : `Last updated: ${mins} min${mins === 1 ? "" : "s"} ago`}
      </span>
      <RefreshCw
        className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:text-foreground",
          refreshing && "animate-spin",
        )}
      />
    </button>
  );
}

/* ---------------------------------------------------------------- */
/* Sentiment badge                                                   */
/* ---------------------------------------------------------------- */

export function SentimentBadge({ score, className }: { score: number; className?: string }) {
  const label = sentimentLabel(score);
  const tone =
    label === "Positive"
      ? "text-positive border-positive/30 bg-positive/10 shadow-[0_0_20px_-6px_var(--positive)]"
      : label === "Negative"
        ? "text-negative border-negative/30 bg-negative/10 shadow-[0_0_20px_-6px_var(--negative)]"
        : "text-neutral border-neutral/30 bg-neutral/10";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {label}
      <span className="opacity-70">
        {score > 0 ? "+" : ""}
        {score.toFixed(2)}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Loading / empty / error                                           */
/* ---------------------------------------------------------------- */

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-white/[0.06]", className)} />;
}

export function StatSkeleton() {
  return (
    <GlassCard className="p-6">
      <Shimmer className="h-3.5 w-28" />
      <Shimmer className="mt-4 h-9 w-36" />
      <Shimmer className="mt-3 h-3 w-20" />
    </GlassCard>
  );
}

export function ChartSkeleton() {
  return (
    <GlassCard className="p-6">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="mt-6 h-[260px] w-full" />
    </GlassCard>
  );
}

export function CardSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-6 w-24 rounded-full" />
      </div>
      <Shimmer className="mt-4 h-3 w-full" />
      <Shimmer className="mt-2 h-3 w-4/5" />
      <Shimmer className="mt-5 h-3 w-32" />
    </GlassCard>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <GlassCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="rounded-2xl border border-negative/30 bg-negative/10 p-3 text-negative">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">We couldn't load this data</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? "The sentiment service didn't respond in time."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <RefreshCw className="h-4 w-4" /> Try Again
      </button>
    </GlassCard>
  );
}

export function EmptyState({
  title = "Nothing matches those filters",
  description = "Try widening the sentiment range or clearing the topic filter.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <GlassCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {actionLabel}
        </button>
      ) : null}
    </GlassCard>
  );
}

/* ---------------------------------------------------------------- */
/* Motion helpers                                                    */
/* ---------------------------------------------------------------- */

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
