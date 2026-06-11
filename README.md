# Marketing AI Engine

Enterprise AI-powered marketing analytics platform. Upload Google Ads + Meta Ads CSV exports and get instant KPI analysis, platform comparisons, and AI-generated strategic insights.

---

## Project Structure

```
marketing-ai-engine/
├── client/          # Next.js 16 frontend (React 19, Tailwind 4, Recharts, React Flow)
└── server/          # Express 5 backend (Node.js, OpenRouter AI)
```

---

## Quick Start

Both servers must run simultaneously. Start each in a separate terminal.

### 1. Backend (port 5000)

```bash
cd server
npm install
# Create server/.env with your API key (see Environment Variables below)
npm run dev
```

### 2. Frontend (port 3000)

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `server/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=5000
SITE_URL=http://localhost:3000
SITE_NAME=Marketing AI Engine
```

Get a free API key at [openrouter.ai](https://openrouter.ai)

---

## Features

- **CSV Upload** — Google Ads + Meta Ads CSV files
- **KPI Dashboard** — ROAS, CTR, CPC, CPA, conversion rate, platform split
- **Charts** — Revenue vs Spend, Pie, Funnel, Scatter, Area, Radar
- **AI Memory Tree** — Interactive React Flow graph of campaign relationships and insights
- **AI Insights** — Executive-level strategic analysis via Claude (OpenRouter)

---

## Tech Stack

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Frontend | Next.js 16, React 19, Tailwind 4, Recharts, @xyflow/react |
| Backend  | Express 5, Node.js, csv-parser, multer     |
| AI       | OpenRouter API (Claude)                    |

---

## API

`POST /api/analyze` — multipart form with `googleFile` and `metaFile` CSV fields.

Returns:
```json
{
  "success": true,
  "kpis": { "totalSpend": 0, "totalRevenue": 0, "overallROAS": 0, "..." },
  "insights": "# Executive Summary\n..."
}
```
