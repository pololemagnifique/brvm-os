"use client";

import { useEffect, useState } from "react";

interface IndiceData {
  brvm_c: { value: number; change: number };
  brvm_30: { value: number; change: number };
  brvm_prestige: { value: number; change: number };
}

interface Summary {
  portfolio: { id: string; name: string };
  totalInvested: number;
  totalMarketValue: number;
  totalUnrealizedPnl: number;
  totalPnlPct: number;
  positions: any[];
  transactionsCount: number;
  updatedAt: string;
}

interface StockMarket {
  ticker: string;
  last: number;
  change_pct: number;
  var_7d: number;
  var_30d: number;
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [indices, setIndices] = useState<IndiceData | null>(null);
  const [market, setMarket] = useState<{ stocks: StockMarket[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("brvm_token");
    if (!stored) { setLoading(false); return; }
    setToken(stored);
    fetchAll(stored);
  }, []);

  async function fetchAll(t: string) {
    const auth = { Authorization: `Bearer ${t}` };
    try {
      // Portfolio summary
      const pfRes = await fetch("/api/portfolios", { headers: auth });
      if (!pfRes.ok) throw new Error();
      const portfolios = await pfRes.json();
      if (portfolios.length === 0) { setLoading(false); return; }
      const pfId = portfolios[0].id;

      const sumRes = await fetch(`/api/portfolios/${pfId}/summary`, { headers: auth });
      if (sumRes.ok) setSummary(await sumRes.json());

      // Recent transactions
      const txRes = await fetch(`/api/portfolios/${pfId}/transactions`, { headers: auth });
      if (txRes.ok) {
        const txs = await txRes.json();
        setTransactions(txs.slice(0, 5));
      }

      // Market data + indices
      const pricesRes = await fetch("/api/prices");
      if (pricesRes.ok) {
        const data = await pricesRes.json();
        // data may be array or {indices, stocks}
        if (Array.isArray(data)) {
          setMarket({ stocks: data });
        } else {
          setIndices(data.indices || null);
          setMarket({ stocks: data.stocks || [] });
        }
      }
    } catch {}
    setLoading(false);
  }

