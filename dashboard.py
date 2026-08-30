"""
dashboard.py

A Streamlit dashboard that reads scored posts from hn_data.db and shows
sentiment trends, top positive/negative posts, and basic stats.

Run with:
    streamlit run dashboard.py
"""

import sqlite3
import pandas as pd
import streamlit as st

DB_PATH = "hn_data.db"

st.set_page_config(page_title="HN AI Sentiment Dashboard", layout="wide")


@st.cache_data(ttl=60)
def load_data():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("""
        SELECT id, title, url, score, author, created_at, sentiment_score, sentiment_reason
        FROM posts
        WHERE sentiment_score IS NOT NULL
        ORDER BY created_at
    """, conn)
    conn.close()
    df["created_at"] = pd.to_datetime(df["created_at"])
    return df


df = load_data()

st.title("📊 Hacker News AI Sentiment Dashboard")
st.caption("Tracking sentiment on AI-related Hacker News posts, scored with Gemini.")

if df.empty:
    st.warning("No scored posts found yet. Run fetch_hn_data.py then score_sentiment.py first.")
    st.stop()

# --- Top-level stats ---
col1, col2, col3 = st.columns(3)
col1.metric("Total posts analyzed", len(df))
col2.metric("Average sentiment", f"{df['sentiment_score'].mean():.2f}")
col3.metric("Date range", f"{df['created_at'].min().date()} → {df['created_at'].max().date()}")

st.divider()

# --- Sentiment over time ---
st.subheader("Sentiment over time")
daily = df.set_index("created_at").resample("D")["sentiment_score"].mean().dropna()
st.line_chart(daily)

st.divider()

# --- Top positive / negative posts ---
col_pos, col_neg = st.columns(2)

with col_pos:
    st.subheader("🟢 Most positive posts")
    top_pos = df.sort_values("sentiment_score", ascending=False).head(5)
    for _, row in top_pos.iterrows():
        st.markdown(f"**{row['title']}** (score: {row['sentiment_score']:.2f})")
        st.caption(row["sentiment_reason"])
        st.markdown(f"[link]({row['url']})" if row["url"] else "")
        st.markdown("---")

with col_neg:
    st.subheader("🔴 Most negative posts")
    top_neg = df.sort_values("sentiment_score", ascending=True).head(5)
    for _, row in top_neg.iterrows():
        st.markdown(f"**{row['title']}** (score: {row['sentiment_score']:.2f})")
        st.caption(row["sentiment_reason"])
        st.markdown(f"[link]({row['url']})" if row["url"] else "")
        st.markdown("---")

st.divider()

# --- Full data table ---
st.subheader("All scored posts")
st.dataframe(
    df[["title", "sentiment_score", "sentiment_reason", "score", "created_at"]]
    .sort_values("created_at", ascending=False),
    use_container_width=True,
)
