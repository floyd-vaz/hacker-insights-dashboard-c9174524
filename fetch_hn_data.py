"""
fetch_hn_data.py

Pulls recent Hacker News stories, filters for AI-related ones (by keyword),
and stores them in a local SQLite database for later sentiment analysis.

No API key needed — Hacker News' API is fully public.
"""

import requests
import sqlite3
import time
from datetime import datetime

HN_BASE = "https://hacker-news.firebaseio.com/v0"
DB_PATH = "hn_data.db"

# Keywords to filter for AI-related posts. Tweak this list to change your topic.
KEYWORDS = ["ai", "llm", "gpt", "claude", "gemini", "openai", "anthropic", "machine learning", "chatgpt"]


def init_db():
    """Create the posts table if it doesn't already exist, and migrate in new columns."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY,
            title TEXT,
            url TEXT,
            score INTEGER,
            author TEXT,
            created_at TEXT,
            fetched_at TEXT,
            sentiment_score REAL,
            sentiment_reason TEXT,
            comments INTEGER DEFAULT 0
        )
    """)
    # Migration safety net: if posts table already existed from before the
    # 'comments' column was added, add it now without losing existing data.
    try:
        cur.execute("ALTER TABLE posts ADD COLUMN comments INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass  # column already exists
    conn.commit()
    conn.close()


def get_story_ids(feed="topstories", limit=100):
    """Fetch a list of story IDs from a given HN feed (topstories, newstories, beststories)."""
    resp = requests.get(f"{HN_BASE}/{feed}.json")
    resp.raise_for_status()
    return resp.json()[:limit]


def get_item(item_id):
    """Fetch a single HN item (story/comment) by ID."""
    resp = requests.get(f"{HN_BASE}/item/{item_id}.json")
    resp.raise_for_status()
    return resp.json()


def is_ai_related(title):
    if not title:
        return False
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in KEYWORDS)


def save_post(conn, item):
    cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO posts (id, title, url, score, author, created_at, fetched_at, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.get("id"),
        item.get("title"),
        item.get("url"),
        item.get("score"),
        item.get("by"),
        datetime.utcfromtimestamp(item.get("time", 0)).isoformat(),
        datetime.utcnow().isoformat(),
        item.get("descendants", 0),
    ))
    conn.commit()


def cleanup_old_posts(conn, max_age_days=90):
    """Delete posts older than max_age_days to keep the database from growing forever."""
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM posts
        WHERE created_at < datetime('now', ?)
    """, (f"-{max_age_days} days",))
    deleted = cur.rowcount
    conn.commit()
    if deleted:
        print(f"Deleted {deleted} posts older than {max_age_days} days.")


def main():
    init_db()
    conn = sqlite3.connect(DB_PATH)

    cleanup_old_posts(conn, max_age_days=90)

    print("Fetching top story IDs...")
    story_ids = get_story_ids("topstories", limit=200)

    saved_count = 0
    for i, story_id in enumerate(story_ids):
        try:
            item = get_item(story_id)
        except requests.RequestException as e:
            print(f"  Failed to fetch item {story_id}: {e}")
            continue

        if item and item.get("type") == "story" and is_ai_related(item.get("title")):
            save_post(conn, item)
            saved_count += 1
            print(f"  Saved: {item.get('title')}")

        # Be polite to the free public API — no key means no official rate limit,
        # but a small delay avoids hammering it.
        time.sleep(0.05)

    conn.close()
    print(f"\nDone. Checked {len(story_ids)} stories, saved {saved_count} AI-related posts to {DB_PATH}")


if __name__ == "__main__":
    main()