"use client";

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";

export default function MemoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  animated,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  });

  const label = data?.label || "";
  const isAlert = label === "Alert" || label === "Warning";
  const isOpportunity = label === "Opportunity";
  const isCompare = label === "Compare";

  const color = isAlert
    ? "#ef4444"
    : isOpportunity
    ? "#10b981"
    : isCompare
    ? "#8b5cf6"
    : "#3b82f6";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: animated ? 2 : 1.5,
          strokeDasharray: isAlert ? "6 4" : isCompare ? "4 4" : undefined,
          opacity: animated ? 0.85 : 0.55,
          filter: animated ? `drop-shadow(0 0 3px ${color})` : undefined,
          ...style,
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: "9px",
              fontWeight: "700",
              color,
              background: "#060d1a",
              padding: "2px 7px",
              borderRadius: "6px",
              border: `1px solid ${color}35`,
              pointerEvents: "none",
              letterSpacing: "0.05em",
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
