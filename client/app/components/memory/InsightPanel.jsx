"use client";

const STATUS_INFO = {
  good: { label: "Performing Well", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  warning: { label: "Needs Attention", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  danger: { label: "Critical Alert", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  neutral: { label: "Informational", color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" },
  insight: { label: "AI Insight", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  opportunity: { label: "Growth Opportunity", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  hub: { label: "Central Node", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
};

const METRIC_GUIDE = {
  roas: {
    name: "Return on Ad Spend",
    desc: "Revenue generated per dollar of ad spend. Above 4x is excellent; below 2x signals inefficiency.",
    benchmark: "Industry avg: 2–4x",
  },
  spend: {
    name: "Ad Spend",
    desc: "Total budget allocated to this platform. Monitor against revenue to ensure positive ROI.",
    benchmark: "Track weekly for budget pacing",
  },
  revenue: {
    name: "Attributed Revenue",
    desc: "Revenue directly attributed to ad-driven conversions on this platform.",
    benchmark: "Should exceed spend for positive ROAS",
  },
  conversions: {
    name: "Total Conversions",
    desc: "Count of completed goal actions (purchases, sign-ups, leads) driven by ads.",
    benchmark: "Higher volume improves statistical confidence",
  },
  conversion: {
    name: "Conversion Rate",
    desc: "Percentage of clicks that result in a conversion. Formula: conversions / clicks × 100.",
    benchmark: "E-commerce avg: 1–3%. Above 3% is strong.",
  },
  ctr: {
    name: "Click-Through Rate",
    desc: "Percentage of ad impressions that result in clicks. Reflects ad relevance and creative quality.",
    benchmark: "Display avg: 0.1–0.3%. Search avg: 2–5%.",
  },
};

const TYPE_LABEL = {
  hub: "Central Hub",
  platform: "Ad Platform",
  kpi: "KPI Metric",
  insight: "AI Insight",
  warning: "Performance Warning",
  recommendation: "Recommendation",
};

export default function InsightPanel({ node, onClose }) {
  if (!node) return null;

  const { type, data } = node;
  const status = data?.status || "neutral";
  const statusInfo = STATUS_INFO[status] || STATUS_INFO.neutral;
  const guide = METRIC_GUIDE[data?.metric];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "290px",
        height: "100%",
        background: "rgba(6,13,26,0.97)",
        borderLeft: "1px solid #1a2f50",
        backdropFilter: "blur(20px)",
        zIndex: 20,
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Close */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", color: "#3b82f6", letterSpacing: "0.12em" }}>
          NODE INSPECTOR
        </span>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid #1e3a5f",
            borderRadius: "8px",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "4px 10px",
            fontSize: "13px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Type + Status */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", letterSpacing: "0.08em" }}>
          {TYPE_LABEL[type] || type.toUpperCase()}
        </div>
        <h3 style={{ color: "white", fontSize: "20px", fontWeight: "800", lineHeight: 1.2, margin: 0 }}>
          {data?.label || "Node"}
        </h3>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            borderRadius: "8px",
            padding: "5px 10px",
            width: "fit-content",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusInfo.color,
              boxShadow: `0 0 6px ${statusInfo.color}`,
              flexShrink: 0,
            }}
          />
          <span style={{ color: statusInfo.color, fontSize: "11px", fontWeight: "600" }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* KPI Value */}
      {data?.value && (
        <div
          style={{
            background: "rgba(59,130,246,0.07)",
            border: "1px solid rgba(59,130,246,0.18)",
            borderRadius: "14px",
            padding: "16px 18px",
          }}
        >
          <div style={{ color: "#475569", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "6px" }}>
            CURRENT VALUE
          </div>
          <div style={{ color: "#60a5fa", fontSize: "36px", fontWeight: "800", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {data.value}
          </div>
        </div>
      )}

      {/* Sublabel */}
      {data?.sublabel && (
        <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
          {data.sublabel}
        </div>
      )}

      {/* Insight/Recommendation text */}
      {data?.text && (
        <div
          style={{
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.18)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          <div style={{ color: "#8b5cf6", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "8px" }}>
            AI ANALYSIS
          </div>
          <p style={{ color: "#c4b5fd", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
            {data.text}
          </p>
        </div>
      )}

      {/* Metric guide */}
      {guide && (
        <div
          style={{
            background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          <div style={{ color: "#10b981", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "8px" }}>
            METRIC GUIDE
          </div>
          <div style={{ color: "#6ee7b7", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
            {guide.name}
          </div>
          <p style={{ color: "#a7f3d0", fontSize: "12px", lineHeight: 1.6, margin: "0 0 8px" }}>
            {guide.desc}
          </p>
          <div style={{ color: "#34d399", fontSize: "11px", fontWeight: "600", opacity: 0.75 }}>
            {guide.benchmark}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #0f1f35", paddingTop: "14px" }}>
        <p style={{ color: "#334155", fontSize: "11px", lineHeight: 1.6, margin: 0 }}>
          Click any node in the graph to inspect its metrics and AI-generated analysis.
        </p>
      </div>
    </div>
  );
}
