# Hacker Insights Dashboard

A live sentiment analytics dashboard that tracks how Hacker News reacts to AI companies (Claude, Gemini, and OpenAI) over time — built end-to-end from data collection to a deployed, self-updating web app.

**Live demo:** [https://hacker-insights-dashboard-c9174524.vercel.app/]

---

## Screenshots

![Dashboard overview](./screenshots/overview.png)
*Sentiment trend and top-level stats*

![Post feed](./screenshots/posts.png)
*Most positive and most negative posts, with reasons*

---

## What it does

Every 4 hours, an automated pipeline pulls fresh AI-related posts from Hacker News, scores their sentiment using Google's Gemini API, and stores the results in a live database. A dashboard renders that data as interactive charts and post rankings — no manual updates required.

---

## Architecture

```
Hacker News API (public, no key needed)
        ↓
fetch_hn_data.py  →  filters AI-related posts, prunes anything older than 90 days
        ↓
score_sentiment.py  →  sends batches to Gemini, gets back a sentiment score + reason
        ↓
Postgres (Neon)  →  single source of truth, always live
        ↓
api.py (FastAPI)  →  serves /stats, /posts, /daily-sentiment, /top-posts as JSON
        ↓
React dashboard (TanStack Start)  →  fetches from the API, renders charts + post feed

GitHub Actions runs fetch_hn_data.py + score_sentiment.py every 4 hours automatically.
```

---

## Tech stack

**Backend**
- Python, FastAPI
- Postgres (hosted on [Neon](https://neon.tech))
- Google Gemini API for sentiment scoring
- Deployed on [Render](https://render.com)

**Frontend**
- React + TanStack Start (router, SSR)
- Tailwind CSS
- Recharts for data visualization
- Framer Motion for animation
- Deployed on [Vercel](https://vercel.com)

**Automation**
- GitHub Actions (scheduled workflow, runs every 4 hours)

---

## Project structure

```
.
├── fetch_hn_data.py       # Pulls + filters HN posts, prunes old data
├── score_sentiment.py     # Scores posts with Gemini
├── api.py                 # FastAPI backend, serves data to the frontend
├── requirements.txt       # Python dependencies
├── .github/workflows/     # Scheduled data-refresh automation
├── src/
│   ├── routes/            # Dashboard pages (overview, stats, posts, etc.)
│   ├── components/        # UI components (charts, post cards, etc.)
│   ├── data/
│   │   ├── api.ts         # Real API client used by the deployed app
│   │   └── mockData.ts    # Original mock data (types + local dev fallback)
│   └── hooks/              # Data-fetching hooks
├── public/                 # Static assets (favicon, etc.)
└── vite.config.ts          # Build config (TanStack Start + Vercel/Nitro)
```

---

## Running it locally

### 1. Set up the database
Create a free [Neon](https://neon.tech) Postgres project and copy its connection string.

### 2. Backend

```sh
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
```

Pull and score some data, then start the API:

```sh
python fetch_hn_data.py
python score_sentiment.py
uvicorn api:app --reload --port 8000
```

### 3. Frontend

```sh
bun install    # or npm install
bun run dev    # or npm run dev
```

The frontend reads `VITE_API_URL` from its own `.env` (defaults to `http://localhost:8000` if unset).

---

## Deployment

| Piece | Hosted on | Notes |
|---|---|---|
| Database | Neon | Free tier, no expiration |
| Backend API | Render | Free tier, cold starts after 15 min idle |
| Frontend | Vercel | Auto-deploys on push |
| Data refresh | GitHub Actions | Scheduled every 4 hours, writes directly to Neon |

Environment variables needed on each platform:
- **Render:** `DATABASE_URL`, `GEMINI_API_KEY`
- **Vercel:** `VITE_API_URL` (pointing at your Render backend URL)
- **GitHub Actions secrets:** `DATABASE_URL`, `GEMINI_API_KEY`

---

## What I'd improve next

- Add a rolling refresh on the frontend so new data appears without a manual page reload
- Expand beyond Hacker News to a second data source for comparison
- Add historical trend detection (e.g. flag unusual sentiment spikes automatically)

---

## Notes on building this

This project went through a few real pivots worth mentioning: an initial plan to use Reddit's API was dropped after hitting developer approval friction, in favor of Hacker News' fully open API. The database also migrated from SQLite to Postgres partway through, once it became clear a live, automatically-updating site needed a database that didn't require redeploying on every data refresh.