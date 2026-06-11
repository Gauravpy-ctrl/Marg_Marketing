"use client";

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
  Legend,
} from "recharts";

const PLATFORM_COLORS = [
  "#2563eb", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtNum = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: "10px", padding: "12px 16px",
    }}>
      <p style={{ color: "#94a3b8", marginBottom: "6px", fontSize: "13px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: "13px", margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" && p.value > 100
            ? fmt(p.value)
            : `${Number(p.value || 0).toFixed(2)}`}
        </p>
      ))}
    </div>
  );
};

export default function PlatformAnalytics({ platformBreakdown = {} }) {
  const platforms = Object.entries(platformBreakdown);

  if (!platforms.length) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontSize: "16px" }}>
        No platform data available. Upload CSV files to see platform analytics.
      </div>
    );
  }

  const barData = platforms.map(([name, p]) => ({
    name,
    Revenue: Number((p.revenue || 0).toFixed(2)),
    Spend:   Number((p.spend   || 0).toFixed(2)),
  }));

  const roasData = platforms
    .map(([name, p]) => ({ name, ROAS: Number((p.roas || 0).toFixed(2)) }))
    .sort((a, b) => b.ROAS - a.ROAS);

  const ctrData = platforms.map(([name, p]) => ({
    name, CTR: Number((p.ctr || 0).toFixed(2)),
  }));

  const pieData = platforms
    .map(([name, p]) => ({ name, value: p.conversions || 0 }))
    .filter((d) => d.value > 0);

  return (
    <div>
      {/* Platform KPI cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "20px",
        marginBottom: "36px",
      }}>
        {platforms.map(([name, p], i) => (
          <div key={name} style={{
            background: "#0f172a",
            borderRadius: "20px",
            padding: "24px",
            border: `1px solid ${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}33`,
            boxShadow: `0 0 20px ${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}18`,
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              gap: "10px", marginBottom: "18px",
            }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
                boxShadow: `0 0 8px ${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}`,
              }} />
              <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
                {name}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { label: "Spend",       value: fmt(p.spend)       },
                { label: "Revenue",     value: fmt(p.revenue)     },
                { label: "ROAS",        value: `${Number(p.roas || 0).toFixed(2)}x` },
                { label: "CTR",         value: `${Number(p.ctr  || 0).toFixed(2)}%` },
                { label: "Conversions", value: fmtNum(p.conversions) },
                { label: "CPC",         value: fmt(p.cpc)         },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                    {label}
                  </div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
        gap: "24px",
      }}>

        {/* Revenue vs Spend */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            Revenue vs Spend by Platform
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px" }} />
              <Bar dataKey="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Spend"   fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ROAS Comparison */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            ROAS by Platform
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roasData} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ROAS" radius={[0, 6, 6, 0]}>
                {roasData.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CTR */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            CTR by Platform (%)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ctrData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="CTR" radius={[6, 6, 0, 0]}>
                {ctrData.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversions Pie */}
        <div style={{ background: "#0f172a", borderRadius: "20px", padding: "28px", border: "1px solid #1e293b" }}>
          <h3 style={{ color: "white", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>
            Conversions Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px" }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
