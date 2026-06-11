"use client";

import { useState } from "react";

const STATUS_STYLE = {
  top:             { bg: "#052e16", color: "#4ade80", border: "#166534" },
  moderate:        { bg: "#0c1a3a", color: "#60a5fa", border: "#1d4ed8" },
  underperforming: { bg: "#1c1500", color: "#fbbf24", border: "#92400e" },
  waste:           { bg: "#200a0a", color: "#f87171", border: "#991b1b" },
};

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const COLUMNS = [
  { key: "name",           label: "Campaign",    numeric: false },
  { key: "platform",       label: "Platform",    numeric: false },
  { key: "spend",          label: "Spend",       numeric: true  },
  { key: "revenue",        label: "Revenue",     numeric: true  },
  { key: "roas",           label: "ROAS",        numeric: true  },
  { key: "ctr",            label: "CTR %",       numeric: true  },
  { key: "conversions",    label: "Conversions", numeric: true  },
  { key: "status",         label: "Status",      numeric: false },
];

export default function CampaignTable({ campaigns = [] }) {
  const [sortKey, setSortKey]     = useState("roas");
  const [sortAsc, setSortAsc]     = useState(false);
  const [filter, setFilter]       = useState("");

  if (!campaigns.length) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "16px" }}>
        No campaign data available.
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = campaigns.filter((c) => {
    const q = filter.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q) || c.status.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    const isNum = typeof av === "number";
    if (isNum) return sortAsc ? av - bv : bv - av;
    return sortAsc
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const renderCell = (col, row) => {
    switch (col.key) {
      case "spend":
      case "revenue":
        return fmt(row[col.key]);
      case "roas":
        return `${Number(row.roas || 0).toFixed(2)}x`;
      case "ctr":
        return `${Number(row.ctr || 0).toFixed(2)}%`;
      case "conversions":
        return Number(row.conversions || 0).toLocaleString();
      case "status": {
        const s = STATUS_STYLE[row.status] || STATUS_STYLE.waste;
        return (
          <span style={{
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            borderRadius: "8px", padding: "3px 10px",
            fontSize: "12px", fontWeight: "600", textTransform: "capitalize",
          }}>
            {row.status}
          </span>
        );
      }
      default:
        return row[col.key];
    }
  };

  return (
    <div>
      {/* Filter */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Filter by campaign, platform, or status…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: "10px",
            padding: "10px 16px", color: "white", fontSize: "14px",
            width: "100%", maxWidth: "400px", outline: "none",
          }}
        />
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "16px" }}>
          {sorted.length} / {campaigns.length} campaigns
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: "12px 16px",
                    textAlign: col.numeric ? "right" : "left",
                    color: sortKey === col.key ? "#60a5fa" : "#94a3b8",
                    fontWeight: "600", fontSize: "12px",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: "1px solid #1e293b",
                    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: "4px" }}>{sortAsc ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={`${row.name}-${row.platform}`}
                style={{
                  background: i % 2 === 0 ? "#0f172a" : "#111827",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0f172a" : "#111827")}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      textAlign: col.numeric ? "right" : "left",
                      color: col.key === "name" ? "white" : "#cbd5e1",
                      fontWeight: col.key === "name" ? "600" : "400",
                      borderBottom: "1px solid #1e293b11",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
