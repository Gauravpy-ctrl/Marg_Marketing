"use client";

const NAV = [
  {
    label: "Dashboard",
    active: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    label: "AI Insights",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "8px 10px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
              MarketAI
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              ENTERPRISE
            </div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: "600",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          padding: "0 10px",
          marginBottom: "6px",
        }}
      >
        MAIN MENU
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV.map((item, i) => (
          <button
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: item.active ? "rgba(59,130,246,0.12)" : "transparent",
              color: item.active ? "#3b82f6" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: item.active ? "600" : "500",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s",
            }}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.active && (
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ margin: "20px 0", borderTop: "1px solid var(--border-subtle)" }} />

      {/* Status */}
      <div style={{ padding: "0 10px", marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "var(--green)",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--green)",
            }}
          />
          All systems operational
        </div>
      </div>

      {/* User */}
      <div style={{ marginTop: "auto", padding: "14px 10px 6px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
              color: "white",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>
              Marketing Team
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Enterprise Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
