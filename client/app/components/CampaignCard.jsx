"use client";

import { useState } from "react";

// ── Status config ────────────────────────────────────────
const STATUS = {
  top:             { label: "Scale",   color: "#4ade80", bg: "#052e16", border: "#166534" },
  moderate:        { label: "Monitor", color: "#fbbf24", bg: "#1c1500", border: "#92400e" },
  underperforming: { label: "Pause",   color: "#f87171", bg: "#200a0a", border: "#991b1b" },
  waste:           { label: "Pause",   color: "#f87171", bg: "#200a0a", border: "#991b1b" },
};

const PLATFORM_COLOR = {
  "Google Ads":       "#3b82f6",
  "Facebook":         "#8b5cf6",
  "Instagram":        "#ec4899",
  "Audience Network": "#10b981",
};

const PLATFORM_DESC = {
  "Google Ads":       "Intent-based search and display advertising",
  "Facebook":         "Interest and demographic-based social advertising",
  "Instagram":        "Visual and story-driven social advertising",
  "Audience Network": "Extended reach across Meta's partner apps and sites",
};

// ── Helpers ──────────────────────────────────────────────
const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

// ── AI insight generator (client-side, no API) ───────────
const generateInsight = (c) => {
  if (c.roas >= 5)
    return "Exceptional ROAS — this is a top revenue driver. Scale budget aggressively to capture more market share before competitors do.";
  if (c.roas >= 4 && c.ctr >= 3)
    return "Strong ROAS and CTR — campaign is at peak efficiency. Increase budget 20–30% while monitoring ROAS stability.";
  if (c.roas >= 4)
    return "Strong ROAS — consistent efficiency above the 4x threshold. Consider scaling budget to grow revenue volume.";
  if (c.ctr >= 2 && (c.conversionRate || 0) < 2)
    return "Good CTR but weak conversion rate — ad creative is engaging, but the landing page is losing intent. A/B test landing pages immediately.";
  if (c.roas >= 2 && c.ctr < 1.5)
    return "Moderate ROAS with low CTR — improve audience targeting and creative quality to push toward top-tier performance.";
  if (c.roas >= 2)
    return "Moderate performance — profitable but below potential. Tighten audience segmentation and improve creative to push ROAS above 4x.";
  if (c.spend > 3000 && c.conversions < 50)
    return "High spend with low conversions — budget is burning without results. Pause and restructure targeting, creative, and bidding strategy.";
  if (c.roas < 1)
    return "Budget waste detected — spend exceeds revenue. Immediate pause recommended pending a full audit of audience, creative, and landing page.";
  return "Underperforming against portfolio benchmarks. Reduce budget while reviewing audience, ad creative, and landing page before scaling.";
};

const getStrengths = (c) => {
  const s = [];
  if (c.roas >= 4)
    s.push(`Exceptional ROAS of ${c.roas.toFixed(2)}x — well above the 4x benchmark`);
  else if (c.roas >= 2)
    s.push(`Profitable ROAS of ${c.roas.toFixed(2)}x — above break-even`);
  if (c.ctr >= 3)
    s.push(`High CTR of ${c.ctr.toFixed(2)}% — strong creative resonance with the audience`);
  if ((c.conversionRate || 0) >= 5)
    s.push(`High conversion rate of ${(c.conversionRate || 0).toFixed(2)}%`);
  if (c.cpc > 0 && c.cpc <= 1.5)
    s.push(`Efficient CPC at ${fmt(c.cpc)} — low cost per click`);
  if (c.conversions >= 200)
    s.push(`Strong volume: ${c.conversions.toLocaleString()} total conversions`);
  if (!s.length)
    s.push("No significant strengths at current performance levels");
  return s;
};

const getOpportunities = (c) => {
  const o = [];
  if (c.roas < 1)
    o.push("ROAS below 1x — generating a net loss. Immediate structural review required.");
  else if (c.roas < 2)
    o.push("ROAS below 2x target — review bidding strategy and audience quality.");
  if (c.ctr < 1)
    o.push("CTR below 1% — improve ad creative and tighten audience targeting.");
  if ((c.conversionRate || 0) < 3 && c.ctr >= 2)
    o.push("CTR-to-conversion gap — optimise landing page for intent alignment.");
  if (c.cpc > 3)
    o.push("High CPC — add negative keywords or narrow audience targeting.");
  if (c.conversions < 30 && c.status !== "waste")
    o.push("Low conversion volume — expand audience reach or increase bid aggressiveness.");
  if (!o.length)
    o.push("Performance is solid — maintain efficiency while scaling volume.");
  return o;
};

