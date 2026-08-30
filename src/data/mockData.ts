/**
 * Mock data layer for the AI-company Hacker News sentiment dashboard.
 * Everything here is deterministic so SSR and the client agree.
 * Each `fetchX` mirrors a real API endpoint shape and resolves after a delay.
 */

export type Topic = "Claude" | "Gemini" | "OpenAI";

export interface Post {
  id: string;
  title: string;
  author: string;
  points: number;
  comments: number;
  topic: Topic;
  /** -1 .. 1 */
  sentiment: number;
  reason: string;
  createdAt: string;
  url: string;
}

export interface DailySentiment {
  date: string;
  score: number;
  posts: number;
}

export interface Stats {
  totalPosts: number;
  averageSentiment: number;
  dateRange: { from: string; to: string };
  positiveShare: number;
  negativeShare: number;
  neutralShare: number;
  topicBreakdown: { topic: Topic; posts: number; score: number }[];
  lastUpdated: string;
}

/* ------------------------------------------------------------------ */
/* deterministic pseudo-randomness                                     */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(20260830);

const START = new Date("2026-06-01T00:00:00Z");
const DAYS = 90;

function dayISO(offset: number) {
  const d = new Date(START);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* posts                                                               */
/* ------------------------------------------------------------------ */

const TOPICS: Topic[] = ["Claude", "Gemini", "OpenAI"];

const TITLE_PARTS: Record<Topic, string[]> = {
  Claude: [
    "Claude ships a 1M-token context window for agentic coding",
    "We replaced our review pipeline with Claude and shipped 3x faster",
    "Claude Code keeps rewriting my tests and I love it",
    "Anthropic publishes interpretability results on Claude's planning",
    "Claude's refusal behaviour is getting in the way of security research",
    "Benchmarking Claude vs. in-house models on SQL generation",
    "Claude quietly became the default model at our startup",
    "Rate limits on Claude broke our nightly batch job",
  ],
  Gemini: [
    "Gemini's long-context retrieval beats our RAG stack",
    "Gemini in Workspace is finally useful for real documents",
    "Why Gemini's pricing changed our multimodal roadmap",
    "Gemini hallucinated an entire API in our docs pipeline",
    "Ask HN: is anyone shipping production apps on Gemini?",
    "Gemini's Flash tier makes cheap classification viable",
    "Google deprecated the Gemini endpoint we depend on",
    "Gemini live audio latency measured across three regions",
  ],
  OpenAI: [
    "OpenAI's new reasoning model tops the agent leaderboard",
    "We cut inference spend 60% by leaving OpenAI",
    "OpenAI outage took down half our customer support flow",
    "GPT function calling is finally reliable enough for prod",
    "OpenAI's enterprise terms are a dealbreaker for us",
    "Fine-tuning on OpenAI: what actually moved the needle",
    "Ask HN: how are you handling OpenAI model deprecations?",
    "OpenAI ships batch pricing and our costs halved overnight",
  ],
};

const POSITIVE_REASONS = [
  "Commenters praised the measurable latency win and shared reproducible benchmarks.",
  "Overwhelmingly enthusiastic thread about real production cost savings.",
  "Developers reported the release unblocked workflows they had shelved for months.",
  "Strong appreciation for transparent methodology and open evaluation data.",
  "Thread celebrated a long-requested feature landing with sane defaults.",
];

const NEGATIVE_REASONS = [
  "Thread dominated by frustration over undocumented breaking changes.",
  "Users reported repeated outages and slow incident communication.",
  "Heavy criticism of opaque pricing and surprise quota enforcement.",
  "Commenters flagged hallucinations that reached production users.",
  "Discussion soured over deprecations with a short migration window.",
];

const NEUTRAL_REASONS = [
  "Mixed thread: measured optimism balanced against reliability concerns.",
  "Largely technical Q&A with no strong emotional signal either way.",
  "Comparison thread where each option had roughly equal support.",
  "Informational post; discussion stayed analytical and even-handed.",
];

function pickReason(sentiment: number) {
  const pool =
    sentiment > 0.25 ? POSITIVE_REASONS : sentiment < -0.25 ? NEGATIVE_REASONS : NEUTRAL_REASONS;
  return pool[Math.floor(rand() * pool.length)]!;
}

const AUTHORS = [
  "pg_reader",
  "throwaway_9f2",
  "latent_space",
  "tokenpusher",
  "dhh_fan",
  "vectorized",
  "sre_on_call",
  "compilerbug",
  "quietml",
  "ship_it_fri",
];

export const posts: Post[] = Array.from({ length: 132 }, (_, i) => {
  const topic = TOPICS[Math.floor(rand() * TOPICS.length)]!;
  const titles = TITLE_PARTS[topic];
  const title = titles[Math.floor(rand() * titles.length)]!;
  const bias = topic === "Claude" ? 0.18 : topic === "Gemini" ? 0.02 : -0.05;
  const raw = (rand() * 2 - 1) * 0.85 + bias;
  const sentiment = Math.max(-0.98, Math.min(0.98, Number(raw.toFixed(2))));
  const dayOffset = Math.floor(rand() * DAYS);
  return {
    id: `hn-${41000000 + i * 137}`,
    title: `${title}${i % 11 === 0 ? " (2026)" : ""}`,
    author: AUTHORS[Math.floor(rand() * AUTHORS.length)]!,
    points: 40 + Math.floor(rand() * 960),
    comments: 5 + Math.floor(rand() * 420),
    topic,
    sentiment,
    reason: pickReason(sentiment),
    createdAt: dayISO(dayOffset),
    url: `https://news.ycombinator.com/item?id=${41000000 + i * 137}`,
  };
}).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

/* ------------------------------------------------------------------ */
/* daily sentiment                                                     */
/* ------------------------------------------------------------------ */

export const dailySentiment: DailySentiment[] = Array.from({ length: DAYS }, (_, i) => {
  const date = dayISO(i);
  const sameDay = posts.filter((p) => p.createdAt === date);
  const score = sameDay.length
    ? sameDay.reduce((sum, p) => sum + p.sentiment, 0) / sameDay.length
    : Math.sin(i / 7) * 0.25;
  return {
    date,
    score: Number(score.toFixed(3)),
    posts: sameDay.length,
  };
});

/* ------------------------------------------------------------------ */
/* stats                                                               */
/* ------------------------------------------------------------------ */

const avg = posts.reduce((s, p) => s + p.sentiment, 0) / posts.length;

export const stats: Stats = {
  totalPosts: posts.length,
  averageSentiment: Number(avg.toFixed(3)),
  dateRange: { from: dayISO(0), to: dayISO(DAYS - 1) },
  positiveShare: posts.filter((p) => p.sentiment > 0.25).length / posts.length,
  negativeShare: posts.filter((p) => p.sentiment < -0.25).length / posts.length,
  neutralShare:
    posts.filter((p) => p.sentiment >= -0.25 && p.sentiment <= 0.25).length / posts.length,
  topicBreakdown: TOPICS.map((topic) => {
    const group = posts.filter((p) => p.topic === topic);
    return {
      topic,
      posts: group.length,
      score: Number((group.reduce((s, p) => s + p.sentiment, 0) / group.length).toFixed(3)),
    };
  }),
  lastUpdated: new Date().toISOString(),
};

export const topPositive = [...posts].sort((a, b) => b.sentiment - a.sentiment).slice(0, 8);
export const topNegative = [...posts].sort((a, b) => a.sentiment - b.sentiment).slice(0, 8);

/* ------------------------------------------------------------------ */
/* "endpoints"                                                         */
/* ------------------------------------------------------------------ */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Flip to true in the console to exercise the error states. */
export const mockConfig = { failNextRequest: false };

async function respond<T>(data: T, ms = 700): Promise<T> {
  await delay(ms);
  if (mockConfig.failNextRequest) {
    throw new Error("Upstream sentiment service is unavailable (mock).");
  }
  return data;
}

export const api = {
  /** GET /stats */
  getStats: () => respond({ ...stats, lastUpdated: new Date().toISOString() }, 650),
  /** GET /daily-sentiment */
  getDailySentiment: (days = 30) => respond(dailySentiment.slice(-days), 800),
  /** GET /top-posts */
  getTopPosts: () => respond({ positive: topPositive, negative: topNegative }, 750),
  /** GET /posts */
  getPosts: () => respond(posts, 900),
};

export function sentimentLabel(score: number) {
  if (score > 0.25) return "Positive" as const;
  if (score < -0.25) return "Negative" as const;
  return "Neutral" as const;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
