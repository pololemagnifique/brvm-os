"use client";

import { useState, useEffect, useCallback } from "react";

const API = "/api";

interface Stock {
  ticker: string;
  companyName?: string;
  sector?: string;
  last: number | null;
  change_pct: number | null;
  var_7d: number | null;
  var_30d: number | null;
  volume: number | null;
}

interface Position {
  ticker: string;
  companyName?: string;
  sector?: string;
  quantity: number;
  totalCost: number;
  avgCost: number;
  last: number | null;
  change_pct: number | null;
  var_7d: number | null;
  var_30d: number | null;
  colorVar7d: number;
  colorVar30d: number;
  volume: number | null;
  // Calculated fields
  currentValue?: number;
  pnl?: number;
  pnlPct?: number;
}

interface Transaction {
  id: string;
  type: "BUY" | "SELL";
  ticker: string;
  companyName?: string;
  quantity: number;
  price: number;
  fees: number;
  transactionDate: string;
  notes?: string;
}

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
}

// Load EOD prices
async function loadPrices(tickers: string[]): Promise<Record<string, Stock>> {
  try {
    const res = await fetch("/api/prices");
    if (!res.ok) return {};
    const list: Stock[] = await res.json();
    const map: Record<string, Stock> = {};
    for (const s of list) {
      if (s && s.ticker && tickers.includes(s.ticker)) map[s.ticker] = s;
    }
    return map;
  } catch {
    return {};
  }
}

