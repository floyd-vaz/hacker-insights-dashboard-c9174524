import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight, MessageSquare, TrendingUp } from "lucide-react";
import { formatDate, type Post } from "@/data/mockData";
import { GlassCard, SentimentBadge } from "./primitives";

export function PostCard({ post, index = 0, tilt = false }: { post: Post; index?: number; tilt?: boolean }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const glare = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(255,255,255,0.09), transparent 65%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    x.set(px);
    y.set(py);
    if (!tilt) return;
    rotateY.set(((px / rect.width) * 2 - 1) * 6);
    rotateX.set((1 - (py / rect.height) * 2) * 6);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <GlassCard className="group h-full overflow-hidden p-5 transition-colors hover:border-white/20">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {post.topic}
              </span>
              <SentimentBadge score={post.sentiment} />
            </div>

            <h3 className="mt-3 text-base leading-snug font-semibold text-balance">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {post.title}
              </a>
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.reason}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> {post.points} pts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
              </span>
              <span>{formatDate(post.createdAt)}</span>
              <span className="text-foreground/50">by {post.author}</span>
            </div>

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              View on Hacker News <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
