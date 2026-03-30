"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  stock: { ticker: string; companyName: string } | null;
  type: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  lastTriggered: string | null;
}

interface Stock {
  id: string;
  ticker: string;
  companyName: string;
}

export default function AlertesClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filterTicker, setFilterTicker] = useState("");
  const [newAlert, setNewAlert] = useState({ stockId: "", type: "PRICE_BELOW", condition: "BELOW", threshold: "" });
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string>("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("brvm_token");
    if (stored) setToken(stored);
    fetchStocks();
    fetchAlerts(stored || "");
  }, []);

  async function fetchStocks() {
    try {
      const r = await fetch("/api/stocks");
      if (r.ok) setStocks(await r.json());
    } catch {}
  }

  async function fetchAlerts(t: string) {
    if (!t) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/alerts", {
        headers: { "x-token": t },
        credentials: "include",
      });
      if (r.ok) setAlerts(await r.json());
      else setError("Erreur de chargement");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  async function handleToggle(alert: Alert) {
    if (!token) return;
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({ _method: "toggle" }),
      });
      fetchAlerts(token);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette alerte ?")) return;
    if (!token) return;
    await fetch(`/api/alerts/${id}`, {
      method: "DELETE",
      headers: { "x-token": token },
    });
    fetchAlerts(token);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlert.stockId || !newAlert.threshold) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({ ...newAlert, threshold: Number(newAlert.threshold) }),
      });
      if (r.ok) {
        setNewAlert({ stockId: "", type: "PRICE_BELOW", condition: "BELOW", threshold: "" });
        setShowForm(false);
        fetchAlerts(token);
      }
    } catch {}
    setSubmitting(false);
  }

  async function handleCheckNow() {
    if (!token) return;
    setChecking(true);
    try {
      const r = await fetch("/api/alerts-engine/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
      });
      if (r.ok) {
        const data = await r.json();
        alert(`Vérifié ! ${data.triggered} alerte(s) déclenchée(s)`);
        fetchAlerts(token);
      }
    } catch {}
    setChecking(false);
  }

  const typeLabel: Record<string, string> = {
    PRICE_ABOVE: "📈 Prix >",
    PRICE_BELOW: "📉 Prix <",
    CHANGE_PCT: "📊 Variation %",
    VOLUME_SPIKE: "🔔 Volume",
  };

  const filtered = filterTicker
    ? alerts.filter(a => a.stock?.ticker?.includes(filterTicker.toUpperCase()))
    : alerts;

  if (!token) {
    return (
      <div style={{ padding: "2rem", color: "#ccc", textAlign: "center" }}>
        <p>Connecte-toi d'abord pour accéder aux alertes.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, color: "#e2e8f0" }}>🔔 Mes Alertes</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            {alerts.length} alerte(s) · {alerts.filter(a => a.isActive).length} active(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleCheckNow}
            disabled={checking}
            style={{ padding: "0.5rem 1rem", background: "#334155", color: "#e2e8f0", border: "1px solid #475569", borderRadius: "6px", cursor: checking ? "not-allowed" : "pointer", fontSize: "0.85rem" }}
          >
            {checking ? "Vérification..." : "🔍 Vérifier maintenant"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: "0.5rem 1rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
          >
            {showForm ? "✕ Annuler" : "+ Nouvelle alerte"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>}

      {/* Search */}
      <input
        type="text"
        placeholder="Filtrer par ticker (ex: ABJC)..."
        value={filterTicker}
        onChange={e => setFilterTicker(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "6px", boxSizing: "border-box" }}
      />

      {/* Create Alert Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#1e293b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #334155" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <select
              value={newAlert.stockId}
              onChange={e => setNewAlert({ ...newAlert, stockId: e.target.value })}
              required
              style={{ padding: "0.5rem", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "6px" }}
            >
              <option value="">Titre...</option>
              {stocks.map(s => (
                <option key={s.id} value={s.id}>{s.ticker} — {s.companyName}</option>
              ))}
            </select>
            <select
              value={newAlert.type}
              onChange={e => setNewAlert({ ...newAlert, type: e.target.value })}
              style={{ padding: "0.5rem", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "6px" }}
            >
              <option value="PRICE_BELOW">📉 Prix en dessous de</option>
              <option value="PRICE_ABOVE">📈 Prix au-dessus de</option>
              <option value="CHANGE_PCT">📊 Variation % (seuil)</option>
              <option value="VOLUME_SPIKE">🔔 Volume (minimum titres)</option>
            </select>
            <input
              type="number"
              step="any"
              placeholder="Seuil (ex: 3500)"
              value={newAlert.threshold}
              onChange={e => setNewAlert({ ...newAlert, threshold: e.target.value })}
              required
              style={{ padding: "0.5rem", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "6px" }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "0.5rem 1.5rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Création..." : "Créer l'alerte"}
          </button>
        </form>
      )}

      {/* Alerts Table */}
      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center" }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#475569" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🔔</p>
          <p>Aucune alerte{filterTicker ? " pour ce filtre" : ""}. Crée ta première alerte !</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(alert => (
            <div
              key={alert.id}
              style={{
                background: "#1e293b",
                border: `1px solid ${alert.isActive ? "#16a34a" : "#334155"}`,
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: alert.isActive ? 1 : 0.6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
                    {alert.stock?.ticker || "—"}
                  </span>
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                    {alert.stock?.companyName}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ background: "#0f172a", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", color: "#94a3b8" }}>
                    {typeLabel[alert.type] || alert.type}
                  </span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {Number(alert.threshold).toLocaleString("fr-FR")}
                  </span>
                  {alert.lastTriggered && (
                    <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
                      ⚡ Déclenché {new Date(alert.lastTriggered).toLocaleString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={() => handleToggle(alert)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "none",
                    background: alert.isActive ? "#16a34a" : "#334155",
                    color: "#fff",
                  }}
                >
                  {alert.isActive ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  style={{ padding: "0.25rem 0.5rem", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "1.5rem", padding: "0.75rem", background: "#0f172a", borderRadius: "6px", border: "1px solid #1e293b", fontSize: "0.8rem", color: "#475569" }}>
        💡 Les alertes sont vérifiées manuellement via le bouton "Vérifier maintenant" ou automatiquement par le moteur nightly (18h30).
        <br />📊 Les variations % et volumes utilisent les données de clôture EOD BRVM. Les prix sont en FCFA.
      </div>
    </div>
  );
}
