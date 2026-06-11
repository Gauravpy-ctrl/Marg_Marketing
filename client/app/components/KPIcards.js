"use client";

export default function KPICards({ kpis }) {
  if (!kpis) return null;

  const formatNumber = (num) => {
    if (!num || isNaN(num)) return "0";

    if (num >= 1000000000)
      return `${(num / 1000000000).toFixed(1)}B`;

    if (num >= 1000000)
      return `${(num / 1000000).toFixed(1)}M`;

    if (num >= 1000)
      return `${(num / 1000).toFixed(1)}K`;

    return Number(num).toFixed(0);
  };

  const cards = [
    {
      title: "Total Spend",
      value: `$${formatNumber(
        kpis.totalSpend
      )}`,
    },

    {
      title: "Total Revenue",
      value: `$${formatNumber(
        kpis.totalRevenue
      )}`,
    },

    {
      title: "Total Clicks",
      value: formatNumber(
        kpis.totalClicks
      ),
    },

    {
      title: "Total Impressions",
      value: formatNumber(
        kpis.totalImpressions
      ),
    },

    {
      title: "Total Conversions",
      value: formatNumber(
        kpis.totalConversions
      ),
    },

    {
      title: "Overall CTR",
      value: `${Number(
        kpis.overallCTR || 0
      ).toFixed(2)}%`,
    },

    {
      title: "Overall ROAS",
      value: Number(
        kpis.overallROAS || 0
      ).toFixed(2),
    },

    {
      title: "Conversion Rate",
      value: `${Number(
        kpis.conversionRate || 0
      ).toFixed(2)}%`,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(240px,1fr))",
        gap: "20px",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            background: "#ffffff",
            padding: "28px",
            borderRadius: "22px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              color: "#6b7280",
              marginBottom: "14px",
            }}
          >
            {card.title}
          </p>

          <h2
            style={{
              fontSize: "44px",
              fontWeight: "800",
              color: "#111827",
            }}
          >
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}
