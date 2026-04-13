import { useState } from "react";

const modules = {
  business: [
    {
      id: "orders",
      label: "Order-taking & Tables",
      icon: "🍽️",
      priority: true,
      desc: "Live orders, table status, seat management",
      color: "#F97316",
    },
    {
      id: "bookings",
      label: "Bookings Network",
      icon: "📅",
      desc: "Reservations, capacity, walk-ins",
      color: "#3B82F6",
    },
    {
      id: "payments",
      label: "Payments",
      icon: "💳",
      desc: "Split bills, card/cash, receipts",
      color: "#10B981",
    },
    {
      id: "stock",
      label: "Stock Management",
      icon: "📦",
      desc: "Inventory tracking, low-stock alerts",
      color: "#8B5CF6",
    },
    {
      id: "reports",
      label: "Financial / Stock Reports",
      icon: "📊",
      desc: "Daily takings, COGS, sales trends",
      color: "#EC4899",
    },
    {
      id: "kds",
      label: "Kitchen Display (KDS)",
      icon: "👨‍🍳",
      desc: "Order routing, ticket times, priorities",
      color: "#EF4444",
    },
    {
      id: "staff",
      label: "Staff & Permissions",
      icon: "👥",
      desc: "Roles, clock-in/out, access control",
      color: "#14B8A6",
    },
    {
      id: "menu",
      label: "Menu Management",
      icon: "📋",
      desc: "Items, modifiers, pricing, categories",
      color: "#F59E0B",
    },
    {
      id: "crm",
      label: "Customer / Loyalty",
      icon: "❤️",
      desc: "Profiles, repeat visits, discounts",
      color: "#6366F1",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: "🔗",
      desc: "Deliveroo, Uber Eats, Xero, QuickBooks",
      color: "#64748B",
    },
  ],
  dev: [
    {
      id: "sandbox",
      label: "Sandbox / Testing",
      icon: "🧪",
      desc: "Safe environment to trial new features",
      color: "#94A3B8",
    },
    {
      id: "featureflags",
      label: "Feature Flags",
      icon: "🚩",
      desc: "Toggle features on/off without deploying",
      color: "#94A3B8",
    },
    {
      id: "devtools",
      label: "Dev Tools & Logs",
      icon: "🛠️",
      desc: "Error logs, performance, DB inspector",
      color: "#94A3B8",
    },
    {
      id: "versioning",
      label: "Version Control Panel",
      icon: "📌",
      desc: "Track releases, rollback, changelogs",
      color: "#94A3B8",
    },
  ],
};

export default function SystemMap() {
  const [active, setActive] = useState(null);

  const selected =
    [...modules.business, ...modules.dev].find((m) => m.id === active) || null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0F",
        fontFamily: "'Courier New', monospace",
        color: "#E2E8F0",
        padding: "2rem",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .card {
          background: #13131A;
          border: 1px solid #1E1E2E;
          border-radius: 10px;
          padding: 0.65rem 1rem;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 10px 0 0 10px;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .card:hover, .card.active {
          border-color: var(--accent);
          background: #1A1A24;
          transform: translateX(4px);
        }
        .card:hover::before, .card.active::before {
          opacity: 1;
        }
        .priority-badge {
          font-size: 0.55rem;
          background: #F97316;
          color: #000;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-left: auto;
        }
        .connector {
          width: 24px;
          height: 1px;
          background: #2D2D3F;
        }
        .detail-panel {
          background: #13131A;
          border: 1px solid #2D2D3F;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .section-label {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.8rem;
          font-weight: 700;
        }
        .center-node {
          background: #13131A;
          border: 2px solid #3B3B52;
          border-radius: 12px;
          padding: 1.2rem 1.5rem;
          text-align: center;
          position: relative;
        }
        .dev-card {
          background: #0D0D14;
          border: 1px dashed #2D2D3F;
        }
        .dev-card:hover, .dev-card.active {
          border-color: #64748B;
          border-style: dashed;
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#475569", marginBottom: "0.3rem" }}>
            SYSTEM ARCHITECTURE MAP — v0.1
          </div>
          <h1 style={{ fontSize: "1.6rem", fontFamily: "'Space Mono', monospace", fontWeight: 700, margin: 0, color: "#F1F5F9" }}>
            POS Management System
          </h1>
          <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "0.3rem" }}>
            Click any module to see details &nbsp;·&nbsp; 🟠 = build first
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "start" }}>
          
          {/* Left — Business modules top half */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="section-label">Business Layer</div>
            {modules.business.slice(0, 5).map((m) => (
              <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "flex-end" }} key={m.id}>
                <div
                  className={`card ${active === m.id ? "active" : ""}`}
                  style={{ "--accent": m.color, flex: 1 }}
                  onClick={() => setActive(active === m.id ? null : m.id)}
                >
                  <span style={{ fontSize: "1rem" }}>{m.icon}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#CBD5E1" }}>{m.label}</span>
                  {m.priority && <span className="priority-badge">START HERE</span>}
                </div>
                <div className="connector" />
              </div>
            ))}
          </div>

          {/* Center node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "1.8rem" }}>
            <div className="center-node">
              <div style={{ fontSize: "0.6rem", color: "#475569", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>CORE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#F1F5F9", whiteSpace: "nowrap" }}>POS System</div>
            </div>
            <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, #3B3B52, transparent)", minHeight: 40 }} />
          </div>

          {/* Right — Business modules bottom half */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="section-label" style={{ opacity: 0 }}>_</div>
            {modules.business.slice(5).map((m) => (
              <div style={{ display: "flex", alignItems: "center", gap: 0 }} key={m.id}>
                <div className="connector" />
                <div
                  className={`card ${active === m.id ? "active" : ""}`}
                  style={{ "--accent": m.color, flex: 1 }}
                  onClick={() => setActive(active === m.id ? null : m.id)}
                >
                  <span style={{ fontSize: "1rem" }}>{m.icon}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#CBD5E1" }}>{m.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dev Layer */}
        <div style={{ marginTop: "2.5rem", borderTop: "1px dashed #1E1E2E", paddingTop: "1.5rem" }}>
          <div className="section-label" style={{ color: "#334155" }}>
            ⚙️ &nbsp;Developer / Admin Layer — private, not client-facing
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {modules.dev.map((m) => (
              <div
                key={m.id}
                className={`card dev-card ${active === m.id ? "active" : ""}`}
                style={{ "--accent": "#64748B" }}
                onClick={() => setActive(active === m.id ? null : m.id)}
              >
                <span style={{ fontSize: "0.9rem" }}>{m.icon}</span>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel" style={{ borderColor: selected.color + "44" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{selected.icon}</span>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: selected.color }}>{selected.label}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "0.1rem" }}>{selected.desc}</div>
              </div>
            </div>
            {selected.priority && (
              <div style={{ fontSize: "0.72rem", background: "#F9731611", border: "1px solid #F9731633", borderRadius: 6, padding: "0.5rem 0.75rem", color: "#F97316", marginTop: "0.5rem" }}>
                🟠 This is your <strong>first module to build</strong>. Getting tables + orders right unlocks payments, KDS, and stock tracking downstream.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}