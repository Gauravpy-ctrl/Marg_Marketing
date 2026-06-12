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
import CampaignTable from "./CampaignTable";

const STATUS_COLOR = {
  top:             "#4ade80",
  moderate:        "#60a5fa",
  underperforming: "#fbbf24",
  waste:           "#f87171",
};

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: "10px", padding: "12px 16px",
    }}>
      <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: "13px" }}>
          ROAS: {Number(p.value || 0).toFixed(2)}x
        </p>
      ))}
    </div>
  );
};

const truncate = (str, n = 22) =>
  str.length > n ? `${str.slice(0, n)}…` : str;

export default function CampaignAnalytics({ campaignBreakdown = [] }) {
  if (!campaignBreakdown.length) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontSize: "16px" }}>
        No campaign data available. Upload CSV files to see campaign analytics.
      </div>
    );
  }

  const top5    = campaignBreakdown.slice(0, 5);
  const bottom5 = [...campaignBreakdown].reverse().slice(0, 5);

  const wasteCount = campaignBreakdown.filter((c) => c.status === "waste").length;
  const wasteSpend = campaignBreakdown
    .filter((c) => c.status === "waste")
    .reduce((s, c) => s + (c.spend || 0), 0);

  const statusCounts = campaignBreakdown.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "36px",
      }}>
        {[
          { label: "Total Campaigns",   value: campaignBreakdown.length, color: "#60a5fa" },
          { label: "Top Performers",    value: statusCounts.top             || 0, color: "#4ade80" },
          { label: "Moderate",          value: statusCounts.moderate        || 0, color: "#60a5fa" },
          { label: "Underperforming",   value: statusCounts.underperforming || 0, color: "#fbbf24" },
          { label: "Wasted Budget",     value: `${wasteCount} (${fmt(wasteSpend)})`, color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#0f172a", borderRadius: "16px", padding: "22px",
            border: `1px solid ${color}22`,
          }}>
            <div style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              {label}
            </div>
            <div style={{ color, fontWeight: "800", fontSize: "26px" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Top 5 / Bottom 5 charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
        gap: "24px",
        marginBottom: "36px",
      }}>

        {/* Top 5 */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            Top 5 Campaigns — ROAS
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={top5.map((c) => ({ name: truncate(c.name), roas: c.roas, status: c.status }))}
              layout="vertical"
              margin={{ top: 4, right: 50, bottom: 4, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                {top5.map((c, i) => (
                  <Cell key={i} fill={STATUS_COLOR[c.status] || "#60a5fa"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom 5 */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            Bottom 5 Campaigns — ROAS
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={bottom5.map((c) => ({ name: truncate(c.name), roas: c.roas, status: c.status }))}
              layout="vertical"
              margin={{ top: 4, right: 50, bottom: 4, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                {bottom5.map((c, i) => (
                  <Cell key={i} fill={STATUS_COLOR[c.status] || "#f87171"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Full table */}
      <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
        <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
          All Campaigns
        </h3>
        <CampaignTable campaigns={campaignBreakdown} />
      </div>
    </div>
  );
}
