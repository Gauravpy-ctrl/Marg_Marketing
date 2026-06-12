"use client";

import { useState } from "react";
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
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px" }}>
      <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: "13px" }}>
          ROAS: {Number(p.value || 0).toFixed(2)}x
        </p>
      ))}
    </div>
  );
};

const truncate = (str, n = 22) => str.length > n ? `${str.slice(0, n)}…` : str;

const FILTER_TABS = [
  { key: "all",             label: "All"            },
  { key: "top",             label: "Scale"          },
  { key: "moderate",       label: "Monitor"        },
  { key: "underperforming", label: "Underperforming" },
  { key: "waste",           label: "Pause"          },
];

export default function CampaignAnalytics({ campaignBreakdown = [] }) {
  const [activeFilter, setActiveFilter] = useState("all");

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

  const totalSpend = campaignBreakdown.reduce((s, c) => s + (c.spend || 0), 0);

  const topCampaigns   = campaignBreakdown.filter((c) => c.status === "top");
  const underCampaigns = campaignBreakdown.filter((c) => c.status === "underperforming" || c.status === "waste");
  const filtered       = activeFilter === "all"
    ? campaignBreakdown
    : campaignBreakdown.filter((c) => c.status === activeFilter);

  const sectionHeading = { color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "6px" };
  const sectionSub     = { color: "#64748b", fontSize: "13px", marginBottom: "20px" };

  return (
    <div>

      {/* ── Summary cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "18px",
        marginBottom: "36px",
      }}>
        {[
          { label: "Total Campaigns",  value: campaignBreakdown.length,              color: "#60a5fa" },
          { label: "Scale",            value: statusCounts.top             || 0,      color: "#4ade80" },
          { label: "Monitor",          value: statusCounts.moderate        || 0,      color: "#fbbf24" },
          { label: "Underperforming",  value: statusCounts.underperforming || 0,      color: "#f87171" },
          { label: "Wasted Budget",    value: `${wasteCount} (${fmt(wasteSpend)})`,  color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#0f172a", borderRadius: "16px", padding: "22px",
            border: `1px solid ${color}22`,
          }}>
            <div style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              {label}
            </div>
            <div style={{ color, fontWeight: "800", fontSize: "26px" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── ROAS charts ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
        gap: "24px",
        marginBottom: "40px",
      }}>
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={sectionHeading}>Top 5 Campaigns — ROAS</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top5.map((c) => ({ name: truncate(c.name), roas: c.roas, status: c.status }))} layout="vertical" margin={{ top: 4, right: 50, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                {top5.map((c, i) => <Cell key={i} fill={STATUS_COLOR[c.status] || "#60a5fa"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={sectionHeading}>Bottom 5 Campaigns — ROAS</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bottom5.map((c) => ({ name: truncate(c.name), roas: c.roas, status: c.status }))} layout="vertical" margin={{ top: 4, right: 50, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                {bottom5.map((c, i) => <Cell key={i} fill={STATUS_COLOR[c.status] || "#f87171"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Performing Campaigns ── */}
      {topCampaigns.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
            <h3 style={{ ...sectionHeading, marginBottom: 0 }}>Top Performing Campaigns</h3>
          </div>
          <p style={sectionSub}>These campaigns exceed 4x ROAS — scale budget to maximize revenue.</p>
          {topCampaigns.map((c, i) => (
            <CampaignCard key={`${c.name}-${c.platform}`} campaign={c} rank={i + 1} totalSpend={totalSpend} />
          ))}
        </div>
      )}

      {/* ── Underperforming Campaigns ── */}
      {underCampaigns.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", boxShadow: "0 0 8px #f87171" }} />
            <h3 style={{ ...sectionHeading, marginBottom: 0 }}>Underperforming Campaigns</h3>
          </div>
          <p style={sectionSub}>These campaigns need immediate attention — pause or restructure to stop budget waste.</p>
          {underCampaigns.map((c, i) => (
            <CampaignCard key={`${c.name}-${c.platform}`} campaign={c} rank={i + 1} totalSpend={totalSpend} />
          ))}
        </div>
      )}

      {/* ── All Campaigns with filter ── */}
      <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ ...sectionHeading, marginBottom: "2px" }}>All Campaigns</h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              {filtered.length} of {campaignBreakdown.length} campaigns
            </p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "4px", background: "#080f1c", padding: "5px", borderRadius: "12px", border: "1px solid #1e293b" }}>
            {FILTER_TABS.map((tab) => {
              const count = tab.key === "all"
                ? campaignBreakdown.length
                : (statusCounts[tab.key] || 0);
              const isActive = activeFilter === tab.key;
              const tabColor = { all: "#60a5fa", top: "#4ade80", moderate: "#fbbf24", underperforming: "#f87171", waste: "#f87171" }[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                    fontSize: "12px", fontWeight: "600", fontFamily: "inherit",
                    background: isActive ? "#1e293b" : "transparent",
                    color: isActive ? tabColor : "#475569",
                    transition: "all .15s",
                  }}
                >
                  {tab.label} <span style={{ opacity: 0.6 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "#475569", fontSize: "14px", padding: "20px 0" }}>No campaigns match this filter.</p>
        ) : (
          filtered.map((c, i) => (
            <CampaignCard key={`${c.name}-${c.platform}`} campaign={c} rank={i + 1} totalSpend={totalSpend} />
          ))
        )}
      </div>

    </div>
  );
}
