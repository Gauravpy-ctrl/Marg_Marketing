# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Client (Next.js) — run from `client/`:**
```
npm run dev      # dev server on port 3000
npm run build    # production build
npm run lint     # ESLint (flat config, Next.js + TypeScript rules)
```

**Server (Express) — run from `server/`:**
```
npm run dev      # nodemon on port 5000
```

Both must run simultaneously. There is no root-level package.json or workspace orchestration — start each independently.

**Manual test scripts (server):**
```
node src/testAI.js              # test AI insight generation in isolation
node src/testFullPipeline.js    # test end-to-end data pipeline
```

## Architecture

Monorepo with two apps and a standalone service:

```
client/     Next.js 16 + React 19 + Tailwind 4 + Recharts
server/     Express 5 + Node.js (CommonJS)
services/   Standalone OpenAI-based AI service (separate from server/src/services/)
```

### Server data pipeline

`POST /api/analyze` (multipart: `googleFile`, `metaFile` CSVs) → `analyzeController.js`:

1. `cleaners/googleAdsCleaner.js` — normalize Google Ads CSV fields
2. `cleaners/metaAdsCleaner.js` — normalize Meta Ads CSV fields
3. `merge/mergeEngine.js` + `schema/unifiedSchemaMapper.js` — join into unified schema
4. `analytics/analyticsEngine.js` + `kpi/kpiEngine.js` — compute ROAS, CTR, CPC, CPA, etc.
5. `ai/aiInsightGenerator.js` → `ai/openRouterClient.js` → OpenRouter API (Claude) — generate strategic insights
6. JSON response with KPIs, analytics, and AI insights

### Client page structure

`client/app/page.js` (main dashboard, ~972 lines) composes:
- `UploadForm.jsx` — CSV upload, calls `http://localhost:5000/api/analyze`
- `KPIcards.js` — metric summary cards
- `AdvancedCharts.jsx` — Recharts visualizations (Bar, Pie, Line, Scatter, Radar)
- `AIInsights.jsx` — renders AI-generated markdown insights

## Key Configuration

**Server env** (`server/.env`):
- `OPENROUTER_API_KEY` — required for AI insights
- `PORT` — defaults to 5000

**Next.js** (`client/next.config.ts`): Check before adding new Next.js APIs — this is Next.js 16 with breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing Next.js-specific code (see `client/AGENTS.md`).

Uploaded CSV files are temporarily written to `server/src/uploads/` (gitignored).
