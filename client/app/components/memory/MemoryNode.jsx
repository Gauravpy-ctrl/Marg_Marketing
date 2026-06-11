"use client";

import { Handle, Position } from "@xyflow/react";

const STATUS_THEME = {
  hub: {
    bg: "linear-gradient(135deg, #0d2044 0%, #060d1a 100%)",
    border: "#3b82f6",
    glow: "0 0 28px rgba(59,130,246,0.55), 0 0 60px rgba(59,130,246,0.2)",
    title: "#93c5fd",
    sub: "#60a5fa",
  },
  good: {
    bg: "#040f0a",
    border: "#10b981",
    glow: "0 0 16px rgba(16,185,129,0.4)",
    title: "#34d399",
    sub: "#6ee7b7",
  },
  warning: {
    bg: "#110c00",
    border: "#f59e0b",
    glow: "0 0 16px rgba(245,158,11,0.35)",
    title: "#fbbf24",
    sub: "#fcd34d",
  },
  danger: {
    bg: "#100303",
    border: "#ef4444",
    glow: "0 0 16px rgba(239,68,68,0.45)",
    title: "#f87171",
    sub: "#fca5a5",
  },
  neutral: {
    bg: "#0a0f17",
    border: "#334155",
    glow: "0 2px 8px rgba(0,0,0,0.4)",
    title: "#94a3b8",
    sub: "#64748b",
  },
  insight: {
    bg: "linear-gradient(135deg, #140a30, #0a0d1a)",
    border: "#8b5cf6",
    glow: "0 0 18px rgba(139,92,246,0.45)",
    title: "#c4b5fd",
    sub: "#a78bfa",
  },
  opportunity: {
    bg: "#030d07",
    border: "#10b981",
    glow: "0 0 18px rgba(16,185,129,0.5)",
    title: "#34d399",
    sub: "#6ee7b7",
  },
};

const PLATFORM_OVERRIDES = {
  "#2563eb": { bg: "#020c1c", border: "#2563eb", glow: "0 0 18px rgba(37,99,235,0.5)", title: "#60a5fa", sub: "#93c5fd" },
  "#8b5cf6": { bg: "#0b0817", border: "#8b5cf6", glow: "0 0 18px rgba(139,92,246,0.5)", title: "#a78bfa", sub: "#c4b5fd" },
};

export default function MemoryNode({ type, data, selected }) {
  const status = data?.status || "neutral";
  let theme = STATUS_THEME[status] || STATUS_THEME.neutral;

  if (type === "hub") theme = STATUS_THEME.hub;
  if (type === "platform" && data?.color && PLATFORM_OVERRIDES[data.color]) {
    theme = { ...theme, ...PLATFORM_OVERRIDES[data.color] };
  }

  const isLeaf = type === "insight" || type === "warning" || type === "recommendation";
  const isRoot = type === "hub";
  const isKpi = type === "kpi";
  const isPlatform = type === "platform";

  const width = isRoot ? 200 : isLeaf ? 178 : isPlatform ? 158 : 140;
  const padding = isRoot ? "18px 22px" : isLeaf ? "14px 16px" : "12px 14px";
  const borderRadius = isRoot ? "22px" : "14px";

  return (
    <div
      style={{
        background: theme.bg,
        border: `1.5px solid ${selected ? "rgba(255,255,255,0.8)" : theme.border}`,
        borderRadius,
        padding,
        width,
        boxShadow: selected
          ? `0 0 0 2px rgba(255,255,255,0.25), ${theme.glow}`
          : theme.glow,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        position: "relative",
      }}
    >
      {/* Target handle (top) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: theme.border,
            border: `2px solid #060d1a`,
            width: 9,
            height: 9,
          }}
        />
      )}

      {/* Emoji icon for insight/warning/recommendation */}
      {data?.icon && (
        <div style={{ fontSize: "18px", marginBottom: "6px", lineHeight: 1 }}>
          {data.icon}
        </div>
      )}

      {/* Large value for KPI nodes */}
      {isKpi && data?.value && (
        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: theme.title,
            lineHeight: 1,
            marginBottom: "4px",
            letterSpacing: "-0.02em",
          }}
        >
          {data.value}
        </div>
      )}

      {/* Label */}
      <div
        style={{
          fontSize: isRoot ? "15px" : isPlatform ? "14px" : "12px",
          fontWeight: isRoot ? "800" : "700",
          color: theme.title,
          lineHeight: 1.3,
        }}
      >
        {data?.label}
      </div>

      {/* Sublabel (platform / hub) */}
      {data?.sublabel && (
        <div
          style={{
            fontSize: "11px",
            color: theme.sub,
            marginTop: "5px",
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {data.sublabel}
        </div>
      )}

      {/* Insight/warning/recommendation text */}
      {isLeaf && data?.text && (
        <div
          style={{
            fontSize: "11px",
            color: theme.sub,
            marginTop: "8px",
            lineHeight: 1.6,
            opacity: 0.88,
          }}
        >
          {data.text}
        </div>
      )}

      {/* Source handle (bottom) */}
      {!isLeaf && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: theme.border,
            border: `2px solid #060d1a`,
            width: 9,
            height: 9,
          }}
        />
      )}
    </div>
  );
}
