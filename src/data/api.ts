/**
 * Real API client — drop-in replacement for the mock `api` object in
 * `src/data/mockData.ts`. Same method names, same return shapes, so no
 * component or route needs to change beyond the import path.
 *
 * Set VITE_API_URL in a `.env` file if your backend isn't on localhost:8000, e.g.:
 *   VITE_API_URL=http://localhost:8000
 */

import type { Post, DailySentiment, Stats } from "./mockData";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** GET /stats */
  getStats: () => get<Stats>("/stats"),

  /** GET /daily-sentiment?days=N */
  getDailySentiment: (days = 30) => get<DailySentiment[]>(`/daily-sentiment?days=${days}`),

  /** GET /top-posts */
  getTopPosts: () => get<{ positive: Post[]; negative: Post[] }>("/top-posts"),

  /** GET /posts */
  getPosts: () => get<Post[]>("/posts"),
};
