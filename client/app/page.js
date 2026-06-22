"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import UploadForm from "./components/UploadForm";
import AIInsights from "./components/AIInsights";
import PlatformAnalytics from "./components/PlatformAnalytics";
import CampaignAnalytics from "./components/CampaignAnalytics";

const MemoryMap = dynamic(
  () => import("./components/memory/MemoryMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "760px",
          background: "#040b16",
          borderRadius: "24px",
          border: "1px solid #1a2f50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "3px solid #1a2f50",
              borderTop: "3px solid #3b82f6",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <span style={{ color: "#3b82f6", fontSize: "14px" }}>Initializing Memory Tree…</span>
        </div>
      </div>
    ),
  }
);

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Legend,
} from "recharts";

export default function Home() {
  const [results, setResults] = useState(null);
  const [insights, setInsights] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  useEffect(() => {
    setSelectedCampaign("all");
    setSelectedPlatform("all");
  }, [results]);

  // FORMAT LARGE NUMBERS

  const formatNumber = (num) => {
    if (!num) return "0";

    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    }

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }

    return Number(num).toFixed(0);
  };

  // KPI VALUES

  const kpis = results?.analytics || results?.kpis || {};

  // FILTERED KPIs — client-side filter derived from campaignBreakdown

  const filteredCampaigns = (kpis.campaignBreakdown || []).filter((c) => {
    const okCampaign = selectedCampaign === "all" || c.name === selectedCampaign;
    const okPlatform = selectedPlatform === "all" || c.platform === selectedPlatform;
    return okCampaign && okPlatform;
  });

  const filteredKpis = (() => {
    if (!filteredCampaigns.length) return kpis;

    const totalSpend       = filteredCampaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue     = filteredCampaigns.reduce((s, c) => s + c.revenue, 0);
    const totalClicks      = filteredCampaigns.reduce((s, c) => s + c.clicks, 0);
    const totalImpressions = filteredCampaigns.reduce((s, c) => s + c.impressions, 0);
    const totalConversions = filteredCampaigns.reduce((s, c) => s + c.conversions, 0);
    const overallCTR       = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallROAS      = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const conversionRate   = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const platformMap = {};
    filteredCampaigns.forEach((c) => {
      if (!platformMap[c.platform]) {
        platformMap[c.platform] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 };
      }
      const p = platformMap[c.platform];
      p.spend       += c.spend;
      p.revenue     += c.revenue;
      p.clicks      += c.clicks;
      p.impressions += c.impressions;
      p.conversions += c.conversions;
    });
    Object.keys(platformMap).forEach((k) => {
      const p = platformMap[k];
      p.roas           = p.spend       > 0 ? p.revenue / p.spend                  : 0;
      p.ctr            = p.impressions > 0 ? (p.clicks / p.impressions) * 100      : 0;
      p.cpc            = p.clicks      > 0 ? p.spend / p.clicks                   : 0;
      p.conversionRate = p.clicks      > 0 ? (p.conversions / p.clicks) * 100     : 0;
    });

    const GOOGLE_KEYS = ["Google Ads", "Google"];
    const META_KEYS   = ["Facebook", "Instagram", "Meta", "Audience Network"];
    const sum = (keys, f) => keys.reduce((s, k) => s + (platformMap[k]?.[f] || 0), 0);

    return {
      totalSpend, totalRevenue, totalClicks, totalImpressions, totalConversions,
      overallCTR, overallROAS, conversionRate,
      googleRevenue:     sum(GOOGLE_KEYS, "revenue"),
      metaRevenue:       sum(META_KEYS,   "revenue"),
      googleSpend:       sum(GOOGLE_KEYS, "spend"),
      metaSpend:         sum(META_KEYS,   "spend"),
      platformBreakdown: platformMap,
      campaignBreakdown: filteredCampaigns,
    };
  })();

  const bestPlatform =
    Object.entries(filteredKpis.platformBreakdown || {})
      .sort(([, a], [, b]) => b.roas - a.roas)[0]?.[0] || "N/A";

  // CHART DATA

  const revenueSpendData = [
    {
      platform: "Google",
      Revenue: filteredKpis.googleRevenue || 0,
      Spend: filteredKpis.googleSpend || 0,
    },
    {
      platform: "Meta",
      Revenue: filteredKpis.metaRevenue || 0,
      Spend: filteredKpis.metaSpend || 0,
    },
  ];

  const pieData = [
    {
      name: "Google",
      value: filteredKpis.googleRevenue || 0,
    },
    {
      name: "Meta",
      value: filteredKpis.metaRevenue || 0,
    },
  ];

  const funnelData = [
    {
      stage: "Impressions",
      value: filteredKpis.totalImpressions || 0,
    },
    {
      stage: "Clicks",
      value: filteredKpis.totalClicks || 0,
    },
    {
      stage: "Conversions",
      value: filteredKpis.totalConversions || 0,
    },
  ];

  const scatterData = [
    {
      ctr: 1.2,
      conversion: 0.5,
    },
    {
      ctr: 2.1,
      conversion: 1.2,
    },
    {
      ctr: 3.2,
      conversion: 2.4,
    },
    {
      ctr: 4.5,
      conversion: 3.1,
    },
  ];

  const radarData = [
    {
      metric: "CTR",
      Google: 4.2,
      Meta: 1.8,
    },
    {
      metric: "ROAS",
      Google: 14,
      Meta: 4,
    },
    {
      metric: "Conversion",
      Google: 3.5,
      Meta: 1.2,
    },
    {
      metric: "Revenue",
      Google: 9,
      Meta: 3,
    },
  ];

  const performanceTrendData = [
    {
      month: "Jan",
      revenue: 120,
      spend: 80,
    },
    {
      month: "Feb",
      revenue: 220,
      spend: 120,
    },
    {
      month: "Mar",
      revenue: 320,
      spend: 160,
    },
    {
      month: "Apr",
      revenue: 450,
      spend: 220,
    },
    {
      month: "May",
      revenue: 610,
      spend: 300,
    },
  ];

  return (
    <main
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <h1
          style={{
            fontSize: "52px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "12px",
          }}
        >
          AI Marketing Intelligence
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "18px",
            marginBottom: "40px",
          }}
        >
          Upload Google Ads + Meta Ads CSV files for advanced strategic
          marketing intelligence.
        </p>

        {/* UPLOAD */}

        <UploadForm
          setResults={setResults}
          setInsights={setInsights}
          setLoading={() => {}}
        />

        {results && (
          <>
            {/* TAB SWITCHER */}

            <div
              style={{
                display: "flex",
                gap: "4px",
                marginTop: "36px",
                marginBottom: "36px",
                background: "#0f172a",
                padding: "6px",
                borderRadius: "14px",
                width: "fit-content",
              }}
            >
              {[
                { id: "dashboard",          label: "Dashboard"           },
                { id: "platform-analytics", label: "Platform Analytics"  },
                { id: "campaign-analytics", label: "Campaign Analytics"  },
                { id: "memory-tree",        label: "AI Memory Tree"      },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  style={{
                    padding: "10px 28px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      activeView === tab.id
                        ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                        : "transparent",
                    color: activeView === tab.id ? "white" : "#64748b",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.18s ease",
                    boxShadow:
                      activeView === tab.id
                        ? "0 0 16px rgba(59,130,246,0.35)"
                        : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PLATFORM ANALYTICS VIEW */}

            {activeView === "platform-analytics" && (
              <div style={{ marginBottom: "40px" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                    Platform Analytics
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px" }}>
                    Per-platform spend, revenue, ROAS, CTR, and conversion breakdown.
                  </p>
                </div>
                <PlatformAnalytics platformBreakdown={kpis.platformBreakdown || {}} />
              </div>
            )}

            {/* CAMPAIGN ANALYTICS VIEW */}

            {activeView === "campaign-analytics" && (
              <div style={{ marginBottom: "40px" }}>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                    Campaign Analytics
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px" }}>
                    Campaign-level performance ranked by ROAS, with waste identification and scaling opportunities.
                  </p>
                </div>
                <CampaignAnalytics campaignBreakdown={kpis.campaignBreakdown || []} />
              </div>
            )}

            {/* AI MEMORY TREE VIEW */}

            {activeView === "memory-tree" && (
              <div style={{ marginBottom: "40px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontSize: "36px",
                      fontWeight: "800",
                      color: "#0f172a",
                      marginBottom: "8px",
                    }}
                  >
                    AI Memory Tree
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px" }}>
                    Interactive knowledge graph showing campaign relationships, KPI flows, and AI-generated insights.
                  </p>
                </div>
                <MemoryMap kpis={kpis} />
              </div>
            )}

            {activeView === "dashboard" && (
            <>
            {/* FILTER BAR */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "28px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "16px 24px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginRight: "4px",
                }}
              >
                Filter:
              </span>

              {/* Campaign dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label
                  style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}
                >
                  Campaign
                </label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 32px 8px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "auto",
                    minWidth: "220px",
                  }}
                >
                  <option value="all">All Campaigns</option>
                  {[...new Set((kpis.campaignBreakdown || []).map((c) => c.name))].map(
                    (name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Platform dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label
                  style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}
                >
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 32px 8px 14px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "auto",
                    minWidth: "180px",
                  }}
                >
                  <option value="all">All Platforms</option>
                  {["Google Ads", "Facebook", "Instagram", "Audience Network"].filter(
                    (p) => kpis.platformBreakdown?.[p]
                  ).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active filter badge */}
              {(selectedCampaign !== "all" || selectedPlatform !== "all") && (
                <button
                  onClick={() => {
                    setSelectedCampaign("all");
                    setSelectedPlatform("all");
                  }}
                  style={{
                    marginLeft: "auto",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Clear filters ×
                </button>
              )}
            </div>

            {/* KPI SECTION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginTop: "40px",
                marginBottom: "40px",
              }}
            >
              {[
                {
                  label: "Total Spend",
                  value: `$${formatNumber(filteredKpis.totalSpend)}`,
                },
                {
                  label: "Total Revenue",
                  value: `$${formatNumber(filteredKpis.totalRevenue)}`,
                },
                {
                  label: "Total Clicks",
                  value: formatNumber(filteredKpis.totalClicks),
                },
                {
                  label: "Total Impressions",
                  value: formatNumber(filteredKpis.totalImpressions),
                },
                {
                  label: "Total Conversions",
                  value: formatNumber(filteredKpis.totalConversions),
                },
                {
                  label: "Overall CTR",
                  value: `${Number(
                    filteredKpis.overallCTR || 0
                  ).toFixed(2)}%`,
                },
                {
                  label: "Overall ROAS",
                  value: Number(
                    filteredKpis.overallROAS || 0
                  ).toFixed(2),
                },
                {
                  label: "Conversion Rate",
                  value: `${Number(
                    filteredKpis.conversionRate || 0
                  ).toFixed(2)}%`,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "28px",
                    boxShadow:
                      "0 4px 18px rgba(0,0,0,0.06)",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    {item.label}
                  </p>

                  <h2
                    style={{
                      fontSize: "42px",
                      fontWeight: "800",
                      color: "#0f172a",
                    }}
                  >
                    {item.value}
                  </h2>
                </div>
              ))}
            </div>

            {/* PLATFORM KPI CARDS */}

            {(() => {
              const PLATFORM_ORDER = ["Google Ads", "Facebook", "Instagram", "Audience Network", "Meta"];
              const PLATFORM_COLORS = {
                "Google Ads":        { dot: "#2563eb", bg: "#eff6ff", label: "#1d4ed8" },
                "Facebook":          { dot: "#7c3aed", bg: "#f5f3ff", label: "#6d28d9" },
                "Instagram":         { dot: "#db2777", bg: "#fdf2f8", label: "#be185d" },
                "Audience Network":  { dot: "#059669", bg: "#ecfdf5", label: "#047857" },
                "Meta":              { dot: "#64748b", bg: "#f8fafc", label: "#475569" },
              };

              const pb = filteredKpis.platformBreakdown || {};
              const platforms = [
                ...PLATFORM_ORDER.filter((p) => pb[p]),
                ...Object.keys(pb).filter((p) => !PLATFORM_ORDER.includes(p)),
              ];

              if (!platforms.length) return null;

              return (
                <div style={{ marginBottom: "30px" }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: "14px",
                    }}
                  >
                    Platform Breakdown
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {platforms.map((name) => {
                      const p = pb[name];
                      const colors = PLATFORM_COLORS[name] || PLATFORM_COLORS["Meta"];
                      return (
                        <div
                          key={name}
                          style={{
                            background: "#ffffff",
                            borderRadius: "20px",
                            padding: "22px 24px",
                            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                            borderTop: `4px solid ${colors.dot}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "16px",
                            }}
                          >
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: colors.dot,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: "700",
                                color: "#0f172a",
                              }}
                            >
                              {name}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            {[
                              { label: "Spend",       value: `$${formatNumber(p.spend)}` },
                              { label: "Revenue",     value: `$${formatNumber(p.revenue)}` },
                              { label: "ROAS",        value: p.roas.toFixed(2) },
                              { label: "CTR",         value: `${p.ctr.toFixed(2)}%` },
                              { label: "Conversions", value: formatNumber(p.conversions) },
                            ].map((stat) => (
                              <div key={stat.label}>
                                <p
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: "3px",
                                  }}
                                >
                                  {stat.label}
                                </p>
                                <p
                                  style={{
                                    fontSize: "17px",
                                    fontWeight: "800",
                                    color: "#0f172a",
                                  }}
                                >
                                  {stat.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* TOP SECTION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "24px",
                marginBottom: "30px",
              }}
            >
              {/* BAR CHART */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                  minHeight: "620px",
                  color: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    marginBottom: "24px",
                    color: "white",
                  }}
                >
                  Revenue vs Spend
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "380px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueSpendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="platform"
                        stroke="#cbd5e1"
                      />

                      <YAxis stroke="#cbd5e1" />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="Revenue"
                        fill="#2563eb"
                        radius={[8, 8, 0, 0]}
                      />

                      <Bar
                        dataKey="Spend"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* INSIGHTS */}

                <div
                  style={{
                    marginTop: "24px",
                    background: "#111827",
                    borderRadius: "18px",
                    padding: "20px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      marginBottom: "14px",
                      color: "white",
                    }}
                  >
                    AI Insights
                  </h3>

                  <ul
                    style={{
                      color: "#cbd5e1",
                      lineHeight: "32px",
                      paddingLeft: "20px",
                    }}
                  >
                    <li>
                      Google Ads generates substantially higher revenue efficiency.
                    </li>

                    <li>
                      Meta Ads spend is comparatively high relative to revenue generated.
                    </li>

                    <li>
                      Budget reallocation toward high-performing campaigns could improve ROAS.
                    </li>
                  </ul>
                </div>
              </div>

              {/* EXECUTIVE SUMMARY */}

              <div
                style={{
                  background:
                    "linear-gradient(135deg,#0f172a,#020617)",
                  borderRadius: "24px",
                  padding: "28px",
                  color: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "34px",
                    fontWeight: "800",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  AI Executive Summary
                </h2>

                <p
                  style={{
                    fontSize: "17px",
                    lineHeight: "34px",
                    color: "#e2e8f0",
                  }}
                >
                  Google Ads is significantly outperforming Meta Ads in
                  ROAS, revenue generation, and conversion efficiency.
                  Multiple under-performing campaigns are consuming
                  budget without delivering proportional returns,
                  creating strong optimization opportunities.
                </p>

                <div
                  style={{
                    marginTop: "30px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "18px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span>Total ROAS</span>

                    <strong>
                      {Number(filteredKpis.overallROAS || 0).toFixed(2)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span>Conversion Rate</span>

                    <strong>
                      {Number(filteredKpis.conversionRate || 0).toFixed(2)}%
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Best Platform</span>

                    <strong>{bestPlatform}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* SECOND GRID */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "24px",
                marginBottom: "30px",
              }}
            >
              {/* PIE */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                  color: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  Platform Revenue Share
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "320px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        outerRadius={110}
                        label
                      >
                        <Cell fill="#2563eb" />
                        <Cell fill="#8b5cf6" />
                      </Pie>

                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    background: "#111827",
                    borderRadius: "18px",
                    padding: "18px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Revenue Insights
                  </h3>

                  <p
                    style={{
                      color: "#cbd5e1",
                      lineHeight: "30px",
                    }}
                  >
                    Google Ads contributes the majority of total revenue share,
                    indicating stronger monetization efficiency compared to Meta campaigns.
                  </p>
                </div>
              </div>

              {/* FUNNEL */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                  color: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  Conversion Funnel
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "320px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={funnelData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="stage"
                        stroke="#cbd5e1"
                      />

                      <YAxis stroke="#cbd5e1" />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={4}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    background: "#111827",
                    borderRadius: "18px",
                    padding: "18px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Funnel Insights
                  </h3>

                  <p
                    style={{
                      color: "#cbd5e1",
                      lineHeight: "30px",
                    }}
                  >
                    Large drop-offs between impressions and clicks suggest opportunities
                    for stronger creatives, audience targeting, and landing-page optimization.
                  </p>
                </div>
              </div>

              {/* SCATTER */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                  color: "white",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  CTR vs Conversion
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "320px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid stroke="#334155" />

                      <XAxis
                        type="number"
                        dataKey="ctr"
                        name="CTR"
                        stroke="#cbd5e1"
                      />

                      <YAxis
                        type="number"
                        dataKey="conversion"
                        name="Conversion"
                        stroke="#cbd5e1"
                      />

                      <Tooltip />

                      <Scatter
                        data={scatterData}
                        fill="#2563eb"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    background: "#111827",
                    borderRadius: "18px",
                    padding: "18px",
                    border: "1px solid #1e293b",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Performance Insights
                  </h3>

                  <p
                    style={{
                      color: "#cbd5e1",
                      lineHeight: "30px",
                    }}
                  >
                    Campaigns with higher CTR consistently show stronger conversion
                    performance, highlighting the importance of engagement-focused creatives.
                  </p>
                </div>
              </div>
            </div>

            {/* ADVANCED */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "30px",
              }}
            >
              {/* AREA */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  Revenue Growth Trend
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "340px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="month" stroke="#cbd5e1" />

                      <YAxis stroke="#cbd5e1" />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        fill="#93c5fd"
                      />

                      <Area
                        type="monotone"
                        dataKey="spend"
                        stroke="#8b5cf6"
                        fill="#c4b5fd"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RADAR */}

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "24px",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "20px",
                    color: "white",
                  }}
                >
                  Platform Performance Radar
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "340px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />

                      <PolarAngleAxis dataKey="metric" />

                      <Radar
                        name="Google"
                        dataKey="Google"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.5}
                      />

                      <Radar
                        name="Meta"
                        dataKey="Meta"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                      />

                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* PRIORITY ACTIONS */}

            <div
              style={{
                background: "#0f172a",
                borderRadius: "24px",
                padding: "30px",
                marginBottom: "30px",
              }}
            >
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  marginBottom: "30px",
                  color: "white",
                }}
              >
                Priority Actions
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {[
                  {
                    title: "Pause weak campaigns",
                    text:
                      "Low-performing campaigns consume budget without generating sufficient ROI.",
                  },
                  {
                    title: "Scale winning campaigns",
                    text:
                      "Top Google campaigns show scalable ROAS and strong conversion efficiency.",
                  },
                  {
                    title: "Improve audience targeting",
                    text:
                      "CTR gaps indicate mismatched audience intent and poor targeting precision.",
                  },
                  {
                    title: "Increase creative testing",
                    text:
                      "A/B testing creatives and landing pages can significantly improve conversions.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#111827",
                      borderRadius: "18px",
                      padding: "22px",
                      border: "1px solid #1e293b",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        marginBottom: "12px",
                        color: "white",
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        color: "#cbd5e1",
                        lineHeight: "28px",
                        fontSize: "15px",
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI INSIGHTS */}

            <AIInsights insights={insights} />
            </>
            )}

          </>
        )}
      </div>
    </main>
  );
}