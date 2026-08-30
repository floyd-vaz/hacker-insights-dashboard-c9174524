"""
score_sentiment.py

Reads posts from Postgres that haven't been scored yet, sends them to
Gemini in small batches, and saves sentiment scores + reasons back.

Setup:
    pip install google-generativeai psycopg2-binary python-dotenv
    .env needs both DATABASE_URL and GEMINI_API_KEY.
"""

import os
import json
import time

import psycopg2
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
BATCH_SIZE = 5

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def get_unscored_posts(conn, limit=200):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, title FROM posts
            WHERE sentiment_score IS NULL
            LIMIT %s
        """, (limit,))
        return cur.fetchall()


def build_prompt(posts_batch):
    items_text = "\n".join(f'- id={pid}: "{title}"' for pid, title in posts_batch)
    return f"""You are analyzing Hacker News post titles about AI/tech topics.
For each post below, give a sentiment score from -1 (very negative) to 1 (very positive),
reflecting the tone/reaction the title implies, plus a short one-sentence reason.

Posts:
{items_text}

Respond ONLY with a JSON array, no markdown formatting, no backticks, no extra text.
Format:
[
  {{"id": 12345, "sentiment_score": 0.3, "reason": "short reason here"}},
  ...
]
"""


def score_batch(posts_batch, max_retries=3):
    prompt = build_prompt(posts_batch)

    for attempt in range(1, max_retries + 1):
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()

            if text.startswith("```"):
                text = text.strip("`")
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            return json.loads(text)

        except json.JSONDecodeError:
            print("  Failed to parse response:")
            print(text[:500])
            return []

        except Exception as e:
            wait = 2 ** attempt
            print(f"  Attempt {attempt} failed ({type(e).__name__}: {e}). Retrying in {wait}s...")
            time.sleep(wait)

    print("  Giving up on this batch after repeated failures.")
    return []


def save_scores(conn, results):
    with conn.cursor() as cur:
        for r in results:
            cur.execute("""
                UPDATE posts
                SET sentiment_score = %s, sentiment_reason = %s
                WHERE id = %s
            """, (r.get("sentiment_score"), r.get("reason"), r.get("id")))
    conn.commit()


def main():
    conn = get_conn()
    posts = get_unscored_posts(conn)

    if not posts:
        print("No unscored posts found. Run fetch_hn_data.py first, or everything is already scored.")
        conn.close()
        return

    print(f"Found {len(posts)} unscored posts. Scoring in batches of {BATCH_SIZE}...")

    for i in range(0, len(posts), BATCH_SIZE):
        batch = posts[i:i + BATCH_SIZE]
        print(f"\nBatch {i // BATCH_SIZE + 1}: {[t for _, t in batch]}")

        results = score_batch(batch)
        if results:
            save_scores(conn, results)
            for r in results:
                print(f"  id={r.get('id')} score={r.get('sentiment_score')} reason={r.get('reason')}")

        time.sleep(1)

    conn.close()
    print("\nDone scoring.")


if __name__ == "__main__":
    main()