"use client";
import { useState } from "react";

const STATUS = {
  top:             { roiColor: "#4ade80" },
  moderate:        { roiColor: "#fbbf24" },
  underperforming: { roiColor: "#f87171" },
  waste:           { roiColor: "#f87171" },
};

const PLAT_COLOR = {
  "Google Ads":       "#3b82f6",
  "Facebook":         "#8b5cf6",
  "Instagram":        "#ec4899",
  "Audience Network": "#10b981",
};

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

function getPlan(c) {
  if (c.roas >= 5)
    return `Maximize revenue from this top-performing ${c.platform} campaign by scaling budget 25–30% and expanding to similar high-intent audience segments.`;
  if (c.roas >= 4)
    return `Scale this ${c.platform} campaign aggressively — ROAS of ${c.roas.toFixed(1)}x demonstrates strong efficiency. Increase budget and broaden reach.`;
  if (c.roas >= 2)
    return `Optimize ${c.platform} targeting to push ROAS from ${c.roas.toFixed(1)}x toward the 4x benchmark. Focus on high-converting segments and pause underperformers.`;
  if (c.roas < 1)
    return `Pause this ${c.platform} campaign immediately — ROAS of ${c.roas.toFixed(2)}x means negative ROI. Restructure targeting and creative before resuming spend.`;
  return `Improve ${c.platform} campaign efficiency. With ROAS at ${c.roas.toFixed(1)}x, tighten audience targeting and refresh creatives to drive profitable conversions.`;
}

function getProcedure(c) {
  const p = c.platform;
  if (p === "Google Ads") {
    if (c.roas >= 4)
      return "Raise bid caps on top keywords by 20%. Expand to exact-match variations. Layer RLSA audiences for returning visitors to capture high-intent repeat traffic.";
    if (c.roas >= 2)
      return "Add negative keywords to cut wasted spend. Switch underperforming ad groups to target-CPA bidding. Test 2–3 new headline variants in responsive search ads.";
    return "Halt broad-match campaigns. Focus budget on exact-match converters only. Improve landing page relevance scores and Quality Scores above 7/10.";
  }
  if (p === "Facebook" || p === "Instagram") {
    if (c.roas >= 4)
      return "Duplicate winning ad sets with a scaled budget. Build 1% lookalike audiences from purchasers. Test short-form video creatives alongside top static image ads.";
    if (c.roas >= 2)
      return "Narrow audiences by tightening age bands and interest clusters. Refresh creatives older than 3 weeks. Reduce frequency below 3 to prevent audience fatigue.";
    return "Pause all active ad sets. Audit audience overlap across campaigns. Rebuild from a retargeting-first approach using warm audiences only.";
  }
  if (c.roas >= 4)
    return "Increase budget allocation by 20–30%. Expand placements to additional channels. Track attribution across the full funnel to protect ROAS at scale.";
  return "Audit placement performance and pause bottom-20% ad sets. Reallocate budget to top-performing creatives. Review attribution window settings.";
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 8,
};

export default function CampaignCard({ campaign: c }) {
  const [open, setOpen] = useState(false);

  const st = STATUS[c.status] || STATUS.underperforming;
  const pc = PLAT_COLOR[c.platform] || "#64748b";
  const roi = Math.round((c.roas - 1) * 100);

  return (
    <div style={{
      background: "#080f1c",
      borderRadius: 12,
      border: `1px solid ${open ? "#334155" : "#1e293b"}`,
      marginBottom: 8,
      overflow: "hidden",
      transition: "border-color .2s",
    }}>
      {/* ── Collapsed header ── */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          userSelect: "none",
        }}
      >
        {/* Left: name + meta */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 6 }}>
            {c.name}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              background: `${pc}18`, color: pc,
              border: `1px solid ${pc}30`, borderRadius: 5,
              padding: "2px 8px", fontSize: 11, fontWeight: 600,
            }}>{c.platform}</span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              &#8857; {c.conversions.toLocaleString()} Leads
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              $ {fmt(c.spend)} Budget
            </span>
          </div>
        </div>

        {/* Right: ROI */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: st.roiColor, lineHeight: 1 }}>
            {roi}%
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
            ROI (Target: 200%)
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          color: "#475569", fontSize: 11, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform .2s",
        }}>▼</div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "20px 22px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px 32px",
          }}>
            {/* Plan */}
            <div>
              <div style={labelStyle}>Plan</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>
                {getPlan(c)}
              </p>
            </div>

            {/* Procedure */}
            <div>
              <div style={labelStyle}>Procedure</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>
                {getProcedure(c)}
              </p>
            </div>

            {/* Platforms */}
            <div>
              <div style={labelStyle}>Platforms</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{
                  background: `${pc}18`, color: pc,
                  border: `1px solid ${pc}30`, borderRadius: 6,
                  padding: "4px 11px", fontSize: 12, fontWeight: 600,
                }}>{c.platform}</span>
              </div>
            </div>

            {/* Performance */}
            <div>
              <div style={labelStyle}>Team Involved</div>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[
                  ["ROAS",      c.roas.toFixed(2) + "x",            st.roiColor],
                  ["CTR",       c.ctr.toFixed(2) + "%",             "#f1f5f9"],
                  ["Conv Rate", c.conversionRate.toFixed(2) + "%",  "#f1f5f9"],
                  ["CPC",       fmt(c.cpc),                         "#f1f5f9"],
                ].map(([l, v, col]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
