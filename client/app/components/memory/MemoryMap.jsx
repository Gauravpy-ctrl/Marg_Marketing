"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { generateGraph } from "./graphGenerator";
import MemoryNode from "./MemoryNode";
import MemoryEdge from "./MemoryEdge";
import InsightPanel from "./InsightPanel";

const NODE_TYPES = {
  hub: MemoryNode,
  platform: MemoryNode,
  kpi: MemoryNode,
  insight: MemoryNode,
  warning: MemoryNode,
  recommendation: MemoryNode,
};

const EDGE_TYPES = {
  memory: MemoryEdge,
};

const LEGEND = [
  ["#3b82f6", "Platform"],
  ["#10b981", "Strong / Opportunity"],
  ["#f59e0b", "Needs Attention"],
  ["#ef4444", "Critical Alert"],
  ["#8b5cf6", "AI Insight"],
  ["#334155", "Neutral KPI"],
];

export default function MemoryMap({ kpis = {} }) {
  const init = generateGraph(kpis);
  const [nodes, setNodes, onNodesChange] = useNodesState(init.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(init.edges);
  const [selectedNode, setSelectedNode] = useState(null);

  // Regenerate graph when kpis data changes (new upload)
  useEffect(() => {
    const { nodes: n, edges: e } = generateGraph(kpis);
    setNodes(n);
    setEdges(e);
    setSelectedNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    kpis.totalSpend,
    kpis.totalRevenue,
    kpis.googleSpend,
    kpis.googleRevenue,
    kpis.metaSpend,
    kpis.metaRevenue,
    kpis.overallROAS,
    kpis.overallCTR,
    kpis.conversionRate,
    kpis.totalConversions,
  ]);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "760px",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid #1a2f50",
        background: "#040b16",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 20px",
          background: "rgba(4,11,22,0.9)",
          borderBottom: "1px solid #1a2f50",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(59,130,246,0.5)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div>
          <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>AI Memory Tree</div>
          <div style={{ color: "#475569", fontSize: "11px" }}>
            {nodes.length} nodes · {edges.length} connections — click nodes to inspect
          </div>
        </div>
        <div style={{ marginLeft: "auto", color: "#334155", fontSize: "11px" }}>
          Scroll to zoom · Drag to pan
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        style={{ background: "#040b16", paddingTop: "56px" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#0f2040"
          gap={30}
          variant={BackgroundVariant.Dots}
          size={1.5}
        />

        <Controls
          style={{
            background: "#0a1628",
            border: "1px solid #1a2f50",
            borderRadius: "12px",
            overflow: "hidden",
            bottom: "16px",
            left: "16px",
          }}
        />

        <MiniMap
          style={{
            background: "#060e1c",
            border: "1px solid #1a2f50",
            borderRadius: "12px",
            bottom: "16px",
            right: "16px",
          }}
          nodeColor={(n) => {
            if (n.type === "hub") return "#3b82f6";
            const s = n.data?.status;
            if (s === "good" || s === "opportunity") return "#10b981";
            if (s === "warning") return "#f59e0b";
            if (s === "danger") return "#ef4444";
            if (s === "insight") return "#8b5cf6";
            if (n.type === "platform") return n.data?.color || "#3b82f6";
            return "#334155";
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(4,11,22,0.88)"
        />

        {/* Legend panel */}
        <Panel position="top-left" style={{ top: "72px" }}>
          <div
            style={{
              background: "rgba(6,14,28,0.94)",
              border: "1px solid #1a2f50",
              borderRadius: "14px",
              padding: "12px 16px",
              backdropFilter: "blur(12px)",
              minWidth: "160px",
            }}
          >
            <div
              style={{
                color: "#3b82f6",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              LEGEND
            </div>
            {LEGEND.map(([color, label]) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 5px ${color}80`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "11px" }}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {/* Slide-in inspection panel */}
      {selectedNode && (
        <InsightPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
