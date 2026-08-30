# Hacker Insights Dashboard

Build a production-ready interactive React dashboard for AI-company Hacker News sentiment analytics. Use a modern dark glassmorphism aesthetic: #09090b deep zinc/slate base, multi-layer backdrop blurs, translucent white/10 borders, ambient radial violet/cyan/emerald glows, crisp typography, neon accents. Use Tailwind, Framer Motion, Lucide icons, Recharts (or shadcn components if helpful). Implement responsive routes/sections for /stats, /daily-sentiment, /top-posts, and /posts, plus an intuitive main dashboard navigation. Create organized mockData.ts with functional mock responses/data for all endpoints.

Required UX: (1) Hero/stats: Total Posts Analyzed, Average Sentiment Score, Date Range with smooth count-up animation on load and a glowing live refresh badge, pulsing green dot, "Last updated: X mins ago". (2) Daily Sentiment: responsive animated area/line chart with gradient fill, hover data points, glass tooltip containing date, score, posts. (3) Top posts: positive/negative segmented toggle or two columns; cards animate in on scroll; card includes title, sentiment badge score, concise reason, and outbound Hacker News link. (4) All Posts explorer: keyword/topic filter for Claude/Gemini/OpenAI, sentiment range filters, filterable grid/list; cards have subtle 3D perspective/tilt hover behavior. (5) Skeleton shimmer loading states for every component, custom empty/error states with a Try Again button. (6) Animate route/tab transitions with AnimatePresence. Ensure the dashboard is fully usable out of the box, responsive, accessible, and highly polished without relying on external APIs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c0bed74-9644-4d2b-8d74-7e0acfd696a3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
