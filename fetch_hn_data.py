"""
fetch_hn_data.py

Pulls recent Hacker News stories, filters for AI-related ones (by keyword),
and stores them in a Postgres database (e.g. Neon) for later sentiment
analysis. Also prunes posts older than 90 days on every run.

No Hacker News API key needed — it's fully public.

Setup:
    pip install requests psycopg2-binary python-dotenv
    Create a .env file with:
        DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
    (Neon gives you this connection string directly from its dashboard.)
"""

import os
import time
from datetime import datetime

import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

HN_BASE = "https://hacker-news.firebaseio.com/v0"
DATABASE_URL = os.environ["DATABASE_URL"]

# Keywords to filter for AI-related posts. Tweak this list to change your topic.
KEYWORDS = ["ai", "llm", "gpt", "claude", "gemini", "openai", "anthropic", "machine learning", "chatgpt"]


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def init_db(conn):
    """Create the posts table if it doesn't already exist."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id BIGINT PRIMARY KEY,
                title TEXT,
                url TEXT,
                score INTEGER,
                author TEXT,
                created_at TIMESTAMP,
                fetched_at TIMESTAMP,
                comments INTEGER DEFAULT 0,
                sentiment_score REAL,
                sentiment_reason TEXT
            )
        """)
    conn.commit()


def cleanup_old_posts(conn, max_age_days=90):
    """Delete posts older than max_age_days to keep the database from growing forever."""
    with conn.cursor() as cur:
        cur.execute("""
            DELETE FROM posts
            WHERE created_at < NOW() - (%s || ' days')::interval
        """, (max_age_days,))
        deleted = cur.rowcount
    conn.commit()
    if deleted:
        print(f"Deleted {deleted} posts older than {max_age_days} days.")


def get_story_ids(feed="topstories", limit=200):
    resp = requests.get(f"{HN_BASE}/{feed}.json")
    resp.raise_for_status()
    return resp.json()[:limit]


def get_item(item_id):
    resp = requests.get(f"{HN_BASE}/item/{item_id}.json")
    resp.raise_for_status()
    return resp.json()


def is_ai_related(title):
    if not title:
        return False
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in KEYWORDS)


def save_post(conn, item):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO posts (id, title, url, score, author, created_at, fetched_at, comments)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            item.get("id"),
            item.get("title"),
            item.get("url"),
            item.get("score"),
            item.get("by"),
            datetime.utcfromtimestamp(item.get("time", 0)),
            datetime.utcnow(),
            item.get("descendants", 0),
        ))
    conn.commit()


def main():
    conn = get_conn()
    init_db(conn)
    cleanup_old_posts(conn, max_age_days=90)

    print("Fetching top story IDs...")
    story_ids = get_story_ids("topstories", limit=200)

    saved_count = 0
    for story_id in story_ids:
        try:
            item = get_item(story_id)
        except requests.RequestException as e:
            print(f"  Failed to fetch item {story_id}: {e}")
            continue

        if item and item.get("type") == "story" and is_ai_related(item.get("title")):
            save_post(conn, item)
            saved_count += 1
            print(f"  Saved: {item.get('title')}")

        time.sleep(0.05)

    conn.close()
    print(f"\nDone. Checked {len(story_ids)} stories, saved {saved_count} AI-related posts to Postgres.")


if __name__ == "__main__":
    main()