// ── Component ────────────────────────────────────────────
export default function CampaignCard({ campaign: c, rank, totalSpend = 0 }) {
  const [open, setOpen] = useState(false);

  const st      = STATUS[c.status] || STATUS.underperforming;
  const pc      = PLATFORM_COLOR[c.platform] || "#64748b";
  const insight = generateInsight(c);
  const strengths = getStrengths(c);
  const opps    = getOpportunities(c);
  const roasPct = Math.min((c.roas / 8) * 100, 100);
  const spendPct = totalSpend > 0 ? ((c.spend / totalSpend) * 100).toFixed(1) : "0.0";

  let budgetAction, budgetActionColor, budgetDesc;
  if (c.status === "top") {
    budgetAction = "Increase 20–30%"; budgetActionColor = "#4ade80";
    budgetDesc = "Proven efficiency — scaling is the recommended next step.";
  } else if (c.status === "moderate") {
    budgetAction = "Hold Current"; budgetActionColor = "#fbbf24";
    budgetDesc = "Monitor performance before committing additional budget.";
  } else if (c.status === "underperforming") {
    budgetAction = "Reduce 30%"; budgetActionColor = "#f87171";
    budgetDesc = "Reduce spend until optimisations show measurable improvement.";
  } else {
    budgetAction = "Pause Immediately"; budgetActionColor = "#f87171";
    budgetDesc = "Halt spend — this campaign generates negative ROI.";
  }

  // Style tokens
  const sectionStyle = { padding: "18px 22px", borderTop: "1px solid #1e293b" };
  const sLabel = { fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" };
  const metricBox = { background: "#080f1c", borderRadius: "10px", padding: "12px 14px" };
  const mLabel = { fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" };
  const mValue = { fontSize: "18px", fontWeight: "800", color: "#f1f5f9", lineHeight: 1 };

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      border: `1px solid ${open ? st.border : "#1e293b"}`,
      overflow: "hidden",
      marginBottom: "10px",
      transition: "border-color .2s",
    }}>

      {/* ── Collapsed row ── */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "14px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
          userSelect: "none",
        }}
      >
        {/* Rank */}
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", minWidth: "22px" }}>
          #{rank}
        </span>

        {/* Status dot */}
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: st.color, flexShrink: 0, boxShadow: `0 0 6px ${st.color}88`,
        }} />

        {/* Campaign name */}
        <span style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", flex: 1, minWidth: "140px" }}>
          {c.name}
        </span>

        {/* Platform tag */}
        <span style={{
          background: `${pc}18`, color: pc, border: `1px solid ${pc}30`,
          borderRadius: "7px", padding: "3px 10px", fontSize: "11px", fontWeight: "600", flexShrink: 0,
        }}>
          {c.platform}
        </span>

        {/* Inline metrics */}
        {[
          { l: "Spend",   v: fmt(c.spend)             },
          { l: "Revenue", v: fmt(c.revenue)            },
          { l: "ROAS",    v: `${c.roas.toFixed(2)}x`  },
          { l: "CTR",     v: `${c.ctr.toFixed(2)}%`   },
          { l: "Conv",    v: c.conversions.toLocaleString() },
        ].map(({ l, v }) => (
          <div key={l} style={{ textAlign: "center", minWidth: "56px" }}>
            <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f1f5f9" }}>{v}</div>
          </div>
        ))}

        {/* Status badge */}
        <span style={{
          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          borderRadius: "8px", padding: "4px 12px",
          fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", flexShrink: 0,
        }}>
          {st.label}
        </span>

        {/* Chevron */}
        <span style={{
          color: "#334155", fontSize: "11px", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s",
        }}>▼</span>
      </div>

      {/* ── Expanded sections ── */}
      {open && (
        <>
          {/* Campaign Summary */}
          <div style={sectionStyle}>
            <div style={sLabel}>Campaign Summary</div>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.8", margin: 0 }}>
              <strong style={{ color: "#f1f5f9" }}>{c.name}</strong> is a{" "}
              <strong style={{ color: pc }}>{c.platform}</strong> campaign spending{" "}
              <strong style={{ color: "#f1f5f9" }}>{fmt(c.spend)}</strong> and generating{" "}
              <strong style={{ color: "#f1f5f9" }}>{fmt(c.revenue)}</strong> in revenue —
              a ROAS of <strong style={{ color: st.color }}>{c.roas.toFixed(2)}x</strong>.
              It has delivered <strong style={{ color: "#f1f5f9" }}>{c.conversions.toLocaleString()}</strong> conversions
              at a CTR of <strong style={{ color: "#f1f5f9" }}>{c.ctr.toFixed(2)}%</strong>.
              Current recommendation:{" "}
              <strong style={{ color: st.color }}>{st.label}</strong>.
            </p>
          </div>

          {/* Performance Metrics */}
          <div style={sectionStyle}>
            <div style={sLabel}>Performance Metrics</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px", marginBottom: "16px",
            }}>
              {[
                { l: "ROAS",         v: `${c.roas.toFixed(2)}x`,                         color: st.color    },
                { l: "CTR",          v: `${c.ctr.toFixed(2)}%`,                           color: "#f1f5f9"  },
                { l: "CPC",          v: fmt(c.cpc),                                        color: "#f1f5f9"  },
                { l: "Conv Rate",    v: `${(c.conversionRate || 0).toFixed(2)}%`,          color: "#f1f5f9"  },
                { l: "Conversions",  v: c.conversions.toLocaleString(),                    color: "#f1f5f9"  },
                { l: "Net P&L",      v: fmt(c.revenue - c.spend),
                  color: c.revenue >= c.spend ? "#4ade80" : "#f87171" },
              ].map(({ l, v, color }) => (
                <div key={l} style={metricBox}>
                  <div style={mLabel}>{l}</div>
                  <div style={{ ...mValue, color }}>{v}</div>
                </div>
              ))}
            </div>
            {/* ROAS gauge */}
            <div style={{ marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "6px" }}>
                <span>ROAS Performance</span>
                <span style={{ color: st.color, fontWeight: "700" }}>{c.roas.toFixed(2)}x / 8x</span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${roasPct}%`, background: st.color, borderRadius: "99px" }} />
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ ...sectionStyle, background: "rgba(59,130,246,0.04)" }}>
            <div style={sLabel}>AI Recommendation</div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0,
                background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", color: "#60a5fa",
              }}>✦</div>
              <p style={{ fontSize: "14px", color: "#93c5fd", lineHeight: "1.8", margin: 0 }}>
                {insight}
              </p>
            </div>
          </div>

          {/* Budget Allocation */}
          <div style={sectionStyle}>
            <div style={sLabel}>Budget Allocation</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
              <div style={{ ...metricBox, flex: 1, minWidth: "110px" }}>
                <div style={mLabel}>Portfolio Share</div>
                <div style={mValue}>{spendPct}%</div>
              </div>
              <div style={{ ...metricBox, flex: 2, minWidth: "160px" }}>
                <div style={mLabel}>Recommended Action</div>
                <div style={{ ...mValue, color: budgetActionColor, fontSize: "16px" }}>{budgetAction}</div>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.65", margin: 0 }}>{budgetDesc}</p>
          </div>

          {/* Key Strengths + Improvement Opportunities */}
          <div style={{
            ...sectionStyle,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}>
            <div>
              <div style={sLabel}>Key Strengths</div>
              {strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>
                  <span style={{ color: "#4ade80", flexShrink: 0, marginTop: "2px" }}>✓</span>
                  {s}
                </div>
              ))}
            </div>
            <div>
              <div style={sLabel}>Improvement Opportunities</div>
              {opps.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>
                  <span style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }}>→</span>
                  {o}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Information */}
          <div style={sectionStyle}>
            <div style={sLabel}>Platform Information</div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: pc, boxShadow: `0 0 8px ${pc}`,
              }} />
              <span style={{ color: pc, fontWeight: "700", fontSize: "14px" }}>{c.platform}</span>
              <span style={{ color: "#334155" }}>·</span>
              <span style={{ color: "#64748b", fontSize: "13px" }}>
                {PLATFORM_DESC[c.platform] || "Advertising platform"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
