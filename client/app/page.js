"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import UploadForm from "./components/UploadForm";
import AIInsights from "./components/AIInsights";

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

  // CHART DATA

  const revenueSpendData = [
    {
      platform: "Google",
      Revenue: kpis.googleRevenue || 0,
      Spend: kpis.googleSpend || 0,
    },
    {
      platform: "Meta",
      Revenue: kpis.metaRevenue || 0,
      Spend: kpis.metaSpend || 0,
    },
  ];

  const pieData = [
    {
      name: "Google",
      value: kpis.googleRevenue || 0,
    },
    {
      name: "Meta",
      value: kpis.metaRevenue || 0,
    },
  ];

  const funnelData = [
    {
      stage: "Impressions",
      value: kpis.totalImpressions || 0,
    },
    {
      stage: "Clicks",
      value: kpis.totalClicks || 0,
    },
    {
      stage: "Conversions",
      value: kpis.totalConversions || 0,
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
                { id: "dashboard", label: "Dashboard" },
                { id: "memory-tree", label: "AI Memory Tree" },
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
                  value: `$${formatNumber(kpis.totalSpend)}`,
                },
                {
                  label: "Total Revenue",
                  value: `$${formatNumber(kpis.totalRevenue)}`,
                },
                {
                  label: "Total Clicks",
                  value: formatNumber(kpis.totalClicks),
                },
                {
                  label: "Total Impressions",
                  value: formatNumber(kpis.totalImpressions),
                },
                {
                  label: "Total Conversions",
                  value: formatNumber(kpis.totalConversions),
                },
                {
                  label: "Overall CTR",
                  value: `${Number(
                    kpis.overallCTR || 0
                  ).toFixed(2)}%`,
                },
                {
                  label: "Overall ROAS",
                  value: Number(
                    kpis.overallROAS || 0
                  ).toFixed(2),
                },
                {
                  label: "Conversion Rate",
                  value: `${Number(
                    kpis.conversionRate || 0
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
                      {Number(kpis.overallROAS || 0).toFixed(2)}
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
                      {Number(kpis.conversionRate || 0).toFixed(2)}%
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Best Platform</span>

                    <strong>Google Ads</strong>
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