"""
api.py

FastAPI server that reads from Postgres and exposes data shaped to match
the frontend's Post/Stats/DailySentiment TypeScript interfaces exactly.

Setup:
    pip install fastapi uvicorn psycopg2-binary python-dotenv pandas
    .env needs DATABASE_URL.

Run with:
    uvicorn api:app --reload --port 8000
"""

import os
from datetime import datetime, timezone

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI(title="HN Sentiment API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev only — tighten before deploying publicly
    allow_methods=["*"],
    allow_headers=["*"],
)

TOPIC_KEYWORDS = {
    "Claude": ["claude", "anthropic"],
    "Gemini": ["gemini", "google"],
    "OpenAI": ["openai", "gpt", "chatgpt"],
}


def derive_topic(title: str) -> str:
    title_lower = (title or "").lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            return topic
    return "Other"


def get_df() -> pd.DataFrame:
    conn = psycopg2.connect(DATABASE_URL)
    df = pd.read_sql_query("""
        SELECT id, title, url, score, author, created_at, comments,
               sentiment_score, sentiment_reason
        FROM posts
        WHERE sentiment_score IS NOT NULL
        ORDER BY created_at
    """, conn)
    conn.close()
    if not df.empty:
        df["created_at"] = pd.to_datetime(df["created_at"])
        df["topic"] = df["title"].apply(derive_topic)
    return df


def post_to_json(row) -> dict:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "author": row["author"],
        "points": int(row["score"]) if pd.notna(row["score"]) else 0,
        "comments": int(row["comments"]) if pd.notna(row["comments"]) else 0,
        "topic": row["topic"],
        "sentiment": round(float(row["sentiment_score"]), 3),
        "reason": row["sentiment_reason"],
        "createdAt": row["created_at"].strftime("%Y-%m-%d"),
        "url": row["url"],
    }


@app.get("/posts")
def get_posts():
    df = get_df()
    if df.empty:
        return []
    df = df.sort_values("created_at", ascending=False)
    return [post_to_json(row) for _, row in df.iterrows()]


@app.get("/stats")
def get_stats():
    df = get_df()
    if df.empty:
        return {
            "totalPosts": 0,
            "averageSentiment": 0,
            "dateRange": {"from": None, "to": None},
            "positiveShare": 0,
            "negativeShare": 0,
            "neutralShare": 0,
            "topicBreakdown": [],
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
        }

    total = len(df)
    positive = (df["sentiment_score"] > 0.25).sum()
    negative = (df["sentiment_score"] < -0.25).sum()
    neutral = total - positive - negative

    topic_breakdown = [
        {
            "topic": topic,
            "posts": int(len(group)),
            "score": round(float(group["sentiment_score"].mean()), 3),
        }
        for topic, group in df.groupby("topic")
    ]

    return {
        "totalPosts": total,
        "averageSentiment": round(float(df["sentiment_score"].mean()), 3),
        "dateRange": {
            "from": df["created_at"].min().strftime("%Y-%m-%d"),
            "to": df["created_at"].max().strftime("%Y-%m-%d"),
        },
        "positiveShare": round(positive / total, 3),
        "negativeShare": round(negative / total, 3),
        "neutralShare": round(neutral / total, 3),
        "topicBreakdown": topic_breakdown,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/daily-sentiment")
def get_daily_sentiment(days: int = 30):
    df = get_df()
    if df.empty:
        return []

    daily = (
        df.set_index("created_at")
        .resample("D")
        .agg(score=("sentiment_score", "mean"), posts=("id", "count"))
        .dropna()
        .reset_index()
    )
    daily = daily.tail(days)

    return [
        {
            "date": row["created_at"].strftime("%Y-%m-%d"),
            "score": round(float(row["score"]), 3),
            "posts": int(row["posts"]),
        }
        for _, row in daily.iterrows()
    ]


@app.get("/top-posts")
def get_top_posts(limit: int = 8):
    df = get_df()
    if df.empty:
        return {"positive": [], "negative": []}

    top_positive = df.sort_values("sentiment_score", ascending=False).head(limit)
    top_negative = df.sort_values("sentiment_score", ascending=True).head(limit)

    return {
        "positive": [post_to_json(row) for _, row in top_positive.iterrows()],
        "negative": [post_to_json(row) for _, row in top_negative.iterrows()],
    }