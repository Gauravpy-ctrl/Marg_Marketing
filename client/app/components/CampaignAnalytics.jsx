"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import CampaignCard from "./CampaignCard";

const STATUS_COLOR = {
  top:             "#4ade80",
  moderate:        "#fbbf24",
  underperforming: "#f87171",
  waste:           "#f87171",
};

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const truncate = (str, n = 20) => (str.length > n ? `${str.slice(0, n)}…` : str);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px" }}>
      <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p style={{ color: payload[0].color, fontSize: 13 }}>
        ROAS: {Number(payload[0].value || 0).toFixed(2)}x
      </p>
    </div>
  );
};

export default function CampaignAnalytics({ campaignBreakdown = [] }) {
  if (!campaignBreakdown.length) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#64748b", fontSize: 16 }}>
        No campaign data available. Upload CSV files to see campaign analytics.
      </div>
    );
  }

  const top5    = campaignBreakdown.slice(0, 5);
  const bottom5 = [...campaignBreakdown].reverse().slice(0, 5);

  const wasteSpend = campaignBreakdown
    .filter((c) => c.status === "waste")
    .reduce((s, c) => s + (c.spend || 0), 0);

  const statusCounts = campaignBreakdown.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* ── Summary KPI cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { label: "Total Campaigns",  value: campaignBreakdown.length,           color: "#60a5fa" },
          { label: "Scale",            value: statusCounts.top             || 0,   color: "#4ade80" },
          { label: "Monitor",          value: statusCounts.moderate        || 0,   color: "#fbbf24" },
          { label: "Underperforming",  value: statusCounts.underperforming || 0,   color: "#f87171" },
          { label: "Wasted Budget",    value: fmt(wasteSpend),                     color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#0f172a", borderRadius: 14, padding: "20px 22px",
            border: `1px solid ${color}22`,
          }}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ color, fontWeight: 800, fontSize: 24 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── ROAS bar charts ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
        marginBottom: 32,
      }}>
        {[
          { title: "Top 5 Campaigns — ROAS",    data: top5    },
          { title: "Bottom 5 Campaigns — ROAS", data: bottom5 },
        ].map(({ title, data }) => (
          <div key={title} style={{ background: "#0f172a", borderRadius: 18, padding: "24px 28px", border: "1px solid #1e293b" }}>
            <h3 style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.map((c) => ({ name: truncate(c.name), roas: c.roas, status: c.status }))}
                layout="vertical"
                margin={{ top: 4, right: 44, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                  {data.map((c, i) => (
                    <Cell key={i} fill={STATUS_COLOR[c.status] || "#60a5fa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* ── Campaign Performance — reference-style expandable cards ── */}
      <div style={{ background: "#0f172a", borderRadius: 18, padding: "24px 28px", border: "1px solid #1e293b" }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: "#f1f5f9", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            Campaign Performance
          </h3>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Detailed insights into each marketing campaign.
          </p>
        </div>

        {campaignBreakdown.map((c) => (
          <CampaignCard key={`${c.name}-${c.platform}`} campaign={c} />
        ))}
      </div>
    </div>
  );
}
