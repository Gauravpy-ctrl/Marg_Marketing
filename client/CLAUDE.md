
@AGENTS.md

# AI Memory Tree System

This project includes an advanced AI Memory Tree / Knowledge Graph system.

Goal:
Build an interactive memory visualization for marketing analytics relationships.

Tech:
- React Flow
- Next.js
- Tailwind CSS
- Recharts
- AI-driven node generation

Memory Tree Features:
- Campaign relationship mapping
- KPI relationship visualization
- AI recommendation chains
- Anomaly detection visualization
- Budget optimization graph
- Interactive node system

Node Types:
- Campaign
- KPI
- Insight
- Warning
- Recommendation
- Opportunity
- Audience
- Region

Relationships:
- High CTR → High Conversion
- Low ROAS → Budget Waste
- High Spend → Optimization Required
- Strong Campaign → Scale Budget
- Poor Audience → Weak Performance

UI Requirements:
- Enterprise dark dashboard
- Premium SaaS design
- Neon blue/purple glow
- Interactive graph
- Animated edges
- Zoom + drag
- Mini-map
- Search/filter support
- Glassmorphism panels

Folder Structure:
app/components/memory/
  ├── MemoryMap.jsx
  ├── MemoryNode.jsx
  ├── MemoryEdge.jsx
  ├── InsightPanel.jsx
  └── graphGenerator.js

Design Inspiration:
- Palantir
- OpenAI
- Notion AI
- Vercel Analytics
- Enterprise AI dashboards

Data Rules:
- Dynamically generate graph from analytics data
- Handle empty data safely
- Prevent rendering crashes
- Optimize rendering performance

Important:
The memory system should feel like an AI reasoning engine, not a basic chart.