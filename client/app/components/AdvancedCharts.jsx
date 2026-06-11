"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function AdvancedCharts({
  kpis,
}) {
  if (!kpis) return null;

  // =========================
  // DATASETS
  // =========================

  const revenueData = [
    {
      platform: "Google",
      revenue: 716,
      spend: 49,
    },
    {
      platform: "Meta",
      revenue: 95,
      spend: 18,
    },
  ];

  const roasData = [
    {
      platform: "Google",
      roas: 14.6,
    },
    {
      platform: "Meta",
      roas: 5.2,
    },
  ];

  const wasteData = [
    {
      name: "Effective",
      value: 78,
    },
    {
      name: "Wasted",
      value: 22,
    },
  ];

  const conversionData = [
    {
      campaign: "Campaign A",
      conversions: 58000,
    },
    {
      campaign: "Campaign B",
      conversions: 42000,
    },
    {
      campaign: "Campaign C",
      conversions: 21000,
    },
  ];

  const opportunityData = [
    {
      spend: 10,
      roas: 2,
    },
    {
      spend: 30,
      roas: 6,
    },
    {
      spend: 60,
      roas: 15,
    },
    {
      spend: 80,
      roas: 18,
    },
  ];

  return (
    <div className="mt-10 space-y-8">

      {/* ROW 1 */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* REVENUE */}

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-xl font-bold mb-5">
            Revenue vs Spend
          </h3>

          <div className="h-[350px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />

                <Bar
                  dataKey="spend"
                  fill="#7c3aed"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROAS */}

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-xl font-bold mb-5">
            Platform ROAS
          </h3>

          <div className="h-[350px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={roasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="roas"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2 */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BUDGET WASTE */}

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-xl font-bold mb-5">
            Budget Waste
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={wasteData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  label
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#ef4444" />
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONVERSION RANKING */}

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-xl font-bold mb-5">
            Top Campaigns
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                layout="vertical"
                data={conversionData}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis type="number" />

                <YAxis
                  type="category"
                  dataKey="campaign"
                />

                <Tooltip />

                <Bar
                  dataKey="conversions"
                  fill="#2563eb"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OPPORTUNITY MATRIX */}

        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-xl font-bold mb-5">
            AI Opportunity Matrix
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ScatterChart>
                <CartesianGrid />

                <XAxis
                  type="number"
                  dataKey="spend"
                  name="Spend"
                />

                <YAxis
                  type="number"
                  dataKey="roas"
                  name="ROAS"
                />

                <Tooltip />

                <Scatter
                  data={opportunityData}
                  fill="#2563eb"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}