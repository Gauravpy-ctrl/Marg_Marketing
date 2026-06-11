// Generates React Flow nodes + edges from the analytics KPI object.

function fmt(n) {
  if (!n || isNaN(n)) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Number(n).toFixed(0);
}

function fmtPct(n) {
  return `${Number(n || 0).toFixed(2)}%`;
}

function fmtX(n) {
  return `${Number(n || 0).toFixed(2)}x`;
}

function roasStatus(roas) {
  if (roas >= 4) return "good";
  if (roas >= 2) return "warning";
  if (roas > 0) return "danger";
  return "neutral";
}

export function generateGraph(kpis = {}) {
  const nodes = [];
  const edges = [];

  const gSpend = kpis.googleSpend || 0;
  const mSpend = kpis.metaSpend || 0;
  const gRev = kpis.googleRevenue || 0;
  const mRev = kpis.metaRevenue || 0;
  const gROAS = gSpend > 0 ? gRev / gSpend : 0;
  const mROAS = mSpend > 0 ? mRev / mSpend : 0;
  const totalSpend = kpis.totalSpend || gSpend + mSpend;
  const overallROAS = kpis.overallROAS || (totalSpend > 0 ? (gRev + mRev) / totalSpend : 0);
  const overallCTR = kpis.overallCTR || 0;
  const conversionRate = kpis.conversionRate || 0;
  const totalConversions = kpis.totalConversions || 0;

  const hasData = totalSpend > 0 || gRev > 0 || mRev > 0;

  // === HUB ===
  nodes.push({
    id: "hub",
    type: "hub",
    position: { x: 520, y: 20 },
    data: {
      label: "Marketing Hub",
      sublabel: hasData
        ? `ROAS ${fmtX(overallROAS)} · CTR ${fmtPct(overallCTR)}`
        : "Upload data to activate",
      status: hasData
        ? overallROAS >= 3 ? "good" : overallROAS >= 1.5 ? "warning" : "neutral"
        : "neutral",
    },
  });

  // === PLATFORMS ===
  nodes.push({
    id: "google",
    type: "platform",
    position: { x: 200, y: 210 },
    data: {
      label: "Google Ads",
      sublabel: hasData ? `$${fmt(gRev)} revenue` : "No data",
      status: hasData ? roasStatus(gROAS) : "neutral",
      color: "#2563eb",
    },
  });

  nodes.push({
    id: "meta",
    type: "platform",
    position: { x: 840, y: 210 },
    data: {
      label: "Meta Ads",
      sublabel: hasData ? `$${fmt(mRev)} revenue` : "No data",
      status: hasData ? roasStatus(mROAS) : "neutral",
      color: "#8b5cf6",
    },
  });

  edges.push({
    id: "e-hub-google",
    source: "hub",
    target: "google",
    type: "memory",
    animated: hasData && gROAS >= 3,
    data: { label: "Google" },
  });
  edges.push({
    id: "e-hub-meta",
    source: "hub",
    target: "meta",
    type: "memory",
    animated: hasData && mROAS >= 3,
    data: { label: "Meta" },
  });

  // Total conversions — center node
  nodes.push({
    id: "total-conv",
    type: "kpi",
    position: { x: 480, y: 210 },
    data: {
      label: "Conversions",
      value: fmt(totalConversions),
      status:
        conversionRate >= 3 ? "good" : conversionRate >= 1 ? "warning" : "neutral",
      metric: "conversions",
    },
  });
  edges.push({
    id: "e-hub-conv",
    source: "hub",
    target: "total-conv",
    type: "memory",
    data: { label: "Total" },
  });

  // === GOOGLE KPIs ===
  nodes.push({
    id: "g-roas",
    type: "kpi",
    position: { x: 10, y: 410 },
    data: {
      label: "Google ROAS",
      value: hasData ? fmtX(gROAS) : "—",
      status: hasData ? roasStatus(gROAS) : "neutral",
      metric: "roas",
    },
  });
  nodes.push({
    id: "g-spend",
    type: "kpi",
    position: { x: 190, y: 410 },
    data: {
      label: "Google Spend",
      value: hasData ? `$${fmt(gSpend)}` : "—",
      status: "neutral",
      metric: "spend",
    },
  });
  nodes.push({
    id: "g-revenue",
    type: "kpi",
    position: { x: 370, y: 410 },
    data: {
      label: "Google Revenue",
      value: hasData ? `$${fmt(gRev)}` : "—",
      status: hasData && gRev > gSpend ? "good" : "neutral",
      metric: "revenue",
    },
  });

  edges.push({ id: "e-g-roas", source: "google", target: "g-roas", type: "memory", animated: gROAS >= 4, data: { label: "ROAS" } });
  edges.push({ id: "e-g-spend", source: "google", target: "g-spend", type: "memory", data: { label: "Spend" } });
  edges.push({ id: "e-g-rev", source: "google", target: "g-revenue", type: "memory", animated: gRev > gSpend, data: { label: "Revenue" } });

  // === META KPIs ===
  nodes.push({
    id: "m-roas",
    type: "kpi",
    position: { x: 670, y: 410 },
    data: {
      label: "Meta ROAS",
      value: hasData ? fmtX(mROAS) : "—",
      status: hasData ? roasStatus(mROAS) : "neutral",
      metric: "roas",
    },
  });
  nodes.push({
    id: "m-spend",
    type: "kpi",
    position: { x: 850, y: 410 },
    data: {
      label: "Meta Spend",
      value: hasData ? `$${fmt(mSpend)}` : "—",
      status: "neutral",
      metric: "spend",
    },
  });
  nodes.push({
    id: "m-revenue",
    type: "kpi",
    position: { x: 1030, y: 410 },
    data: {
      label: "Meta Revenue",
      value: hasData ? `$${fmt(mRev)}` : "—",
      status: hasData && mRev > mSpend ? "good" : "neutral",
      metric: "revenue",
    },
  });

  edges.push({ id: "e-m-roas", source: "meta", target: "m-roas", type: "memory", animated: mROAS >= 4, data: { label: "ROAS" } });
  edges.push({ id: "e-m-spend", source: "meta", target: "m-spend", type: "memory", data: { label: "Spend" } });
  edges.push({ id: "e-m-rev", source: "meta", target: "m-revenue", type: "memory", animated: mRev > mSpend, data: { label: "Revenue" } });

  // Conv rate under total-conv
  if (hasData && conversionRate > 0) {
    nodes.push({
      id: "conv-rate",
      type: "kpi",
      position: { x: 450, y: 410 },
      data: {
        label: "Conv. Rate",
        value: fmtPct(conversionRate),
        status: conversionRate >= 3 ? "good" : conversionRate >= 1 ? "warning" : "danger",
        metric: "conversion",
      },
    });
    edges.push({
      id: "e-conv-rate",
      source: "total-conv",
      target: "conv-rate",
      type: "memory",
      animated: conversionRate >= 3,
      data: { label: "Rate" },
    });
  }

  if (!hasData) return { nodes, edges };

  // === INSIGHT / WARNING / RECOMMENDATION NODES ===
  const insightY = 620;

  // Google insight
  if (gROAS >= 4) {
    nodes.push({
      id: "ins-google-scale",
      type: "recommendation",
      position: { x: 10, y: insightY },
      data: {
        label: "Scale Google",
        text: `ROAS ${fmtX(gROAS)} — strong signal to increase Google Ads budget for compounding returns.`,
        status: "opportunity",
        icon: "🚀",
      },
    });
    edges.push({
      id: "e-ins-gs",
      source: "g-roas",
      target: "ins-google-scale",
      type: "memory",
      animated: true,
      data: { label: "Opportunity" },
    });
  } else if (gROAS < 1.5 && gSpend > 0) {
    nodes.push({
      id: "warn-google",
      type: "warning",
      position: { x: 10, y: insightY },
      data: {
        label: "Google ROAS Low",
        text: `ROAS ${fmtX(gROAS)} is below efficiency threshold. Review bidding strategy and keyword targeting.`,
        status: "danger",
        icon: "⚠️",
      },
    });
    edges.push({
      id: "e-warn-g",
      source: "g-roas",
      target: "warn-google",
      type: "memory",
      data: { label: "Alert" },
    });
  }

  // Meta insight
  if (mROAS >= 4) {
    nodes.push({
      id: "ins-meta-scale",
      type: "recommendation",
      position: { x: 860, y: insightY },
      data: {
        label: "Scale Meta",
        text: `Meta ROAS ${fmtX(mROAS)} — increase Meta Ads spend allocation for maximum ROI.`,
        status: "opportunity",
        icon: "🚀",
      },
    });
    edges.push({
      id: "e-ins-ms",
      source: "m-roas",
      target: "ins-meta-scale",
      type: "memory",
      animated: true,
      data: { label: "Opportunity" },
    });
  } else if (mROAS < 1.5 && mSpend > 0) {
    nodes.push({
      id: "warn-meta",
      type: "warning",
      position: { x: 860, y: insightY },
      data: {
        label: "Meta ROAS Alert",
        text: `ROAS ${fmtX(mROAS)} — budget inefficiency detected. Narrow audience targeting and pause weak ad sets.`,
        status: "danger",
        icon: "⚠️",
      },
    });
    edges.push({
      id: "e-warn-m",
      source: "m-roas",
      target: "warn-meta",
      type: "memory",
      data: { label: "Alert" },
    });
  }

  // Cross-platform comparison insight
  if (gROAS > 0 && mROAS > 0) {
    const winner = gROAS >= mROAS ? "Google" : "Meta";
    const loser = gROAS >= mROAS ? "Meta" : "Google";
    const ratio = Math.max(gROAS, mROAS) / Math.max(Math.min(gROAS, mROAS), 0.01);

    nodes.push({
      id: "ins-compare",
      type: "insight",
      position: { x: 400, y: insightY },
      data: {
        label: `${winner} Outperforms`,
        text: `${winner} leads ${loser} by ${ratio.toFixed(1)}x ROAS. Reallocate budget toward ${winner} for stronger returns.`,
        status: "insight",
        icon: "🧠",
      },
    });
    edges.push({ id: "e-cmp-g", source: "g-roas", target: "ins-compare", type: "memory", data: { label: "Compare" } });
    edges.push({ id: "e-cmp-m", source: "m-roas", target: "ins-compare", type: "memory", data: { label: "Compare" } });
  }

  // CTR insight
  if (overallCTR < 2 && overallCTR > 0) {
    nodes.push({
      id: "ins-ctr",
      type: "insight",
      position: { x: 650, y: insightY },
      data: {
        label: "CTR Opportunity",
        text: `Overall CTR ${fmtPct(overallCTR)} is below 2% benchmark. Improve ad copy, creatives, and audience relevance.`,
        status: "warning",
        icon: "📊",
      },
    });
    edges.push({
      id: "e-ins-ctr",
      source: "total-conv",
      target: "ins-ctr",
      type: "memory",
      data: { label: "CTR" },
    });
  }

  return { nodes, edges };
}