// Load all stocks for picker
async function loadAllStocks(): Promise<Array<{ ticker: string; companyName: string; sector?: string }>> {
  try {
    const res = await fetch(`${API}/stocks`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export default function PortfolioClient() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("laurent@brvm.org");
  const [password, setPassword] = useState("brvm2026laurent");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  // Portfolio state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allStocks, setAllStocks] = useState<Array<{ ticker: string; companyName: string; sector?: string }>>([]);

  // UI state
  const [tab, setTab] = useState<"positions" | "transactions">("positions");
  const [showAddTx, setShowAddTx] = useState(false);
  const [addTicker, setAddTicker] = useState("");
  const [addType, setAddType] = useState<"BUY" | "SELL">("BUY");
  const [addQty, setAddQty] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addFees, setAddFees] = useState("0");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const [addNotes, setAddNotes] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingTicker, setClosingTicker] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem("brvm_token");
    if (stored) setToken(stored);
    else setLoading(false);
  }, []);

  // Load data
  useEffect(() => {
    if (!token) return;
    Promise.all([loadPortfolios(), loadAllStocks()])
      .then(([pfs, stocks]) => {
        setAllStocks(stocks);
        if (pfs.length === 0) {
          createDefaultPortfolio().then((pf) => {
            if (pf) { setPortfolios([pf]); setSelectedPortfolio(pf); }
          });
        } else {
          setPortfolios(pfs);
          const def = pfs.find((p: Portfolio) => p.isDefault) || pfs[0];
          setSelectedPortfolio(def);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load positions + transactions when portfolio changes
  useEffect(() => {
    if (!token || !selectedPortfolio) return;
    Promise.all([loadPositions(selectedPortfolio.id), loadTransactions(selectedPortfolio.id)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedPortfolio]);

  async function doLogin() {
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.message || "Erreur login"); return; }
      localStorage.setItem("brvm_token", data.access_token);
      setToken(data.access_token);
    } catch (e: any) {
      setLoginError(e.message || "Erreur connexion");
    }
  }

  async function loadPortfolios(): Promise<Portfolio[]> {
    const res = await fetch(`${API}/portfolios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { localStorage.removeItem("brvm_token"); setToken(null); return []; }
    if (!res.ok) return [];
    return await res.json();
  }

  async function createDefaultPortfolio(): Promise<Portfolio | null> {
    const res = await fetch(`${API}/portfolios`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Mon Portefeuille", description: "Portefeuille principal", isDefault: true }),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  async function loadPositions(portfolioId: string) {
    const res = await fetch(`${API}/portfolios/${portfolioId}/positions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok || res.status === 401) return;
    const raw: any[] = await res.json();
    const tickers = raw.map((p) => p.ticker).filter(Boolean);
    const prices = await loadPrices(tickers);
    const enriched: Position[] = raw.map((p) => {
      const price = prices[p.ticker] || {};
      const last = price.last ?? p.avgCost;
      const currentValue = (price.last ?? p.avgCost) * p.quantity;
      const pnl = currentValue - p.totalCost;
      const pnlPct = p.totalCost > 0 ? (pnl / p.totalCost) * 100 : 0;
      return {
        ticker: p.ticker,
        companyName: price.companyName || p.companyName || p.ticker,
        sector: price.sector || p.sector || "",
        quantity: p.quantity,
        totalCost: p.totalCost,
        avgCost: p.avgCost,
        last: price.last ?? null,
        change_pct: price.change_pct ?? null,
        var_7d: price.var_7d ?? null,
        var_30d: price.var_30d ?? null,
        colorVar7d: price.var_7d ?? 0,
        colorVar30d: price.var_30d ?? 0,
        volume: price.volume ?? null,
        currentValue: Math.round(currentValue * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
      };
    });
    setPositions(enriched);
  }

  async function loadTransactions(portfolioId: string) {
    const res = await fetch(`${API}/portfolios/${portfolioId}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok || res.status === 401) return;
    const raw: any[] = await res.json();
    const txs: Transaction[] = raw.map((t) => ({
      id: t.id,
      type: t.type,
      ticker: t.stock?.ticker || t.stockId || "?",
      companyName: t.stock?.companyName || t.stock?.company_name || "",
      quantity: t.quantity,
      price: Number(t.price),
      fees: Number(t.fees || 0),
      transactionDate: t.transactionDate,
      notes: t.notes,
    }));
    setTransactions(txs);
  }

  async function submitTransaction() {
    if (!addTicker || !addQty || !addPrice || !selectedPortfolio) { setAddError("Remplis tous les champs"); return; }
    setSubmitting(true);
    setAddError("");
    setAddSuccess("");
    try {
      // Find stockId from ticker
      const stockInfo = allStocks.find((s) => s.ticker === addTicker);
      if (!stockInfo) { setAddError(`Ticker "${addTicker}" non trouvé`); return; }
      // Get stock details from API
      const stockRes = await fetch(`${API}/stocks/${addTicker}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stockRes.ok) { setAddError("Action non trouvée en base"); return; }
      const stockData = await stockRes.json();
      const stockId = stockData.id;
      if (!stockId) { setAddError("Impossible d'obtenir l'ID de l'action"); return; }

      const res = await fetch(`${API}/portfolios/${selectedPortfolio.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          stockId,
          type: addType,
          quantity: Number(addQty),
          price: Number(addPrice),
          fees: Number(addFees) || 0,
          transactionDate: addDate,
          notes: addNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.message || "Erreur ajout transaction"); return; }
      setAddSuccess(`${addType === "BUY" ? "Achat" : "Vente"} enregistré !`);
      setAddTicker(""); setAddQty(""); setAddPrice(""); setAddFees("0"); setAddNotes("");
      // Reload
      await Promise.all([
        loadPositions(selectedPortfolio.id),
        loadTransactions(selectedPortfolio.id),
      ]);
    } catch (e: any) {
      setAddError(e.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransaction(txId: string) {
    if (!selectedPortfolio || !token) return;
    if (!confirm("Supprimer cette transaction ?")) return;
    setDeletingId(txId);
    try {
      const res = await fetch(`${API}/portfolios/${selectedPortfolio.id}/transactions/${txId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Erreur suppression");
        return;
      }
      await Promise.all([loadPositions(selectedPortfolio.id), loadTransactions(selectedPortfolio.id)]);
    } catch (e: any) {
      alert(e.message || "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  async function closePosition(ticker: string, quantity: number, lastPrice: number | null) {
    if (!selectedPortfolio || !token) return;
    const price = lastPrice || 0;
    if (!confirm(`Fermer la position ${ticker} (${quantity} titres) au prix de ${price} FCFA ?`)) return;
    setClosingTicker(ticker);
    try {
      // Find stock ID
      const stockRes = await fetch(`${API}/stocks/${ticker}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!stockRes.ok) { alert("Action non trouvée"); return; }
      const stockData = await stockRes.json();
      if (!stockData.id) { alert("ID de l'action introuvable"); return; }
      const res = await fetch(`${API}/portfolios/${selectedPortfolio.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          stockId: stockData.id,
          type: "SELL",
          quantity,
          price,
          fees: 0,
          transactionDate: new Date().toISOString().split("T")[0],
          notes: "Fermeture de position",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Erreur fermeture");
        return;
      }
      await Promise.all([loadPositions(selectedPortfolio.id), loadTransactions(selectedPortfolio.id)]);
    } catch (e: any) {
      alert(e.message || "Erreur");
    } finally {
      setClosingTicker(null);
    }
  }

  async function handleExportCsv() {
    if (!selectedPortfolio || !token) return;
    try {
      const res = await fetch(
        `${API}/portfolios/${selectedPortfolio.id}/transactions.csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) { alert("Export CSV impossible"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brvm-transactions-${selectedPortfolio.id.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur export CSV");
    }
  }

  // ---- LOGIN FORM ----
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 40, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: "#f59e0b" }}>BRVM-OS</div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>Portefeuille — Accès réservé</div>
          <input
            style={{ width: "100%", padding: "10px 12px", marginBottom: 12, background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }}
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }}
            type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
          />
          {loginError && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{loginError}</div>}
          <button
            onClick={doLogin}
            style={{ width: "100%", padding: "11px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Connexion
          </button>
          <div style={{ marginTop: 20, padding: "12px", background: "#1f2937", borderRadius: 8, fontSize: 12, color: "#6b7280" }}>
            Accès démo : laurent@brvm.org / brvm2026laurent
          </div>
        </div>
      </div>
    );
  }

  // ---- LOADING ----
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ color: "#6b7280" }}>Chargement...</div>
      </div>
    );
  }

  const fmt = (n: number | null | undefined, prefix = "") => {
    if (n == null) return "—";
    return prefix + n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const totalValue = positions.reduce((s, p) => s + (p.currentValue || 0), 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>📊 Mon Portefeuille</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {selectedPortfolio?.name || "Portefeuille"} &nbsp;·&nbsp; {positions.length} position{positions.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => { localStorage.removeItem("brvm_token"); setToken(null); }}
            style={{ background: "transparent", border: "1px solid #374151", color: "#6b7280", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
          >
            Déconnexion
          </button>
          <button
            onClick={() => { window.location.href = "/stocks"; }}
            style={{ background: "transparent", border: "1px solid #374151", color: "#6b7280", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
          >
            ← Marché
          </button>
          <button
            onClick={handleExportCsv}
            title="Exporter en CSV"
            style={{ background: "#16a34a", border: "none", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div style={{ background: "#1c1408", border: "1px solid #92400e", borderRadius: 8, margin: "16px 24px", padding: "10px 14px", fontSize: 12, color: "#fcd34d", lineHeight: 1.5 }}>
        ⚠️ <strong>Simulation uniquement.</strong> Les transactions saisies ici sont des exemples pédagogiques sans valeur réelle. Ceci ne constitue ni une recommandation d&apos;investissement ni un conseil financier.
      </div>

      {/* SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, padding: "0 24px 16px" }}>
        {[
          { label: "Valorisation", value: fmt(totalValue, "") + " FCFA", color: "#f59e0b" },
          { label: "Coût total", value: fmt(totalCost, "") + " FCFA", color: "#94a3b8" },
          { label: "P&L", value: (totalPnl >= 0 ? "+" : "") + fmt(totalPnl, "") + " FCFA", color: totalPnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Rendement", value: (totalPnlPct >= 0 ? "+" : "") + fmt(totalPnlPct) + "%", color: totalPnlPct >= 0 ? "#4ade80" : "#f87171" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid #1f2937" }}>
        {(["positions", "transactions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #f59e0b" : "2px solid transparent",
              color: tab === t ? "#f59e0b" : "#6b7280",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize" as "capitalize",
            }}
          >
            {t === "positions" ? `Positions (${positions.length})` : `Transactions (${transactions.length})`}
          </button>
        ))}
      </div>

      {/* POSITIONS TABLE */}
      {tab === "positions" && (
        <div style={{ padding: "16px 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
                {[
                  ["Titre", "left"],
                  ["Qté", "right"],
                  ["PRU", "right"],
                  ["Cours", "right"],
                  ["Valorisation", "right"],
                  ["P&L", "right"],
                  ["Rend.", "right"],
                  ["7j", "right"],
                  ["30j", "right"],
                  ["", "right"],
                ].map(([h, align]) => (
                  <th key={h} style={{ textAlign: align as "left" | "right", padding: "8px 10px", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Aucune position. Ajoute une transaction pour commencer.</td></tr>
              )}
              {positions.map((p) => {
                const pnlColor = (p.pnl || 0) >= 0 ? "#4ade80" : "#f87171";
                return (
                  <tr key={p.ticker} style={{ borderBottom: "1px solid #1f2937", color: "#e2e8f0" }}>
                    <td style={{ padding: "10px 12px", textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#f59e0b" }}>{p.ticker}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{p.companyName || p.ticker}</div>
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.quantity.toLocaleString("fr-FR")}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(p.avgCost)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(p.last)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(p.currentValue)}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: pnlColor }}>
                      {(p.pnl || 0) >= 0 ? "+" : ""}{fmt(p.pnl)}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: pnlColor }}>
                      {(p.pnlPct || 0) >= 0 ? "+" : ""}{fmt(p.pnlPct)}%</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: p.colorVar7d >= 0 ? "#4ade80" : "#f87171" }}>
                      {p.var_7d != null ? (p.var_7d >= 0 ? "+" : "") + p.var_7d.toFixed(2) + "%" : "—"}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: p.colorVar30d >= 0 ? "#4ade80" : "#f87171" }}>
                      {p.var_30d != null ? (p.var_30d >= 0 ? "+" : "") + p.var_30d.toFixed(2) + "%" : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      <button
                        onClick={() => closePosition(p.ticker, p.quantity, p.last)}
                        disabled={closingTicker === p.ticker}
                        title="Fermer cette position"
                        style={{ background: "transparent", border: "1px solid #374151", color: "#6b7280", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", opacity: closingTicker === p.ticker ? 0.5 : 1 }}
                      >
                        {closingTicker === p.ticker ? "..." : "Fermer"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            onClick={() => setShowAddTx(true)}
            style={{ marginTop: 16, padding: "10px 20px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            + Ajouter une transaction
          </button>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      {tab === "transactions" && (
        <div style={{ padding: "16px 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
                {["Date", "Type", "Titre", "Qté", "Prix", "Frais", "Total", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>Aucune transaction.</td></tr>
              )}
              {transactions.map((t) => {
                const total = t.quantity * t.price + t.fees;
                const buy = t.type === "BUY";
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1f2937", color: "#e2e8f0" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 12 }}>{t.transactionDate}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: buy ? "#064e3b" : "#7f1d1d", color: buy ? "#4ade80" : "#f87171" }}>
                        {buy ? "ACHAT" : "VENTE"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#f59e0b" }}>{t.ticker}</td>
                    <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>{t.quantity.toLocaleString("fr-FR")}</td>
                    <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>{fmt(t.price)}</td>
                    <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums", color: "#6b7280" }}>{fmt(t.fees)}</td>
                    <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: buy ? "#f87171" : "#4ade80" }}>
                      {buy ? "-" : "+"}{fmt(total)}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        disabled={deletingId === t.id}
                        title="Supprimer"
                        style={{ background: "transparent", border: "1px solid #374151", color: "#6b7280", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", opacity: deletingId === t.id ? 0.5 : 1 }}
                      >
                        {deletingId === t.id ? "..." : "✕"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            onClick={() => setShowAddTx(true)}
            style={{ marginTop: 16, padding: "10px 20px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            + Nouvelle transaction
          </button>
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showAddTx && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 28, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f59e0b" }}>Nouvelle transaction</div>

            {/* Type */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAddType(t)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${addType === t ? (t === "BUY" ? "#4ade80" : "#f87171") : "#374151"}`,
                    background: addType === t ? (t === "BUY" ? "#064e3b" : "#7f1d1d") : "transparent",
                    color: addType === t ? (t === "BUY" ? "#4ade80" : "#f87171") : "#6b7280",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {t === "BUY" ? "ACHAT" : "VENTE"}
                </button>
              ))}
            </div>

            {/* Ticker */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Ticker *</label>
              <input
                list="stock-picker"
                value={addTicker}
                onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
                placeholder="Ex: BNBC"
                style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }}
              />
              <datalist id="stock-picker">
                {allStocks.map((s) => <option key={s.ticker} value={s.ticker} label={s.companyName} />)}
              </datalist>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Quantité *</label>
                <input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} placeholder="10" style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Prix unitaire (FCFA) *</label>
                <input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="1200" style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Frais (FCFA)</label>
                <input type="number" value={addFees} onChange={(e) => setAddFees(e.target.value)} placeholder="0" style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Date</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Notes</label>
              <input type="text" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Optionnel" style={{ width: "100%", padding: "9px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
            </div>

            {addError && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{addError}</div>}
            {addSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>{addSuccess}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={submitTransaction}
                disabled={submitting}
                style={{ flex: 1, padding: "10px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => { setShowAddTx(false); setAddError(""); setAddSuccess(""); }}
                style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #374151", color: "#6b7280", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