  if (!token) {
    return (
      <div style={{ padding: "2rem", maxWidth: 600, margin: "4rem auto", textAlign: "center" }}>
        <h2 style={{ color: "#e2e8f0", marginBottom: "1rem" }}>Bienvenue sur BRVM OS</h2>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
          Connecte-toi pour accéder à ton espace personnel.
        </p>
        <a href="/stocks" style={{ color: "#3b82f6", textDecoration: "underline" }}>
          Aller aux cours →
        </a>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "2rem", color: "#64748b" }}>Chargement du dashboard...</div>;
  }

  if (!summary) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#94a3b8" }}>Aucun portefeuille. <a href="/portefeuille" style={{ color: "#3b82f6" }}>Créer un portefeuille →</a></p>
      </div>
    );
  }

  const pnlColor = summary.totalUnrealizedPnl >= 0 ? "#16a34a" : "#ef4444";
  const topGainers = market?.stocks?.filter(s => s.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 5) || [];
  const topLosers = market?.stocks?.filter(s => s.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 5) || [];

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ color: "#e2e8f0", marginBottom: "0.25rem" }}>📊 Tableau de bord</h2>
      <p style={{ color: "#475569", margin: "0 0 1.5rem", fontSize: "0.85rem" }}>
        {summary.portfolio.name} · {summary.positions.length} positions · {summary.transactionsCount} transactions
      </p>

      {/* Indices BRVM */}
      {indices && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid #1e3a5f", textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.2rem" }}>BRVM-C</div>
            <div style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 700 }}>{indices.brvm_c.value.toFixed(2)}</div>
            <div style={{ color: indices.brvm_c.change >= 0 ? "#16a34a" : "#ef4444", fontSize: "0.8rem" }}>{indices.brvm_c.change >= 0 ? "+" : ""}{indices.brvm_c.change.toFixed(2)}%</div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid #1e3a5f", textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.2rem" }}>BRVM-30</div>
            <div style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 700 }}>{indices.brvm_30.value.toFixed(2)}</div>
            <div style={{ color: indices.brvm_30.change >= 0 ? "#16a34a" : "#ef4444", fontSize: "0.8rem" }}>{indices.brvm_30.change >= 0 ? "+" : ""}{indices.brvm_30.change.toFixed(2)}%</div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid #1e3a5f", textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.2rem" }}>BRVM-PRESTIGE</div>
            <div style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 700 }}>{indices.brvm_prestige.value.toFixed(2)}</div>
            <div style={{ color: indices.brvm_prestige.change >= 0 ? "#16a34a" : "#ef4444", fontSize: "0.8rem" }}>{indices.brvm_prestige.change >= 0 ? "+" : ""}{indices.brvm_prestige.change.toFixed(2)}%</div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <KpiCard
          label="Valeur actuelle"
          value={`${summary.totalMarketValue.toLocaleString("fr-FR")} FCFA`}
          sub={`Dont ${summary.totalInvested.toLocaleString("fr-FR")} FCFA investi`}
        />
        <KpiCard
          label="P&L Global"
          value={`${summary.totalUnrealizedPnl >= 0 ? "+" : ""}${summary.totalUnrealizedPnl.toLocaleString("fr-FR")} FCFA`}
          sub={`${summary.totalPnlPct >= 0 ? "+" : ""}${summary.totalPnlPct.toFixed(2)}%`}
          color={pnlColor}
        />
        <KpiCard
          label="Positions"
          value={String(summary.positions.length)}
          sub={`${summary.transactionsCount} transactions`}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Top Gainers */}
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
          <h3 style={{ color: "#16a34a", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>📈 Plus haussiers</h3>
          {topGainers.length === 0 ? <p style={{ color: "#475569", fontSize: "0.85rem" }}>—</p> : topGainers.map(s => (
            <div key={s.ticker} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>{s.ticker}</span>
              <span style={{ color: "#16a34a", fontSize: "0.85rem" }}>+{s.change_pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>

        {/* Top Losers */}
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
          <h3 style={{ color: "#ef4444", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>📉 Plus baissiers</h3>
          {topLosers.length === 0 ? <p style={{ color: "#475569", fontSize: "0.85rem" }}>—</p> : topLosers.map(s => (
            <div key={s.ticker} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>{s.ticker}</span>
              <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{s.change_pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Positions */}
      <div style={{ background: "#1e293b", borderRadius: "8px", padding: "1rem", border: "1px solid #334155", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: "0.95rem" }}>💼 Mes positions</h3>
          <a href="/portefeuille" style={{ color: "#3b82f6", fontSize: "0.8rem" }}>Voir tout →</a>
        </div>
        {summary.positions.length === 0 ? (
          <p style={{ color: "#475569" }}>Aucune position. <a href="/portefeuille" style={{ color: "#3b82f6" }}>Ajouter →</a></p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ color: "#64748b", borderBottom: "1px solid #334155" }}>
                <th style={{ textAlign: "left", padding: "0.3rem 0.5rem" }}>Titre</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>PRU</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>Cours</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>P&L</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>7j</th>
              </tr>
            </thead>
            <tbody>
              {summary.positions.map(pos => (
                <tr key={pos.ticker} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "0.35rem 0.5rem", color: "#e2e8f0" }}>
                    <span style={{ fontWeight: 600 }}>{pos.ticker}</span>
                    <br /><span style={{ color: "#64748b", fontSize: "0.75rem" }}>{pos.companyName}</span>
                  </td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: "#94a3b8" }}>{pos.quantity}</td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: "#94a3b8" }}>{pos.avgCost.toLocaleString("fr-FR")}</td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: "#e2e8f0" }}>{pos.lastPrice?.toLocaleString("fr-FR")}</td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: pos.unrealizedPnl >= 0 ? "#16a34a" : "#ef4444" }}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}{pos.unrealizedPnl.toLocaleString("fr-FR")}
                    <br /><span style={{ fontSize: "0.75rem" }}>{pos.unrealizedPnlPct >= 0 ? "+" : ""}{pos.unrealizedPnlPct.toFixed(2)}%</span>
                  </td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: pos.var_7d_pct >= 0 ? "#16a34a" : "#ef4444" }}>
                    {pos.var_7d_pct !== null ? `${pos.var_7d_pct >= 0 ? "+" : ""}${pos.var_7d_pct.toFixed(2)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Transactions */}
      <div style={{ background: "#1e293b", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: "0.95rem" }}>📋 Transactions récentes</h3>
          <a href="/portefeuille" style={{ color: "#3b82f6", fontSize: "0.8rem" }}>Historique complet →</a>
        </div>
        {transactions.length === 0 ? (
          <p style={{ color: "#475569" }}>Aucune transaction.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ color: "#64748b", borderBottom: "1px solid #334155" }}>
                <th style={{ textAlign: "left", padding: "0.3rem 0.5rem" }}>Date</th>
                <th style={{ textAlign: "left", padding: "0.3rem 0.5rem" }}>Titre</th>
                <th style={{ textAlign: "center", padding: "0.3rem 0.5rem" }}>Type</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "0.35rem 0.5rem", color: "#64748b" }}>{new Date(tx.transactionDate).toLocaleDateString("fr-FR")}</td>
                  <td style={{ padding: "0.35rem 0.5rem", color: "#e2e8f0" }}>{tx.stock?.ticker} <span style={{ color: "#64748b" }}>({tx.stock?.companyName})</span></td>
                  <td style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: tx.type === "BUY" ? "#16a34a" : "#ef4444", fontWeight: 600 }}>{tx.type}</td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: "#94a3b8" }}>{Number(tx.quantity)}</td>
                  <td style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: "#e2e8f0" }}>{Number(tx.price).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "#e2e8f0" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
      <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ color, fontSize: "1.3rem", fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}
